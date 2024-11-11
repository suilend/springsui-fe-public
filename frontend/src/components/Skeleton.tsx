import { CSSProperties } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: ClassValue;
  style?: CSSProperties;
}

export default function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-navy-100", className)} style={style} />
  );
}
