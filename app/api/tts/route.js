// File: /app/api/tts/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const text = request.nextUrl.searchParams.get("text") || "Hello, how can I help you?";
    const pythonResponse = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}`, {
      method: "GET",
    });
    if (!pythonResponse.ok) {
      throw new Error("Python TTS endpoint returned an error");
    }
    const audioData = await pythonResponse.arrayBuffer();
    
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": "audio/mp3",
        "Content-Disposition": "inline; filename=tts.mp3"
      }
    });
  } catch (error) {
    console.error("Error processing TTS request:", error);
    return NextResponse.json(
      { error: "Failed to process the TTS request." },
      { status: 500 }
    );
  }
}
