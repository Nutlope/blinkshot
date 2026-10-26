import Together from "together-ai";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import {
  flushBraintrust,
  getBraintrustLogger,
  logBraintrustFailure,
  serializeBraintrustError,
  type Span,
} from "@/lib/braintrust";
import { buildImageGenerationRequest } from "@/lib/image-generation";
import { imageStyleSlugSchema } from "@/lib/image-style-slugs";
import {
  buildGenerationTraceStart,
  buildGenerationTraceSuccess,
} from "@/lib/generation-tracing";
import { describePromptRejection, validatePrompt } from "@/lib/prompt-validation.server";
import { isAllowedOrigin, originOf } from "@/lib/origin-guard";
import {
  describeModerationDecision,
  moderatePrompt,
} from "@/lib/moderation/inference";

const MAX_PROMPT_LENGTH = 2000;
const MAX_API_KEY_LENGTH = 256;

let ratelimit: Ratelimit | undefined;
let byokRatelimit: Ratelimit | undefined;

if (process.env.UPSTASH_REDIS_REST_URL) {
  const redis = Redis.fromEnv();
  ratelimit = new Ratelimit({
    redis,
    // Allow 5 requests per day (~1 prompt), then need to use API key
    limiter: Ratelimit.fixedWindow(5, "1440 m"),
    analytics: true,
    prefix: "blinkshot",
    timeout: 0,
  });
  byokRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "blinkshot-byok",
    timeout: 0,
  });
}

// Allowed origins for the defense-in-depth origin guard. The real app also
// passes via Sec-Fetch-Site: same-origin, so an unset/empty set here never
// breaks legitimate same-origin calls — it just weakens the explicit check.
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    origins.add(process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""));
  }
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
  }
  return origins;
}

const allowedOrigins = buildAllowedOrigins();

export async function POST(req: Request) {
  const logger = getBraintrustLogger();
  const headersList = await headers();

  // Defense-in-depth: reject direct curl/bot calls that don't come from the
  // app's own origin. Spoofable speed bump, not a lock — see lib/origin-guard.
  if (
    !isAllowedOrigin({
      origin: headersList.get("origin"),
      referer: headersList.get("referer"),
      secFetchSite: headersList.get("sec-fetch-site"),
      allowedOrigins,
      requestUrl: req.url,
      allowLocalhost: process.env.NODE_ENV !== "production",
    })
  ) {
    // Log only header-bearing rejections (a request that carried an Origin or
    // Referer but wasn't allowed) — these are the potential false-positives
    // (a real user from an unallowed origin, or a misconfigured allowlist).
    // Bare bots with no Origin/Referer are skipped to avoid an unbounded log
    // flood. Metadata only — no prompt (the body isn't parsed yet anyway).
    const origin = headersList.get("origin");
    const referer = headersList.get("referer");
    if (origin !== null || referer !== null) {
      await logBraintrustFailure(
        {
          name: "blinkshot.generate-image",
          type: "llm",
          event: {
            metadata: {
              route: "/api/generateImages",
              phase: "origin-guard",
              success: false,
              rejectedOrigin: origin,
              rejectedRefererOrigin: referer ? originOf(referer) : null,
            },
          },
        },
        new Error("origin rejected"),
      );
      await flushBraintrust();
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let traceStarted = false;

  try {
    const json = await req.json();
    const parsed = z
      .object({
        prompt: z.string().max(MAX_PROMPT_LENGTH),
        iterativeMode: z.boolean(),
        userAPIKey: z.string().max(MAX_API_KEY_LENGTH).optional(),
        style: imageStyleSlugSchema.optional(),
      })
      .parse(json);
    const { prompt, iterativeMode, style } = parsed;
    const userAPIKey = parsed.userAPIKey?.trim() || undefined;
    if (userAPIKey && !/^[\x21-\x7e]+$/.test(userAPIKey)) {
      return Response.json({ error: "Invalid API key" }, { status: 400 });
    }

    // Server-side prompt safety gate (the real backstop since the client is
    // bypassable). Runs before any Together call so blocked/short prompts
    // spend no tokens. Logged to Braintrust without the prompt text.
    const validation = validatePrompt(prompt);
    if (!validation.ok) {
      // The logging-vs-skip decision + user-facing message live in a pure helper
      // so they are unit-tested (lib/prompt-validation.test.ts): only
      // `blocked_term` (the abuse signal) is logged; `too_short` is typing noise
      // and the easiest flood vector, and this path runs before the rate limiter.
      const rejection = describePromptRejection(validation, prompt);
      if (rejection.shouldLog) {
        await logBraintrustFailure(
          {
            name: "blinkshot.generate-image",
            type: "llm",
            event: {
              metadata: {
                route: "/api/generateImages",
                phase: "prompt-validation",
                success: false,
                ...rejection.logMetadata,
              },
            },
          },
          new Error(`prompt rejected: ${rejection.logMetadata.rejectionReason}`),
        );
        await flushBraintrust();
      }
      return Response.json({ error: rejection.message }, { status: 400 });
    }

    // ML residual gate (enguard tiny-guard-8m, pure-TS port). Runs on the raw
    // prompt after the deterministic blocklist, before any Together tokens are
    // spent — catches euphemisms/obfuscation the word-boundary matcher misses.
    // Logged to Braintrust without the prompt text (privacy contract). Uses the
    // clean moderatePrompt (no per-request timing log) — diagnostics live in the
    // standalone /api/moderate testbed route.
    const moderation = moderatePrompt(prompt);
    if (!moderation.ok) {
      const moderationRejection = describeModerationDecision(moderation, prompt);
      if (moderationRejection.shouldLog) {
        await logBraintrustFailure(
          {
            name: "blinkshot.generate-image",
            type: "llm",
            event: {
              metadata: {
                route: "/api/generateImages",
                phase: "moderation",
                success: false,
                ...moderationRejection.logMetadata,
              },
            },
          },
          new Error(
            `prompt rejected: ${moderationRejection.logMetadata.rejectionReason}`,
          ),
        );
        await flushBraintrust();
      }
      return Response.json(
        { error: moderationRejection.message },
        { status: 400 },
      );
    }

    const input = { prompt, iterativeMode, style };

    // Add observability if a Helicone key is specified, otherwise skip
    const options: ConstructorParameters<typeof Together>[0] = {};
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

    const limiter = userAPIKey ? byokRatelimit : ratelimit;
    if (!limiter) {
      if (process.env.NODE_ENV === "production") {
        console.error("Rate limiter is not configured");
        return Response.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 },
        );
      }
    } else {
      let success: boolean;
      try {
        ({ success } = await limiter.limit(await getIPAddress()));
      } catch (error) {
        console.error("Rate limiter unavailable:", error);
        return Response.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 },
        );
      }
      if (!success) {
        return Response.json(
          userAPIKey
            ? "Too many requests. Please slow down and try again in a minute."
            : "No requests left. Please add your own API key or try again in 24h.",
          {
            status: 429,
          },
        );
      }
    }

    const generateImage = async (span?: Span) => {
      const imageRequest = buildImageGenerationRequest(input);
      const startedAt = performance.now();

      try {
        const response = await client.images.generate({
          prompt: imageRequest.effectivePrompt,
          model: imageRequest.model,
          width: imageRequest.width,
          height: imageRequest.height,
          seed: imageRequest.seed,
          steps: imageRequest.steps,
          response_format: "base64",
        });

        span?.log(
          buildGenerationTraceSuccess(response, performance.now() - startedAt),
        );
        return Response.json(response.data[0]);
      } catch (error) {
        span?.log({
          error: serializeBraintrustError(error, [userAPIKey]),
          metadata: { success: false },
          metrics: { duration_ms: performance.now() - startedAt },
        });
        console.error("Image generation failed:", serializeBraintrustError(error, [userAPIKey]));
        return Response.json(
          { error: generationErrorMessage(error, Boolean(userAPIKey)) },
          {
            status: 500,
          },
        );
      }
    };

    if (!logger) return await generateImage();

    traceStarted = true;
    const response = await logger.traced((span) => generateImage(span), {
      name: "blinkshot.generate-image",
      type: "llm",
      event: buildGenerationTraceStart(input, Boolean(userAPIKey)),
    });
    await flushBraintrust();
    return response;
  } catch (error) {
    if (!traceStarted) {
      await logBraintrustFailure(
        {
          name: "blinkshot.generate-image",
          type: "llm",
          event: {
            metadata: {
              route: "/api/generateImages",
              phase: "request-validation",
              success: false,
            },
          },
        },
        error,
      );
    }
    await flushBraintrust();
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export const runtime = "nodejs";

function generationErrorMessage(error: unknown, usingOwnKey: boolean) {
  const status = (error as { status?: unknown } | null)?.status;
  if (usingOwnKey && status === 401) {
    return "Your API key is invalid. Please check it and try again.";
  }
  if (usingOwnKey && status === 402) {
    return "Your Together account is out of credits.";
  }
  return "Image generation failed. Please try again.";
}

// Vercel sets x-real-ip and x-vercel-forwarded-for from the connection and
// overwrites client-supplied values; x-forwarded-for is only trusted off Vercel.
async function getIPAddress() {
  const headersList = await headers();
  const vercelIp =
    headersList.get("x-real-ip") ??
    headersList.get("x-vercel-forwarded-for")?.split(",")[0];
  const ip =
    vercelIp?.trim() ||
    (process.env.VERCEL !== "1"
      ? headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      : undefined) ||
    "unknown";
  return normalizeIp(ip);
}

// IPv6 clients usually control a whole /64, so they share one bucket.
function normalizeIp(ip: string) {
  if (!ip.includes(":")) return ip;
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];
  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = ip.includes("::") ? 8 - headGroups.length - tailGroups.length : 0;
  const groups = [...headGroups, ...Array(Math.max(missing, 0)).fill("0"), ...tailGroups];
  return `${groups.slice(0, 4).join(":")}::/64`;
}
