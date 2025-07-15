import { useState } from "react";

import { Settings } from "lucide-react";

import { RpcId } from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

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
    isUsingLedger,
    setIsUsingLedger,
  } = useSettingsContext();

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
