import { useWallet } from "@suiet/wallet-kit";
import { merge } from "lodash";

const PRIORITY_WALLET_NAMES = ["Sui Wallet", "Nightly", "Suiet"];

const walletKitOverrides = {
  "Sui Wallet": {
    logoUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/05/7c/f1/057cf17e-109e-72cd-eed7-2d539cf3d1f9/AppIcon-0-0-1x_U007ephone-0-85-220.png/460x0w.webp", // Chrome Web Store logo isn't full size
    downloadUrls: {
      iOS: "https://apps.apple.com/us/app/sui-wallet-mobile/id6476572140",
      android:
        "https://play.google.com/store/apps/details?id=com.mystenlabs.suiwallet",
    },
  },
};

export type Wallet = {
  id: string;
  name: string;
  isInstalled: boolean;
  logoUrl?: string;
  downloadUrls: {
    browserExtension?: string;
    iOS?: string;
    android?: string;
  };
};

export const useListWallets = () => {
  const { configuredWallets, allAvailableWallets } = useWallet();

  const filteredConfiguredWallets = configuredWallets.filter((wallet) =>
    PRIORITY_WALLET_NAMES.find((wName) => wName === wallet.name),
  );
  const filteredAvailableWallets = allAvailableWallets.filter(
    (wallet) => !filteredConfiguredWallets.find((w) => w.name === wallet.name),
  );

  const allWallets = [
    ...filteredConfiguredWallets,
    ...filteredAvailableWallets,
  ].map(
    (w) =>
      merge(
        {
          id: w.name,
          name: w.name,
          isInstalled: w.installed ?? false,
          logoUrl: w.iconUrl,
          downloadUrls: w.downloadUrl,
        },
        walletKitOverrides[w.name as keyof typeof walletKitOverrides] ?? {},
      ) as Wallet,
  );

  // Sort
  const sortWallets = (wallets: Wallet[]) =>
    wallets.slice().sort((wA, wB) => {
      const wA_priorityIndex = PRIORITY_WALLET_NAMES.findIndex(
        (wName) => wName === wA.name,
      );
      const wB_priorityIndex = PRIORITY_WALLET_NAMES.findIndex(
        (wName) => wName === wB.name,
      );

      if (wA_priorityIndex > -1 && wB_priorityIndex > -1)
        return wA_priorityIndex - wB_priorityIndex;
      else if (wA_priorityIndex === -1 && wB_priorityIndex === -1) return 0;
      else return wA_priorityIndex > -1 ? -1 : 1;
    });

  const installedWallets = sortWallets(
    allWallets.filter((wallet) => wallet.isInstalled),
  );
  const notInstalledWallets = sortWallets(
    allWallets.filter((wallet) => !wallet.isInstalled),
  );

  return [...installedWallets, ...notInstalledWallets];
};
