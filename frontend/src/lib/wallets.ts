import { useWallet } from "@suiet/wallet-kit";
import { merge } from "lodash";

const PRIORITY_WALLET_IDS = ["Sui Wallet"];

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
  // Wallets
  const { allAvailableWallets } = useWallet();

  const walletKitOverrides = {
    "Sui Wallet": {
      downloadUrls: {
        iOS: "https://apps.apple.com/us/app/sui-wallet-mobile/id6476572140",
        android:
          "https://play.google.com/store/apps/details?id=com.mystenlabs.suiwallet",
      },
    },
  };

  const wallets = allAvailableWallets.map(
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

  const installedWallets = wallets.filter((w) => w.isInstalled);
  const priorityWallets = PRIORITY_WALLET_IDS.map((wId) =>
    wallets.find((w) => w.id === wId),
  ).filter(Boolean) as Wallet[];

  // Categorize wallets
  const sortedInstalledWallets = installedWallets.sort((wA, wB) => {
    const wAPriorityIndex = priorityWallets.findIndex((w) => w.id === wA.id);
    const wBPriorityIndex = priorityWallets.findIndex((w) => w.id === wB.id);

    if (wAPriorityIndex > -1 && wBPriorityIndex > -1)
      return wAPriorityIndex - wBPriorityIndex;
    else if (wAPriorityIndex === -1 && wBPriorityIndex === -1) return 0;
    else return wAPriorityIndex > -1 ? -1 : 1;
  });
  const notInstalledPriorityWallets = priorityWallets.filter(
    (w) => !sortedInstalledWallets.find((iw) => iw.id === w.id),
  );

  const mainWallets = [
    ...sortedInstalledWallets,
    ...notInstalledPriorityWallets,
  ];
  const otherWallets = wallets.filter(
    (w) => !mainWallets.find((iw) => iw.id === w.id),
  );

  return {
    mainWallets,
    otherWallets,
    wallets: [...mainWallets, ...otherWallets],
  };
};
