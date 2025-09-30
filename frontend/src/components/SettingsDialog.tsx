import { useState } from "react";

import { Settings } from "lucide-react";

import { EXPLORERS, ExplorerId, RPCS, RpcId } from "@suilend/sui-fe";
import { useSettingsContext, useWalletContext } from "@suilend/sui-fe-next";

import Input from "@/components/create-admin/Input";
import SelectPopover from "@/components/create-admin/SelectPopover";
import Dialog from "@/components/Dialog";
import { cn } from "@/lib/utils";

export default function SettingsDialog() {
  const {
    rpc,
    setRpcId,
    setRpcUrl,
    explorer,
    setExplorerId,
    gasBudget,
    setGasBudget,
  } = useSettingsContext();
  const { isUsingLedger, setIsUsingLedger } = useWalletContext();

  // Custom RPC URL
  const [customRpcUrl, setCustomRpcUrl] = useState<string>(
    rpc.id === RpcId.CUSTOM ? rpc.url : "",
  );

  return (
    <Dialog
      trigger={
        <button className="group flex h-5 w-5 flex-row items-center justify-center">
          <Settings className="h-5 w-5 text-navy-600 transition-colors group-hover:text-foreground" />
        </button>
      }
      headerProps={{
        title: "Settings",
      }}
      dialogContentOuterClassName="max-w-md"
    >
      {/* RPC */}
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-row">
          <div className="flex h-10 flex-1 flex-row items-center">
            <p className="text-p2 text-navy-600">RPC</p>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <SelectPopover
              className="bg-navy-100/50"
              options={RPCS}
              value={rpc.id}
              onChange={(id: string) => setRpcId(id as RpcId)}
            />

            {rpc.id === RpcId.CUSTOM && (
              <Input
                className="bg-navy-100/50"
                autoFocus={customRpcUrl === ""}
                value={customRpcUrl}
                onChange={setCustomRpcUrl}
                onBlur={() => setRpcUrl(customRpcUrl)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Explorer */}
      <div className="flex flex-row items-center">
        <p className="flex-1 text-p2 text-navy-600">Explorer</p>

        <div className="flex-1">
          <SelectPopover
            className="bg-navy-100/50"
            options={EXPLORERS}
            value={explorer.id}
            onChange={(id: string) => setExplorerId(id as ExplorerId)}
          />
        </div>
      </div>

      {/* Gas budget */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-1 flex-col">
          <p className="text-p2 text-navy-600">Gas budget</p>
          <p className="text-p3 text-navy-500">Leave blank for auto</p>
        </div>

        <div className="relative flex-1">
          <Input
            className="bg-navy-100/50"
            type="number"
            placeholder=""
            value={gasBudget}
            onChange={(value) => setGasBudget(value)}
          />

          <p className="text-600 pointer-events-none absolute right-3 top-1/2 z-[2] -translate-y-1/2 text-p2">
            SUI
          </p>
        </div>
      </div>

      {/* Ledger */}
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <p className="text-p2 text-navy-600">Using a Ledger</p>

        <button
          className={cn(
            "group flex h-[24px] w-[40px] flex-row items-center rounded-full border border-navy-200 p-px transition-colors",
            isUsingLedger ? "border-blue" : "",
          )}
          onClick={() => setIsUsingLedger(!isUsingLedger)}
        >
          <div
            className={cn(
              "h-[20px] w-[20px] rounded-full transition-all",
              isUsingLedger ? "ml-[16px] bg-blue" : "bg-navy-200",
            )}
          />
        </button>
      </div>
    </Dialog>
  );
}
