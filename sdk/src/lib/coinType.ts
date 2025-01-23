import { normalizeStructTag } from "@mysten/sui/utils";

import { LIQUID_STAKING_INFO_MAP } from "./lsts";

export const NORMALIZED_LST_COINTYPES = Object.values(
  LIQUID_STAKING_INFO_MAP,
).map((info) => info.type);

export const NORMALIZED_ECOSYSTEM_LST_COINTYPES =
  NORMALIZED_LST_COINTYPES.filter(
    (coinType) =>
      normalizeStructTag(coinType) !== LIQUID_STAKING_INFO_MAP.sSUI.type,
  );

export const isLst = (coinType: string) =>
  NORMALIZED_LST_COINTYPES.includes(normalizeStructTag(coinType));

export const isEcosystemLst = (coinType: string) =>
  NORMALIZED_ECOSYSTEM_LST_COINTYPES.includes(normalizeStructTag(coinType));
