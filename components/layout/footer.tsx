import GithubIcon from "@/components/icons/github-icon";
import { Button } from "../ui/button";
import XIcon from "../icons/x-icon";

export function Footer() {
  return (
    <footer className="mt-16 w-full items-center pb-10 text-center text-gray-300 md:mt-4 md:flex md:justify-between md:pb-5 md:text-xs lg:text-sm">
      <p>
        Powered by{" "}
        <a
          href="https://togetherai.link/?utm_source=blinkshot&utm_medium=referral&utm_campaign=example-app"
          target="_blank"
          className="underline underline-offset-4 transition hover:text-blue-500"
        >
          Together.ai
        </a>{" "}
        &{" "}
        <a
          href="https://www.together.ai/models/juggernaut-lightning-flux"
          target="_blank"
          className="underline underline-offset-4 transition hover:text-blue-500"
        >
          Juggernaut Lightning Flux
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
  );
}
