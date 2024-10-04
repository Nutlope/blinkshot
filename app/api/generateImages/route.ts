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

  const startTime = Date.now();

  let response = await client.images.create({
    prompt,
    model: "black-forest-labs/FLUX.1-schnell",
    n: 1,
    steps: 3,
    width: 1024,
    height: 768,
    // @ts-expect-error - this is not typed in the API
    response_format: "base64",
  });

  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime} ms`);

  return Response.json(response.data[0]);
}

export const runtime = "edge";
