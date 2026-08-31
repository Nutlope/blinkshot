import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);

async function reservePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const port = address.port;
  server.close();
  await once(server, "close");
  return port;
}

async function stopChild(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const killTimer = setTimeout(() => child.kill("SIGKILL"), 5_000);
  await exited;
  clearTimeout(killTimer);
}

test("Together transport does not depend on legacy node-fetch", async () => {
  const packageRoot = dirname(require.resolve("together-ai"));
  const packageJson = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  ) as { dependencies?: Record<string, string> };

  assert.equal(
    packageJson.dependencies?.["node-fetch"],
    undefined,
    "node-fetch@2 calls deprecated url.parse() in bundled Next.js routes",
  );
});

test(
  "POST /api/generateImages uses the current Together transport",
  { timeout: 30_000 },
  async () => {
    let resolveProviderRequest!: (request: {
      authorization: string | undefined;
      body: unknown;
      method: string | undefined;
      url: string | undefined;
    }) => void;
    let rejectProviderRequest!: (error: Error) => void;
    const providerRequest = new Promise<{
      authorization: string | undefined;
      body: unknown;
      method: string | undefined;
      url: string | undefined;
    }>((resolve, reject) => {
      resolveProviderRequest = resolve;
      rejectProviderRequest = reject;
    });

    const provider = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("error", rejectProviderRequest);
      request.on("end", () => {
        try {
          resolveProviderRequest({
            authorization: request.headers.authorization,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
            method: request.method,
            url: request.url,
          });
          response.writeHead(200, { "content-type": "application/json" });
          response.end(
            JSON.stringify({
              id: "test-response",
              model: "Rundiffusion/Juggernaut-Lightning-Flux",
              object: "list",
              data: [{ type: "b64_json", index: 0, b64_json: "fake-image" }],
            }),
          );
        } catch (error) {
          rejectProviderRequest(
            error instanceof Error ? error : new Error(String(error)),
          );
          response.writeHead(400).end();
        }
      });
    });

    provider.listen(0, "127.0.0.1");
    await once(provider, "listening");

    const providerAddress = provider.address();
    assert.ok(providerAddress && typeof providerAddress !== "string");

    const appPort = await reservePort();
    const next = spawn(
      process.execPath,
      [
        require.resolve("next/dist/bin/next"),
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(appPort),
      ],
      {
        cwd: join(import.meta.dirname, ".."),
        env: {
          ...process.env,
          BRAINTRUST_API_KEY: "",
          HELICONE_API_KEY: "",
          NEXT_TELEMETRY_DISABLED: "1",
          NODE_OPTIONS: "--trace-deprecation",
          TOGETHER_API_KEY: "route-test-api-key",
          TOGETHER_BASE_URL: `http://127.0.0.1:${providerAddress.port}`,
          UPSTASH_REDIS_REST_TOKEN: "",
          UPSTASH_REDIS_REST_URL: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let nextOutput = "";
    const ready = new Promise<void>((resolve, reject) => {
      const readyTimeout = setTimeout(
        () => reject(new Error(`Next.js did not start:\n${nextOutput}`)),
        15_000,
      );
      const capture = (chunk: Buffer) => {
        nextOutput += chunk.toString("utf8");
        if (nextOutput.includes("Ready in")) {
          clearTimeout(readyTimeout);
          resolve();
        }
      };

      next.stdout?.on("data", capture);
      next.stderr?.on("data", capture);
      next.once("error", reject);
      next.once("exit", (code, signal) => {
        clearTimeout(readyTimeout);
        reject(
          new Error(
            `Next.js exited before becoming ready (${code ?? signal}):\n${nextOutput}`,
          ),
        );
      });
    });

    try {
      await ready;

      const response = await fetch(
        `http://127.0.0.1:${appPort}/api/generateImages`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: `http://127.0.0.1:${appPort}`,
            "sec-fetch-site": "same-origin",
          },
          body: JSON.stringify({
            prompt: "A calm lighthouse by the sea at sunset",
            iterativeMode: false,
            userAPIKey: "route-test-api-key",
          }),
        },
      );

      assert.equal(response.status, 200, nextOutput);
      assert.deepEqual(await response.json(), {
        type: "b64_json",
        index: 0,
        b64_json: "fake-image",
      });
      assert.deepEqual(await providerRequest, {
        authorization: "Bearer route-test-api-key",
        method: "POST",
        url: "/images/generations",
        body: {
          prompt: "A calm lighthouse by the sea at sunset",
          model: "Rundiffusion/Juggernaut-Lightning-Flux",
          width: 1024,
          height: 768,
          steps: 4,
          response_format: "base64",
        },
      });

      await delay(100);
      assert.doesNotMatch(nextOutput, /\[DEP0169\]/, nextOutput);
    } finally {
      await stopChild(next);
      const closed = once(provider, "close");
      provider.close();
      provider.closeAllConnections();
      await closed;
    }
  },
);
