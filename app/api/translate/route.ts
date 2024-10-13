import { NextResponse } from 'next/server';
import Together from "together-ai";

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, targetLanguage } = body;

    const response = await together.chat.completions.create({
      messages: [
        { role: "system", content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original meaning, tone, and style as closely as possible.` },
        { role: "user", content: content }
      ],
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
      max_tokens: 300,
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Error in translation:', error);
    return NextResponse.json({ 
      error: 'Failed to translate text', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
