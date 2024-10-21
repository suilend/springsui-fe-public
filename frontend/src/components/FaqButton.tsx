import Link from "next/link";

import { MessageCircleQuestion } from "lucide-react";

import { FAQ_URL } from "@/lib/navigation";

export default function FaqButton() {
  return (
    <Link
      className="flex h-10 w-8 flex-row items-center justify-center gap-2 md:h-12 md:w-auto md:rounded-md md:bg-white md:px-4 md:shadow-sm"
      target="_blank"
      href={FAQ_URL}
    >
      <MessageCircleQuestion size={20} />

      {/* WIDTH >= md */}
      <p className="text-p2 max-md:hidden">FAQ</p>
    </Link>
  );
}
