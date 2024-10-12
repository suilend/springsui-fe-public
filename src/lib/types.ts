import { StaticImageData } from "next/image";

import { CoinMetadata } from "@mysten/sui/client";

export type Token = Omit<CoinMetadata, "iconUrl"> & {
  coinType: string;
  iconUrl?: StaticImageData | string | null;
};
