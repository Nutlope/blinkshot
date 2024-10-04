"use client";

import GithubIcon from "@/components/icons/github-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import imagePlaceholder from "@/public/image-placeholder.png";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const debouncedPrompt = useDebounce(prompt, 250);

  const { data: image, isFetching } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt],
    queryFn: async () => {
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      return (await res.json()) as {
        b64_json: string;
        timings: { inference: number };
      };
    },
    enabled: !!prompt.trim(),
    staleTime: Infinity,
  });

  let isDebouncing = prompt !== debouncedPrompt;

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
              <div
                className={`${isFetching || isDebouncing ? "flex" : "hidden"} absolute right-4 top-6 h-full items-center justify-center lg:right-2`}
              >
                <Spinner className="size-4" />
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
        {!image ? (
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
            <div>
              <Image
                placeholder="blur"
                blurDataURL={imagePlaceholder.blurDataURL}
                width={1024}
                height={768}
                src={`data:image/png;base64,${image.b64_json}`}
                alt=""
                className={`${isFetching ? "animate-pulse" : ""} max-w-full rounded-lg object-cover shadow-sm shadow-black`}
              />
            </div>
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
