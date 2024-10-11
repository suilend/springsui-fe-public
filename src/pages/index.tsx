import Image from "next/image";
import { useRouter } from "next/router";

import { useWallet } from "@suiet/wallet-kit";
import { Wallet } from "lucide-react";

import { useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { COINTYPE_LOGO_MAP, NORMALIZED_SUI_COINTYPE } from "@/lib/coinType";
import { shallowPushQuery } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useListWallets } from "@/lib/wallets";

enum QueryParams {
  TAB = "tab",
}

export default function Home() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  const { data } = useAppContext();
  const { disconnect } = useWallet();
  const { address, selectWallet } = useWalletContext();

  const { mainWallets, otherWallets } = useListWallets();

  // Tabs
  enum Tab {
    STAKE = "Stake",
    UNSTAKE = "Unstake",
  }

  const tabs = [
    { id: Tab.STAKE, title: "Stake" },
    { id: Tab.UNSTAKE, title: "Unstake" },
  ];

  const selectedTab =
    queryParams[QueryParams.TAB] &&
    Object.values(Tab).includes(queryParams[QueryParams.TAB])
      ? queryParams[QueryParams.TAB]
      : Tab.STAKE;
  const onSelectedTabChange = (tab: Tab) => {
    shallowPushQuery(router, { ...router.query, [QueryParams.TAB]: tab });
  };

  // Stake
  const stakeAmount = 0;

  // Receive
  const receiveAmount = 0;

  return (
    <div className="flex h-dvh flex-col px-2 pb-2">
      <div className="flex h-20 w-full flex-row">hi</div>

      <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-scroll rounded-lg bg-[lightgray] px-8 pb-8 pt-20">
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <div className="w-full rounded-lg border border-white">
            {/* Tabs */}
            <div className="w-full p-4">
              <div className="flex h-12 w-full flex-row gap-0.5 rounded-sm bg-white/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "h-12 flex-1 rounded-sm transition-colors hover:bg-white hover:text-foreground",
                      selectedTab === tab.id
                        ? "bg-white"
                        : "text-foreground-light",
                    )}
                    onClick={() => onSelectedTabChange(tab.id)}
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white" />

            {/* Form */}
            <div className="flex w-full flex-col gap-4 p-4">
              <div className="flex w-full flex-col gap-0.5">
                {/* Stake */}
                <div className="flex w-full flex-col gap-1.5 rounded-md bg-white px-5 py-4">
                  <p className="text-foreground-light">Stake</p>

                  <div className="flex w-full flex-row items-center justify-between">
                    <div className="flex-1">
                      <input
                        className="w-full font-sans text-3xl text-foreground placeholder:text-foreground-light/50"
                        placeholder="0"
                        value={stakeAmount}
                      />
                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <Image
                        width={28}
                        height={28}
                        src={COINTYPE_LOGO_MAP[NORMALIZED_SUI_COINTYPE]}
                        alt="SUI logo"
                      />
                      <p className="text-lg">SUI</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-row items-center justify-between">
                    <p className="text-xs text-foreground-light/50">$0.00</p>

                    <div className="group flex cursor-pointer flex-row items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-foreground-light group-hover:text-foreground" />
                      <p className="text-foreground-light underline decoration-dotted decoration-1 underline-offset-2 group-hover:text-foreground group-hover:decoration-solid">
                        120.56
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receive */}
                <div className="flex w-full flex-col gap-1.5 rounded-md bg-white/50 px-5 py-4">
                  <p className="text-foreground-light">Receive</p>

                  <div className="flex w-full flex-row items-center justify-between">
                    <p
                      className={cn(
                        "flex-1 text-3xl",
                        stakeAmount === 0 && "text-foreground-light/50",
                      )}
                    >
                      {receiveAmount}
                    </p>

                    <div className="flex flex-row items-center gap-2">
                      <Image
                        width={28}
                        height={28}
                        src={COINTYPE_LOGO_MAP[NORMALIZED_SUI_COINTYPE]}
                        alt="SUI logo"
                      />
                      <p className="text-lg">sSUI</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-row items-center justify-between">
                    <p className="text-xs text-foreground-light/50">$0.00</p>

                    <div className="group flex cursor-pointer flex-row items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-foreground-light group-hover:text-foreground" />
                      <p className="text-foreground-light underline decoration-dotted decoration-1 underline-offset-2 group-hover:text-foreground group-hover:decoration-solid">
                        0.00
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button className="bg-glacier-blue h-16 w-full rounded-md text-lg text-foreground-light/50">
                Enter amount
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 px-4">
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-foreground-light">Exchange rate</p>
              <p>1 SUI = 0.987 sSUI</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-foreground-light">Staking rewards fee</p>
              <p>8.6%</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-foreground-light">APR</p>
              <p>2.65%</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-foreground-light">Est. yearly earnings</p>
              <p>0.00 SUI</p>
            </div>
          </div>

          {!address ? (
            <>
              {mainWallets.map((w) => (
                <button key={w.name} onClick={() => selectWallet(w.name)}>
                  {w.name}
                </button>
              ))}
              {otherWallets.map((w) => (
                <button key={w.name} onClick={() => selectWallet(w.name)}>
                  {w.name}
                </button>
              ))}
            </>
          ) : (
            <>
              <button onClick={disconnect}>Disconnect</button>
              <p className="break-all">
                {data &&
                  JSON.stringify(
                    data.coinBalancesRaw.find(
                      (cb) => cb.coinType === NORMALIZED_SUI_COINTYPE,
                    ),
                  )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
