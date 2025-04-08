import { useCallback, useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Minus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import Card from "@/components/Card";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function ValidatorAddressesAndWeightsCard() {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useLoadedAppContext();
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

  const onChange = (id: string, key: string, value: string) =>
    setVaw((vaw) =>
      vaw.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );

  const removeRow = (id: string) =>
    setVaw((vaw) => vaw.filter((row) => row.id !== id));

  const addRow = () => {
    const rowId = uuidv4();
    setVaw((vaw) => [...vaw, { id: rowId, validatorAddress: "", weight: "" }]);

    setTimeout(() => {
      document.getElementById(`validator-address-${rowId}`)?.focus();
    });
  };

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
    } catch (err) {
      showErrorToast("Failed to set validators", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refresh();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Validators</p>

        <div className="flex flex-col gap-4">
          {vaw.map((row, index) => (
            <div key={row.id} className="flex flex-row gap-4">
              {/* Address */}
              <div className="flex flex-1 flex-col gap-1.5">
                {index === 0 && (
                  <p className="text-p2 text-navy-600">Address</p>
                )}
                <TextareaAutosize
                  id={`validator-address-${row.id}`}
                  className="min-h-10 w-full rounded-sm bg-white px-4 py-2 font-sans text-p1 text-foreground placeholder:text-navy-500 focus-within:shadow-[inset_0_0_0_1px_hsl(var(--blue))] focus-visible:outline-none"
                  value={row.validatorAddress}
                  onChange={(e) =>
                    onChange(row.id, "validatorAddress", e.target.value)
                  }
                  minRows={1}
                />
              </div>

              {/* Weight */}
              <div className="flex w-[125px] flex-col gap-1.5">
                {index === 0 && (
                  <p className="text-p2 text-navy-600">Weight (0–100%)</p>
                )}
                <Input
                  type="number"
                  value={row.weight}
                  onChange={(value) => onChange(row.id, "weight", value)}
                />
                {index === vaw.length - 1 && (
                  <p className="text-p3 text-navy-500">Must add up to 100%</p>
                )}
              </div>

              {/* Remove */}
              <div className="flex flex-col gap-1.5">
                {index === 0 && <p className="text-p2 opacity-0">-</p>}
                <Button
                  className="w-10"
                  isDisabled={vaw.length < 2}
                  onClick={() => removeRow(row.id)}
                >
                  <Minus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}

          <Button className="mr-14 w-auto" onClick={addRow}>
            Add row
          </Button>
        </div>

        <Button
          onClick={submit}
          isLoading={isSubmitting}
          isDisabled={!admin.weightHookAdminCapId}
        />
      </div>
    </Card>
  );
}
