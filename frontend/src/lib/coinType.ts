import { normalizeStructTag } from "@mysten/sui/utils";

export const LIQUID_STAKING_INFO = {
  id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
  type: "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
  weightHookId:
    "0xbbafcb2d7399c0846f8185da3f273ad5b26b3b35993050affa44cfa890f1f144",
};
if (
  process.env.NEXT_PUBLIC_LIQUID_STAKING_INFO_ID &&
  process.env.NEXT_PUBLIC_LIQUID_STAKING_INFO_TYPE &&
  process.env.NEXT_PUBLIC_LIQUID_STAKING_INFO_WEIGHT_HOOK_ID
) {
  LIQUID_STAKING_INFO.id = process.env.NEXT_PUBLIC_LIQUID_STAKING_INFO_ID;
  LIQUID_STAKING_INFO.type = process.env.NEXT_PUBLIC_LIQUID_STAKING_INFO_TYPE;
  LIQUID_STAKING_INFO.weightHookId =
    process.env.NEXT_PUBLIC_LIQUID_STAKING_INFO_WEIGHT_HOOK_ID;
}

const LST_COINTYPE = LIQUID_STAKING_INFO.type;
const AAA_COINTYPE =
  "0xd976fda9a9786cda1a36dee360013d775a5e5f206f8e20f84fad3385e99eeb2d::aaa::AAA";

export const NORMALIZED_LST_COINTYPE = normalizeStructTag(LST_COINTYPE);
export const NORMALIZED_AAA_COINTYPE = normalizeStructTag(AAA_COINTYPE);

export const isLst = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_LST_COINTYPE;
