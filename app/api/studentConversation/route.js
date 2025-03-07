import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
// import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
// import { Chroma } from "@langchain/community/vectorstores/chroma";
// withAuth is imported but typically not used in API routes, so consider removing if unused.

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 150
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "text-embedding-004",
});

// const duck_duck_go_search = new DuckDuckGoSearch();

// vectorStore = Chroma(embeddings)

export async function POST(request) {
  try {
    // Parse JSON payload from the request body.
    const { subject, chapter, message } = await request.json();

    // Log the received data.
    console.log('Received data:', { subject, chapter, message });

    // Invoke the LLM and wait for the result.
    const result = await llm.invoke(`Received your message: "${message}" for subject: "${subject || 'Generalized'}" and chapter: "${chapter || 'N/A'}"`);
    console.log(result.content);

    // Optionally, use the result.content or further process it.
    return NextResponse.json({ response: result.content });
  } catch (error) {
    console.error('Error processing the request:', error);
    return NextResponse.json({ error: 'Failed to process the request.' }, { status: 500 });
  }
}
