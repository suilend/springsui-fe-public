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
import { cloneDeep } from "lodash";
import { ArrowUpDown, Wallet } from "lucide-react";

import {
  SUI_GAS_MIN,
  Token,
  formatInteger,
  formatPercent,
  formatPoints,
  formatToken,
  getBalanceChange,
} from "@suilend/frontend-sui";
import track from "@suilend/frontend-sui/lib/track";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  ParsedObligation,
  createObligationIfNoneExists,
  initializeSuilend,
  sendObligationToUser,
} from "@suilend/sdk";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import {
  LstId,
  convertLsts,
  convertLstsAndSendToUser,
} from "@suilend/springsui-sdk";

import Card from "@/components/Card";
import FaqPopover, { FaqContent } from "@/components/FaqPopover";
import { FOOTER_MD_HEIGHT, FooterSm } from "@/components/Footer";
import StakeInput from "@/components/StakeInput";
import StatsPopover, { StatsContent } from "@/components/StatsPopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TransactionConfirmationDialog, {
  TransactionConfirmationDialogConfig,
} from "@/components/TransactionConfirmationDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import {
  DEFAULT_TOKEN_IN_SYMBOL,
  DEFAULT_TOKEN_OUT_SYMBOL,
  Mode,
  QueryParams,
  useLoadedLstContext,
} from "@/contexts/LstContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const getUrl = (tokenInSymbol: string, tokenOutSymbol: string) =>
  `${tokenInSymbol}-${tokenOutSymbol}`;

enum TokenDirection {
  IN = "in",
  OUT = "out",
}

export default function Home() {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.LST]: router.query[QueryParams.LST] as LstId | undefined,
      [QueryParams.AMOUNT]: router.query[QueryParams.AMOUNT] as
        | string
        | undefined,
    }),
    [router.query],
  );

  const { explorer, suiClient } = useSettingsContext();
  const {
    setIsConnectWalletDropdownOpen,
    address,
    signExecuteAndWaitForTransaction,
  } = useWalletContext();
  const { appData, getBalance, refresh } = useLoadedAppContext();
  const { isSlugValid, tokenInSymbol, tokenOutSymbol, mode, lstIds } =
    useLoadedLstContext();

  const suiBalance = getBalance(appData.suiToken.coinType);

  // Ref
  const inInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inInputRef.current?.focus();
  }, []);

  // Slug
  useEffect(() => {
    const restQuery = cloneDeep(router.query);
    delete restQuery.slug;
    delete restQuery[QueryParams.LST];

    if (!isSlugValid())
      router.replace(
        {
          pathname: getUrl(
            DEFAULT_TOKEN_IN_SYMBOL,
            queryParams[QueryParams.LST] ?? DEFAULT_TOKEN_OUT_SYMBOL,
          ),
          query: restQuery,
        },
        undefined,
        { shallow: true },
      );
  }, [router, isSlugValid, queryParams]);

  const reverseTokens = useCallback(() => {
    router.push(
      { pathname: getUrl(tokenOutSymbol, tokenInSymbol) },
      undefined,
      { shallow: true },
    );
  }, [router, tokenOutSymbol, tokenInSymbol]);

  const onTokenChange = useCallback(
    (token: Token, direction: TokenDirection) => {
      if (
        token.symbol ===
        (direction === TokenDirection.IN ? tokenOutSymbol : tokenInSymbol)
      )
        reverseTokens();
      else {
        router.push(
          {
            pathname: getUrl(
              direction === TokenDirection.IN ? token.symbol : tokenInSymbol,
              direction === TokenDirection.IN ? tokenOutSymbol : token.symbol,
            ),
          },
          undefined,
          { shallow: true },
        );
      }

      inInputRef.current?.focus();
    },
    [tokenOutSymbol, tokenInSymbol, reverseTokens, router],
  );

  // Mode
  const isStaking = useMemo(() => mode === Mode.STAKING, [mode]);
  const isUnstaking = useMemo(() => mode === Mode.UNSTAKING, [mode]);
  const isConverting = useMemo(() => mode === Mode.CONVERTING, [mode]);

  // In
  const inLstData = useMemo(
    () => (isStaking ? undefined : appData.lstDataMap[tokenInSymbol as LstId]),
    [isStaking, appData.lstDataMap, tokenInSymbol],
  );
  const inLstClient = useMemo(
    () =>
      isStaking ? undefined : appData.lstClientMap[tokenInSymbol as LstId],
    [isStaking, appData.lstClientMap, tokenInSymbol],
  );

  const inToken = isStaking ? appData.suiToken : inLstData!.token;
  const inPrice = isStaking ? appData.suiPrice : inLstData!.price;
  const inBalance = getBalance(inToken.coinType);

  const [inValue, setInValue] = useState<string>(
    queryParams[QueryParams.AMOUNT] ?? "",
  );
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
  const outLstData = useMemo(
    () =>
      isUnstaking ? undefined : appData.lstDataMap[tokenOutSymbol as LstId],
    [isUnstaking, appData.lstDataMap, tokenOutSymbol],
  );
  const outLstClient = useMemo(
    () =>
      isUnstaking ? undefined : appData.lstClientMap[tokenOutSymbol as LstId],
    [isUnstaking, appData.lstClientMap, tokenOutSymbol],
  );

  const outToken = isUnstaking ? appData.suiToken : outLstData!.token;
  const outPrice = isUnstaking ? appData.suiPrice : outLstData!.price;
  const outBalance = getBalance(outToken.coinType);

  const outValue = useMemo(() => {
    if (inValue === "") return "";

    const getFee = (amount: BigNumber) => {
      if (isStaking) {
        const suiAmount = amount;
        return suiAmount
          .times(outLstData!.mintFeePercent.div(100))
          .decimalPlaces(inToken.decimals, BigNumber.ROUND_UP);
      }
      if (isUnstaking) {
        const lstAmount = amount;
        return lstAmount
          .times(inLstData!.redeemFeePercent.div(100))
          .decimalPlaces(inToken.decimals, BigNumber.ROUND_UP);
      }
      if (isConverting) {
        const inLstAmount = amount;
        const unstakingFee = inLstAmount
          .times(inLstData!.redeemFeePercent.div(100))
          .decimalPlaces(inToken.decimals, BigNumber.ROUND_UP);

        const suiAmount = inLstAmount.minus(unstakingFee);
        const stakingFee = suiAmount
          .times(outLstData!.mintFeePercent.div(100))
          .decimalPlaces(inToken.decimals, BigNumber.ROUND_UP);

        return unstakingFee.plus(stakingFee);
      }
      return new BigNumber(0); // Not possible
    };

    const inToOutExchangeRate = (() => {
      if (isStaking) return outLstData!.suiToLstExchangeRate;
      if (isUnstaking) return inLstData!.lstToSuiExchangeRate;
      if (isConverting)
        return inLstData!.lstToSuiExchangeRate.times(
          outLstData!.suiToLstExchangeRate,
        );
      return new BigNumber(1); // Not possible
    })();

    const _inValue = BigNumber.max(0, inValue);
    const result = _inValue.minus(getFee(_inValue)).times(inToOutExchangeRate);

    return formatToken(result, {
      dp: outToken.decimals,
      useGrouping: false,
      roundLtMinToZero: true,
    });
  }, [
    inValue,
    isStaking,
    outLstData,
    inToken.decimals,
    isUnstaking,
    inLstData,
    isConverting,
    outToken.decimals,
  ]);
  const outValueUsd = new BigNumber(outValue || 0).times(outPrice);

  // Submit
  // Submit - obligations
  const [obligationOwnerCaps, setObligationOwnerCaps] = useState<
    ObligationOwnerCap<string>[] | undefined
  >(undefined);
  const [obligations, setObligations] = useState<
    ParsedObligation[] | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      const result = await initializeSuilend(
        suiClient,
        appData.suilendClient,
        address!,
      );

      setObligationOwnerCaps(result.obligationOwnerCaps);
      setObligations(result.obligations);
    })();
  }, [suiClient, appData.suilendClient, address]);

  // Submit - transaction confirmation dialog
  const [
    isTransactionConfirmationDialogOpen,
    setIsTransactionConfirmationDialogOpen,
  ] = useState<boolean>(false);

  const getTransactionConfirmationDialogConfig = (
    isDepositing: boolean,
  ): TransactionConfirmationDialogConfig => ({
    isDepositing,
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
  const [isSubmitting_main, setIsSubmitting_main] = useState<boolean>(false);
  const [isSubmitting_stakeAndDeposit, setIsSubmitting_stakeAndDeposit] =
    useState<boolean>(false);

  const getSubmitButtonState_main = (): SubmitButtonState => {
    if (!address)
      return {
        icon: <Wallet />,
        title: "Connect wallet",
        onClick: () => setIsConnectWalletDropdownOpen(true),
      };
    if (isSubmitting_main) return { isLoading: true, isDisabled: true };

    if (new BigNumber(inValue || 0).lte(0))
      return { title: "Enter an amount", isDisabled: true };
    if (new BigNumber(inValue).gt(inBalance))
      return { title: `Insufficient ${inToken.symbol}`, isDisabled: true };
    if (
      (isStaking && new BigNumber(inValue).gt(inBalance.minus(SUI_GAS_MIN))) ||
      suiBalance.lt(SUI_GAS_MIN)
    )
      return {
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        isDisabled: true,
      };
    if (new BigNumber(outValue).lte(0))
      return { title: "Amount too low", isDisabled: true };

    return {
      title: `${isStaking ? "Stake" : isUnstaking ? "Unstake" : "Convert"} ${formatToken(new BigNumber(inValue), { dp: inToken.decimals })} ${inToken.symbol}`,
      isDisabled: isSubmitting_stakeAndDeposit,
    };
  };
  const submitButtonState_main = getSubmitButtonState_main();

  const getSubmitButtonState_stakeAndDeposit = (): SubmitButtonState => {
    if (isSubmitting_stakeAndDeposit)
      return { isLoading: true, isDisabled: true };

    return {
      title: `${isStaking ? "Stake" : "Convert"} and deposit in Suilend`,
      isDisabled:
        !address || submitButtonState_main.isDisabled || isSubmitting_main,
    };
  };
  const submitButtonState_stakeAndDeposit =
    getSubmitButtonState_stakeAndDeposit();

  const hasStakeAndDepositButton = useMemo(
    () =>
      (isStaking || isConverting) &&
      outLstData!.suilendReserveStats !== undefined,
    [isStaking, isConverting, outLstData],
  );

  // Submit - send transaction
  const submit = async (isDepositing: boolean) => {
    if (isDepositing) {
      if (submitButtonState_stakeAndDeposit.isDisabled) return;
    } else {
      if (submitButtonState_main.isDisabled) return;
    }

    const setIsSubmitting = isDepositing
      ? setIsSubmitting_stakeAndDeposit
      : setIsSubmitting_main;
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
        if (!(isStaking || isConverting)) throw new Error("Unsupported mode");

        const obligation = obligations?.[0]; // Obligation with the highest TVL
        const obligationOwnerCap = obligationOwnerCaps?.find(
          (o) => o.obligationId === obligation?.id,
        );

        const { obligationOwnerCapId, didCreate } =
          createObligationIfNoneExists(
            appData.suilendClient,
            transaction,
            obligationOwnerCap,
          );

        const lstCoin = isStaking
          ? outLstClient!.mintAmountAndRebalance(
              transaction,
              address!,
              submitAmount,
            )
          : convertLsts(
              inLstClient!,
              outLstClient!,
              transaction,
              address!,
              submitAmount,
            );
        appData.suilendClient.deposit(
          lstCoin,
          outLstData!.token.coinType,
          obligationOwnerCapId,
          transaction,
        );

        if (didCreate)
          sendObligationToUser(obligationOwnerCapId, address!, transaction);
      } else {
        if (isStaking) {
          outLstClient!.mintAmountAndRebalanceAndSendToUser(
            transaction,
            address!,
            submitAmount,
          );
        } else if (isUnstaking) {
          inLstClient!.redeemAmountAndSendToUser(
            transaction,
            address!,
            submitAmount,
          );
        } else if (isConverting) {
          convertLstsAndSendToUser(
            inLstClient!,
            outLstClient!,
            transaction,
            address!,
            submitAmount,
          );
        }
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
          isStaking ? "Staked" : isUnstaking ? "Unstaked" : "Converted",
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

      track(isStaking ? "stake" : isUnstaking ? "unstake" : "convert", {
        amountIn: inValue,
        amountInUsd: inValueUsd.toFixed(2, BigNumber.ROUND_DOWN),
        amountOut: outValue,
        amountOutUsd: outValueUsd.toFixed(2, BigNumber.ROUND_DOWN),
      });
    } catch (err) {
      showErrorToast(
        `Failed to ${isStaking ? "stake" : isUnstaking ? "unstake" : "convert"}`,
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
    values: {
      startDecorator?: ReactNode;
      value: string;
      endDecorator?: ReactNode;
      subValue?: string;
    }[];
  };

  const parameters = useMemo(() => {
    const lstDatas = lstIds.map((lstId) => appData.lstDataMap[lstId]);

    const result: Parameter[] = [
      {
        label: "1 SUI ≈",
        values: lstDatas.reduce(
          (acc, lstData) => [
            ...acc,
            {
              value: [
                formatToken(lstData.suiToLstExchangeRate, { dp: 3 }),
                lstDatas.length === 1 ? lstData.token.symbol : null,
              ]
                .filter(Boolean)
                .join(" "),
            },
          ],
          [] as Parameter["values"],
        ),
      },
      {
        label: "APR",
        values: lstDatas.reduce(
          (acc, lstData) => [
            ...acc,
            {
              value:
                lstData.aprPercent === undefined
                  ? "--"
                  : formatPercent(lstData.aprPercent),
            },
          ],
          [] as Parameter["values"],
        ),
      },
      {
        label: "Staking fee",
        values: lstDatas.reduce(
          (acc, lstData) => [
            ...acc,
            {
              value: formatPercent(lstData.mintFeePercent),
            },
          ],
          [] as Parameter["values"],
        ),
      },
      {
        label: "Unstaking fee",
        values: lstDatas.reduce(
          (acc, lstData) => [
            ...acc,
            {
              value: formatPercent(lstData.redeemFeePercent),
            },
          ],
          [] as Parameter["values"],
        ),
      },
    ];

    return result;
  }, [lstIds, appData.lstDataMap]);

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
              {/* Form */}
              <div className="relative flex w-full flex-col items-center gap-2 p-2 md:gap-4 md:p-4">
                <div className="relative z-[1] w-full">
                  <StakeInput
                    ref={inInputRef}
                    title="In"
                    token={inToken}
                    onTokenChange={(_token) =>
                      onTokenChange(_token, TokenDirection.IN)
                    }
                    value={inValue}
                    onChange={formatAndSetInValue}
                    usdValue={inValueUsd}
                    onBalanceClick={onInBalanceClick}
                  />
                </div>

                <button
                  className="group relative z-[2] -my-5 rounded-[50%] bg-navy-100 p-2 md:-my-7"
                  onClick={reverseTokens}
                >
                  <ArrowUpDown className="h-4 w-4 text-navy-600 transition-colors group-hover:text-foreground" />
                </button>

                <div className="relative z-[1] w-full">
                  <StakeInput
                    title="Out"
                    token={outToken}
                    onTokenChange={(_token) =>
                      onTokenChange(_token, TokenDirection.OUT)
                    }
                    value={outValue}
                    usdValue={outValueUsd}
                  />
                </div>

                <div className="flex w-full flex-col items-center gap-2">
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
                      state={submitButtonState_main}
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

                  {(isStaking || isConverting) &&
                    outLstData &&
                    outLstData.suilendReserveStats !== undefined &&
                    outLstData.suilendReserveStats.sendPointsPerDay.gt(0) && (
                      <div className="flex flex-row items-center gap-1.5">
                        <p className="text-p2 text-navy-600">
                          Deposit to earn{" "}
                          {outValue === ""
                            ? `${formatPoints(new BigNumber(1).times(outLstData.suilendReserveStats!.sendPointsPerDay), { dp: 3 })} SEND Points / ${outLstData.token.symbol} / day`
                            : `${formatPoints(new BigNumber(outValue || 0).times(outLstData.suilendReserveStats!.sendPointsPerDay), { dp: 3 })} SEND Points / day`}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </Card>

            {/* Parameters */}
            <div className="flex w-full flex-col gap-4 px-2 md:px-4">
              {lstIds.length > 1 && (
                <div className="flex w-full flex-row items-center justify-end gap-4">
                  {lstIds.map((lstId) => (
                    <div key={lstId} className="flex w-16 flex-col items-end">
                      <p className="text-p2 text-navy-600">
                        {appData.lstDataMap[lstId].token.symbol}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {parameters.map((param, index) => (
                <div
                  key={index}
                  className="flex w-full flex-row justify-between"
                >
                  <div className="flex flex-row items-center gap-1.5">
                    {param.labelStartDecorator}
                    <p className="text-p2 text-navy-600">{param.label}</p>
                    {param.labelEndDecorator}
                  </div>

                  <div className="flex flex-row items-center gap-4">
                    {param.values.map((value, index2) => (
                      <div
                        key={index2}
                        className={cn(
                          "flex flex-col items-end",
                          lstIds.length > 1 && "w-16",
                        )}
                      >
                        <div className="flex flex-row items-center gap-1.5">
                          {value.startDecorator}
                          <p className="text-p2">{value.value}</p>
                          {value.endDecorator}
                        </div>
                        {value.subValue && (
                          <p className="text-p2 text-navy-500">
                            {value.subValue}
                          </p>
                        )}
                      </div>
                    ))}
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
