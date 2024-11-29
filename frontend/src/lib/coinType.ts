import { normalizeStructTag } from "@mysten/sui/utils";

const AAA_COINTYPE =
  "0xd976fda9a9786cda1a36dee360013d775a5e5f206f8e20f84fad3385e99eeb2d::aaa::AAA";
const FRATT_COINTYPE =
  "0x31348f17429e6b37ed269cc667cc83947ff8c54593dcbd1a56cae06a895a38be::fratt::FRATT";

export const NORMALIZED_AAA_COINTYPE = normalizeStructTag(AAA_COINTYPE);
export const NORMALIZED_FRATT_COINTYPE = normalizeStructTag(FRATT_COINTYPE);
