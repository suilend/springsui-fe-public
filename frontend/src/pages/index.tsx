import { useRouter } from "next/router";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/react";
import BigNumber from "bignumber.js";
import { Info, Wallet } from "lucide-react";

import {
  SUI_GAS_MIN,
  getBalanceChange,
  shallowPushQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui";
import track from "@suilend/frontend-sui/lib/track";
import { SuilendClient } from "@suilend/sdk";

import Card from "@/components/Card";
import FaqPopover, { FaqContent } from "@/components/FaqPopover";
import { FOOTER_MD_HEIGHT, FooterSm } from "@/components/Footer";
import StakeInput from "@/components/StakeInput";
import StatsPopover, { StatsContent } from "@/components/StatsPopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import TransactionConfirmationDialog, {
  TransactionConfirmationDialogConfig,
} from "@/components/TransactionConfirmationDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedLstContext } from "@/contexts/LstContext";
import {
  formatInteger,
  formatPercent,
  formatPoints,
  formatToken,
} from "@/lib/format";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

enum QueryParams {
  TAB = "tab",
}

export default function Home() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  const { explorer, suiClient } = useSettingsContext();
  const {
    setIsConnectWalletDropdownOpen,
    address,
    signExecuteAndWaitForTransaction,
  } = useWalletContext();
  const { appData, getBalance, refresh } = useLoadedAppContext();
  const { lstClient, lstData } = useLoadedLstContext();

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
  const inToOutExchangeRate = isStaking
    ? lstData.suiToLstExchangeRate
    : lstData.lstToSuiExchangeRate;

  // Balance
  const suiBalance = getBalance(appData.suiToken.coinType);
  const lstBalance = getBalance(lstData.token.coinType);

  const inBalance = isStaking ? suiBalance : lstBalance;
  const outBalance = isStaking ? lstBalance : suiBalance;

  // In
  const inTitle = isStaking ? "Stake" : "Unstake";
  const inToken = isStaking ? appData.suiToken : lstData.token;
  const inPrice = isStaking ? appData.suiPrice : lstData.price;

  const [inValue, setInValue] = useState<string>("");
  const inValueUsd = new BigNumber(BigNumber.max(0, inValue || 0)).times(
    inPrice,
  );

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
      (isStaking ? BigNumber.max(0, inBalance.minus(1)) : inBalance).toFixed(
        inToken.decimals,
        BigNumber.ROUND_DOWN,
      ),
    );
    inInputRef.current?.focus();
  };

  // Out
  const outToken = isStaking ? lstData.token : appData.suiToken;
  const outPrice = isStaking ? lstData.price : appData.suiPrice;

  const outValue =
    inValue === ""
      ? ""
      : formatToken(
          BigNumber.max(0, inValue)
            .times(inToOutExchangeRate)
            .times(
              new BigNumber(1).minus(
                (isStaking
                  ? lstData.mintFeePercent
                  : lstData.redeemFeePercent
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
  // Submit - transaction confirmation dialog
  const [
    isTransactionConfirmationDialogOpen,
    setIsTransactionConfirmationDialogOpen,
  ] = useState<boolean>(false);

  const getTransactionConfirmationDialogConfig = (
    isDepositing: boolean,
  ): TransactionConfirmationDialogConfig => ({
    isDepositing,
    isStaking,
    inToken,
    outToken,
    inValue,
    outValue,
  });

  const [
    transactionConfirmationDialogConfig,
    setTransactionConfirmationDialogConfig,
  ] = useState<TransactionConfirmationDialogConfig>(
    getTransactionConfirmationDialogConfig(false),
  );

  // Submit - button state
  const [isSubmitting_stakeOrUnstake, setIsSubmitting_stakeOrUnstake] =
    useState<boolean>(false);
  const [isSubmitting_stakeAndDeposit, setIsSubmitting_stakeAndDeposit] =
    useState<boolean>(false);

  const getSubmitButtonState_stakeOrUnstake = (): SubmitButtonState => {
    if (!address)
      return {
        icon: <Wallet />,
        title: "Connect wallet",
        onClick: () => setIsConnectWalletDropdownOpen(true),
      };
    if (isSubmitting_stakeOrUnstake)
      return { isLoading: true, isDisabled: true };

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
      title: `${inTitle} ${formatToken(new BigNumber(inValue), { dp: inToken.decimals })} ${inToken.symbol}`,
    };
  };
  const submitButtonState_stakeOrUnstake =
    getSubmitButtonState_stakeOrUnstake();

  const getSubmitButtonState_stakeAndDeposit = (): SubmitButtonState => {
    if (isSubmitting_stakeAndDeposit)
      return { isLoading: true, isDisabled: true };

    return {
      title: "Stake and deposit in Suilend",
      isDisabled:
        submitButtonState_stakeOrUnstake.isDisabled ||
        isSubmitting_stakeOrUnstake,
    };
  };
  const submitButtonState_stakeAndDeposit =
    getSubmitButtonState_stakeAndDeposit();

  const hasStakeAndDepositButton = useMemo(
    () => address && isStaking && lstData.suilendReserveStats !== undefined,
    [address, isStaking, lstData.suilendReserveStats],
  );

  // Submit - send transaction
  const submit = async (isDepositing: boolean) => {
    if (isDepositing) {
      if (submitButtonState_stakeAndDeposit.isDisabled) return;
    } else {
      if (submitButtonState_stakeOrUnstake.isDisabled) return;
    }

    const setIsSubmitting = isDepositing
      ? setIsSubmitting_stakeAndDeposit
      : setIsSubmitting_stakeOrUnstake;
    setIsSubmitting(true);

    setTransactionConfirmationDialogConfig(
      getTransactionConfirmationDialogConfig(isDepositing),
    );
    setTimeout(() => setIsTransactionConfirmationDialogOpen(true));

    const submitAmount = new BigNumber(inValue)
      .times(10 ** inToken.decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();

    const transaction = new Transaction();
    try {
      if (isDepositing) {
        const obligationOwnerCaps = await SuilendClient.getObligationOwnerCaps(
          address!,
          appData.suilendClient.lendingMarket.$typeArgs,
          suiClient,
        );

        const lst = lstClient.mintAndRebalance(transaction, submitAmount);
        await appData.suilendClient.depositCoin(
          address!,
          lst,
          lstData.token.coinType,
          transaction,
          obligationOwnerCaps[0]?.id,
        );
      } else {
        if (isStaking)
          lstClient.mintAndRebalanceAndSendToUser(
            transaction,
            address!,
            submitAmount,
          );
        else
          await lstClient.redeemAndSendToUser(
            transaction,
            address!,
            submitAmount,
          );
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
      throw err;
    }

    try {
      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeIn = getBalanceChange(res, address!, inToken, -1);
      const balanceChangeOut = getBalanceChange(res, address!, outToken);

      showSuccessTxnToast(
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
        txUrl,
        {
          description: [
            isDepositing ? "Deposited" : "Received",
            formatToken(
              !isDepositing && balanceChangeOut !== undefined
                ? balanceChangeOut
                : new BigNumber(outValue),
              { dp: outToken.decimals },
            ),
            outToken.symbol,
            isDepositing ? "in Suilend" : false,
          ]
            .filter(Boolean)
            .join(" "),
        },
      );
      formatAndSetInValue("");

      track(isStaking ? "stake" : "unstake", {
        amountIn: inValue,
        amountInUsd: inValueUsd.toFixed(2, BigNumber.ROUND_DOWN),
        amountOut: outValue,
        amountOutUsd: outValueUsd.toFixed(2, BigNumber.ROUND_DOWN),
      });
    } catch (err) {
      showErrorToast(
        `Failed to ${isStaking ? "stake" : "unstake"}`,
        err as Error,
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsTransactionConfirmationDialogOpen(false);

      inInputRef.current?.focus();
      await refresh();
    }
  };

  // Parameters
  type Parameter = {
    labelStartDecorator?: ReactNode;
    label: string;
    labelEndDecorator?: ReactNode;
    valueStartDecorator?: ReactNode;
    value: string;
    valueEndDecorator?: ReactNode;
  };

  const parameters: Parameter[] = [
    {
      label: "APR",
      value:
        lstData.aprPercent === undefined
          ? "--"
          : formatPercent(lstData.aprPercent),
    },
  ];
  if (lstData.mintFeePercent.gt(0))
    parameters.push({
      label: "Staking fee",
      value: formatPercent(lstData.mintFeePercent),
    });
  if (lstData.redeemFeePercent.gt(0))
    parameters.push({
      label: "Unstaking fee",
      value: formatPercent(lstData.redeemFeePercent),
    });
  if (lstData.spreadFeePercent.gt(0))
    parameters.push({
      label: "Spread fee",
      value: formatPercent(lstData.spreadFeePercent),
    });

  if (isStaking) {
    if (
      lstData.suilendReserveStats !== undefined &&
      lstData.suilendReserveStats.sendPointsPerDay.gt(0)
    )
      parameters.push({
        label: "SEND Points",
        labelEndDecorator: (
          <Tooltip
            title={`SEND Points are earned by depositing ${lstData.token.symbol} in Suilend`}
          >
            <Info className="h-4 w-4 text-navy-600" />
          </Tooltip>
        ),
        valueStartDecorator: (
          <TokenLogo token={appData.sendPointsToken} size={16} />
        ),
        value:
          outValue === ""
            ? `${formatPoints(new BigNumber(1).times(lstData.suilendReserveStats.sendPointsPerDay), { dp: 3 })} / ${lstData.token.symbol} / day`
            : `${formatPoints(new BigNumber(outValue || 0).times(lstData.suilendReserveStats.sendPointsPerDay), { dp: 3 })} / day`,
      });
  }

  return (
    <>
      {/* Fixed */}
      <TransactionConfirmationDialog
        isOpen={isTransactionConfirmationDialogOpen}
        config={transactionConfirmationDialogConfig}
      />

      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="flex w-full flex-col gap-4">
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
                <StakeInput
                  ref={inInputRef}
                  token={inToken}
                  isLst={!isStaking}
                  onLstChange={() => inInputRef.current?.focus()}
                  title={inTitle}
                  value={inValue}
                  onChange={formatAndSetInValue}
                  usdValue={inValueUsd}
                  onBalanceClick={onInBalanceClick}
                />

                <StakeInput
                  token={outToken}
                  isLst={isStaking}
                  title="Receive"
                  value={outValue}
                  usdValue={outValueUsd}
                />

                <div className="flex w-full flex-col gap-px">
                  <SubmitButton
                    style={
                      hasStakeAndDepositButton
                        ? {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                          }
                        : undefined
                    }
                    state={submitButtonState_stakeOrUnstake}
                    submit={() => submit(false)}
                  />
                  {hasStakeAndDepositButton && (
                    <SubmitButton
                      className="min-h-9 bg-navy-600 py-2"
                      style={{
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                      }}
                      labelClassName="text-p2"
                      loadingClassName="h-5 w-5"
                      state={submitButtonState_stakeAndDeposit}
                      submit={() => submit(true)}
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Parameters */}
            <div className="flex w-full flex-col gap-4 px-2 md:px-4">
              {parameters.map((param) => (
                <div
                  key={param.label}
                  className="flex w-full flex-row items-center justify-between"
                >
                  <div className="flex flex-row items-center gap-1.5">
                    {param.labelStartDecorator}
                    <p className="text-p2 text-navy-600">{param.label}</p>
                    {param.labelEndDecorator}
                  </div>
                  <div className="flex flex-row items-center gap-1.5">
                    {param.valueStartDecorator}
                    <p className="text-p2">{param.value}</p>
                    {param.valueEndDecorator}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats and FAQ, WIDTH < md */}
          <div className="flex w-full flex-col gap-6 md:hidden">
            <div className="flex w-full flex-col gap-4 rounded-lg border border-white/75 bg-white/20 p-4 backdrop-blur-[10px]">
              <StatsContent />
            </div>

            <div className="flex w-full flex-col gap-4 rounded-lg border border-white/75 bg-white/20 p-4 backdrop-blur-[10px]">
              <FaqContent />
            </div>
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>

      {/* Fixed, WIDTH >= md */}
      <div
        className="fixed z-[2] max-md:hidden"
        style={{ left: 8 + 32, bottom: FOOTER_MD_HEIGHT + 32 }}
      >
        <StatsPopover />
      </div>

      {/* Fixed, WIDTH >= md */}
      <div
        className="fixed z-[2] max-md:hidden"
        style={{ right: 8 + 32, bottom: FOOTER_MD_HEIGHT + 32 }}
      >
        <FaqPopover />
      </div>
    </>
  );
}
