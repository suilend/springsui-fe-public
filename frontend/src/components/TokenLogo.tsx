import Image from "next/image";

import { ClassValue } from "clsx";

import { Token } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  className?: ClassValue;
  token: Token;
  size: number;
}

export default function TokenLogo({ className, token, size }: TokenLogoProps) {
  return token.iconUrl ? (
    <Image
      className={cn("rounded-[50%]", className)}
      src={token.iconUrl}
      alt={`${token.symbol} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={cn("rounded-[50%] bg-navy-100", className)}
      style={{ width: size, height: size }}
    />
  );
}
