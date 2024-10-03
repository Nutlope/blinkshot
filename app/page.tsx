"use client";

import ArrowIcon from "@/components/arrow-icon";
import Logo from "@/components/logo";
import SparklesIcon from "@/components/sparkles-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { FormEvent, useState } from "react";
import imagePlaceholder from "@/public/image-placeholder.png";

let models = [
  { label: "Flux 1.1 Pro", value: "black-forest-labs/FLUX.1.1-pro" },
  { label: "Flux Schnell", value: "black-forest-labs/FLUX.1-schnell" },
];

export default function Home() {
  let [status, setStatus] = useState<"idle" | "loading" | "generated">("idle");
  let [prompt, setPrompt] = useState("");
  let [model, setModel] = useState(models[0].value);
  let [images, setImages] = useState<{ url: string }[]>([
    {
      url: "https://api.together.ai/imgproxy/NKQDXe9gwB8M45pUhYRp35Su_QAnsnzpgPuo3o8btyU/format:jpg/aHR0cHM6Ly9iZmxhcGlzdG9yYWdlLmJsb2IuY29yZS53aW5kb3dzLm5ldC9wdWJsaWMvMzc1YzZhYjZhZTM4NDg0OGIyMDIyN2MyOGYzNjNiMmYvc2FtcGxlLmpwZw",
    },
    {
      url: "https://api.together.ai/imgproxy/NKQDXe9gwB8M45pUhYRp35Su_QAnsnzpgPuo3o8btyU/format:jpg/aHR0cHM6Ly9iZmxhcGlzdG9yYWdlLmJsb2IuY29yZS53aW5kb3dzLm5ldC9wdWJsaWMvMzc1YzZhYjZhZTM4NDg0OGIyMDIyN2MyOGYzNjNiMmYvc2FtcGxlLmpwZw",
    },
    {
      url: "https://api.together.ai/imgproxy/NKQDXe9gwB8M45pUhYRp35Su_QAnsnzpgPuo3o8btyU/format:jpg/aHR0cHM6Ly9iZmxhcGlzdG9yYWdlLmJsb2IuY29yZS53aW5kb3dzLm5ldC9wdWJsaWMvMzc1YzZhYjZhZTM4NDg0OGIyMDIyN2MyOGYzNjNiMmYvc2FtcGxlLmpwZw",
    },
    {
      url: "https://api.together.ai/imgproxy/NKQDXe9gwB8M45pUhYRp35Su_QAnsnzpgPuo3o8btyU/format:jpg/aHR0cHM6Ly9iZmxhcGlzdG9yYWdlLmJsb2IuY29yZS53aW5kb3dzLm5ldC9wdWJsaWMvMzc1YzZhYjZhZTM4NDg0OGIyMDIyN2MyOGYzNjNiMmYvc2FtcGxlLmpwZw",
    },
  ]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    let res = await fetch("/api/generateImages", { method: "POST" });
    let json = await res.json();

    setStatus("generated");
    setImages(json);
  }

  return (
    <div className="flex h-full flex-col px-5">
      <header className="flex justify-center pt-6">
        <Logo />
      </header>

      <div className="flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-md flex-col gap-4"
        >
          <div className="relative">
            <Input
              placeholder="Describe your image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-12 border-[0.3px] border-gray-300 border-opacity-50 bg-gray-400 placeholder-gray-300 lg:h-16 lg:px-4 lg:text-base"
            />
            <div className="absolute right-2 top-0 flex h-full items-center justify-center lg:right-4">
              <button
                type="submit"
                className="flex size-8 items-center justify-center rounded bg-white"
              >
                <ArrowIcon className="size-7" />
              </button>
            </div>
          </div>
          <div className="flex gap-4">
            <Select name="model" value={model} onValueChange={setModel}>
              <SelectTrigger className="grow bg-gray-500 shadow-sm shadow-black">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              type="button"
              className="inline-flex items-center gap-1 whitespace-nowrap px-3 text-sm shadow-sm shadow-black"
            >
              <SparklesIcon className="size-4" />
              Enhance prompt
            </Button>
          </div>
        </form>
      </div>

      <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
        {status === "idle" || status === "loading" ? (
          <div className="max-w-xl lg:max-w-3xl">
            <p className="text-xl font-semibold text-gray-200 md:text-3xl lg:text-5xl">
              Generate images in seconds
            </p>
            <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
              Type a prompt, choose your model, enhance your prompt, and
              generate images in the blink of an eye.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid w-full max-w-7xl gap-8 md:grid-cols-2">
            {images.map((image) => (
              <div key={image.url}>
                <Image
                  placeholder="blur"
                  blurDataURL={imagePlaceholder.blurDataURL}
                  width={1024}
                  height={768}
                  src={image.url}
                  alt=""
                  className="max-w-full rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-16 w-full items-center pb-10 text-center text-gray-300 md:flex md:justify-between">
        <p>Powered by Together.ai & Flux</p>

        <div className="mt-4 flex items-center justify-between md:mt-0 md:gap-6">
          <p className="whitespace-nowrap text-xs">100% free and open source</p>

          <div className="flex gap-1">
            <button className="border p-1 text-xs">GitHub</button>
            <button className="border p-1 text-xs">Twitter</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
