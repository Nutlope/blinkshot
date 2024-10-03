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

export default function Home() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-5">
      <header className="pt-6">
        <Logo />
      </header>

      <div className="mt-6 flex w-full max-w-md flex-col gap-4">
        <div className="relative">
          <Input
            placeholder="Describe your image..."
            className="h-12 border-[0.3px] border-gray-300 border-opacity-50 bg-gray-400 placeholder-gray-300 lg:h-16 lg:px-4 lg:text-base"
          />
          <div className="absolute right-2 top-0 flex h-full items-center justify-center lg:right-4">
            <button className="flex size-8 items-center justify-center rounded bg-white">
              <ArrowIcon className="size-7" />
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <Select>
            <SelectTrigger className="grow bg-gray-500 shadow-sm shadow-black">
              <SelectValue placeholder="Flux Pro 1.1" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Flux Pro 1.1</SelectItem>
              <SelectItem value="dark">Flux Schnell</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="inline-flex items-center gap-1 whitespace-nowrap px-3 text-sm shadow-sm shadow-black"
          >
            <SparklesIcon className="size-4" />
            Enhance prompt
          </Button>
        </div>
      </div>

      <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
        <div className="max-w-xl lg:max-w-3xl">
          <p className="text-xl font-semibold text-gray-200 md:text-3xl lg:text-5xl">
            Generate images in seconds
          </p>
          <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
            Type a prompt, choose your model, enhance your prompt, and generate
            images in the blink of an eye.
          </p>
        </div>
      </div>

      <footer className="w-full items-center py-6 text-center text-gray-300 md:flex md:justify-between">
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
