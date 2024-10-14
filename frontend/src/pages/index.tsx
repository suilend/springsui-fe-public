import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import Card from "@/components/Card";
import Icon, { IconList } from "@/components/Icon";
import StakeInput from "@/components/Input";
import { AppData, useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { SUI_GAS_MIN } from "@/lib/constants";
import { formatPercent, formatToken } from "@/lib/format";
import { DEFI_URL, ROOT_URL } from "@/lib/navigation";
import { shallowPushQuery } from "@/lib/router";
import { mint, redeem } from "@/lib/transactions";
import { SubmitButtonState } from "@/lib/types";
import { cn } from "@/lib/utils";

enum QueryParams {
  TAB = "tab",
}

function Content() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  const { address } = useWalletContext();
  const {
    suiClient,
    refreshData,
    explorer,
    signExecuteAndWaitForTransaction,
    ...restAppContext
  } = useAppContext();
  const data = restAppContext.data as AppData;

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
  const suiPrice = data.suiPrice;
  const lstPrice = data.suiPrice.div(
    data.liquidStakingInfo.suiToLstExchangeRate,
  );

  const inToOutExchangeRate = isStaking
    ? data.liquidStakingInfo.suiToLstExchangeRate
    : data.liquidStakingInfo.lstToSuiExchangeRate;

  const aprPercent = new BigNumber(2.65);

  // Tokens
  const suiToken = data.coinMetadataMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = data.coinMetadataMap[NORMALIZED_LST_COINTYPE];

  // Balance
  const suiBalance = data.balanceMap[suiToken.coinType] ?? new BigNumber(0);
  const lstBalance = data.balanceMap[lstToken.coinType] ?? new BigNumber(0);
  console.log("XXX", +suiBalance, +lstBalance);

  const inBalance = isStaking ? suiBalance : lstBalance;
  const outBalance = isStaking ? lstBalance : suiBalance;

  // In
  const inTitle = isStaking ? "Stake" : "Unstake";
  const inToken = isStaking ? suiToken : lstToken;
  const inPrice = isStaking ? suiPrice : lstPrice;

  const [inValue, setInValue] = useState<string>("");
  const inValueUsd = new BigNumber(inValue || 0).times(inPrice);

  const maxInValue = isStaking
    ? BigNumber.max(0, inBalance.minus(SUI_GAS_MIN))
    : inBalance;

  // Out
  const outToken = isStaking ? lstToken : suiToken;
  const outPrice = isStaking ? lstPrice : suiPrice;

  const outValue =
    inValue === ""
      ? ""
      : formatToken(BigNumber.max(0, inValue).times(inToOutExchangeRate), {
          dp: outToken.decimals,
          useGrouping: false,
        });
  const outValueUsd = new BigNumber(outValue || 0).times(outPrice);

  const onInBalanceClick = () => {
    setInValue(
      formatToken(maxInValue, {
        dp: inToken.decimals,
        useGrouping: false,
      }),
    );
    inInputRef.current?.focus();
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);

  const getSubmitButtonState = (): SubmitButtonState => {
    if (!address)
      return {
        icon: <Icon icon={IconList.WALLET} size={28} />,
        title: "Connect wallet",
      };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    if (new BigNumber(inValue || 0).lte(0))
      return { title: "Enter an amount", isDisabled: true };
    if (new BigNumber(inValue).gt(inBalance))
      return { title: "Insufficient balance", isDisabled: true };
    if (isStaking && new BigNumber(inValue).gt(maxInValue))
      return {
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        isDisabled: true,
      };

    return {
      title: `${inTitle} ${inValue} ${inToken.symbol}`,
    };
  };
  const submitButtonState = getSubmitButtonState();

  // TODO
  const submit = async () => {
    if (submitButtonState.isDisabled) return;

    setIsSubmitting(true);

    const submitAmount = new BigNumber(inValue)
      .times(10 ** inToken.decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();

    const transaction = new Transaction();
    if (isStaking) mint(transaction, address!, submitAmount);
    else await redeem(suiClient, transaction, address!, submitAmount);

    try {
      setIsConfirmationModalOpen(true);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      // const balanceChangeOut = getBalanceChange(res, address!, inToken);

      // console.log(res, +balanceChangeOut);
      setInValue("");
    } catch (err) {
    } finally {
      setIsSubmitting(false);
      setIsConfirmationModalOpen(false);

      inInputRef.current?.focus();
      await refreshData();
    }
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
        label: "APR",
        value: formatPercent(aprPercent),
      },
      {
        label: "Est. yearly earnings",
        value: `${
          inValue === ""
            ? "--"
            : formatToken(
                new BigNumber(inValue || 0).times(aprPercent.div(100)),
              )
        } ${inToken.symbol}`,
      },
    );

  return (
    <div className="relative z-[1] flex w-full max-w-md flex-col items-center gap-4">
      <Card>
        {/* Tabs */}
        <div className="w-full px-4 py-3.5">
          <div className="flex w-full flex-row rounded-md bg-white/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "group h-10 flex-1 rounded-md border transition-colors",
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
        <div className="h-px w-full bg-white/75" />

        {/* Form */}
        <div className="flex w-full flex-col gap-4 p-4">
          <div className="flex w-full flex-col gap-0.5">
            <StakeInput
              ref={inInputRef}
              token={inToken}
              title={inTitle}
              value={inValue}
              onChange={setInValue}
              usdValue={inValueUsd}
              onBalanceClick={onInBalanceClick}
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
              !submitButtonState.isDisabled || submitButtonState.isLoading
                ? "bg-navy-800 text-white"
                : "bg-navy-200 text-navy-500",
            )}
            disabled={submitButtonState.isDisabled}
            onClick={submit}
          >
            {submitButtonState.isLoading ? (
              <Icon
                className="animate-spin"
                icon={IconList.LOADING}
                size={36}
              />
            ) : (
              <>
                {submitButtonState.icon}
                <p>{submitButtonState.title}</p>
              </>
            )}
          </button>
        </div>
      </Card>

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
  );
}

export default function Home() {
  const router = useRouter();

  const { data } = useAppContext();

  const isLoading = !data;

  return (
    <div className="flex h-dvh flex-col px-2 pb-2">
      {/* Navbar */}
      <div className="flex h-20 w-full flex-row items-center justify-center gap-12">
        {[
          { url: ROOT_URL, icon: IconList.STAKE, title: "Stake" },
          { url: DEFI_URL, icon: IconList.DEFI, title: "DeFi" },
          {
            icon: IconList.SPRING_SUI,
            title: "Spring Standard",
            endDecorator: "Soon",
          },
        ].map((item) => {
          const isSelected = router.pathname === item.url;
          const isDisabled = !item.url;
          const Component = !isDisabled ? Link : "div";

          return (
            <Component
              href={item.url as string}
              key={item.title}
              className="group flex flex-row items-center gap-2"
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isSelected
                    ? "text-foreground"
                    : !isDisabled
                      ? "text-navy-600 transition-colors group-hover:text-foreground"
                      : "text-navy-400",
                )}
                icon={item.icon}
                size={28}
              />
              <p
                className={cn(
                  isSelected
                    ? "text-foreground"
                    : !isDisabled
                      ? "text-navy-600 transition-colors group-hover:text-foreground"
                      : "text-navy-400",
                )}
              >
                {item.title}
              </p>

              {item.endDecorator && (
                <p className="rounded-[4px] bg-navy-100 px-1 py-0.5 text-p3 text-navy-600">
                  {item.endDecorator}
                </p>
              )}
            </Component>
          );
        })}
      </div>

      {/* Container */}
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-scroll rounded-lg bg-navy-100",
          isLoading ? "justify-center" : "px-8 pb-12 pt-20",
        )}
        style={{
          backgroundImage: "url('/assets/bg.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        {isLoading ? (
          <Icon
            className="animate-spin text-foreground"
            icon={IconList.LOADING}
            size={36}
          />
        ) : (
          <Content />
        )}
      </div>
    </div>
  );
}
