import { Bag } from "../../_dependencies/source/0x2/bag/structs";
import { ID, UID } from "../../_dependencies/source/0x2/object/structs";
import {
  PhantomReified,
  Reified,
  StructClass,
  ToField,
  ToTypeArgument,
  ToTypeStr,
  TypeArgument,
  assertFieldsWithTypesArgsMatch,
  assertReifiedTypeArgsMatch,
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  extractType,
  fieldToJSON,
  phantom,
  toBcs,
} from "../../_framework/reified";
import {
  FieldsWithTypes,
  composeSuiType,
  compressSuiType,
  parseTypeName,
} from "../../_framework/util";
import { PKG_V5 } from "../index";
import { Version } from "../version/structs";
import { BcsType, bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== Registry =============================== */

export function isRegistry(type: string): boolean {
  type = compressSuiType(type);
  return type === `${PKG_V5}::registry::Registry`;
}

export interface RegistryFields {
  id: ToField<UID>;
  version: ToField<Version>;
  table: ToField<Bag>;
}

export type RegistryReified = Reified<Registry, RegistryFields>;

export class Registry implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V5}::registry::Registry`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = Registry.$typeName;
  readonly $fullTypeName: `${typeof PKG_V5}::registry::Registry`;
  readonly $typeArgs: [];
  readonly $isPhantom = Registry.$isPhantom;

  readonly id: ToField<UID>;
  readonly version: ToField<Version>;
  readonly table: ToField<Bag>;

  private constructor(typeArgs: [], fields: RegistryFields) {
    this.$fullTypeName = composeSuiType(
      Registry.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V5}::registry::Registry`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.version = fields.version;
    this.table = fields.table;
  }

  static reified(): RegistryReified {
    const reifiedBcs = Registry.bcs;
    return {
      typeName: Registry.$typeName,
      fullTypeName: composeSuiType(
        Registry.$typeName,
        ...[],
      ) as `${typeof PKG_V5}::registry::Registry`,
      typeArgs: [] as [],
      isPhantom: Registry.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Registry.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        Registry.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        Registry.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Registry.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Registry.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        Registry.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        Registry.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        Registry.fetch(client, id),
      new: (fields: RegistryFields) => {
        return new Registry([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return Registry.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<Registry>> {
    return phantom(Registry.reified());
  }
  static get p() {
    return Registry.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("Registry", {
      id: UID.bcs,
      version: Version.bcs,
      table: Bag.bcs,
    });
  }

  private static cachedBcs: ReturnType<typeof Registry.instantiateBcs> | null =
    null;

  static get bcs() {
    if (!Registry.cachedBcs) {
      Registry.cachedBcs = Registry.instantiateBcs();
    }
    return Registry.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): Registry {
    return Registry.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      version: decodeFromFields(Version.reified(), fields.version),
      table: decodeFromFields(Bag.reified(), fields.table),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Registry {
    if (!isRegistry(item.type)) {
      throw new Error("not a Registry type");
    }

    return Registry.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      version: decodeFromFieldsWithTypes(
        Version.reified(),
        item.fields.version,
      ),
      table: decodeFromFieldsWithTypes(Bag.reified(), item.fields.table),
    });
  }

  static fromBcs(data: Uint8Array): Registry {
    return Registry.fromFields(Registry.bcs.parse(data));
  }

  toJSONField() {
    return {
      id: this.id,
      version: this.version.toJSONField(),
      table: this.table.toJSONField(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): Registry {
    return Registry.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      version: decodeFromJSONField(Version.reified(), field.version),
      table: decodeFromJSONField(Bag.reified(), field.table),
    });
  }

  static fromJSON(json: Record<string, any>): Registry {
    if (json.$typeName !== Registry.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return Registry.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): Registry {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isRegistry(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a Registry object`,
      );
    }
    return Registry.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): Registry {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isRegistry(data.bcs.type)) {
        throw new Error(`object at is not a Registry object`);
      }

      return Registry.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return Registry.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<Registry> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching Registry object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isRegistry(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a Registry object`);
    }

    return Registry.fromSuiObjectData(res.data);
  }
}

/* ============================== Entry =============================== */

export function isEntry(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V5}::registry::Entry` + "<");
}

export interface EntryFields<ExtraInfoType extends TypeArgument> {
  adminCapId: ToField<ID>;
  liquidStakingInfoId: ToField<ID>;
  extraInfo: ToField<ExtraInfoType>;
}

export type EntryReified<ExtraInfoType extends TypeArgument> = Reified<
  Entry<ExtraInfoType>,
  EntryFields<ExtraInfoType>
>;

export class Entry<ExtraInfoType extends TypeArgument> implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V5}::registry::Entry`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [false] as const;

  readonly $typeName = Entry.$typeName;
  readonly $fullTypeName: `${typeof PKG_V5}::registry::Entry<${ToTypeStr<ExtraInfoType>}>`;
  readonly $typeArgs: [ToTypeStr<ExtraInfoType>];
  readonly $isPhantom = Entry.$isPhantom;

  readonly adminCapId: ToField<ID>;
  readonly liquidStakingInfoId: ToField<ID>;
  readonly extraInfo: ToField<ExtraInfoType>;

  private constructor(
    typeArgs: [ToTypeStr<ExtraInfoType>],
    fields: EntryFields<ExtraInfoType>,
  ) {
    this.$fullTypeName = composeSuiType(
      Entry.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V5}::registry::Entry<${ToTypeStr<ExtraInfoType>}>`;
    this.$typeArgs = typeArgs;

    this.adminCapId = fields.adminCapId;
    this.liquidStakingInfoId = fields.liquidStakingInfoId;
    this.extraInfo = fields.extraInfo;
  }

  static reified<ExtraInfoType extends Reified<TypeArgument, any>>(
    ExtraInfoType: ExtraInfoType,
  ): EntryReified<ToTypeArgument<ExtraInfoType>> {
    const reifiedBcs = Entry.bcs(toBcs(ExtraInfoType));
    return {
      typeName: Entry.$typeName,
      fullTypeName: composeSuiType(
        Entry.$typeName,
        ...[extractType(ExtraInfoType)],
      ) as `${typeof PKG_V5}::registry::Entry<${ToTypeStr<ToTypeArgument<ExtraInfoType>>}>`,
      typeArgs: [extractType(ExtraInfoType)] as [
        ToTypeStr<ToTypeArgument<ExtraInfoType>>,
      ],
      isPhantom: Entry.$isPhantom,
      reifiedTypeArgs: [ExtraInfoType],
      fromFields: (fields: Record<string, any>) =>
        Entry.fromFields(ExtraInfoType, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        Entry.fromFieldsWithTypes(ExtraInfoType, item),
      fromBcs: (data: Uint8Array) =>
        Entry.fromFields(ExtraInfoType, reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Entry.fromJSONField(ExtraInfoType, field),
      fromJSON: (json: Record<string, any>) =>
        Entry.fromJSON(ExtraInfoType, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        Entry.fromSuiParsedData(ExtraInfoType, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        Entry.fromSuiObjectData(ExtraInfoType, content),
      fetch: async (client: SuiClient, id: string) =>
        Entry.fetch(client, ExtraInfoType, id),
      new: (fields: EntryFields<ToTypeArgument<ExtraInfoType>>) => {
        return new Entry([extractType(ExtraInfoType)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return Entry.reified;
  }

  static phantom<ExtraInfoType extends Reified<TypeArgument, any>>(
    ExtraInfoType: ExtraInfoType,
  ): PhantomReified<ToTypeStr<Entry<ToTypeArgument<ExtraInfoType>>>> {
    return phantom(Entry.reified(ExtraInfoType));
  }
  static get p() {
    return Entry.phantom;
  }

  private static instantiateBcs() {
    return <ExtraInfoType extends BcsType<any>>(ExtraInfoType: ExtraInfoType) =>
      bcs.struct(`Entry<${ExtraInfoType.name}>`, {
        admin_cap_id: ID.bcs,
        liquid_staking_info_id: ID.bcs,
        extra_info: ExtraInfoType,
      });
  }

  private static cachedBcs: ReturnType<typeof Entry.instantiateBcs> | null =
    null;

  static get bcs() {
    if (!Entry.cachedBcs) {
      Entry.cachedBcs = Entry.instantiateBcs();
    }
    return Entry.cachedBcs;
  }

  static fromFields<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    fields: Record<string, any>,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    return Entry.reified(typeArg).new({
      adminCapId: decodeFromFields(ID.reified(), fields.admin_cap_id),
      liquidStakingInfoId: decodeFromFields(
        ID.reified(),
        fields.liquid_staking_info_id,
      ),
      extraInfo: decodeFromFields(typeArg, fields.extra_info),
    });
  }

  static fromFieldsWithTypes<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    item: FieldsWithTypes,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    if (!isEntry(item.type)) {
      throw new Error("not a Entry type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return Entry.reified(typeArg).new({
      adminCapId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.admin_cap_id,
      ),
      liquidStakingInfoId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.liquid_staking_info_id,
      ),
      extraInfo: decodeFromFieldsWithTypes(typeArg, item.fields.extra_info),
    });
  }

  static fromBcs<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    data: Uint8Array,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    const typeArgs = [typeArg];

    return Entry.fromFields(typeArg, Entry.bcs(toBcs(typeArgs[0])).parse(data));
  }

  toJSONField() {
    return {
      adminCapId: this.adminCapId,
      liquidStakingInfoId: this.liquidStakingInfoId,
      extraInfo: fieldToJSON<ExtraInfoType>(this.$typeArgs[0], this.extraInfo),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    field: any,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    return Entry.reified(typeArg).new({
      adminCapId: decodeFromJSONField(ID.reified(), field.adminCapId),
      liquidStakingInfoId: decodeFromJSONField(
        ID.reified(),
        field.liquidStakingInfoId,
      ),
      extraInfo: decodeFromJSONField(typeArg, field.extraInfo),
    });
  }

  static fromJSON<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    json: Record<string, any>,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    if (json.$typeName !== Entry.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(Entry.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return Entry.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    content: SuiParsedData,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isEntry(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a Entry object`,
      );
    }
    return Entry.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<ExtraInfoType extends Reified<TypeArgument, any>>(
    typeArg: ExtraInfoType,
    data: SuiObjectData,
  ): Entry<ToTypeArgument<ExtraInfoType>> {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isEntry(data.bcs.type)) {
        throw new Error(`object at is not a Entry object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return Entry.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return Entry.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<ExtraInfoType extends Reified<TypeArgument, any>>(
    client: SuiClient,
    typeArg: ExtraInfoType,
    id: string,
  ): Promise<Entry<ToTypeArgument<ExtraInfoType>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching Entry object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isEntry(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a Entry object`);
    }

    return Entry.fromSuiObjectData(typeArg, res.data);
  }
}
