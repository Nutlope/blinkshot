"use client";

import CheckIcon from "@/components/icons/check-icon";
import GithubIcon from "@/components/icons/github-icon";
import PictureIcon from "@/components/icons/picture-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import imagePlaceholder from "@/public/image-placeholder.png";
import cinematicImage from "@/public/styles/cinematic.png";
import fantasyImage from "@/public/styles/fantasy.png";
import minimalImage from "@/public/styles/minimal.png";
import moodyImage from "@/public/styles/moody.png";
import popArtImage from "@/public/styles/pop-art.png";
import retroImage from "@/public/styles/retro.png";
import vibrantImage from "@/public/styles/vibrant.png";
import watercolorImage from "@/public/styles/watercolor.png";
import artDecoImage from "@/public/styles/art-deco.jpeg";
import cyberpunkImage from "@/public/styles/cyberpunk.jpeg";
import grafitiImage from "@/public/styles/grafiti.jpeg";
import surrealImage from "@/public/styles/surreal.jpeg";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [userAPIKey, setUserAPIKey] = useState(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      return localStorage.getItem("togetherApiKey") || "";
    }
    return "";
  });
  const [selectedStyleValue, setSelectedStyleValue] = useState("");
  const debouncedPrompt = useDebounce(prompt, 350);
  const [generations, setGenerations] = useState<
    { prompt: string; image: ImageResponse }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();

  const selectedStyle = imageStyles.find((s) => s.value === selectedStyleValue);

  const { data: image, isFetching } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt + selectedStyleValue],
    queryFn: async () => {
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          style: imagePrompts[selectedStyleValue],
          userAPIKey,
          iterativeMode,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      return (await res.json()) as ImageResponse;
    },
    enabled: !!debouncedPrompt.trim(),
    staleTime: Infinity,
    retry: false,
  });

  let isDebouncing = prompt !== debouncedPrompt;

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => [...images, { prompt, image }]);
      setActiveIndex(generations.length);
    }
  }, [generations, image, prompt]);

  useEffect(() => {
    if (userAPIKey) {
      localStorage.setItem("togetherApiKey", userAPIKey);
    } else {
      localStorage.removeItem("togetherApiKey");
    }
  }, [userAPIKey]);

  let activeImage =
    activeIndex !== undefined ? generations[activeIndex].image : undefined;

  // Function to handle image download
  const handleDownload = (format: 'jpg' | 'png', quality: 'high' | 'medium' | 'low') => {
    if (!activeImage) return;
    
    // Create an image from the base64 data
    const img = new window.Image();
    img.crossOrigin = "Anonymous"; // Add cross-origin handling
    
    img.onload = () => {
      // Create a canvas to manipulate the image
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Adjust size based on quality
      if (quality === 'medium') {
        width = Math.floor(width * 0.7);
        height = Math.floor(height * 0.7);
      } else if (quality === 'low') {
        width = Math.floor(width * 0.4);
        height = Math.floor(height * 0.4);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }
      
      // Fill with white background for JPG (prevents transparency issues)
      if (format === 'jpg') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Set quality parameter (0.95 for high, 0.8 for medium, 0.6 for low)
      const qualityValue = quality === 'high' ? 0.95 : quality === 'medium' ? 0.8 : 0.6;
      
      // Convert to blob with quality parameter
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Failed to create blob");
            return;
          }
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `blinkshot-image.${format}`;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 
        format === 'jpg' ? 'image/jpeg' : 'image/png',
        qualityValue
      );
    };
    
    img.onerror = (err) => {
      console.error("Error loading image for download:", err);
    };
    
    // Ensure we're using the correct data URL format
    img.src = `data:image/png;base64,${activeImage.b64_json}`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="bg-cyan-600 p-2 text-center text-white">
        <p className="text-balance">
          Check out{" "}
          <a
            href="https://loras.dev"
            className="font-semibold underline"
            target="_blank"
          >
            Loras.dev
          </a>{" "}
          to generate stylized AI Images
        </p>
      </div>
      <div className="relative mt-3 flex h-full flex-col px-5">
        <header className="flex justify-center pt-20 md:justify-end md:pt-3">
          <div className="absolute left-1/2 top-6 -translate-x-1/2">
            <a href="https://togetherai.link" target="_blank">
              <Logo />
            </a>
          </div>
          <div>
            <label className="text-xs text-gray-200">
              [Optional] Add your{" "}
              <a
                href="https://api.together.xyz/settings/api-keys"
                target="_blank"
                className="underline underline-offset-4 transition hover:text-blue-500"
              >
                Together API Key
              </a>{" "}
            </label>
            <Input
              placeholder="API Key"
              type="password"
              value={userAPIKey}
              className="mt-1 bg-gray-400 text-gray-200 placeholder:text-gray-300"
              onChange={(e) => setUserAPIKey(e.target.value)}
            />
          </div>
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
                  className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 px-4 text-base placeholder-gray-300"
                />
                <div
                  className={`${isFetching || isDebouncing ? "flex" : "hidden"} absolute bottom-3 right-3 items-center justify-center`}
                >
                  <Spinner className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-sm md:text-right">
                <div>
                  <label
                    title="Use earlier images as references"
                    className="inline-flex cursor-pointer items-center gap-2 rounded border-[0.5px] border-gray-350 bg-gray-500 px-2 py-1.5 shadow shadow-black"
                  >
                    <input
                      type="checkbox"
                      className="accent-white"
                      checked={iterativeMode}
                      onChange={() => {
                        setIterativeMode(!iterativeMode);
                      }}
                    />
                    Consistency Mode
                  </label>
                </div>
                <div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-sm border-[0.5px] border-gray-350 bg-gray-400 px-2 py-1.5 text-gray-200"
                      >
                        <PictureIcon className="size-[12px]" />
                        {selectedStyle
                          ? `Style: ${selectedStyle.label}`
                          : "Styles"}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="p-10">
                      <DialogHeader>
                        <DialogTitle>Select a style</DialogTitle>
                        <DialogDescription>
                          Select a style to instantly transform your shots and
                          bring out the best in your creative ideas.{" "}
                          <span className="text-gray-350">
                            Experiment, explore, and make it yours!
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <RadioGroup.Root
                        value={selectedStyleValue}
                        onValueChange={setSelectedStyleValue}
                        className="grid grid-cols-2 gap-2 md:grid-cols-4"
                      >
                        {imageStyles.map((style) => (
                          <RadioGroup.Item
                            value={style.value}
                            className="group relative"
                            key={style.value}
                          >
                            <Image
                              src={style.image}
                              sizes="(max-width: 768px) 50vw, 150px"
                              alt={style.label}
                              className="aspect-square rounded transition group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:opacity-50"
                            />
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent p-2">
                              <p className="text-xs font-bold text-white">
                                {style.label}
                              </p>
                              <RadioGroup.Indicator className="inline-flex size-[14px] items-center justify-center rounded-full bg-white">
                                <CheckIcon />
                              </RadioGroup.Indicator>
                            </div>
                          </RadioGroup.Item>
                        ))}
                      </RadioGroup.Root>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
          {!activeImage || !prompt ? (
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
            <div className="mt-4 flex w-full max-w-4xl flex-col justify-center">
              <div>
                <Image
                  placeholder="blur"
                  blurDataURL={imagePlaceholder.blurDataURL}
                  width={1024}
                  height={768}
                  src={`data:image/png;base64,${activeImage.b64_json}`}
                  alt=""
                  className={`${isFetching ? "animate-pulse" : ""} max-w-full rounded-lg object-cover shadow-sm shadow-black`}
                />
                <div className="mt-2 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="inline-flex items-center gap-2"
                      >
                        <Download className="size-4" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="p-2 text-xs font-semibold text-gray-200">JPG Format</div>
                      <DropdownMenuItem onClick={() => handleDownload('jpg', 'high')}>
                        High Resolution
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload('jpg', 'medium')}>
                        Medium Resolution
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload('jpg', 'low')}>
                        Low Resolution
                      </DropdownMenuItem>
                      
                      <div className="p-2 text-xs font-semibold text-gray-200">PNG Format</div>
                      <DropdownMenuItem onClick={() => handleDownload('png', 'high')}>
                        High Resolution
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload('png', 'medium')}>
                        Medium Resolution
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload('png', 'low')}>
                        Low Resolution
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-4 flex gap-4 overflow-x-scroll pb-4">
                {generations.map((generatedImage, i) => (
                  <button
                    key={i}
                    className="w-32 shrink-0 opacity-50 hover:opacity-100"
                    onClick={() => setActiveIndex(i)}
                  >
                    <Image
                      placeholder="blur"
                      blurDataURL={imagePlaceholder.blurDataURL}
                      width={1024}
                      height={768}
                      src={`data:image/png;base64,${generatedImage.image.b64_json}`}
                      alt=""
                      className="max-w-full rounded-lg object-cover shadow-sm shadow-black"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-16 w-full items-center pb-10 text-center text-gray-300 md:mt-4 md:flex md:justify-between md:pb-5 md:text-xs lg:text-sm">
          <p>
            Powered by{" "}
            <a
              href="https://togetherai.link"
              target="_blank"
              className="underline underline-offset-4 transition hover:text-blue-500"
            >
              Together.ai
            </a>{" "}
            &{" "}
            <a
              href="https://togetherai.link/together-flux"
              target="_blank"
              className="underline underline-offset-4 transition hover:text-blue-500"
            >
              Flux
            </a>
          </p>

          <div className="mt-8 flex items-center justify-center md:mt-0 md:justify-between md:gap-6">
            <p className="hidden whitespace-nowrap md:block">
              100% free and{" "}
              <a
                href="https://github.com/Nutlope/blinkshot"
                target="_blank"
                className="underline underline-offset-4 transition hover:text-blue-500"
              >
                open source
              </a>
            </p>

            <div className="flex gap-6 md:gap-2">
              <a href="https://github.com/Nutlope/blinkshot" target="_blank">
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <GithubIcon className="size-4" />
                  GitHub
                </Button>
              </a>
              <a href="https://x.com/nutlope" target="_blank">
                <Button
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <XIcon className="size-3" />
                  Twitter
                </Button>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

const imageStyles = [
  {
    label: "Pop Art",
    value: "pop-art",
    image: popArtImage,
    prompt:
      "Create an image in the bold and vibrant style of classic pop art, using bright primary colors, thick outlines, and a playful comic book flair. Incorporate stylized, mass-produced imagery or dotted shading for added impact.",
  },
  {
    label: "Minimal",
    value: "minimal",
    image: minimalImage,
    prompt:
      "Generate a simple, clean composition with limited shapes and subtle color accents. Emphasize negative space and precise lines to achieve an elegant, understated look.",
  },
  {
    label: "Retro",
    value: "retro",
    image: retroImage,
    prompt:
      "Design a vintage-inspired scene with nostalgic color palettes, distressed textures, and bold mid-century typography. Capture the essence of old posters, ads, or signs for an authentic throwback vibe.",
  },
  {
    label: "Watercolor",
    value: "watercolor",
    image: watercolorImage,
    prompt:
      "Produce a delicate, painterly image emulating fluid watercolor strokes and soft gradients. Blend pastel hues and dreamy splashes to create a light, handcrafted feel.",
  },
  {
    label: "Fantasy",
    value: "fantasy",
    image: fantasyImage,
    prompt:
      "Illustrate a whimsical realm filled with magical creatures, enchanted forests, and otherworldly elements. Use vibrant colors and ornate detailing to evoke a sense of wonder and adventure.",
  },
  {
    label: "Moody",
    value: "moody",
    image: moodyImage,
    prompt:
      "Craft an atmospheric scene defined by dramatic lighting, deep shadows, and rich textures. Evoke emotion with subdued color tones and an underlying sense of tension.",
  },
  {
    label: "Vibrant",
    value: "vibrant",
    image: vibrantImage,
    prompt:
      "Generate an energetic, eye-popping design with bold, saturated hues and dynamic contrasts. Layer vivid gradients and striking shapes for a lively, high-impact result.",
  },
  {
    label: "Cinematic",
    value: "cinematic",
    image: cinematicImage,
    prompt:
      "Compose a visually stunning frame reminiscent of a movie still, complete with dramatic lighting and evocative color grading. Convey a strong sense of story through expressive angles and rich detail.",
  },
  {
    label: "Cyberpunk",
    value: "cyberpunk",
    image: cyberpunkImage,
    prompt:
      "Envision a futuristic, neon-lit cityscape infused with advanced technology and dystopian undertones. Layer towering skyscrapers, holographic signage, and edgy urban elements for a gritty, high-tech aesthetic.",
  },
  {
    label: "Surreal",
    value: "Surreal",
    image: surrealImage,
    prompt:
      "Construct a dreamlike world blending unexpected, fantastical elements in bizarre yet captivating ways. Use vivid colors and warped perspectives to create an otherworldly, mind-bending atmosphere.",
  },
  {
    label: "Art Deco",
    value: "art-deco",
    image: artDecoImage,
    prompt:
      "Design a scene characterized by bold geometric shapes, streamlined forms, and luxe metallic accents. Channel the sophistication of the 1920s and 1930s with glamorous patterns and elegant symmetry.",
  },
  {
    label: "Grafiti",
    value: "grafiti",
    image: grafitiImage,
    prompt:
      "Produce an urban-inspired piece rich with spray paint textures, edgy lettering, and vibrant color bursts. Layer paint drips, splatters, and bold typography for a raw, street-art aesthetic.",
  },
];

const imagePrompts: Record<string, string> = imageStyles.reduce(
  (acc, style) => ({
    ...acc,
    [style.value]: style.prompt,
  }),
  {},
);
