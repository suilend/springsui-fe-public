import { useRouter } from "next/router";
import { useCallback, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";
import { Wallet } from "lucide-react";

import Card from "@/components/Card";
import FaqPopover from "@/components/FaqPopover";
import StakeInput from "@/components/Input";
import Nav from "@/components/Nav";
import StatsPopover from "@/components/StatsPopover";
import SubmitButton from "@/components/SubmitButton";
import TransactionConfirmationDialog from "@/components/TransactionConfirmationDialog";
import { AppData, useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { SUI_GAS_MIN } from "@/lib/constants";
import { formatInteger, formatPercent, formatToken } from "@/lib/format";
import { shallowPushQuery } from "@/lib/router";
import { errorToast, successToast } from "@/lib/toasts";
import { getBalanceChange, mint, redeem } from "@/lib/transactions";
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

  const { setIsConnectWalletDropdownOpen, address } = useWalletContext();
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

  const formatAndSetInValue = useCallback(
    (_value: string) => {
      let formattedValue;
      if (new BigNumber(_value || 0).lt(0)) formattedValue = _value;
      else if (!_value.includes(".")) formattedValue = _value;
      else {
        const [integers, decimals] = _value.split(".");
        const integersFormatted = formatInteger(
          integers !== "" ? parseInt(integers) : 0,
          false,
        );
        const decimalsFormatted = decimals.slice(
          0,
          Math.min(decimals.length, inToken.decimals),
        );
        formattedValue = `${integersFormatted}.${decimalsFormatted}`;
      }

      setInValue(formattedValue);
    },
    [inToken.decimals],
  );

  const maxInValue = isStaking
    ? BigNumber.max(0, inBalance.minus(SUI_GAS_MIN))
    : inBalance;

  const onInBalanceClick = () => {
    formatAndSetInValue(
      maxInValue.toFixed(inToken.decimals, BigNumber.ROUND_DOWN),
    );
    inInputRef.current?.focus();
  };

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

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [
    isTransactionConfirmationDialogOpen,
    setIsTransactionConfirmationDialogOpen,
  ] = useState<boolean>(false);

  const getSubmitButtonState = (): SubmitButtonState => {
    if (!address)
      return {
        icon: <Wallet />,
        title: "Connect wallet",
        onClick: () => setIsConnectWalletDropdownOpen(true),
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

      const balanceChangeIn = getBalanceChange(res, address!, inToken, -1);
      const balanceChangeOut = getBalanceChange(res, address!, outToken);

      successToast(
        [
          isStaking ? "Staked" : "Unstaked",
          formatToken(
            balanceChangeIn !== undefined
              ? balanceChangeIn
              : new BigNumber(inValue),
            { dp: inToken.decimals },
          ),
          inToken.symbol,
        ].join(" "),
        [
          "Received",
          formatToken(
            balanceChangeOut !== undefined
              ? balanceChangeOut
              : new BigNumber(outValue),
            { dp: outToken.decimals },
          ),
          outToken.symbol,
        ].join(" "),
        txUrl,
      );
      formatAndSetInValue("");
    } catch (err) {
      errorToast(
        `Failed to ${isStaking ? "stake" : "unstake"}`,
        err as Error,
        true,
      );
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
        value: formatPercent(data.liquidStakingInfo.aprPercent),
      },
      {
        label: "Est. yearly earnings",
        value: `${
          inValue === ""
            ? "--"
            : formatToken(
                new BigNumber(inValue || 0).times(
                  data.liquidStakingInfo.aprPercent.div(100),
                ),
              )
        } ${inToken.symbol}`,
      },
    );

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

      <Nav />

      <div className="relative z-[1] flex min-h-0 w-full flex-1 flex-col items-center px-4 md:px-10">
        <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-4 pb-8 pt-4 md:py-16">
          <Card>
            {/* Tabs */}
            <div className="w-full p-2 md:px-4 md:py-3.5">
              <div className="flex w-full flex-row rounded-md bg-white/50 md:rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "group h-10 flex-1 rounded-sm border transition-colors md:rounded-md",
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
            <div className="flex w-full flex-col gap-2 p-2 md:gap-4 md:p-4">
              <div className="flex w-full flex-col gap-0.5">
                <StakeInput
                  ref={inInputRef}
                  token={inToken}
                  title={inTitle}
                  value={inValue}
                  onChange={formatAndSetInValue}
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

              <SubmitButton state={submitButtonState} submit={submit} />
            </div>
          </Card>

          {/* Parameters */}
          <div className="flex w-full flex-col gap-4 px-2 md:px-4">
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

      <div className="fixed bottom-10 left-10 z-[2] max-md:hidden">
        <StatsPopover />
      </div>

      <div className="fixed bottom-10 right-10 z-[2] max-md:hidden">
        <FaqPopover />
      </div>
    </>
  );
}

export default function Home() {
  const { data } = useAppContext();

  return (
    <>
      <div
        className="fixed inset-0 z-[0]"
        style={{
          backgroundImage: "url('/assets/bg.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-[1] flex h-dvh flex-col items-center justify-center">
        {!data ? <Loader2 className="animate-spin" /> : <Content />}
      </div>
    </>
  );
}
