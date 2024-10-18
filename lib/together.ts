import axios from 'axios';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/completions';

export async function generateText(prompt: string): Promise<string> {
  try {
    const response = await axios.post(TOGETHER_API_URL, {
      model: 'togethercomputer/llama-2-70b-chat',
      prompt: prompt,
      max_tokens: 256,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text');
  }
}
