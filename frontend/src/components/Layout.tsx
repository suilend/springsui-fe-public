import { PropsWithChildren } from "react";

import { Loader2 } from "lucide-react";

import BottomNav from "@/components/BottomNav";
import { FooterMd } from "@/components/Footer";
import ImpersonationModeBanner from "@/components/ImpersonationModeBanner";
import Mask from "@/components/Mask";
import Nav from "@/components/Nav";
import { useAppContext } from "@/contexts/AppContext";

export default function Layout({ children }: PropsWithChildren) {
  const { lstClient, appData } = useAppContext();

  return (
    <>
      {/* Fixed */}
      <div
        className="fixed inset-0 z-[1] bg-bg"
        style={{
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-[2] h-dvh">
        {!lstClient || !appData ? (
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
