import { SuiClient, ValidatorApy } from "@mysten/sui/client";
import {
  Transaction,
  TransactionObjectInput,
  coinWithBalance,
} from "@mysten/sui/transactions";
import { SUI_DECIMALS, normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import { phantom } from "./_generated/_framework/reified";
import { PACKAGE_ID, setPublishedAt } from "./_generated/liquid_staking";
import {
  newBuilder,
  setRedeemFeeBps,
  setSpreadFeeBps,
  setSuiMintFeeBps,
  toFeeConfig,
} from "./_generated/liquid_staking/fees/functions";
import * as generated from "./_generated/liquid_staking/liquid-staking/functions";
import { LiquidStakingInfo } from "./_generated/liquid_staking/liquid-staking/structs";
import * as weightHookGenerated from "./_generated/liquid_staking/weight/functions";
import { WeightHook } from "./_generated/liquid_staking/weight/structs";

export interface LiquidStakingObjectInfo {
  id: string;
  type: string;
  weightHookId: string;
}

export interface FeeConfigArgs {
  mintFeeBps?: number;
  redeemFeeBps?: number;
  spreadFeeBps?: number;
}

const SUI_SYSTEM_STATE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000005";
export const SUILEND_VALIDATOR_ADDRESS =
  "0xce8e537664ba5d1d5a6a857b17bd142097138706281882be6805e17065ecde89";
export const SPRING_SUI_UPGRADE_CAP_ID =
  "0x4dc657b6c0fe896f4b94fee1ceac96312dde0a36b94e799caaec30deb53dcd67";

export const ADMIN_ADDRESS =
  "0xb1ffbc2e1915f44b8f271a703becc1bf8aa79bc22431a58900a102892b783c25";

export async function getLatestPackageId(
  client: SuiClient,
  upgradeCapId: string,
): Promise<string> {
  const object = await client.getObject({
    id: upgradeCapId,
    options: {
      showContent: true,
    },
  });

  return (object.data?.content as unknown as any).fields.package;
}

export class LstClient {
  liquidStakingObject: LiquidStakingObjectInfo;
  client: SuiClient;

  static async initialize(
    client: SuiClient,
    liquidStakingObjectInfo: LiquidStakingObjectInfo,
    _publishedAt?: string,
    logPackageId?: boolean,
  ): Promise<LstClient> {
    const publishedAt =
      _publishedAt ??
      (await getLatestPackageId(client, SPRING_SUI_UPGRADE_CAP_ID));
    if (logPackageId)
      console.log("@suilend/springsui-sdk | publishedAt:", publishedAt);
    setPublishedAt(publishedAt);

    return new LstClient(liquidStakingObjectInfo, client);
  }

  static createNewLst(
    tx: Transaction,
    treasuryCap: string,
    coinType: string,
  ): TransactionObjectInput {
    const [feeConfigBuilder] = newBuilder(tx);
    const [feeConfig] = toFeeConfig(tx, feeConfigBuilder);

    const [adminCap, liquidStakingInfo] = generated.createLst(tx, coinType, {
      feeConfig,
      lstTreasuryCap: treasuryCap,
    });

    const [weightHook, weightHookAdminCap] = weightHookGenerated.new_(
      tx,
      coinType,
      adminCap,
    );

    weightHookGenerated.addToRegistry(tx, coinType, {
      self: weightHook,
      registry: tx.object(
        "0x577c5a3b474403aec4629a56bab97b95715d3e87867517650651014cbef23e18",
      ),
      liquidStakingInfo,
    });

    tx.moveCall({
      target: `0x2::transfer::public_share_object`,
      typeArguments: [`${LiquidStakingInfo.$typeName}<${coinType}>`],
      arguments: [liquidStakingInfo],
    });

    tx.moveCall({
      target: `0x2::transfer::public_share_object`,
      typeArguments: [`${WeightHook.$typeName}<${coinType}>`],
      arguments: [weightHook],
    });

    return weightHookAdminCap;
  }

  static async getWeightHookAdminCapId(
    client: SuiClient,
    address: string,
    coinType: string,
  ): Promise<string | null | undefined> {
    const res = (
      await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${PACKAGE_ID}::weight::WeightHookAdminCap<${coinType}>`,
        },
      })
    ).data;

    if (res.length == 0) {
      return null;
    }

    return res[0].data?.objectId;
  }

  constructor(liquidStakingObject: LiquidStakingObjectInfo, client: SuiClient) {
    this.liquidStakingObject = liquidStakingObject;
    this.client = client;
  }

  async getAdminCapId(address: string): Promise<string | null | undefined> {
    const res = (
      await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${this.liquidStakingObject.type}>`,
        },
      })
    ).data;

    if (res.length == 0) {
      return null;
    }

    return res[0].data?.objectId;
  }

  // returns the lst object
  mint(tx: Transaction, suiCoinId: TransactionObjectInput) {
    const [lst] = generated.mint(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      sui: suiCoinId,
      systemState: SUI_SYSTEM_STATE_ID,
    });

    return lst;
  }
  mintAmountAndRebalance(tx: Transaction, address: string, amount: string) {
    const [suiCoin] = tx.splitCoins(tx.gas, [BigInt(amount)]);
    const lst = this.mint(tx, suiCoin);

    this.rebalance(tx, this.liquidStakingObject.weightHookId);

    return lst;
  }
  mintAmountAndRebalanceAndSendToUser(
    tx: Transaction,
    address: string,
    amount: string,
  ) {
    const lst = this.mintAmountAndRebalance(tx, address, amount);
    tx.transferObjects([lst], address);
  }

  // returns the sui coin
  redeem(tx: Transaction, lstId: TransactionObjectInput) {
    const [suiCoin] = generated.redeem(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      systemState: SUI_SYSTEM_STATE_ID,
      lst: lstId,
    });

    return suiCoin;
  }
  async redeemAmountAndRebalance(
    tx: Transaction,
    address: string,
    amount: string,
    client: SuiClient,
  ) {
    const coins = (
      await client.getCoins({
        owner: address,
        coinType: this.liquidStakingObject.type,
      })
    ).data;

    const mergeCoin = coins[0];
    if (coins.length > 1) {
      tx.mergeCoins(
        tx.object(mergeCoin.coinObjectId),
        coins.map((c) => tx.object(c.coinObjectId)).slice(1),
      );
    }

    const [lstCoin] = tx.splitCoins(tx.object(mergeCoin.coinObjectId), [
      BigInt(amount),
    ]);
    const suiCoin = this.redeem(tx, lstCoin);

    this.rebalance(tx, this.liquidStakingObject.weightHookId);

    return suiCoin;
  }
  async redeemAmountAndRebalanceAndSendToUser(
    tx: Transaction,
    address: string,
    amount: string,
    client: SuiClient,
  ) {
    const suiCoin = await this.redeemAmountAndRebalance(
      tx,
      address,
      amount,
      client,
    );
    tx.transferObjects([suiCoin], address);
  }

  // admin functions
  increaseValidatorStake(
    tx: Transaction,
    adminCapId: TransactionObjectInput,
    validatorAddress: string,
    suiAmount: number,
  ) {
    generated.increaseValidatorStake(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      adminCap: adminCapId,
      systemState: SUI_SYSTEM_STATE_ID,
      validatorAddress,
      suiAmount: BigInt(suiAmount),
    });
  }

  decreaseValidatorStake(
    tx: Transaction,
    adminCapId: TransactionObjectInput,
    validatorAddress: string,
    targetUnstakeSuiAmount: bigint,
  ) {
    generated.decreaseValidatorStake(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      adminCap: adminCapId,
      systemState: SUI_SYSTEM_STATE_ID,
      validatorAddress,
      targetUnstakeSuiAmount,
    });
  }

  collectFees(tx: Transaction, weightHookAdminCapId: TransactionObjectInput) {
    const [sui] = weightHookGenerated.collectFees(
      tx,
      this.liquidStakingObject.type,
      {
        self: this.liquidStakingObject.weightHookId,
        liquidStakingInfo: this.liquidStakingObject.id,
        systemState: SUI_SYSTEM_STATE_ID,
        weightHookAdminCap: weightHookAdminCapId,
      },
    );

    return sui;
  }
  collectFeesAndSendToUser(
    tx: Transaction,
    weightHookAdminCapId: TransactionObjectInput,
    address: string,
  ) {
    const sui = this.collectFees(tx, weightHookAdminCapId);
    tx.transferObjects([sui], address);
  }

  updateFees(
    tx: Transaction,
    weightHookAdminCapId: TransactionObjectInput,
    feeConfigArgs: FeeConfigArgs,
  ) {
    let [builder] = newBuilder(tx);

    if (feeConfigArgs.mintFeeBps != null) {
      console.log(`Setting mint fee bps to ${feeConfigArgs.mintFeeBps}`);

      builder = setSuiMintFeeBps(tx, {
        self: builder,
        fee: BigInt(feeConfigArgs.mintFeeBps),
      })[0];
    }

    if (feeConfigArgs.redeemFeeBps != null) {
      console.log(`Setting redeem fee bps to ${feeConfigArgs.redeemFeeBps}`);
      builder = setRedeemFeeBps(tx, {
        self: builder,
        fee: BigInt(feeConfigArgs.redeemFeeBps),
      })[0];
    }

    if (feeConfigArgs.spreadFeeBps != null) {
      console.log(`Setting spread fee bps to ${feeConfigArgs.spreadFeeBps}`);
      builder = setSpreadFeeBps(tx, {
        self: builder,
        fee: BigInt(feeConfigArgs.spreadFeeBps),
      })[0];
    }

    const [feeConfig] = toFeeConfig(tx, builder);

    weightHookGenerated.updateFees(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.weightHookId,
      liquidStakingInfo: this.liquidStakingObject.id,
      weightHookAdminCap: weightHookAdminCapId,
      feeConfig,
    });
  }

  // weight hook functions
  initializeWeightHook(tx: Transaction, adminCapId: TransactionObjectInput) {
    const [weightHook, weightHookAdminCap] = weightHookGenerated.new_(
      tx,
      this.liquidStakingObject.type,
      adminCapId,
    );

    tx.moveCall({
      target: `0x2::transfer::public_share_object`,
      typeArguments: [
        `${WeightHook.$typeName}<${this.liquidStakingObject.type}>`,
      ],
      arguments: [weightHook],
    });

    return weightHookAdminCap;
  }

  setValidatorAddressesAndWeights(
    tx: Transaction,
    weightHookId: TransactionObjectInput,
    weightHookAdminCap: TransactionObjectInput,
    validatorAddressesAndWeights: Record<string, number>,
  ) {
    const [vecMap] = tx.moveCall({
      target: `0x2::vec_map::empty`,
      typeArguments: ["address", "u64"],
      arguments: [],
    });

    for (const [validatorAddress, weight] of Object.entries(
      validatorAddressesAndWeights,
    )) {
      tx.moveCall({
        target: `0x2::vec_map::insert`,
        typeArguments: ["address", "u64"],
        arguments: [
          vecMap,
          tx.pure.address(validatorAddress),
          tx.pure.u64(weight),
        ],
      });
    }

    weightHookGenerated.setValidatorAddressesAndWeights(
      tx,
      this.liquidStakingObject.type,
      {
        self: weightHookId,
        weightHookAdminCap,
        validatorAddressesAndWeights: vecMap,
      },
    );
  }

  rebalance(tx: Transaction, weightHookId: TransactionObjectInput) {
    weightHookGenerated.rebalance(tx, this.liquidStakingObject.type, {
      self: weightHookId,
      systemState: SUI_SYSTEM_STATE_ID,
      liquidStakingInfo: this.liquidStakingObject.id,
    });
  }

  async getSpringSuiApy(_validatorApys?: ValidatorApy[]) {
    const validatorApys =
      _validatorApys ?? (await this.client.getValidatorsApy()).apys;

    const liquidStakingInfo = await fetchLiquidStakingInfo(
      this.liquidStakingObject,
      this.client,
    );

    const totalSuiSupply = new BigNumber(
      liquidStakingInfo.storage.totalSuiSupply.toString(),
    ).div(10 ** SUI_DECIMALS);

    const spreadFeePercent = new BigNumber(
      liquidStakingInfo.feeConfig.element?.spreadFeeBps.toString() ?? 0,
    ).div(100);

    return new BigNumber(
      totalSuiSupply.gt(0)
        ? liquidStakingInfo.storage.validatorInfos
            .reduce((acc, validatorInfo) => {
              const validatorApy = new BigNumber(
                validatorApys.find(
                  (_apy) => _apy.address === validatorInfo.validatorAddress,
                )?.apy ?? 0,
              );

              const validatorTotalSuiAmount = new BigNumber(
                validatorInfo.totalSuiAmount.toString(),
              ).div(10 ** SUI_DECIMALS);

              return acc.plus(validatorApy.times(validatorTotalSuiAmount));
            }, new BigNumber(0))
            .div(totalSuiSupply)
        : new BigNumber(0),
    ).times(new BigNumber(1).minus(spreadFeePercent.div(100)));
  }
}

// user functions
export const fetchLiquidStakingInfo = (
  info: LiquidStakingObjectInfo,
  client: SuiClient,
): Promise<LiquidStakingInfo<any>> =>
  LiquidStakingInfo.fetch(client, phantom(info.type), info.id);

export const fetchRegistryLiquidStakingInfoMap = async (client: SuiClient) => {
  const REGISTRY_ID =
    "0x06d6b6881ef14ad1a8cc29d1f97ba3397ecea56af5afa0642093e981b1fda3f4";

  const registryObjectIds: string[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const page = await client.getDynamicFields({
      parentId: REGISTRY_ID,
      cursor,
    });

    registryObjectIds.push(...page.data.map((d) => d.objectId));
    cursor = page.nextCursor;
    hasNextPage = page.hasNextPage;
  }
  const registryObjects = await Promise.all(
    registryObjectIds.map((objectId) =>
      client.getObject({
        id: objectId,
        options: {
          showContent: true,
        },
      }),
    ),
  );

  const LIQUID_STAKING_INFO_MAP = registryObjects.reduce(
    (acc, obj) => {
      const fields = (obj.data?.content as any).fields;

      const id = fields.value.fields.liquid_staking_info_id;
      const coinType = normalizeStructTag(fields.name.fields.name);
      if (
        [
          "0x460c669acd3f294dc4247a6877ec2532340ffde76162ab201e72fe95355830e7::asui::ASUI",
          "0x752f18582da315f9104bb8b7828188c474e64f23255ed9fd231ed3fa883f27e0::tt_sui::TT_SUI",
          "0x86097c930d227f32dd2cd2ffd03d92b57504abb2b9c9cb83013c3923fa185341::tt_sui::TT_SUI",
          "0x86518340cc15853c76bcb63996c6fb36cd566755a870f46bccd3e95f6a0a4993::test_sui::TEST_SUI",
          "0xbf609bb629a11e7ee7c72bc3d5cf98c1c26cd2e35b2d017be4895d7e0c6be898::temps_sui::TEMPS_SUI",
          "0x4bf0e1d42f731c19066d910ebf7ba12ffe4025258f50b6cc490af38080a15dfb::t0sui::T0SUI",
          "0xbdf600b2f3b5d2b315f0c82ad190d4b40666b823144f5013c02f26045cda98b6::tt_sui::TT_SUI",
          "0xfadc3b0fd8aea6aa485ab48271c957922396ab4984a7045da570cf836ed895cc::root_sui::ROOT_SUI",
          "0xeea0564444d930f77341d7cfed9634b691463988456abcf106f6d6ed02519e43::testy_sui::TESTY_SUI",
          "0xad421271913607cab135184481d65d25f10b3ef4464004fe6333930503404e3d::mjsui2::MJSUI2",
        ].includes(coinType)
      )
        return acc;

      const weightHookId = fields.value.fields.extra_info.fields.weight_hook_id;

      return { ...acc, [coinType]: { id, type: coinType, weightHookId } };
    },
    {} as Record<string, LiquidStakingObjectInfo>,
  );

  return LIQUID_STAKING_INFO_MAP;
};
