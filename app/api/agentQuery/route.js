// File: /app/api/agentQuery/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { subject, chapter, message, grade } = await request.json();
    console.log("Received teaching query:", { subject, chapter, message, grade });
    
    const pythonResponse = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, chapter, message, grade })
    });
    if (!pythonResponse.ok) {
      throw new Error("Python server returned an error");
    }
    const pythonData = await pythonResponse.json();
    
    let finalOutput = pythonData.agent_response;
    if (typeof finalOutput === "object" && finalOutput !== null) {
      if ("output" in finalOutput && typeof finalOutput.output === "string") {
        finalOutput = finalOutput.output;
      } else {
        finalOutput = JSON.stringify(finalOutput);
      }
    }
    
    return NextResponse.json({ response: finalOutput, sources: pythonData.vector_results });
  } catch (error) {
    console.error("Error processing the teaching query:", error);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
