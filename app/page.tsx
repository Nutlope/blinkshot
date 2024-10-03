import ArrowIcon from "@/components/arrow-icon";
import Logo from "@/components/logo";
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
    <div className="flex mt-10 px-5 justify-center flex-col items-center">
      <div>
        <Logo />
      </div>
      <div className="flex flex-col mt-4 gap-4 w-full">
        <div className="relative">
          {/* <input
            className="w-full rounded-lg bg-black border px-4 py-2"
            placeholder="Describe your image..."
          /> */}
          <Input
            placeholder="Describe your image..."
            className="bg-gray-400 border-gray-300 border-[0.3px] h-11"
          />
          <div className="absolute right-3 top-0 h-full  flex items-center justify-center">
            <button className="size-6 rounded flex items-center justify-center bg-white">
              <ArrowIcon />
            </button>
          </div>
        </div>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Flux Pro 1.1" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Flux Pro 1.1</SelectItem>
            <SelectItem value="dark">Flux Schnell</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
