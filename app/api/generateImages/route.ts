import Together from "together-ai";
import { z } from "zod";

let options: ConstructorParameters<typeof Together>[0] = {};

if (process.env.HELICONE_API_KEY) {
  options.baseURL = "https://together.helicone.ai/v1";
  options.defaultHeaders = {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  };
}

const client = new Together(options);

export async function POST(req: Request) {
  let json = await req.json();
  let { prompt } = z
    .object({
      prompt: z.string(),
    })
    .parse(json);

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

  return Response.json(response.data[0]);
}

export const runtime = "edge";
