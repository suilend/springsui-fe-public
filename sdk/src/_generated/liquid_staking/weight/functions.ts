import { PUBLISHED_AT } from "..";
import { String as String1 } from "../../_dependencies/source/0x1/ascii/structs";
import { Option } from "../../_dependencies/source/0x1/option/structs";
import { String } from "../../_dependencies/source/0x1/string/structs";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function init(tx: Transaction, otw: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::init`,
    arguments: [obj(tx, otw)],
  });
}

export function new_(
  tx: Transaction,
  typeArg: string,
  adminCap: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::new`,
    typeArguments: [typeArg],
    arguments: [obj(tx, adminCap)],
  });
}

export interface AddToRegistryArgs {
  self: TransactionObjectInput;
  registry: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
}

export function addToRegistry(
  tx: Transaction,
  typeArg: string,
  args: AddToRegistryArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::add_to_registry`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.registry),
      obj(tx, args.liquidStakingInfo),
    ],
  });
}

export interface SetValidatorAddressesAndWeightsArgs {
  self: TransactionObjectInput;
  weightHookAdminCap: TransactionObjectInput;
  validatorAddressesAndWeights: TransactionObjectInput;
}

export function setValidatorAddressesAndWeights(
  tx: Transaction,
  typeArg: string,
  args: SetValidatorAddressesAndWeightsArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::set_validator_addresses_and_weights`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.weightHookAdminCap),
      obj(tx, args.validatorAddressesAndWeights),
    ],
  });
}

export interface UpdateFeesArgs {
  self: TransactionObjectInput;
  weightHookAdminCap: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
  feeConfig: TransactionObjectInput;
}

export function updateFees(
  tx: Transaction,
  typeArg: string,
  args: UpdateFeesArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::update_fees`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.weightHookAdminCap),
      obj(tx, args.liquidStakingInfo),
      obj(tx, args.feeConfig),
    ],
  });
}

export interface CollectFeesArgs {
  self: TransactionObjectInput;
  weightHookAdminCap: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function collectFees(
  tx: Transaction,
  typeArg: string,
  args: CollectFeesArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::collect_fees`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.weightHookAdminCap),
      obj(tx, args.liquidStakingInfo),
      obj(tx, args.systemState),
    ],
  });
}

export interface RebalanceArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
}

export function rebalance(
  tx: Transaction,
  typeArg: string,
  args: RebalanceArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::rebalance`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.liquidStakingInfo),
    ],
  });
}

export interface HandleCustomRedeemRequestArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
  request: TransactionObjectInput;
}

export function handleCustomRedeemRequest(
  tx: Transaction,
  typeArg: string,
  args: HandleCustomRedeemRequestArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::handle_custom_redeem_request`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.liquidStakingInfo),
      obj(tx, args.request),
    ],
  });
}

export interface UpdateMetadataArgs {
  self: TransactionObjectInput;
  weightHookAdminCap: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
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
    target: `${PUBLISHED_AT}::weight::update_metadata`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.weightHookAdminCap),
      obj(tx, args.liquidStakingInfo),
      obj(tx, args.metadata),
      pure(tx, args.name, `${Option.$typeName}<${String.$typeName}>`),
      pure(tx, args.symbol, `${Option.$typeName}<${String1.$typeName}>`),
      pure(tx, args.description, `${Option.$typeName}<${String.$typeName}>`),
      pure(tx, args.iconUrl, `${Option.$typeName}<${String1.$typeName}>`),
    ],
  });
}

export interface RebalanceInternalArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
  totalSuiToAllocate: bigint | TransactionArgument;
}

export function rebalanceInternal(
  tx: Transaction,
  typeArg: string,
  args: RebalanceInternalArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::rebalance_internal`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.liquidStakingInfo),
      pure(tx, args.totalSuiToAllocate, `u64`),
    ],
  });
}

export interface EjectArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
}

export function eject(tx: Transaction, typeArg: string, args: EjectArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::eject`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), obj(tx, args.adminCap)],
  });
}

export interface AdminCapArgs {
  self: TransactionObjectInput;
  weightHookAdminCap: TransactionObjectInput;
}

export function adminCap(tx: Transaction, typeArg: string, args: AdminCapArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::admin_cap`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), obj(tx, args.weightHookAdminCap)],
  });
}

export function weightHookId(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::weight_hook_id`,
    arguments: [obj(tx, self)],
  });
}
