import { PUBLISHED_AT } from "..";
import { String as String1 } from "../../_dependencies/source/0x1/ascii/structs";
import { Option } from "../../_dependencies/source/0x1/option/structs";
import { String } from "../../_dependencies/source/0x1/string/structs";
import { FungibleStakedSui } from "../../_dependencies/source/0x3/staking-pool/structs";
import { obj, pure, vector } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function totalSuiSupply(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::total_sui_supply`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function totalLstSupply(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::total_lst_supply`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function storage(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::storage`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function fees(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::fees`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function feeConfig(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::fee_config`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function lst(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::lst`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function init(tx: Transaction, otw: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::init`,
    arguments: [obj(tx, otw)],
  });
}

export interface CreateLstArgs {
  feeConfig: TransactionObjectInput;
  lstTreasuryCap: TransactionObjectInput;
}

export function createLst(
  tx: Transaction,
  typeArg: string,
  args: CreateLstArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::create_lst`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.feeConfig), obj(tx, args.lstTreasuryCap)],
  });
}

export interface CreateLstWithStakeArgs {
  systemState: TransactionObjectInput;
  feeConfig: TransactionObjectInput;
  lstTreasuryCap: TransactionObjectInput;
  fungibleStakedSuis: Array<TransactionObjectInput> | TransactionArgument;
  sui: TransactionObjectInput;
}

export function createLstWithStake(
  tx: Transaction,
  typeArg: string,
  args: CreateLstWithStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::create_lst_with_stake`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.systemState),
      obj(tx, args.feeConfig),
      obj(tx, args.lstTreasuryCap),
      vector(tx, `${FungibleStakedSui.$typeName}`, args.fungibleStakedSuis),
      obj(tx, args.sui),
    ],
  });
}

export interface CreateLstWithStorageArgs {
  feeConfig: TransactionObjectInput;
  lstTreasuryCap: TransactionObjectInput;
  storage: TransactionObjectInput;
}

export function createLstWithStorage(
  tx: Transaction,
  typeArg: string,
  args: CreateLstWithStorageArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::create_lst_with_storage`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.feeConfig),
      obj(tx, args.lstTreasuryCap),
      obj(tx, args.storage),
    ],
  });
}

export interface MintArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  sui: TransactionObjectInput;
}

export function mint(tx: Transaction, typeArg: string, args: MintArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::mint`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.sui),
    ],
  });
}

export interface RedeemArgs {
  self: TransactionObjectInput;
  lst: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function redeem(tx: Transaction, typeArg: string, args: RedeemArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::redeem`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.lst),
      obj(tx, args.systemState),
    ],
  });
}

export interface RedeemInternalArgs {
  self: TransactionObjectInput;
  lst: TransactionObjectInput;
  systemState: TransactionObjectInput;
  isCustomRedeem: boolean | TransactionArgument;
}

export function redeemInternal(
  tx: Transaction,
  typeArg: string,
  args: RedeemInternalArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::redeem_internal`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.lst),
      obj(tx, args.systemState),
      pure(tx, args.isCustomRedeem, `bool`),
    ],
  });
}

export interface CustomRedeemRequestArgs {
  self: TransactionObjectInput;
  lst: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function customRedeemRequest(
  tx: Transaction,
  typeArg: string,
  args: CustomRedeemRequestArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::custom_redeem_request`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.lst),
      obj(tx, args.systemState),
    ],
  });
}

export interface CustomRedeemArgs {
  self: TransactionObjectInput;
  request: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function customRedeem(
  tx: Transaction,
  typeArg: string,
  args: CustomRedeemArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::custom_redeem`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.request),
      obj(tx, args.systemState),
    ],
  });
}

export interface ChangeValidatorPriorityArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  newValidatorIndex: bigint | TransactionArgument;
}

export function changeValidatorPriority(
  tx: Transaction,
  typeArg: string,
  args: ChangeValidatorPriorityArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::change_validator_priority`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.newValidatorIndex, `u64`),
    ],
  });
}

export interface IncreaseValidatorStakeArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorAddress: string | TransactionArgument;
  suiAmount: bigint | TransactionArgument;
}

export function increaseValidatorStake(
  tx: Transaction,
  typeArg: string,
  args: IncreaseValidatorStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::increase_validator_stake`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.systemState),
      pure(tx, args.validatorAddress, `address`),
      pure(tx, args.suiAmount, `u64`),
    ],
  });
}

export interface DecreaseValidatorStakeArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorAddress: string | TransactionArgument;
  targetUnstakeSuiAmount: bigint | TransactionArgument;
}

export function decreaseValidatorStake(
  tx: Transaction,
  typeArg: string,
  args: DecreaseValidatorStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::decrease_validator_stake`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.systemState),
      pure(tx, args.validatorAddress, `address`),
      pure(tx, args.targetUnstakeSuiAmount, `u64`),
    ],
  });
}

export interface CollectFeesArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  adminCap: TransactionObjectInput;
}

export function collectFees(
  tx: Transaction,
  typeArg: string,
  args: CollectFeesArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::collect_fees`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.adminCap),
    ],
  });
}

export interface UpdateFeesArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  feeConfig: TransactionObjectInput;
}

export function updateFees(
  tx: Transaction,
  typeArg: string,
  args: UpdateFeesArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::update_fees`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.feeConfig),
    ],
  });
}

export interface RefreshArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function refresh(tx: Transaction, typeArg: string, args: RefreshArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::refresh`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), obj(tx, args.systemState)],
  });
}

export interface UpdateMetadataArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  metadata: TransactionObjectInput;
  name: string | TransactionArgument | TransactionArgument | null;
  symbol: string | TransactionArgument | TransactionArgument | null;
  description: string | TransactionArgument | TransactionArgument | null;
  iconUrl: string | TransactionArgument | TransactionArgument | null;
}

export function updateMetadata(
  tx: Transaction,
  typeArg: string,
  args: UpdateMetadataArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::update_metadata`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.metadata),
      pure(tx, args.name, `${Option.$typeName}<${String.$typeName}>`),
      pure(tx, args.symbol, `${Option.$typeName}<${String1.$typeName}>`),
      pure(tx, args.description, `${Option.$typeName}<${String.$typeName}>`),
      pure(tx, args.iconUrl, `${Option.$typeName}<${String1.$typeName}>`),
    ],
  });
}

export interface MarkRedeemRequestAsProcessedArgs {
  adminCap: TransactionObjectInput;
  request: TransactionObjectInput;
}

export function markRedeemRequestAsProcessed(
  tx: Transaction,
  typeArg: string,
  args: MarkRedeemRequestAsProcessedArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::mark_redeem_request_as_processed`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.adminCap), obj(tx, args.request)],
  });
}

export interface SuiAmountToLstAmountArgs {
  self: TransactionObjectInput;
  suiAmount: bigint | TransactionArgument;
}

export function suiAmountToLstAmount(
  tx: Transaction,
  typeArg: string,
  args: SuiAmountToLstAmountArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::sui_amount_to_lst_amount`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), pure(tx, args.suiAmount, `u64`)],
  });
}

export interface LstAmountToSuiAmountArgs {
  self: TransactionObjectInput;
  lstAmount: bigint | TransactionArgument;
}

export function lstAmountToSuiAmount(
  tx: Transaction,
  typeArg: string,
  args: LstAmountToSuiAmountArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::lst_amount_to_sui_amount`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), pure(tx, args.lstAmount, `u64`)],
  });
}
