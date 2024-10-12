import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

import { CoinMetadata } from "@mysten/sui/client";
import { useWallet } from "@suiet/wallet-kit";
import BigNumber from "bignumber.js";
import { Loader2, Wallet } from "lucide-react";

import StakeInput from "@/components/Input";
import { AppData, useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { formatPercent, formatToken } from "@/lib/format";
import { shallowPushQuery } from "@/lib/router";
import { Token } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useListWallets } from "@/lib/wallets";
import lstLogo from "@/public/assets/lst.png";
import suiLogo from "@/public/assets/sui.png";

enum QueryParams {
  TAB = "tab",
}

interface HomeProps {
  suiToken: Token;
  lstToken: Token;
}

function Home({ suiToken, lstToken }: HomeProps) {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  const { disconnect } = useWallet();
  const { address, selectWallet } = useWalletContext();
  const appContext = useAppContext();
  const data = appContext.data as AppData;

  const { mainWallets, otherWallets } = useListWallets();

  // Ref
  const inInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  enum Tab {
    STAKE = "stake",
    UNSTAKE = "unstake",
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
    inInputRef.current?.focus();
  };

  const isStaking = selectedTab === Tab.STAKE;

  // Stats
  const suiPrice = 2.05; // TODO: Use real price
  const lstPrice = 2.087; // TODO: Use real price
  const inToOutExchangeRate = isStaking
    ? suiPrice / lstPrice
    : lstPrice / suiPrice;

  // Balance
  const getBalance = (token: Token) =>
    new BigNumber(
      data.coinBalancesRaw.find((cb) => cb.coinType === token.coinType)
        ?.totalBalance ?? 0,
    ).div(10 ** token.decimals);

  const suiBalance = getBalance(suiToken);
  const lstBalance = getBalance(lstToken);

  const inBalance = isStaking ? suiBalance : lstBalance;
  const outBalance = isStaking ? lstBalance : suiBalance;

  // In
  const inPrice = isStaking ? suiPrice : lstPrice;
  const inToken = isStaking ? suiToken : lstToken;

  const [inValue, setInValue] = useState<string>("");
  const inValueUsd = new BigNumber(inValue || 0).times(inPrice);

  // Out
  const outPrice = isStaking ? lstPrice : suiPrice;
  const outToken = isStaking ? lstToken : suiToken;

  const outValue =
    inValue === ""
      ? ""
      : formatToken(BigNumber.max(0, inValue).times(inToOutExchangeRate), {
          dp: outToken.decimals,
          useGrouping: false,
        });
  const outValueUsd = new BigNumber(outValue || 0).times(outPrice);

  const onBalanceClick = () => {
    setInValue(
      formatToken(inBalance, {
        dp: inToken.decimals,
        useGrouping: false,
      }),
    );
    inInputRef.current?.focus();
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submit = () => {
    setIsSubmitting(true);
  };

  // Parameters
  const parameters = [
    {
      label: "Exchange rate",
      value: `1 ${inToken.symbol} ≈ ${formatToken(new BigNumber(inToOutExchangeRate), { dp: 3 })} ${outToken.symbol}`,
    },
  ];
  if (isStaking)
    parameters.push(
      {
        label: "Staking rewards fee",
        value: formatPercent(new BigNumber(8.6)),
      },
      {
        label: "APR",
        value: formatPercent(new BigNumber(2.65)),
      },
      {
        label: "Est. yearly earnings",
        value: `${formatToken(
          new BigNumber(outValue || 0)
            .times(2.65 / 100)
            .div(inToOutExchangeRate),
        )} ${inToken.symbol}`,
      },
    );

  return (
    <div className="flex h-dvh flex-col px-2 pb-2">
      {/* Navbar */}
      <div className="flex h-20 w-full flex-row">
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
          <button onClick={disconnect}>Disconnect</button>
        )}
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-scroll rounded-lg bg-navy-100 px-8 pb-8 pt-20">
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          {/* Card */}
          <div className="w-full rounded-lg border border-white bg-white/20 shadow-[0_1px_1px_0px_hsla(var(--navy-800)/10%)] backdrop-blur-md">
            {/* Tabs */}
            <div className="w-full px-4 py-3.5">
              <div className="flex w-full flex-row rounded-sm bg-white/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "group h-10 flex-1 rounded-sm border transition-colors",
                      selectedTab === tab.id
                        ? "border-navy-200 bg-white"
                        : "border-[transparent]",
                    )}
                    onClick={() => onSelectedTabChange(tab.id)}
                  >
                    <p
                      className={cn(
                        "transition-colors",
                        selectedTab === tab.id
                          ? "text-foreground"
                          : "text-navy-600 group-hover:text-foreground",
                      )}
                    >
                      {tab.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white" />

            {/* Form */}
            <div className="flex w-full flex-col gap-4 p-4">
              <div className="flex w-full flex-col gap-0.5">
                <StakeInput
                  ref={inInputRef}
                  token={inToken}
                  title={isStaking ? "Stake" : "Unstake"}
                  value={inValue}
                  onChange={setInValue}
                  usdValue={inValueUsd}
                  onBalanceClick={onBalanceClick}
                  hasError={new BigNumber(inValue || 0).gt(inBalance)}
                />
                <StakeInput
                  token={outToken}
                  title="Receive"
                  value={outValue}
                  usdValue={outValueUsd}
                />
              </div>

              {/* Submit */}
              <button
                className={cn(
                  "flex h-[60px] w-full flex-row items-center justify-center gap-2.5 rounded-md",
                  !address ||
                    !(
                      new BigNumber(inValue || 0).lte(0) ||
                      new BigNumber(inValue).gt(inBalance)
                    )
                    ? "bg-navy-800"
                    : "bg-navy-200",
                )}
              >
                {!address ? (
                  <>
                    <Wallet className="h-4 w-4 text-white" />
                    <p className="text-white">Connect wallet</p>
                  </>
                ) : isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : new BigNumber(inValue || 0).lte(0) ? (
                  <p className="text-navy-500">Enter an amount</p>
                ) : new BigNumber(inValue).gt(inBalance) ? (
                  <p className="text-navy-500">Insufficient balance</p>
                ) : (
                  <p className="text-white">
                    Stake {inValue} {inToken.symbol}
                  </p>
                )}
              </button>
            </div>
          </div>

          {/* Parameters */}
          <div className="flex w-full flex-col gap-4 px-4">
            {parameters.map((param) => (
              <div
                key={param.label}
                className="flex w-full flex-row items-center justify-between"
              >
                <p className="text-p2 text-navy-600">{param.label}</p>
                <p className="text-p2">{param.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Wrapper() {
  const { suiClient, data } = useAppContext();

  // Tokens
  const [tokens, setTokens] = useState<Token[] | undefined>(undefined);

  const suiToken = tokens?.find((t) => t.coinType === NORMALIZED_SUI_COINTYPE);
  const lstToken = tokens?.find((t) => t.coinType === NORMALIZED_LST_COINTYPE);

  const fetchTokens = useCallback(async () => {
    const coinTypes = [NORMALIZED_SUI_COINTYPE, NORMALIZED_LST_COINTYPE];

    const result = await Promise.all(
      coinTypes.map((coinType) =>
        (async () => {
          const metadata = (await suiClient.getCoinMetadata({
            coinType,
          })) as CoinMetadata;

          return {
            coinType,
            ...metadata,
            iconUrl:
              {
                [NORMALIZED_SUI_COINTYPE]: suiLogo,
                [NORMALIZED_LST_COINTYPE]: lstLogo,
              }[coinType] ?? metadata.iconUrl,
          };
        })(),
      ),
    );
    setTokens(result);
  }, [suiClient]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  if (!data || tokens === undefined || !suiToken || !lstToken)
    return (
      <div className="flex h-dvh flex-col px-2 pb-2">
        <div className="flex h-20 w-full flex-row" />
        <div className="flex h-0 w-full flex-1 flex-col items-center justify-center rounded-lg bg-navy-100">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      </div>
    );
  return <Home suiToken={suiToken} lstToken={lstToken} />;
}
