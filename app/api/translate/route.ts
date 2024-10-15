import { NextResponse } from 'next/server';
import { TogetherAI } from '@/lib/togetherAI'; // You'll need to create this

const MAX_TOKENS = 500; // Adjust based on Together AI's limits

export async function POST(req: Request) {
  const { text, targetLanguage } = await req.json();

  try {
    const togetherAI = new TogetherAI(process.env.TOGETHER_AI_API_KEY);
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text, MAX_TOKENS);
    
    let translatedChunks = [];
    for (const chunk of chunks) {
      const prompt = `Translate the following text to ${targetLanguage}: "${chunk}"`;
      const response = await togetherAI.generateText(prompt);
      translatedChunks.push(response);
    }

    const translatedText = translatedChunks.join(' ');
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Error translating text:', error);
    return NextResponse.json({ error: 'Failed to translate text' }, { status: 500 });
  }
}

function splitTextIntoChunks(text: string, maxTokens: number): string[] {
  // Implement a function to split text into chunks of approximately maxTokens
  // This is a simple implementation and might need refinement
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = [];

  for (const word of words) {
    if (currentChunk.length + word.length > maxTokens) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
    currentChunk.push(word);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}
