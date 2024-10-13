import { NextResponse } from 'next/server';
import Together from "together-ai";

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentText, imageId } = body;

    const response = await together.chat.completions.create({
      messages: [
        { role: "system", content: "You are a creative children's story writer." },
        { role: "user", content: `Continue this story, incorporating the image with ID ${imageId}: ${currentText}` }
      ],
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
      max_tokens: 150,
      temperature: 0.7,
    });

    const continuationText = response.choices[0].message.content.trim();

    return NextResponse.json({ continuation: continuationText });
  } catch (error) {
    console.error('Error in story continuation:', error);
    return NextResponse.json({ 
      error: 'Failed to continue story', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
