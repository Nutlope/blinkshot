import { NextResponse } from 'next/server';
import Together from "together-ai";

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, storyPrompt, previousContent, language } = body;

    const response = await together.chat.completions.create({
      messages: [
        { role: "system", content: `You are a creative children's story writer. Write in ${language}.` },
        { role: "user", content: `Initial story prompt: ${storyPrompt}\n\nPrevious story content:\n${previousContent}\n\nContinue this story in ${language}: ${prompt}` }
      ],
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
      max_tokens: 150,
      temperature: 0.7,
    });

    const generatedText = response.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ text: generatedText });
  } catch (error) {
    console.error('Error in text generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate text', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
