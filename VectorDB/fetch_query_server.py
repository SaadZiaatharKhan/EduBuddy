# File: backend.py
import os
import json
import logging
import io
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from bs4 import BeautifulSoup
from gtts import gTTS

# LangChain imports
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_community.tools import DuckDuckGoSearchResults, YouTubeSearchTool
from langchain.tools.retriever import create_retriever_tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.conversation.memory import ConversationBufferMemory

# Set up logging.
logging.basicConfig(level=logging.INFO)

# Load configuration from environment variables.
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
VECTOR_DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.0-flash")
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.3"))

app = FastAPI()

# Initialize embeddings and load the vector store.
embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)
vectorstore = Chroma(persist_directory=VECTOR_DB_DIR, embedding_function=embeddings)
retriever = vectorstore.as_retriever(k=10)

# Create a retriever tool for educational content.
retriever_tool = create_retriever_tool(
    retriever,
    "chroma_search",
    "Search for educational content from the Chroma database for student queries."
)

# Initialize DuckDuckGo search tool with a maximum of 10 results.
search = DuckDuckGoSearchResults(num_results=10)

# Define a custom YouTube search tool that cleans the query input.
class CustomYouTubeSearchTool(YouTubeSearchTool):
    def _run(self, query: str, **kwargs):
        cleaned_query = query.split(",")[0].strip()
        return super()._run(cleaned_query, **kwargs)

youtube = CustomYouTubeSearchTool()

# Initialize the language model.
llm = ChatGoogleGenerativeAI(model=LLM_MODEL, temperature=TEMPERATURE)

# Initialize in-memory conversation memory.
memory = ConversationBufferMemory(return_messages=True)

# Define the query input model.
class QueryRequest(BaseModel):
    subject: Optional[str] = None
    chapter: Optional[str] = None
    message: str
    grade: Optional[str] = None

@app.post("/query")
async def query_vectorstore(query: QueryRequest):
    try:
        # Build the chat prompt with instructions for the teaching assistant.
        chat_prompt = ChatPromptTemplate([
            (
                "system",
                (
                    "You are a helpful AI teaching assistant named Ada. You help students of grade {grade} using the {subject} textbook (Chapter {chapter}) to answer their questions. "
                    "When a student asks a question, search your Vector Database for the most relevant textbook content and resources. "
                    "Use the retrieved content to generate a concise, clear answer with sources. "
                    "If no relevant content is found, ask for more details. "
                    "Relevant textbook context: {agent_scratchpad}"
                )
            ),
            ("human", "{user_input}")
        ])

        # Perform a vector similarity search on the query message.
        results = vectorstore.similarity_search(query.message, k=10)
        processed_results = []
        for result in results:
            # Clean HTML content from the result.
            clean_text = BeautifulSoup(result.page_content, "html.parser").get_text(separator="\n").strip()
            metadata_str = json.dumps(result.metadata, indent=2)
            processed_results.append({
                "content": clean_text,
                "metadata": metadata_str
            })

        # Build a vector context string from the processed vector search results.
        vector_context = "\n\n".join(
            [f"Content: {r['content']}\nSources: {r['metadata']}" for r in processed_results]
        )

        # Prepare the tools to be used by the agent.
        tools = [search, retriever_tool, youtube]
        # Create the tool-calling agent.
        agent = create_tool_calling_agent(llm, tools, chat_prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

        # Prepare the input parameters for the agent.
        agent_input = {
            "grade": query.grade if query.grade else "All",
            "chapter": query.chapter if query.chapter else "All",
            "subject": query.subject if query.subject else "All",
            "user_input": query.message,
            "agent_scratchpad": vector_context  # pass vector context to the prompt
        }

        # Invoke the agent.
        agent_response = agent_executor.invoke(agent_input)

        # Extract response text.
        response_text = agent_response.get("text", str(agent_response))
        memory.save_context({"user_input": query.message}, {"agent_response": response_text})

        return {
            "agent_response": agent_response,
            "vector_results": processed_results,
            "memory": memory.buffer  # for debugging purposes
        }
    except Exception as e:
        logging.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/tts")
async def synthesize_tts(text: str = "Hello, how can I help you?"):
    try:
        # Use gTTS (Google Text-to-Speech) for free voice synthesis.
        tts = gTTS(text=text, lang="en")
        audio_bytes = io.BytesIO()
        tts.write_to_fp(audio_bytes)
        audio_bytes.seek(0)
        return StreamingResponse(audio_bytes, media_type="audio/mp3")
    except Exception as e:
        logging.error(f"TTS synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="TTS synthesis failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
