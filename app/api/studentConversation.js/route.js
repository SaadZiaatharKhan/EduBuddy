import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage  } from "@langchain/core/messages";

export async function StudentConversationAPI(request) {
    let data = await request.json();
}