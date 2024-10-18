import { NextResponse } from 'next/server';
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(req: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await req.json();

    const llm = new TogetherAI({
      apiKey: process.env.TOGETHER_API_KEY,
      model: "google/gemma-2-27b-it",
      maxTokens: 1024,
      temperature: 0.1,
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      "You are a professional translator. Translate the following text from {sourceLanguage} to {targetLanguage}. " +
      "Provide only the translated text without any additional comments, explanations, or notes. " +
      "Maintain the original formatting, including line breaks and paragraph structure.\n\n" +
      "Text to translate:\n{text}\n\n" +
      "Translation:"
    );

    const formattedPrompt = await promptTemplate.format({
      sourceLanguage,
      targetLanguage,
      text,
    });

    const translatedText = await llm.call(formattedPrompt);

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    console.error('Error in translation:', error);
    return NextResponse.json({ 
      error: 'Failed to translate text', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
