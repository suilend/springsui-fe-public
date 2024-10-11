import { normalizeStructTag } from "@mysten/sui/utils";

export const SUI_COINTYPE = "0x2::sui::SUI";

export const NORMALIZED_SUI_COINTYPE = normalizeStructTag(SUI_COINTYPE);

// 128x128
export const COINTYPE_LOGO_MAP = {
  [NORMALIZED_SUI_COINTYPE]:
    "data:image/png;base64,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",
};

export const extractSymbolFromCoinType = (coinType: string) =>
  coinType.split("::").at(-1);

export const isSui = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_SUI_COINTYPE;

export const isCoinType = (text: string) => {
  if (text.includes("-")) return false;
  try {
    normalizeStructTag(text);
    return true;
  } catch (err) {}
  return false;
};
