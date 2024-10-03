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
        n: 1,
        width: 1024,
        height: 768,
      }),
    ),
  );

  return Response.json(responses.map((r) => r.data[0]));
}
