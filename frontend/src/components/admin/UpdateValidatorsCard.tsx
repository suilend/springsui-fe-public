import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { ExternalLink } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Button from "@/components/admin/Button";
import Card from "@/components/Card";
import ValidatorsInputs from "@/components/ValidatorsInputs";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { patchLst } from "@/lib/updateLst";

export default function UpdateValidatorsCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useUserContext();
  const { admin } = useLoadedLstContext();

  // State
  const getVaw = useCallback(
    (_weightHook: WeightHook<string> | undefined) =>
      (_weightHook
        ? _weightHook.validatorAddressesAndWeights.contents
        : []
      ).map((c) => ({
        id: uuidv4(),
        validatorAddress: c.key,
        weight: c.value.toString(),
      })),
    [],
  );

  const [vaw, setVaw] = useState<
    { id: string; validatorAddress: string; weight: string }[]
  >(getVaw(admin.weightHook));

  const prevLstCoinTypeRef = useRef<string>(admin.lstCoinType);
  useEffect(() => {
    if (admin.lstCoinType === prevLstCoinTypeRef.current) return;
    prevLstCoinTypeRef.current = admin.lstCoinType;

    setVaw(getVaw(admin.weightHook));
  }, [admin.lstCoinType, getVaw, admin.weightHook]);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (!admin.weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      const hasMissingValues = vaw.some(
        (row) => row.validatorAddress === "" || row.weight === "",
      );
      if (hasMissingValues) throw new Error("Missing values");

      admin.lstData.lstClient.setValidatorAddressesAndWeights(
        transaction,
        admin.lstData.lstClient.liquidStakingObject.weightHookId,
        admin.weightHookAdminCapId,
        vaw.reduce(
          (acc, row) => ({ ...acc, [row.validatorAddress]: +row.weight }),
          {},
        ),
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Set validators", txUrl);

      // Patch
      await patchLst(admin.lstCoinType);
    } catch (err) {
      showErrorToast("Failed to set validators", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <div className="flex flex-row items-center gap-2">
          <p className="text-navy-600">Validators</p>

          <Link
            className="block text-navy-500 transition-colors hover:text-foreground"
            href={explorer.buildAddressUrl("").replace("account", "validators")}
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <ValidatorsInputs vaw={vaw} setVaw={setVaw} />

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        />
      </div>
    </Card>
  );
}
