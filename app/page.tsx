"use client";

import ArrowIcon from "@/components/icons/arrow-icon";
import GithubIcon from "@/components/icons/github-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import imagePlaceholder from "@/public/image-placeholder.png";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<
    { b64_json: string; timings: { inference: number } }[]
  >([]);

  // Function to generate images
  async function generateImages() {
    if (!prompt.trim()) return;
    setIsLoading(true);

    try {
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      let json = await res.json();

      setImages(json);
    } catch (error) {
      console.error("Error generating images:", error);
    }

    setIsLoading(false);
  }

  // Debounce generateImages when prompt changes
  useEffect(() => {
    const handler = setTimeout(() => {
      generateImages();
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [prompt]);

  return (
    <div className="flex h-full flex-col px-5">
      <header className="flex justify-center pt-6">
        <a href="https://www.dub.sh/together" target="_blank">
          <Logo />
        </a>
      </header>

      <div className="flex justify-center">
        <form className="mt-10 w-full max-w-lg">
          <fieldset>
            <div className="relative">
              <Textarea
                rows={4}
                spellCheck={false}
                placeholder="Describe your image..."
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 pl-4 pr-16 placeholder-gray-300"
              />
              <div className="absolute right-2 top-6 flex h-full items-center justify-center lg:right-2">
                <Button
                  type="submit"
                  name="action"
                  value="generate"
                  className="group relative size-8 p-0 disabled:bg-transparent disabled:text-white"
                >
                  <ArrowIcon className="size-8 group-disabled:hidden" />

                  <div className="absolute inset-0 hidden items-center justify-center group-disabled:flex">
                    <Spinner className="size-4" />
                  </div>
                </Button>
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
        {images.length === 0 ? (
          <div className="max-w-xl md:max-w-4xl lg:max-w-3xl">
            <p className="text-xl font-semibold text-gray-200 md:text-3xl lg:text-4xl">
              Generate images in real-time
            </p>
            <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
              Enter a prompt and generate images in milliseconds as you type.
              Powered by Flux on Together AI.
            </p>
          </div>
        ) : (
          <div className="mt-12 flex w-full max-w-4xl justify-center gap-8">
            {images.map((image, i) => (
              <div key={image.b64_json}>
                <Image
                  placeholder="blur"
                  blurDataURL={imagePlaceholder.blurDataURL}
                  width={1024}
                  height={768}
                  src={`data:image/png;base64,${image.b64_json}`}
                  alt=""
                  className={`${isLoading ? "animate-pulse" : ""} max-w-full rounded-lg object-cover shadow-sm shadow-black`}
                  style={{
                    animationDelay: `${i * 75}ms`,
                  }}
                />
                <div>{image.timings.inference}ms</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-16 w-full items-center pb-10 text-center text-gray-300 md:flex md:justify-between md:text-xs lg:text-sm">
        <p>Powered by Together.ai & Flux</p>

        <div className="mt-8 flex items-center justify-center md:mt-0 md:justify-between md:gap-6">
          <p className="hidden whitespace-nowrap md:block">
            100% free and open source
          </p>

          <div className="flex gap-6 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2"
            >
              <GithubIcon className="size-4" />
              GitHub
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <XIcon className="size-3" />
              Twitter
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
