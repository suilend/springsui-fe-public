import Image from "next/image";
import React from "react";

import { WalletIcon } from "lucide-react";

import Popover from "@/components/Popover";
import { useWalletContext } from "@/contexts/WalletContext";
import useIsAndroid from "@/hooks/useIsAndroid";
import useIsiOS from "@/hooks/useIsiOS";
import { Wallet } from "@/lib/types";
import { useListWallets } from "@/lib/wallets";

interface WalletItemProps {
  wallet: Wallet;
}

function WalletItem({ wallet }: WalletItemProps) {
  const { connectWallet } = useWalletContext();

  const isiOS = useIsiOS();
  const isAndroid = useIsAndroid();

  const platform: keyof Wallet["downloadUrls"] = isiOS
    ? "iOS"
    : isAndroid
      ? "android"
      : "browserExtension";
  const downloadUrl = wallet.downloadUrls[platform];

  const onClick = () => {
    if (!wallet.isInstalled) {
      window.open(downloadUrl, "_blank");
      return;
    }

    connectWallet(wallet);
  };

  if (!wallet.isInstalled && !downloadUrl) return null;
  return (
    <button
      className="group flex h-12 w-full flex-row items-center justify-between gap-2 rounded-sm bg-navy-100/50 px-3 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-2">
        {wallet.logoUrl ? (
          <Image
            src={wallet.logoUrl}
            alt={`${wallet.name} logo`}
            width={24}
            height={24}
          />
        ) : (
          <div className="h-6 w-6" />
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
  const { isConnectWalletDropdownOpen, setIsConnectWalletDropdownOpen } =
    useWalletContext();

  const wallets = useListWallets();

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
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-0.5">
          {wallets.map((wallet) => (
            <WalletItem key={wallet.name} wallet={wallet} />
          ))}
        </div>

        <p className="text-p2 text-navy-600">
          {
            "Don't have a Sui wallet? Get started by trying one of the wallets above."
          }
        </p>
      </div>
    </Popover>
  );
}
