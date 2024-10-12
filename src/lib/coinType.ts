import { normalizeStructTag } from "@mysten/sui/utils";

export const SUI_COINTYPE = "0x2::sui::SUI";
export const SSUI_COINTYPE =
  "0x1e20267bbc14a1c19399473165685a409f36f161583650e09981ef936560ee44::ripleys::RIPLEYS";

export const NORMALIZED_SUI_COINTYPE = normalizeStructTag(SUI_COINTYPE);
export const NORMALIZED_LST_COINTYPE = normalizeStructTag(SSUI_COINTYPE);

export const extractSymbolFromCoinType = (coinType: string) =>
  coinType.split("::").at(-1);

export const isCoinType = (text: string) => {
  if (text.includes("-")) return false;
  try {
    normalizeStructTag(text);
    return true;
  } catch (err) {}
  return false;
};
