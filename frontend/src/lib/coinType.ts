import { normalizeStructTag } from "@mysten/sui/utils";

import lstLogo from "@/public/assets/lst.png";
import suiLogo from "@/public/assets/sui.png";

export const LIQUID_STAKING_INFO = {
  id: "0xdae271405d47f04ab6c824d3b362b7375844ec987a2627845af715fdcd835795",
  type: "0xba2a31b3b21776d859c9fdfe797f52b069fe8fe0961605ab093ca4eb437d2632::ripleys::RIPLEYS",
};

export const SUI_COINTYPE = "0x2::sui::SUI";
export const LST_COINTYPE = LIQUID_STAKING_INFO.type;
export const ALPHA_COINTYPE =
  "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA";

export const NORMALIZED_SUI_COINTYPE = normalizeStructTag(SUI_COINTYPE);
export const NORMALIZED_LST_COINTYPE = normalizeStructTag(LST_COINTYPE);
export const NORMALIZED_ALPHA_COINTYPE = normalizeStructTag(ALPHA_COINTYPE);

export const coinTypes = [NORMALIZED_SUI_COINTYPE, NORMALIZED_LST_COINTYPE];

// 128x128
export const COINTYPE_LOGO_MAP = {
  [NORMALIZED_SUI_COINTYPE]: suiLogo,
  [NORMALIZED_LST_COINTYPE]: lstLogo,
};

export const extractSymbolFromCoinType = (coinType: string) =>
  coinType.split("::").at(-1);

export const isSui = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_SUI_COINTYPE;
export const isLst = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_LST_COINTYPE;

export const isCoinType = (text: string) => {
  if (text.includes("-")) return false;
  try {
    normalizeStructTag(text);
    return true;
  } catch (err) {}
  return false;
};
