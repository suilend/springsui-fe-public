import { useRouter } from "next/router";
import { useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import Card from "@/components/Card";
import Icon, { IconList } from "@/components/Icon";
import StakeInput from "@/components/Input";
import Nav from "@/components/Nav";
import Popover from "@/components/Popover";
import TransactionConfirmationDialog from "@/components/TransactionConfirmationDialog";
import { AppData, useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { SUI_GAS_MIN } from "@/lib/constants";
import { formatNumber, formatPercent, formatToken } from "@/lib/format";
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
    getBalance,
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
  const suiBalance = getBalance(suiToken.coinType);
  const lstBalance = getBalance(lstToken.coinType);

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
  const [
    isTransactionConfirmationDialogOpen,
    setIsTransactionConfirmationDialogOpen,
  ] = useState<boolean>(false);

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
      setIsTransactionConfirmationDialogOpen(true);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      // const balanceChangeOut = getBalanceChange(res, address!, inToken);

      // console.log(res, +balanceChangeOut);
      setInValue("");
    } catch (err) {
    } finally {
      setIsSubmitting(false);
      setIsTransactionConfirmationDialogOpen(false);

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

  // Stats
  const stats = [
    {
      label: "APR",
      value: formatPercent(aprPercent),
    },
    {
      label: `Total staked ${lstToken.symbol}`,
      value: formatToken(data.liquidStakingInfo.totalLstSupply),
    },
    {
      label: `Total locked ${suiToken.symbol}`,
      value: formatToken(data.liquidStakingInfo.totalSuiSupply),
    },
    {
      label: "Total users",
      value: formatNumber(new BigNumber(1200)), // TODO
    },
  ];

  // FAQ
  const [faqOpenIndex, setFaqOpenIndex] = useState<number>(0);

  // TODO
  const faq = [
    {
      question: "What is staking?",
      answer: "Staking is...",
    },
    {
      question: `Where can I use ${lstToken.symbol}?`,
      answer: `${lstToken.symbol} will be deeply integrated throughout the Sui ecosystem. It will be usable across DEXes, lending protocols, stablecoins protocols, NFT marketplaces and more. The goal is to have as many integrations for ${lstToken.symbol} as ${suiToken.symbol} itself!`,
    },
  ];

  return (
    <>
      <TransactionConfirmationDialog
        isStaking={isStaking}
        inToken={inToken}
        outToken={outToken}
        inValue={inValue}
        outValue={outValue}
        isOpen={isTransactionConfirmationDialogOpen}
      />

      <div className="relative z-[1] flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto overflow-x-hidden px-8 py-12">
        <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-4">
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
                        "!text-p2 transition-colors",
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
      </div>

      {/* Stats */}
      <div className="absolute bottom-8 left-8 z-[2]">
        <Popover
          trigger={
            <button className="flex h-12 flex-row items-center gap-2 rounded-md bg-white px-4 shadow-sm">
              <Icon icon={IconList.STATS} />
              <p className="text-p2">Stats</p>
            </button>
          }
        >
          <div className="flex w-full flex-col gap-3">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex w-full flex-row items-center justify-between"
              >
                <p className="text-p2 text-navy-600">{stat.label}</p>
                <p className="text-p2">{stat.value}</p>
              </div>
            ))}
          </div>
        </Popover>
      </div>

      {/* FAQ */}
      <div className="absolute bottom-8 right-8 z-[2]">
        <Popover
          trigger={
            <button className="flex h-12 flex-row items-center gap-2 rounded-md bg-white px-4 shadow-sm">
              <Icon icon={IconList.FAQ} />
              <p className="text-p2">FAQ</p>
            </button>
          }
          contentProps={{
            align: "end",
          }}
        >
          <div className="flex w-full flex-col gap-3">
            {faq.map((qa, index) => {
              const isOpen = faqOpenIndex === index;

              return (
                <div
                  key={index}
                  className="flex w-full cursor-pointer flex-col gap-2"
                  onClick={() =>
                    setFaqOpenIndex((i) => (i !== index ? index : -1))
                  }
                >
                  <div className="flex w-full flex-row items-center justify-between gap-4">
                    <p className="text-p2">{qa.question}</p>

                    <Icon
                      className="text-navy-600"
                      icon={isOpen ? IconList.ARROW_UP : IconList.ARROW_DOWN}
                    />
                  </div>
                  {isOpen && <p className="text-p2 font-normal">{qa.answer}</p>}
                </div>
              );
            })}
          </div>
        </Popover>
      </div>
    </>
  );
}

export default function Home() {
  const { data } = useAppContext();

  const isLoading = !data;

  return (
    <div className="flex h-dvh flex-col px-2 pb-2">
      <Nav />

      <div
        className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg bg-navy-100"
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
