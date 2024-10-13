import { NextResponse } from 'next/server';
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, storyPrompt, previousContent, language } = body;

    const llm = new TogetherAI({
      apiKey: process.env.TOGETHER_API_KEY,
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      maxTokens: 256,
      temperature: 0.7,
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      "You are a creative children's story writer. Write in {language}.\n\n" +
      "Initial story prompt: {storyPrompt}\n\n" +
      "Previous story content:\n{previousContent}\n\n" +
      "Continue this story in {language}: {prompt}"
    );

    const formattedPrompt = await promptTemplate.format({
      language,
      storyPrompt,
      previousContent,
      prompt,
    });

    const generatedText = await llm.call(formattedPrompt);

    return NextResponse.json({ text: generatedText.trim() });
  } catch (error) {
    console.error('Error in text generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate text', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
