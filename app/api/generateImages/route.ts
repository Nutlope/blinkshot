import Together from "together-ai";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

let ratelimit: Ratelimit | undefined;

// Add rate limiting if Upstash API keys are set, otherwise skip
if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    // Allow 100 requests per day (~5-10 prompts)
    limiter: Ratelimit.fixedWindow(100, "1440 m"),
    analytics: true,
    prefix: "blinkshot",
  });
}

export async function POST(req: Request) {
  let json = await req.json();
  let { prompt, userAPIKey, iterativeMode } = z
    .object({
      prompt: z.string(),
      iterativeMode: z.boolean(),
      userAPIKey: z.string().optional(),
    })
    .parse(json);

  // Add observability if a Helicone key is specified, otherwise skip
  let options: ConstructorParameters<typeof Together>[0] = {};
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-BYOK": userAPIKey ? "true" : "false",
    };
  }

  const client = new Together(options);

  if (userAPIKey) {
    client.apiKey = userAPIKey;
  }

  if (ratelimit && !userAPIKey) {
    const identifier = getIPAddress();

    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return Response.json(
        "No requests left. Please add your own API key or try again in 24h.",
        {
          status: 429,
        },
      );
    }
  }

  let response;
  try {
    response = await client.images.create({
      prompt,
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      seed: iterativeMode ? 123 : undefined,
      steps: 3,
      // @ts-expect-error - this is not typed in the API
      response_format: "base64",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return Response.json(
      { error: e.toString() },
      {
        status: 500,
      },
    );
  }

  return Response.json(response.data[0]);
}

export const runtime = "edge";

function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}
