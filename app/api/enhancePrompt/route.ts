import Together from "together-ai";
import { z } from "zod";

const client = new Together();

export async function POST(req: Request) {
  let json = await req.json();
  let { prompt } = z
    .object({
      prompt: z.string(),
    })
    .parse(json);

  let response = await client.chat.completions.create({
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    messages: [
      {
        role: "system",
        content:
          "You're a helpful assitant. The user is going to supply a prompt to an image model. You should enhance it by writing 2-3 sentences about it in more detail.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return Response.json({
    prompt: response.choices[0].message?.content ?? prompt,
  });
}
