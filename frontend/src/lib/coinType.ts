import { normalizeStructTag } from "@mysten/sui/utils";

import lstLogo from "@/public/assets/lst.png";
import suiLogo from "@/public/assets/sui.png";

export const LIQUID_STAKING_INFO = {
  id: "0x4b7b661cb29e49557cd8118d34357b2d09e2e959c37188143feac31a9f2f3e79",
  type: "0x1e20267bbc14a1c19399473165685a409f36f161583650e09981ef936560ee44::ripleys::RIPLEYS",
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
