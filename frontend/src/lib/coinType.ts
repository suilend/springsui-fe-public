import { normalizeStructTag } from "@mysten/sui/utils";

const AAA_COINTYPE =
  "0xd976fda9a9786cda1a36dee360013d775a5e5f206f8e20f84fad3385e99eeb2d::aaa::AAA";

export const NORMALIZED_AAA_COINTYPE = normalizeStructTag(AAA_COINTYPE);
