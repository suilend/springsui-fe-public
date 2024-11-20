import { normalizeStructTag } from "@mysten/sui/utils";

const AAA_COINTYPE =
  "0xd976fda9a9786cda1a36dee360013d775a5e5f206f8e20f84fad3385e99eeb2d::aaa::AAA";
const BUCK_COINTYPE =
  "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK";

export const NORMALIZED_AAA_COINTYPE = normalizeStructTag(AAA_COINTYPE);
export const NORMALIZED_BUCK_COINTYPE = normalizeStructTag(BUCK_COINTYPE);
