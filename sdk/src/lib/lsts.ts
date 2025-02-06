import { LiquidStakingObjectInfo } from "../client";

export enum LstId {
  sSUI = "sSUI",
  mSUI = "mSUI",
  fudSUI = "fudSUI",
  kSUI = "kSUI",
  trevinSUI = "trevinSUI",
  upSUI = "upSUI",
  // mikeSUI = "mikeSUI",

  test1SUI = "test1SUI",
  ripleysSUI = "ripleysSUI",
}

export const LIQUID_STAKING_INFO_MAP: Record<LstId, LiquidStakingObjectInfo> = {
  [LstId.sSUI]: {
    id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
    type: "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
    weightHookId:
      "0xbbafcb2d7399c0846f8185da3f273ad5b26b3b35993050affa44cfa890f1f144",
  },
  [LstId.mSUI]: {
    id: "0x985dd33bc2a8b5390f2c30a18d32e9a63a993a5b52750c6fe2e6ac8baeb69f48",
    type: "0x922d15d7f55c13fd790f6e54397470ec592caa2b508df292a2e8553f3d3b274f::msui::MSUI",
    weightHookId:
      "0x887d03877df512e7ed72ca96821dc9cc1715ff7abd204d7cfa41b36a7d61d737",
  },
  [LstId.fudSUI]: {
    id: "0x7b4406fd4de96e08711729516f826e36f3268c2fefe6de985abc41192b02b871",
    type: "0x02358129a7d66f943786a10b518fdc79145f1fc8d23420d9948c4aeea190f603::fud_sui::FUD_SUI",
    weightHookId:
      "0x33af323b12561bf362a2952e2bd5fe5a8e4799314b8bbf7c88033b2a8b6d2ec3",
  },
  [LstId.kSUI]: {
    id: "0x03583e2c4d5a66299369214012564d72c4a141afeefce50c349cd56b5f8a6955",
    type: "0x41ff228bfd566f0c707173ee6413962a77e3929588d010250e4e76f0d1cc0ad4::ksui::KSUI",
    weightHookId:
      "0x8e6a057e3ded16af8bd11d2a5a5ac984776791d458a22de9437124fb40ee385e",
  },
  [LstId.trevinSUI]: {
    id: "0x1ec3b836fe8095152741ae5425ca4c35606ba5622c76291962d8fd9daba961db",
    type: "0x502867b177303bf1bf226245fcdd3403c177e78d175a55a56c0602c7ff51c7fa::trevin_sui::TREVIN_SUI",
    weightHookId:
      "0xf6a76b1026ec24af5102ee0df1e7a031208b3e85dea7d5e114ab559eb9569c2a",
  },
  [LstId.upSUI]: {
    id: "0x0ee341383a760c3af14337f134d96a5502073b897f551895e92f74aa07de0905",
    type: "0xe68fad47384e18cd79040cb8d72b7f64d267eebb73a0b8d54711aa860570f404::upsui::UPSUI",
    weightHookId:
      "0x3302addc63a941747c713b3799a6915aa3232fc9b94c76ae5c5315fbdb1d9286",
  },
  // [LstId.mikeSUI]: {
  //   id: "",
  //   type: "",
  //   weightHookId: "",
  // },

  [LstId.test1SUI]: {
    id: "0xa4b536491aa3a8c02c43a1a1f31c6564579171001d835570bb52978b81c8aa4b",
    type: "0xb5825ab8dc9e72e1f8e6b3fa568407474821c2d9513b596e6639f468eb1f469::test1_sui::TEST1_SUI",
    weightHookId:
      "0xd67b194bcf9c72eefc1be8802a79f44959817eb1952432ac57c7045507e7240b",
  },
  [LstId.ripleysSUI]: {
    id: "0x50f983c5257f578a2340ff45f6c82f3d6fc358a3e7a8bc57dd112d280badbfd6",
    type: "0xdc0c8026236f1be172ba03d7d689bfd663497cc5a730bf367bfb2e2c72ec6df8::ripleys::RIPLEYS",
    weightHookId:
      "0xfee25aa74038036cb1548a27a6824213c6a263c3aa45dc37b1c3fbe6037be7d2",
  },
};
