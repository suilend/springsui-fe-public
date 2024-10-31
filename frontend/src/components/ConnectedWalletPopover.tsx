import Image from "next/image";
import React, { useState } from "react";

import { VenetianMask } from "lucide-react";

import Popover from "@/components/Popover";
import { useWalletContext } from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ConnectedWalletPopover() {
  const {
    isImpersonating,
    wallet,
    disconnectWallet,
    walletAccounts,
    walletAccount,
    selectWalletAccount,
    ...restWalletContext
  } = useWalletContext();
  const address = restWalletContext.address as string;

  const hasDisconnect = !isImpersonating;
  const hasWallets = !isImpersonating && walletAccounts.length > 1;
  const hasContent = hasDisconnect || hasWallets;

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Popover
      rootProps={
        !hasContent
          ? { open: false }
          : { open: isOpen, onOpenChange: setIsOpen }
      }
      contentProps={{
        className: "p-4",
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button
          className={cn(
            "flex h-10 min-w-0 max-w-40 flex-row items-center justify-center gap-2 rounded-sm border border-navy-400/25 px-3",
            !hasContent && "cursor-default",
          )}
        >
          {isImpersonating ? (
            <VenetianMask className="h-4 w-4 shrink-0" />
          ) : wallet?.logoUrl ? (
            <Image
              className="h-4 w-4 min-w-4 shrink-0"
              src={wallet.logoUrl}
              alt={`${wallet.name} logo`}
              width={16}
              height={16}
              quality={100}
            />
          ) : null}

          <p className="overflow-hidden text-ellipsis text-nowrap !text-p2">
            {(!isImpersonating ? walletAccount?.label : undefined) ??
              formatAddress(address)}
          </p>
        </button>
      }
    >
      {hasContent && (
        <div className="flex w-full flex-col gap-3">
          {hasDisconnect && (
            <button
              className="group flex h-10 w-full flex-row items-center rounded-sm bg-navy-100/50 px-3"
              onClick={disconnectWallet}
            >
              <p className="text-p2 text-navy-600 transition-colors group-hover:text-foreground">
                Disconnect
              </p>
            </button>
          )}
          {hasWallets && (
            <div className="flex w-full flex-col gap-1">
              {walletAccounts.map((a) => (
                <button
                  key={a.address}
                  className={cn(
                    "group flex h-10 w-full flex-row items-center justify-between gap-2 rounded-sm bg-navy-100/50 px-3 transition-colors",
                    a.address === address ? "cursor-default bg-light-blue" : "",
                  )}
                  onClick={
                    a.address === address
                      ? undefined
                      : () => {
                          selectWalletAccount(a.address);
                          setIsOpen(false);
                        }
                  }
                >
                  <p
                    className={cn(
                      "shrink-0 !text-p2",
                      a.address === address
                        ? "text-foreground"
                        : "text-navy-600 transition-colors group-hover:text-foreground",
                    )}
                  >
                    {formatAddress(a.address)}
                  </p>

                  {a.label && (
                    <p
                      className={cn(
                        "overflow-hidden text-ellipsis text-nowrap !text-p3",
                        a.address === address
                          ? "text-foreground"
                          : "text-navy-600 transition-colors group-hover:text-foreground",
                      )}
                    >
                      {a.label}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
