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

export const FOOTER_MD_HEIGHT = 40; // px

function FooterContent() {
  return (
    <div className="flex w-full flex-row justify-between gap-2">
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
        <Link
          className="text-p2 text-navy-600 transition-colors hover:text-foreground"
          href={SUILEND_URL}
          target="_blank"
        >
          Powered by Suilend
        </Link>
      </div>

      <div className="flex flex-row items-center gap-6">
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
          <XIcon className="h-4 w-4" />
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

export function FooterSm() {
  return (
    <div className="w-full md:hidden">
      <div className="h-px w-full bg-navy-100" />
      <div className="w-full px-2 py-2.5">
        <FooterContent />
      </div>
    </div>
  );
}

export function FooterMd() {
  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[2] bg-white px-10 py-2.5 max-md:hidden"
        style={{ height: FOOTER_MD_HEIGHT }}
      >
        <FooterContent />
      </div>
      <div
        className="relative z-[1] w-full shrink-0 max-md:hidden"
        style={{ height: FOOTER_MD_HEIGHT }}
      />
    </>
  );
}
