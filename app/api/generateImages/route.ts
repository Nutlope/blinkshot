import Together from "together-ai";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

let options: ConstructorParameters<typeof Together>[0] = {};
let ratelimit: Ratelimit | undefined;

// Observability and rate limiting, if the API keys are set. If not, it skips.
if (process.env.HELICONE_API_KEY) {
  options.baseURL = "https://together.helicone.ai/v1";
  options.defaultHeaders = {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  };
}
if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    // Allow 30 requests per day
    limiter: Ratelimit.fixedWindow(30, "1440 m"),
    analytics: true,
    prefix: "blinkshot",
  });
}

const client = new Together(options);

export async function POST(req: Request) {
  let json = await req.json();
  let { prompt } = z
    .object({
      prompt: z.string(),
    })
    .parse(json);

  if (ratelimit) {
    const identifier = getIPAddress();
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return Response.json(
        "You have no requests left, please try again in 24h.",
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
