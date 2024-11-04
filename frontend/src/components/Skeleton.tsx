import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: ClassValue;
}

export default function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse bg-navy-100", className)} />;
}
