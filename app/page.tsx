import ArrowIcon from "@/components/arrow-icon";
import Logo from "@/components/logo";
import SparklesIcon from "@/components/sparkles-icon";
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
    <div className="mt-10 flex flex-col items-center justify-center px-5">
      <div>
        <Logo />
      </div>

      <div className="mt-6 flex w-full flex-col gap-4">
        <div className="relative">
          <Input
            placeholder="Describe your image..."
            className="h-12 border-[0.3px] border-gray-300 border-opacity-50 bg-gray-400 placeholder-gray-300"
          />
          <div className="absolute right-2 top-0 flex h-full items-center justify-center">
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

          <button className="inline-flex items-center gap-1 whitespace-nowrap rounded border bg-gray-500 px-3 text-sm shadow-sm shadow-black">
            <SparklesIcon className="size-4" />
            Enhance prompt
          </button>
        </div>
      </div>
    </div>
  );
}
