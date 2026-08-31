import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const project = process.env.BRAINTRUST_PROJECT ?? "blinkshot";
const vercelDeployment = process.env.VERCEL_DEPLOYMENT;
const vercelScope = process.env.VERCEL_SCOPE ?? "together-ai-0f0e15af";
const marker = `BT-E2E-${randomUUID()}`;
const prompt = `A tiny blue lighthouse on a white background. ${marker}`;

type LogRow = {
  error: unknown;
  input: { prompt?: string } | null;
  is_root: boolean;
  metadata: Record<string, unknown> | null;
  metrics: Record<string, number>;
  output: Record<string, unknown> | null;
  root_span_id: string;
  span_attributes: { name?: string };
};

function queryRows(): LogRow[] {
  const output = execFileSync(
    "node_modules/.bin/bt",
    [
      "view",
      "logs",
      "-p",
      project,
      "--no-input",
      "--quiet",
      "--json",
      "--window",
      "30m",
      "--limit",
      "20",
      "--preview-length",
      "100000",
      "--list-mode",
      "spans",
      "--search",
      marker,
    ],
    { encoding: "utf8" },
  );

  const result = JSON.parse(output) as { items?: Array<{ row: LogRow }> };
  return result.items?.map((item) => item.row) ?? [];
}

async function main() {
  const image = await requestImage();
  if (!image.b64_json || image.b64_json.length < 100) {
    throw new Error("Generation response did not contain a base64 image");
  }

  let rows: LogRow[] = [];
  for (let attempt = 0; attempt < 15; attempt += 1) {
    rows = queryRows();
    if (
      rows.some((row) => row.metadata?.success === true || row.error != null)
    ) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  const trace = rows.find(
    (row) => row.span_attributes.name === "blinkshot.generate-image",
  );
  const serialized = JSON.stringify(trace);
  const failures = [
    [Boolean(trace), "generation span is missing"],
    [trace?.is_root === true, "generation span is not a root span"],
    [trace?.error == null, "generation span contains an error"],
    [trace?.metadata?.success === true, "generation is not marked successful"],
    [
      trace?.metadata?.model === "Rundiffusion/Juggernaut-Lightning-Flux",
      "model metadata is wrong",
    ],
    [
      trace?.metadata?.width === 1024 && trace?.metadata?.height === 768,
      "dimensions are wrong",
    ],
    [trace?.metadata?.steps === 4, "steps metadata is wrong"],
    [
      trace?.metadata?.iterativeMode === true && trace?.metadata?.seed === 123,
      "seed metadata is wrong",
    ],
    [trace?.metadata?.byok === false, "BYOK metadata is wrong"],
    [(trace?.metrics.duration_ms ?? 0) > 0, "latency metric is missing"],
    [(trace?.metrics.estimated_cost ?? 0) > 0, "cost metric is missing"],
    [trace?.output?.imageCount === 1, "image count output is wrong"],
    [
      trace?.input?.prompt?.includes(marker) === true,
      "effective prompt is missing",
    ],
    [!serialized.includes("b64_json"), "trace contains a base64 field"],
    [
      !serialized.includes(image.b64_json.slice(0, 100)),
      "trace contains image payload bytes",
    ],
    [!serialized.includes("userAPIKey"), "trace contains a user API key field"],
  ].filter(([passed]) => !passed);

  if (failures.length > 0) {
    throw new Error(
      `Braintrust trace verification failed:\n${failures
        .map(([, message]) => `- ${message}`)
        .join("\n")}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        preview: new URL(baseUrl).host,
        rootSpanId: trace?.root_span_id,
        span: trace?.span_attributes.name,
        model: trace?.metadata?.model,
        dimensions: `${trace?.metadata?.width}x${trace?.metadata?.height}`,
        steps: trace?.metadata?.steps,
        iterativeMode: trace?.metadata?.iterativeMode,
        seeded: trace?.metadata?.seeded,
        byok: trace?.metadata?.byok,
        durationMs: trace?.metrics.duration_ms,
        inferenceMs: trace?.metrics.inference_ms,
        estimatedCostUsd: trace?.metrics.estimated_cost,
        usageMetadataReturned: trace?.metadata?.usage != null,
        imageResponseVerified: true,
        privacyChecksPassed: true,
      },
      null,
      2,
    ),
  );
}

async function requestImage() {
  const body = JSON.stringify({
    prompt,
    iterativeMode: true,
    style: "minimal",
  });

  if (vercelDeployment) {
    const output = execFileSync(
      "vercel",
      [
        "curl",
        "/api/generateImages",
        "--deployment",
        vercelDeployment,
        "--scope",
        vercelScope,
        "--",
        "--silent",
        "--show-error",
        "--fail-with-body",
        "--request",
        "POST",
        "--header",
        "Content-Type: application/json",
        "--data",
        body,
      ],
      { encoding: "utf8" },
    );
    return JSON.parse(output) as { b64_json?: string };
  }

  const response = await fetch(`${baseUrl}/api/generateImages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Generation returned ${response.status}: ${await response.text()}`,
    );
  }

  return (await response.json()) as { b64_json?: string };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
