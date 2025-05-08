import { useCallback, useMemo, useRef, useState } from "react";

import { ChevronDown, Search, Wallet, X } from "lucide-react";

import {
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  NORMALIZED_WAL_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  SUI_COINTYPE,
  Token,
  formatToken,
  formatUsd,
  isSui,
} from "@suilend/frontend-sui";
import useIsTouchscreen from "@suilend/frontend-sui-next/hooks/useIsTouchscreen";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import Dialog from "@/components/Dialog";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface TokenRowProps {
  token: Token;
  isSelected: boolean;
  onClick: () => void;
}

function TokenRow({ token, isSelected, onClick }: TokenRowProps) {
  const { appData, getBalance } = useLoadedAppContext();

  const lstData = isSui(token.coinType)
    ? undefined
    : appData.lstDataMap[token.coinType];

  return (
    <div
      className={cn(
        "group relative z-[1] flex w-full cursor-pointer flex-row items-center gap-3 rounded-md px-3 py-2 transition-colors",
        isSelected ? "border-light-blue bg-light-blue" : "bg-navy-100/50",
      )}
      onClick={onClick}
    >
      <TokenLogo className="shrink-0" token={token} size={24} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Top left */}
        <div className="flex w-full min-w-0 flex-row items-center gap-2">
          <p className="overflow-hidden text-ellipsis text-nowrap !text-p2 text-foreground">
            {token.symbol}
          </p>

          <div className="w-max shrink-0">
            <CopyToClipboardButton
              value={isSui(token.coinType) ? SUI_COINTYPE : token.coinType}
            />
          </div>
        </div>

        {/* Bottom left */}
        {token.name && (
          <p className="overflow-hidden text-ellipsis text-nowrap !text-p2 text-navy-600">
            {token.name}
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-col items-end gap-0.5">
        {/* Top right */}
        <div className="flex shrink-0 flex-row items-center gap-2">
          <Wallet className="h-4 w-4 text-navy-600" />
          <p className="text-p2 text-foreground">
            {formatToken(getBalance(token.coinType), { exact: false })}
          </p>
        </div>

        {/* Bottom right */}
        {!isSui(token.coinType) && (
          <div className="flex shrink-0 flex-row items-center gap-2">
            <p className="text-p2 text-navy-600">TVL</p>
            <p className="text-p2 text-foreground">
              {formatToken(lstData!.totalSuiSupply, { exact: false })}{" "}
              {appData.suiToken.symbol}
            </p>
            <p className="text-p2 text-navy-500">
              {formatUsd(lstData!.totalLstSupply.times(appData.suiPrice), {
                exact: false,
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TokenSelectionDialogProps {
  token: Token;
  onSelectToken: (token: Token) => void;
}

export default function TokenSelectionDialog({
  token,
  onSelectToken,
}: TokenSelectionDialogProps) {
  const { appData, getBalance } = useLoadedAppContext();

  const isTouchscreen = useIsTouchscreen();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Tokens - categories
  const tokens = useMemo(
    () => [
      appData.suiToken,
      ...Object.entries(appData.lstDataMap)
        .filter(
          ([coinType]) =>
            coinType !==
              "0xe68fad47384e18cd79040cb8d72b7f64d267eebb73a0b8d54711aa860570f404::upsui::UPSUI" ||
            (coinType ===
              "0xe68fad47384e18cd79040cb8d72b7f64d267eebb73a0b8d54711aa860570f404::upsui::UPSUI" &&
              Date.now() >= 1734609600000),
        ) // 2024-12-19 12:00:00 UTC
        .sort(
          ([, lstDataA], [, lstDataB]) =>
            +lstDataB.totalSuiSupply - +lstDataA.totalSuiSupply,
        )
        .map(([, lstData]) => lstData.token),
    ],
    [appData.suiToken, appData.lstDataMap],
  );

  const balanceTokens = useMemo(() => {
    const sortedTokens = tokens
      .filter((t) => getBalance(t.coinType).gt(0))
      .sort((a, b) => +getBalance(b.coinType) - +getBalance(a.coinType));

    return sortedTokens;
  }, [tokens, getBalance]);

  const suilendTokens = useMemo(
    () => tokens.filter((t) => !!appData.reserveMap[t.coinType]),
    [tokens, appData.reserveMap],
  );

  const otherTokens = useMemo(
    () =>
      tokens.filter(
        (t) => !balanceTokens.find((_t) => _t.coinType === t.coinType),
      ),
    [tokens, balanceTokens],
  );

  // Tokens - top
  const topTokens = useMemo(
    () =>
      [
        NORMALIZED_sSUI_COINTYPE,
        NORMALIZED_SUI_COINTYPE,
        NORMALIZED_USDC_COINTYPE,
        NORMALIZED_WAL_COINTYPE,
        NORMALIZED_SEND_COINTYPE,
      ]

        .map((coinType) => tokens.find((t) => t.coinType === coinType))
        .filter(Boolean) as Token[],
    [tokens],
  );

  // Filter
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchString, setSearchString] = useState<string>("");

  const filterTokens = useCallback(
    (_tokens: Token[]) =>
      _tokens.filter((t) =>
        `${t.coinType}${t.symbol}${t.name}`
          .toLowerCase()
          .includes(searchString.toLowerCase()),
      ),
    [searchString],
  );

  const filteredBalanceTokens = useMemo(
    () => filterTokens(balanceTokens),
    [filterTokens, balanceTokens],
  );
  const filteredSuilendTokens = useMemo(
    () => filterTokens(suilendTokens),
    [filterTokens, suilendTokens],
  );
  const filteredOtherTokens = useMemo(
    () => filterTokens(otherTokens),
    [filterTokens, otherTokens],
  );

  const filteredTokens = useMemo(
    () => [
      ...filteredBalanceTokens,
      ...filteredSuilendTokens,
      ...filteredOtherTokens,
    ],
    [filteredBalanceTokens, filteredSuilendTokens, filteredOtherTokens],
  );

  const filteredTokensMap = useMemo(
    () => ({
      balance: {
        title: "Wallet balances",
        tokens: filteredBalanceTokens,
      },
      suilend: {
        title: "Assets listed on Suilend",
        tokens: filteredSuilendTokens,
      },
      other: {
        title: "Other known assets",
        tokens: filteredOtherTokens,
      },
    }),
    [filteredBalanceTokens, filteredSuilendTokens, filteredOtherTokens],
  );

  // Select token
  const onTokenClick = (t: Token) => {
    onSelectToken(t);
    setTimeout(() => setIsOpen(false), 50);
    setTimeout(() => setSearchString(""), 250);
  };

  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        <button className="flex flex-row items-center gap-2 py-1.5">
          <TokenLogo token={token} size={28} />
          <p className="text-h3">{token.symbol}</p>
          <ChevronDown className="-ml-0.5 h-4 w-4 text-navy-600" />
        </button>
      }
      headerProps={{
        title: "Select token",
      }}
      dialogContentOuterClassName="max-w-lg h-[800px]"
    >
      {/* Search */}
      <div className="relative z-[1] h-10 w-full shrink-0 rounded-md border border-navy-400 bg-background transition-colors focus-within:border-blue">
        <Search className="pointer-events-none absolute left-4 top-3 z-[2] -mt-px h-4 w-4 text-navy-500" />
        {searchString !== "" && (
          <button
            className="group absolute right-2 top-1 z-[2] -mt-px flex h-8 w-8 flex-row items-center justify-center"
            onClick={() => {
              setSearchString("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4 text-navy-600 transition-colors group-hover:text-foreground" />
          </button>
        )}
        <input
          ref={inputRef}
          autoFocus={!isTouchscreen}
          className={cn(
            "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] pl-10 text-p1 text-foreground !outline-0 placeholder:text-navy-500",
            searchString !== "" ? "pr-10" : "pr-4",
          )}
          type="text"
          placeholder="Search by token symbol, name or address"
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
        />
      </div>

      {/* Top tokens */}
      {topTokens.length > 0 && (
        <div className="flex shrink-0 flex-row flex-wrap gap-2">
          {topTokens.map((t) => {
            const isSelected = t.coinType === token?.coinType;

            return (
              <button
                key={t.coinType}
                className={cn(
                  "group flex h-10 flex-row items-center gap-2 rounded-[20px] pl-2 pr-3 transition-colors",
                  isSelected
                    ? "border-light-blue bg-light-blue"
                    : "bg-navy-100/50",
                )}
                onClick={() => onTokenClick(t)}
              >
                {/* TODO: Truncate symbol if the list of top tokens includes non-reserves */}
                <TokenLogo token={t} size={24} />
                <p className="text-p2 text-foreground">{t.symbol}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tokens */}
      <div className="relative -mx-4 -mb-4 flex flex-col gap-6 overflow-y-auto px-4 pb-4">
        {filteredTokens.length > 0 ? (
          Object.values(filteredTokensMap)
            .filter((list) => list.tokens.length > 0)
            .map((list, index) => (
              <div className="flex flex-col gap-3" key={index}>
                <div className="flex w-full flex-row items-center gap-2">
                  <p className="text-p1 text-foreground">{list.title}</p>
                  <p className="text-p2 text-navy-500">{list.tokens.length}</p>
                </div>

                <div className="flex w-full flex-col gap-1">
                  {list.tokens.map((t) => (
                    <TokenRow
                      key={t.coinType}
                      token={t}
                      isSelected={t.coinType === token?.coinType}
                      onClick={() => onTokenClick(t)}
                    />
                  ))}
                </div>
              </div>
            ))
        ) : (
          <p className="text-p2 text-navy-500">
            {searchString ? `No matches for "${searchString}"` : "No tokens"}
          </p>
        )}
      </div>
    </Dialog>
  );
}
