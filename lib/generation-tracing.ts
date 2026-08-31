import type { ImageGenerationInput } from "@/lib/image-generation";
import {
  IMAGE_GENERATION_HEIGHT,
  IMAGE_GENERATION_STEPS,
  IMAGE_GENERATION_WIDTH,
  buildImageGenerationRequest,
  estimateImageGenerationCost,
} from "@/lib/image-generation";

type TogetherImageResponse = {
  id?: string;
  model?: string;
  object?: unknown;
  usage?: unknown;
  data?: Array<{
    b64_json?: string;
    timings?: Record<string, unknown>;
  }>;
};

const SENSITIVE_METADATA_KEY =
  /api.?key|authorization|b64|base64|image.?payload/i;

export function buildGenerationTraceStart(
  input: ImageGenerationInput,
  byok: boolean,
) {
  const request = buildImageGenerationRequest(input);

  return {
    input: {
      prompt: request.effectivePrompt,
    },
    metadata: {
      provider: "together",
      route: "/api/generateImages",
      style: input.style ?? null,
      model: request.model,
      width: request.width,
      height: request.height,
      steps: request.steps,
      iterativeMode: input.iterativeMode,
      seeded: request.seed !== undefined,
      seed: request.seed ?? null,
      byok,
    },
  };
}

export function buildGenerationTraceSuccess(
  response: TogetherImageResponse,
  durationMs: number,
) {
  const inferenceMilliseconds = response.data?.[0]?.timings?.inference;
  const cost = estimateImageGenerationCost({
    width: IMAGE_GENERATION_WIDTH,
    height: IMAGE_GENERATION_HEIGHT,
    steps: IMAGE_GENERATION_STEPS,
    imageCount: response.data?.length ?? 0,
  });
  const metrics: Record<string, number> = {
    duration_ms: durationMs,
    estimated_cost: cost.estimatedCost,
  };

  if (typeof inferenceMilliseconds === "number") {
    metrics.inference_ms = inferenceMilliseconds;
  }

  return {
    output: {
      imageCount: response.data?.length ?? 0,
      responseId: response.id ?? null,
      responseModel: response.model ?? null,
      responseObject: response.object ?? null,
    },
    metadata: {
      success: true,
      cost: {
        currency: "USD",
        ...cost,
      },
      usage: sanitizeUsageMetadata(response.usage),
      timings: response.data?.map((item) => item.timings ?? null) ?? [],
    },
    metrics,
  };
}

export function sanitizeUsageMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeUsageMetadata);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_METADATA_KEY.test(key))
        .map(([key, item]) => [key, sanitizeUsageMetadata(item)]),
    );
  }

  return value;
}
