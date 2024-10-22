import { useWallet } from "@suiet/wallet-kit";
import { merge } from "lodash";

import { Wallet } from "@/lib/types";

const PRIORITY_WALLET_NAMES = ["Sui Wallet", "Nightly", "Suiet"];

const walletKitOverrides = {
  "Sui Wallet": {
    logoUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/05/7c/f1/057cf17e-109e-72cd-eed7-2d539cf3d1f9/AppIcon-0-0-1x_U007ephone-0-85-220.png/460x0w.webp", // Chrome Web Store logo isn't full size
    downloadUrls: {
      browserExtension:
        "https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil",
      iOS: "https://apps.apple.com/us/app/sui-wallet-mobile/id6476572140",
      android:
        "https://play.google.com/store/apps/details?id=com.mystenlabs.suiwallet",
    },
  },
  Nightly: {
    logoUrl:
      "https://lh3.googleusercontent.com/_feXM9qulMM5w9BYMLzMpZrxW2WlBmdyg3SbETIoRsHdAD9PANnLCEPabC7lzEK0N8fOyyvFkY3746jk8l73zUErxhU=s120",
    downloadUrls: {
      browserExtension:
        "https://chromewebstore.google.com/detail/nightly/fiikommddbeccaoicoejoniammnalkfa",
      iOS: "https://apps.apple.com/pl/app/nightly-multichain-wallet/id6444768157",
      android:
        "https://play.google.com/store/apps/details?id=com.nightlymobile",
    },
  },
  Suiet: {
    logoUrl:
      "https://lh3.googleusercontent.com/JLASDvvsaGcOrFvuC1gcay_9J1ZyelGHhs1EnHdrr7wtjPD_KEYL88vriXBia97omZngQTDNIiXlQyvr_hUnHKnv=s120",
    downloadUrls: {
      browserExtension:
        "https://chromewebstore.google.com/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd",
    },
  },
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
