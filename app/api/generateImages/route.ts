import Together from "together-ai";
import { z } from "zod";

const client = new Together();

export async function POST(req: Request) {
  let json = await req.json();
  let { model, prompt } = z
    .object({
      model: z.string(),
      prompt: z.string(),
    })
    .parse(json);

  let responses = await Promise.all(
    Array.from(Array(4).keys()).map(() =>
      client.images.create({
        prompt,
        model,
        n: 4,
        width: 1024,
        height: 768,
      }),
    ),
  );
  // const response = await

  return Response.json(responses.map((r) => r.data[0]));

  // console.log(response);
  // return 123;
  // const { messages } = await req.json()
  // const result = await streamText({
  //   model: openai('gpt-4-turbo'),
  //   messages,
  // })

  // return new StreamingTextResponse(result.toAIStream())
}
