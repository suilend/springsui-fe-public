import "@/lib/abortSignalPolyfill";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PropsWithChildren, useEffect } from "react";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import mixpanel from "mixpanel-browser";

import {
  SettingsContextProvider,
  WalletContextProvider,
  useSettingsContext,
} from "@suilend/frontend-sui";

import Layout from "@/components/Layout";
import Toaster from "@/components/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppContextProvider } from "@/contexts/AppContext";
import { TITLE } from "@/lib/constants";
import { fontClassNames } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import "@/styles/globals.scss";

function WalletContextProviderWrapper({ children }: PropsWithChildren) {
  const { suiClient } = useSettingsContext();

  return (
    <WalletContextProvider appName="SpringSui" suiClient={suiClient}>
      {children}
    </WalletContextProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Mixpanel
  useEffect(() => {
    const projectToken = process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN;
    if (!projectToken) return;

    mixpanel.init(projectToken, {
      debug: process.env.NEXT_PUBLIC_DEBUG === "true",
      persistence: "localStorage",
    });
  }, []);

  return (
    <>
      <SpeedInsights />
      <Analytics />
      <Head>
        <title>{TITLE}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </Head>

      <main id="__app_main" className={cn(fontClassNames)}>
        <SettingsContextProvider>
          <WalletContextProviderWrapper>
            <AppContextProvider>
              <TooltipProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
                <Toaster />
              </TooltipProvider>
            </AppContextProvider>
          </WalletContextProviderWrapper>
        </SettingsContextProvider>
      </main>
    </>
  );
}
