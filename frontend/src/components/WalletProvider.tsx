import {
  AllDefaultWallets,
  WalletProvider as SuietWalletProvider,
  defineStashedWallet,
} from "@suiet/wallet-kit";
import { PropsWithChildren } from "react";

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
