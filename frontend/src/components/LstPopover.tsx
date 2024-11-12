import { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import Popover from "@/components/Popover";
import TokenLogo from "@/components/TokenLogo";
import { LstId, useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import { cn } from "@/lib/utils";

interface LstPopoverProps {
  onChange?: (lstId: LstId) => void;
}

export default function LstPopover({ onChange }: LstPopoverProps) {
  const { appData } = useLoadedAppContext();
  const { lstId, setLstId, lstData } = useLoadedLstContext();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  // Change
  const onChangeWrapper = (_lstId: LstId) => {
    setLstId(_lstId);
    setIsOpen(false);

    if (onChange) onChange(_lstId);
  };

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        <button className="flex flex-row items-center gap-2 py-1.5">
          <TokenLogo token={lstData.token} size={28} />
          <p className="text-h3">{lstData.token.symbol}</p>
          <Chevron className="-ml-0.5 h-4 w-4" />
        </button>
      }
      contentProps={{
        align: "end",
        maxWidth: 150,
      }}
    >
      <div className="flex w-full flex-col gap-3">
        {Object.values(LstId)
          .filter((_lstId) => ![LstId.ripleysSUI, LstId.mSUI].includes(_lstId))
          .map((_lstId) => {
            const _lstData = appData.lstDataMap[_lstId];

            return (
              <button
                key={_lstData.token.coinType}
                className="group -my-1 py-1"
                onClick={() => onChangeWrapper(_lstId)}
              >
                <div className="flex flex-row items-center gap-2">
                  <TokenLogo token={_lstData.token} size={24} />

                  <p
                    className={cn(
                      "!text-p2",
                      _lstId === lstId
                        ? "text-foreground"
                        : "text-navy-600 transition-colors group-hover:text-foreground",
                    )}
                  >
                    {_lstData.token.symbol}
                  </p>
                </div>
              </button>
            );
          })}
      </div>
    </Popover>
  );
}
