import { PropsWithChildren } from "react";

import {
  AllDefaultWallets,
  WalletProvider as SuietWalletProvider,
  defineStashedWallet,
} from "@suiet/wallet-kit";

export default function WalletProvider({ children }: PropsWithChildren) {
  return (
    <SuietWalletProvider
      defaultWallets={[
        ...AllDefaultWallets,
        defineStashedWallet({
          appName: "Suilend",
        }),
      ]}
    >
      {children}
    </SuietWalletProvider>
  );
}
