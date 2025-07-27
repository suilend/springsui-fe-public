import { PUBLISHED_AT } from "..";
import { GenericArg, generic, obj } from "../../_framework/util";
import { Transaction, TransactionObjectInput } from "@mysten/sui/transactions";

export function adminCapId(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::registry::admin_cap_id`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function liquidStakingInfoId(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::registry::liquid_staking_info_id`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function extraInfo(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::registry::extra_info`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export function new_(tx: Transaction) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::registry::new`,
    arguments: [],
  });
}

export interface AddToRegistryArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
  extraInfo: GenericArg;
}

export function addToRegistry(
  tx: Transaction,
  typeArgs: [string, string],
  args: AddToRegistryArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::registry::add_to_registry`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.liquidStakingInfo),
      generic(tx, `${typeArgs[1]}`, args.extraInfo),
    ],
  });
}

export function getEntry(
  tx: Transaction,
  typeArgs: [string, string],
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::registry::get_entry`,
    typeArguments: typeArgs,
    arguments: [obj(tx, self)],
  });
}
