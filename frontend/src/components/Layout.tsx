import { PropsWithChildren, useEffect, useRef } from "react";

// import { registerWallet } from "@mysten/wallet-standard";
import { Loader2 } from "lucide-react";

import { useSettingsContext } from "@suilend/frontend-sui-next";

import BottomNav from "@/components/BottomNav";
import { FooterMd } from "@/components/Footer";
import ImpersonationModeBanner from "@/components/ImpersonationModeBanner";
import Mask from "@/components/Mask";
import Nav from "@/components/Nav";
import { useAppContext } from "@/contexts/AppContext";
import { ASSETS_URL } from "@/lib/constants";

export default function Layout({ children }: PropsWithChildren) {
  const { rpc } = useSettingsContext();
  const { appData } = useAppContext();

  // MSafe Wallet
  const didRegisterMsafeWalletRef = useRef<boolean>(false);
  useEffect(() => {
    if (didRegisterMsafeWalletRef.current) return;

    // registerWallet(new MSafeWallet("SpringSui", rpc.url, "sui:mainnet"));
    didRegisterMsafeWalletRef.current = true;
  }, [rpc.url]);

  return (
    <>
      {/* Fixed */}
      <div
        className="fixed inset-0 z-[1]"
        style={{
          backgroundImage: `url('${ASSETS_URL}/background.png')`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-[2] h-dvh">
        {!appData ? (
          <div className="fixed inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Nav />

            {/* Fixed, WIDTH >= md */}
            <Mask />

            <ImpersonationModeBanner />
            {children}

            {/* WIDTH >= md */}
            <FooterMd />

            {/* WIDTH < md */}
            <BottomNav />
          </>
        )}
      </div>
    </>
  );
}
