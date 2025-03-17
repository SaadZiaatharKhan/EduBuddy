// /app/api/agentQuery/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Expect payload: { subject, chapter, message, grade }
    const { subject, chapter, message, grade } = await request.json();
    console.log("Received data:", { subject, chapter, message, grade });
    
    // Forward the request to the Python backend.
    const pythonResponse = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, chapter, message, grade })
    });
    if (!pythonResponse.ok) {
      throw new Error("Python server returned an error");
    }
    const pythonData = await pythonResponse.json();
    
    // Extract the final output.
    let finalOutput = pythonData.agent_response;
    if (typeof finalOutput === "object" && finalOutput !== null) {
      if ("output" in finalOutput && typeof finalOutput.output === "string") {
        finalOutput = finalOutput.output;
      } else {
        finalOutput = JSON.stringify(finalOutput);
      }
    }
    
    return NextResponse.json({ response: finalOutput, sources: [] });
  } catch (error) {
    console.error("Error processing the request:", error);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
