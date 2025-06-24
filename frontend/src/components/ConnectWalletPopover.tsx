import React from "react";

import { ChevronDown, ChevronUp, WalletIcon } from "lucide-react";

import { isInMsafeApp } from "@suilend/sui-fe";
import { Wallet, WalletType, useWalletContext } from "@suilend/sui-fe-next";
import useIsAndroid from "@suilend/sui-fe-next/hooks/useIsAndroid";
import useIsiOS from "@suilend/sui-fe-next/hooks/useIsiOS";

import Popover from "@/components/Popover";

interface WalletItemProps {
  wallet: Wallet;
}

function WalletItem({ wallet }: WalletItemProps) {
  const { connectWallet } = useWalletContext();

  const isiOS = useIsiOS();
  const isAndroid = useIsAndroid();

  const downloadUrl = isiOS
    ? wallet.downloadUrls?.iOS
    : isAndroid
      ? wallet.downloadUrls?.android
      : wallet.downloadUrls?.extension;

  const onClick = () => {
    if (wallet.type === WalletType.WEB || wallet.isInstalled) {
      connectWallet(wallet);
      return;
    }

    if (downloadUrl) window.open(downloadUrl, "_blank");
  };

  if (!(wallet.type === WalletType.WEB || wallet.isInstalled) && !downloadUrl)
    return null;
  return (
    <button
      className="group flex h-12 w-full flex-row items-center justify-between gap-2 rounded-sm bg-navy-100/50 px-3"
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-2">
        {wallet.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-5 w-5 min-w-5 shrink-0"
            src={wallet.iconUrl}
            alt={`${wallet.name} logo`}
            width={20}
            height={20}
          />
        ) : (
          <div className="h-5 w-5" />
        )}

        <p className="!text-p2 text-navy-600 transition-colors group-hover:text-foreground">
          {wallet.name}
        </p>
      </div>

      {wallet.isInstalled && (
        <p className="!text-p3 text-navy-600 transition-colors group-hover:text-foreground">
          Installed
        </p>
      )}
    </button>
  );
}

export default function ConnectWalletPopover() {
  const {
    isConnectWalletDropdownOpen,
    setIsConnectWalletDropdownOpen,
    wallets,
  } = useWalletContext();

  const Chevron = isConnectWalletDropdownOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{
        open: isConnectWalletDropdownOpen,
        onOpenChange: setIsConnectWalletDropdownOpen,
      }}
      contentProps={{
        className: "p-4",
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button className="flex h-10 flex-row items-center justify-center gap-2 rounded-sm bg-navy-800 px-3 text-white">
          <WalletIcon size={16} />
          <p className="text-p2">Connect</p>
          <Chevron className="-ml-0.5 h-4 w-4" />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-1">
          {wallets.map((wallet) => (
            <WalletItem key={wallet.name} wallet={wallet} />
          ))}
        </div>

        {!isInMsafeApp() && (
          <p className="text-p2 text-navy-600">
            {
              "Don't have a Sui wallet? Get started by trying one of the wallets above."
            }
          </p>
        )}
      </div>
    </Popover>
  );
}
