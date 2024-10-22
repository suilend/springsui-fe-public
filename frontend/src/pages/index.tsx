import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Wallet } from "lucide-react";

import { LstClient } from "@springsui/sdk/functions";

import BottomNav from "@/components/BottomNav";
import Card from "@/components/Card";
import FaqButton from "@/components/FaqButton";
import StakeInput from "@/components/Input";
import Mask from "@/components/Mask";
import Nav from "@/components/Nav";
import StatsPopover from "@/components/StatsPopover";
import SubmitButton from "@/components/SubmitButton";
import TransactionConfirmationDialog, {
  TransactionConfirmationDialogConfig,
} from "@/components/TransactionConfirmationDialog";
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

export default function Home() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  const { suiClient, refreshAppData, explorer, ...restAppContext } =
    useAppContext();
  const lstClient = restAppContext.lstClient as LstClient;
  const appData = restAppContext.appData as AppData;
  const {
    setIsConnectWalletDropdownOpen,
    address,
    signExecuteAndWaitForTransaction,
    refreshBalancesData,
    getAccountBalance,
  } = useWalletContext();

  // Ref
  const inInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inInputRef.current?.focus();
  }, []);

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
  const suiPrice = appData.suiPrice;
  const lstPrice = appData.suiPrice.div(
    appData.liquidStakingInfo.suiToLstExchangeRate,
  );

  const inToOutExchangeRate = isStaking
    ? appData.liquidStakingInfo.suiToLstExchangeRate
    : appData.liquidStakingInfo.lstToSuiExchangeRate;

  // Tokens
  const suiToken = appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = appData.coinMetadataMap[NORMALIZED_LST_COINTYPE];

  // Balance
  const suiBalance = getAccountBalance(suiToken.coinType);
  const lstBalance = getAccountBalance(lstToken.coinType);

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
      : formatToken(
          BigNumber.max(0, inValue)
            .times(inToOutExchangeRate)
            .times(
              new BigNumber(1).minus(
                (isStaking
                  ? appData.liquidStakingInfo.mintFeePercent
                  : appData.liquidStakingInfo.redeemFeePercent
                ).div(100),
              ),
            ),
          {
            dp: outToken.decimals,
            useGrouping: false,
            roundLtMinToZero: true,
          },
        );
  const outValueUsd = new BigNumber(outValue || 0).times(outPrice);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [
    isTransactionConfirmationDialogOpen,
    setIsTransactionConfirmationDialogOpen,
  ] = useState<boolean>(false);

  const getTransactionConfirmationDialogConfig =
    (): TransactionConfirmationDialogConfig => {
      return { isStaking, inToken, outToken, inValue, outValue };
    };
  const [
    transactionConfirmationDialogConfig,
    setTransactionConfirmationDialogConfig,
  ] = useState<TransactionConfirmationDialogConfig>(
    getTransactionConfirmationDialogConfig,
  );

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
    if (new BigNumber(outValue).lte(0))
      return { title: "Amount too low", isDisabled: true };

    return {
      title: `${inTitle} ${inValue} ${inToken.symbol}`,
    };
  };
  const submitButtonState = getSubmitButtonState();

  const submit = async () => {
    if (submitButtonState.isDisabled) return;

    setIsSubmitting(true);
    setTransactionConfirmationDialogConfig(
      getTransactionConfirmationDialogConfig(),
    );

    const submitAmount = new BigNumber(inValue)
      .times(10 ** inToken.decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();

    const transaction = new Transaction();
    if (isStaking) mint(lstClient, transaction, address!, submitAmount);
    else
      await redeem(suiClient, lstClient, transaction, address!, submitAmount);

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
      await refreshAppData();
      await refreshBalancesData();
    }
  };

  // Parameters
  const parameters = [
    {
      label: "Exchange rate",
      value: `1 ${inToken.symbol} ≈ ${formatToken(new BigNumber(inToOutExchangeRate), { dp: 3 })} ${outToken.symbol}`,
    },
    {
      label: isStaking ? "Staking fee" : "Unstaking fee",
      value: formatPercent(
        isStaking
          ? appData.liquidStakingInfo.mintFeePercent
          : appData.liquidStakingInfo.redeemFeePercent,
      ),
    },
  ];
  if (isStaking)
    parameters.push(
      {
        label: "APY",
        value: formatPercent(appData.liquidStakingInfo.apyPercent),
      },
      {
        label: "Est. yearly earnings",
        value: `${
          inValue === ""
            ? "--"
            : formatToken(
                new BigNumber(BigNumber.max(0, inValue || 0)).times(
                  appData.liquidStakingInfo.apyPercent.div(100),
                ),
              )
        } ${inToken.symbol}`,
      },
      {
        label: "Points (on Suilend)",
        value: `0/${lstToken.symbol}/day`,
      },
    );

  return (
    <>
      {/* Fixed */}
      <TransactionConfirmationDialog
        isOpen={isTransactionConfirmationDialogOpen}
        config={transactionConfirmationDialogConfig}
      />

      <Nav />

      {/* Fixed, WIDTH >= md */}
      <Mask />

      <div className="relative z-[1] flex w-full flex-col items-center px-4 pb-12 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <Card>
            {/* Tabs */}
            <div className="w-full p-2 md:px-4 md:py-3.5">
              <div className="flex w-full flex-row rounded-sm bg-white/25 md:rounded-md">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "group h-10 flex-1 rounded-sm transition-colors md:rounded-md",
                      selectedTab === tab.id && "bg-white",
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

      {/* WIDTH < md */}
      <BottomNav />

      {/* Fixed, WIDTH >= md */}
      <div className="fixed bottom-10 left-10 z-[2] max-md:hidden">
        <StatsPopover />
      </div>

      {/* Fixed, WIDTH >= md */}
      <div className="fixed bottom-10 right-10 z-[2] max-md:hidden">
        <FaqButton />
      </div>
    </>
  );
}
