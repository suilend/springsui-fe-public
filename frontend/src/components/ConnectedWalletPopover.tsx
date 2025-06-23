import Link from "next/link";
import React, { useState } from "react";

import DOMPurify from "dompurify";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  VenetianMask,
} from "lucide-react";

import { formatAddress } from "@suilend/sui-fe";
import { useSettingsContext, useWalletContext } from "@suilend/sui-fe-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import Popover from "@/components/Popover";
import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

export default function ConnectedWalletPopover() {
  const { explorer } = useSettingsContext();
  const {
    isImpersonating,
    wallet,
    disconnectWallet,
    accounts,
    account,
    switchAccount,
    ...restWalletContext
  } = useWalletContext();
  const address = restWalletContext.address as string;

  const hasDisconnect = !isImpersonating;
  const hasWallets = !isImpersonating && accounts.length > 1;

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button className="flex h-10 min-w-0 max-w-40 flex-row items-center justify-center gap-2 rounded-sm border border-navy-400/25 px-3">
          {isImpersonating ? (
            <VenetianMask className="h-4 w-4 shrink-0" />
          ) : wallet?.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-4 w-4 min-w-4 shrink-0"
              src={DOMPurify.sanitize(wallet.iconUrl)}
              alt={`${wallet.name} logo`}
              width={16}
              height={16}
            />
          ) : undefined}

          <p className="overflow-hidden text-ellipsis text-nowrap !text-p2">
            {(!isImpersonating ? account?.label : undefined) ??
              formatAddress(address)}
          </p>

          <Chevron className="h-4 w-4 text-navy-600" />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col">
          <p>
            {(!isImpersonating ? account?.label : "Impersonating") ??
              "Connected"}
          </p>

          <div className="flex flex-row items-center gap-2">
            <Tooltip title={address}>
              <p className="text-p2 text-navy-600">{formatAddress(address)}</p>
            </Tooltip>

            <CopyToClipboardButton value={address} />
            <Link
              className="block text-navy-500 transition-colors hover:text-foreground"
              href={explorer.buildAddressUrl(address)}
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

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
            {accounts.map((a) => (
              <button
                key={a.address}
                className={cn(
                  "group flex h-10 w-full flex-row items-center justify-between gap-2 rounded-sm bg-navy-100/50 px-3",
                  a.address === address
                    ? "cursor-default bg-light-blue"
                    : "transition-colors",
                )}
                onClick={
                  a.address === address ? undefined : () => switchAccount(a)
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
    </Popover>
  );
}
