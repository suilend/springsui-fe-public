import { PUBLISHED_AT } from "..";
import { obj } from "../../_framework/util";
import { Transaction, TransactionObjectInput } from "@mysten/sui/transactions";

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

export function init(tx: Transaction, otw: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::init`,
    arguments: [obj(tx, otw)],
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

export function weightHookId(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::weight_hook_id`,
    arguments: [obj(tx, self)],
  });
}
