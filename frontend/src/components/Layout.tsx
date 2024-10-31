import { PropsWithChildren } from "react";

import { Loader2 } from "lucide-react";

import { useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";

export default function Layout({ children }: PropsWithChildren) {
  const { lstClient } = useRootContext();
  const { appData } = useAppDataContext();

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
          children
        )}
      </div>
    </>
  );
}
