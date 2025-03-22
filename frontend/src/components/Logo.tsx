import Image from "next/image";

import { ASSETS_URL } from "@/lib/constants";

export default function Logo() {
  return (
    <div className="flex flex-row items-center gap-1.5">
      <Image
        src={`${ASSETS_URL}/SpringSui Standard.svg`}
        alt="SpringSui Standard logo"
        width={24}
        height={24}
        quality={100}
      />
      <p className="text-h3">SpringSui</p>
    </div>
  );
}
