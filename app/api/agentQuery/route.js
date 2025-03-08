// /app/api/agentQuery/route.js
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { firestore } from "@/firebase/firebaseAdmin";

// Initialize the LLM instance.
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 200,
});

// Initialize DuckDuckGo search tool.
const duckDuckGo = new DuckDuckGoSearch();

export async function POST(request) {
  try {
    const { subject, chapter, message, uid } = await request.json();
    console.log("Received data:", { subject, chapter, message, uid });

    // Fetch past 6 conversations from Firebase.
    const pastConversations = [];
    const messagesRef = firestore
      .collection("conversations")
      .doc(uid)
      .collection("messages");
    const snapshot = await messagesRef.orderBy("timestamp", "desc").limit(6).get();
    snapshot.forEach((doc) => {
      pastConversations.push(doc.data());
    });
    pastConversations.reverse();

    // Perform internet search using DuckDuckGo.
    let internetResults = "";
    try {
      const searchResults = await duckDuckGo.call(message);
      internetResults = JSON.stringify(searchResults);
    } catch (error) {
      console.error("Error during internet search:", error);
    }

    // If the query contains a YouTube link, attempt to summarize the video.
    let youtubeSummary = "";
    const youtubeRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=[\w-]+)/;
    const match = message.match(youtubeRegex);
    if (match) {
      const videoUrl = match[1];
      try {
        const youtubePrompt = `Summarize the content of the YouTube video at ${videoUrl}.`;
        const youtubeResult = await llm.invoke(youtubePrompt);
        youtubeSummary = youtubeResult.content;
      } catch (error) {
        console.error("Error summarizing YouTube video:", error);
      }
    }

    // Build the agent prompt incorporating all information.
    let agentPrompt = `User's query: "${message}"\n`;
    if (subject) agentPrompt += `Subject: ${subject}\n`;
    if (chapter) agentPrompt += `Chapter: ${chapter}\n`;
    if (pastConversations.length > 0) {
      agentPrompt += `Past Conversations:\n`;
      pastConversations.forEach((conv, index) => {
        agentPrompt += `${index + 1}. ${conv.sender}: ${conv.text}\n`;
      });
    }
    if (internetResults) {
      agentPrompt += `Internet Search Results: ${internetResults}\n`;
    }
    if (youtubeSummary) {
      agentPrompt += `YouTube Video Summary: ${youtubeSummary}\n`;
    }
    agentPrompt +=
      "Based on the above, provide a detailed response with sources and reference material where applicable.";

    console.log("Agent Prompt:", agentPrompt);

    // Invoke the LLM with the combined prompt.
    const response = await llm.invoke(agentPrompt);
    const llmResponse = response.content;

    return NextResponse.json({ response: llmResponse, sources: [] });
  } catch (error) {
    console.error("Error processing the request:", error);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
