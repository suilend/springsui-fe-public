import { SuiClient } from "@mysten/sui/client";
import { LstClient } from "@suilend/springsui-sdk";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { LIQUID_STAKING_INFO } from "@/lib/coinType";
import { EXPLORER, RPC } from "@/lib/constants";

interface RootContext {
  suiClient: SuiClient;
  lstClient: LstClient | null;

  rpc: typeof RPC;
  explorer: typeof EXPLORER;
}

const RootContext = createContext<RootContext>({
  suiClient: new SuiClient({ url: RPC.url }),
  lstClient: null,

  rpc: RPC,
  explorer: EXPLORER,
});

export const useRootContext = () => useContext(RootContext);

export function RootContextProvider({ children }: PropsWithChildren) {
  // Sui client
  const suiClient = useMemo(() => new SuiClient({ url: RPC.url }), []);

  // Lst client
  const [lstClient, setLstClient] = useState<RootContext["lstClient"]>(null);
  useEffect(() => {
    (async () => {
      const _lstClient = await LstClient.initialize(
        suiClient,
        LIQUID_STAKING_INFO,
      );
      setLstClient(_lstClient);
    })();
  }, [suiClient]);

  // Context
  const contextValue: RootContext = useMemo(
    () => ({
      suiClient,
      lstClient,

      rpc: RPC,
      explorer: EXPLORER,
    }),
    [suiClient, lstClient],
  );

  return (
    <RootContext.Provider value={contextValue}>{children}</RootContext.Provider>
  );
}
