import { useEffect } from "react";

import { ClassValue } from "clsx";

import { Token } from "@suilend/sui-fe";

import Skeleton from "@/components/Skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { isInvalidIconUrl } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  className?: ClassValue;
  token?: Token;
  size: number;
}

export default function TokenLogo({ className, token, size }: TokenLogoProps) {
  const { tokenIconImageLoadErrorMap, loadTokenIconImage } =
    useLoadedAppContext();

  useEffect(() => {
    if (!token) return;
    if (isInvalidIconUrl(token.iconUrl)) return;

    loadTokenIconImage(token);
  }, [token, loadTokenIconImage]);

  if (!token)
    return (
      <Skeleton
        className={cn(
          "shrink-0 rounded-[50%] border border-white/75 bg-white/20",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  if (
    isInvalidIconUrl(token.iconUrl) ||
    tokenIconImageLoadErrorMap[token.coinType]
  )
    return (
      <div
        className={cn(
          "shrink-0 rounded-[50%] border border-white/75 bg-white/20",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn("shrink-0 rounded-[50%]", className)}
      src={token.iconUrl!}
      alt={`${token.symbol} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
