import axios from 'axios';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/completions';

export async function generateText(prompt: string, storyPrompt: string, previousContent: string, language: string): Promise<string> {
  const response = await fetch('/api/generateText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      storyPrompt,
      previousContent,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate text');
  }

  const data = await response.json();
  return data.text;
}
