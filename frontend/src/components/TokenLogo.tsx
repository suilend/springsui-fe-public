import Image from "next/image";

import { ClassValue } from "clsx";

import { Token } from "@suilend/frontend-sui";

import Skeleton from "@/components/Skeleton";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  className?: ClassValue;
  token: Token | null;
  size: number;
}

export default function TokenLogo({ className, token, size }: TokenLogoProps) {
  if (token === null)
    return (
      <Skeleton
        className={cn("rounded-[50%]", className)}
        style={{ width: size, height: size }}
      />
    );
  if (!token.iconUrl)
    return (
      <div
        className={cn("rounded-[50%] bg-navy-100", className)}
        style={{ width: size, height: size }}
      />
    );
  return (
    <Image
      className={cn("rounded-[50%]", className)}
      src={token.iconUrl}
      alt={`${token.symbol} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      quality={100}
    />
  );
}
