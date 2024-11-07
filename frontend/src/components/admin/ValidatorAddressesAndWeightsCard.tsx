import { useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Minus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

import { phantom } from "@suilend/sdk/_generated/_framework/reified";
import { LstClient } from "@suilend/springsui-sdk";
import { WeightHook } from "@suilend/springsui-sdk/_generated/liquid_staking/weight/structs";

import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import Card from "@/components/Card";
import { useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { formatInteger } from "@/lib/format";
import { errorToast, successToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

export default function ValidatorAddressesAndWeightsCard() {
  const { suiClient, explorer, ...restRootContext } = useRootContext();
  const lstClient = restRootContext.lstClient as LstClient;
  const { refreshAppData } = useAppDataContext();
  const { signExecuteAndWaitForTransaction, weightHookAdminCapId } =
    useWalletContext();

  // Weight hook
  const fetchedWeightHookRef = useRef<boolean>(false);
  const [weightHook, setWeightHook] = useState<WeightHook<string> | undefined>(
    undefined,
  );
  useEffect(() => {
    if (fetchedWeightHookRef.current) return;
    fetchedWeightHookRef.current = true;

    (async () => {
      const _weightHook = await WeightHook.fetch(
        suiClient,
        phantom(LIQUID_STAKING_INFO.type),
        LIQUID_STAKING_INFO.weightHookId,
      );
      setWeightHook(_weightHook);
    })();
  }, [suiClient]);

  // State
  const [vaw, setVaw] = useState<
    { id: string; validatorAddress: string; weight: string }[]
  >([]);
  useEffect(() => {
    if (!weightHook) return;

    setVaw(
      weightHook.validatorAddressesAndWeights.contents.map((c) => ({
        id: uuidv4(),
        validatorAddress: c.key,
        weight: c.value.toString(),
      })),
    );
  }, [weightHook]);

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
    if (!weightHookAdminCapId)
      throw new Error("Error: No weight hook admin cap");

    if (isSubmitting) return;
    setIsSubmitting(true);

    const transaction = new Transaction();

    try {
      const hasMissingValues = vaw.some(
        (row) => row.validatorAddress === "" || row.weight === "",
      );
      if (hasMissingValues) throw new Error("Missing values");

      lstClient.setValidatorAddressesAndWeights(
        transaction,
        LIQUID_STAKING_INFO.weightHookId,
        weightHookAdminCapId,
        vaw.reduce(
          (acc, row) => ({ ...acc, [row.validatorAddress]: +row.weight }),
          {},
        ),
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      successToast("Set validator addresses and weights", undefined, txUrl);
    } catch (err) {
      errorToast("Failed to set validator addresses and weights", err as Error);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      await refreshAppData();
    }
  };

  return (
    <Card>
      <div className="flex w-full flex-col gap-4 p-4">
        <p className="text-navy-600">Validator addresses and weights</p>

        <div className="flex flex-col gap-4">
          {vaw.map((row, index) => (
            <div key={row.id} className="flex flex-row gap-4">
              {/* Validator address */}
              <div className="flex flex-1 flex-col gap-1.5">
                {index === 0 && (
                  <p className="text-p2 text-navy-600">Validator address</p>
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
              <div className="flex w-[80px] flex-col gap-1.5 md:w-[120px]">
                {index === 0 && <p className="text-p2 text-navy-600">Weight</p>}
                <Input
                  type="number"
                  value={row.weight}
                  onChange={(value) => onChange(row.id, "weight", value)}
                />
              </div>

              {/* Remove */}
              <div
                className={cn(
                  "flex flex-col gap-1.5",
                  index === 0 && "pt-[26px]",
                )}
              >
                <Button className="w-10" onClick={() => removeRow(row.id)}>
                  <Minus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Total row */}
          {vaw.length > 0 && (
            <div className="flex flex-row items-center gap-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <p className="text-right !text-p2 text-navy-600">Total</p>
              </div>
              <div className="flex w-[80px] flex-col gap-1.5 md:w-[120px]">
                <p className="px-4">
                  {formatInteger(
                    vaw.reduce((acc, row) => acc + +row.weight, 0),
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="w-10" />
              </div>
            </div>
          )}

          <Button className="mr-12 w-auto" onClick={addRow}>
            Add row
          </Button>
        </div>

        <Button
          onClick={submit}
          isDisabled={!weightHookAdminCapId}
          isSubmitting={isSubmitting}
        />
      </div>
    </Card>
  );
}
