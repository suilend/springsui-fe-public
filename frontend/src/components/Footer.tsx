import Image from "next/image";
import Link from "next/link";

import DiscordIcon from "@/components/icons/DiscordIcon";
import XIcon from "@/components/icons/XIcon";
import {
  DISCORD_URL,
  DOCS_URL,
  SUILEND_URL,
  TWITTER_URL,
} from "@/lib/navigation";

export default function Footer() {
  return (
    <div className="flex w-full flex-row justify-between gap-2 rounded-lg bg-white/25 p-4 text-left backdrop-blur-[10px] md:rounded-xl">
      {/* Powered by Suilend */}
      <div className="flex flex-row items-center gap-2">
        <Image
          className="h-4 w-4"
          src="https://suilend.fi/assets/suilend.svg"
          alt="Suilend logo"
          width={16}
          height={16}
          quality={100}
        />
        <p className="text-p2 text-navy-600">
          Powered by{" "}
          <Link
            className="transition-colors hover:text-foreground"
            href={SUILEND_URL}
            target="_blank"
          >
            Suilend
          </Link>
        </p>
      </div>

      <div className="flex flex-row items-center gap-4">
        <Link
          className="text-p2 text-navy-600 transition-colors hover:text-foreground"
          href={DOCS_URL}
          target="_blank"
        >
          Docs
        </Link>

        <Link
          className="block text-navy-600 transition-colors hover:text-foreground"
          href={TWITTER_URL}
          target="_blank"
        >
          <XIcon className="h-4 w-4 text-navy-600" />
        </Link>

        <Link
          className="block text-navy-600 transition-colors hover:text-foreground"
          href={DISCORD_URL}
          target="_blank"
        >
          <DiscordIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
