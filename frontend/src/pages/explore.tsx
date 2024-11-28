import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

import BigNumber from "bignumber.js";

import {
  LstId,
  NORMALIZED_SUI_COINTYPE,
  Token,
  getToken,
} from "@suilend/frontend-sui";
import { shallowPushQuery } from "@suilend/frontend-sui-next";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";

import Card from "@/components/Card";
import { FooterSm } from "@/components/Footer";
import Skeleton from "@/components/Skeleton";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { NORMALIZED_AAA_COINTYPE } from "@/lib/coinType";
import { formatPercent, formatPoints, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

enum QueryParams {
  CATEGORY = "category",
}

type Category = {
  name: string;
};

enum CategoryId {
  ALL = "all",
  LENDING = "lending",
  AMM = "amm",
  CDP = "cdp",
}

type CetusPool = any;

enum CetusPoolId {
  SSUI_SUI = "ssuiSui",
  AAA_SSUI = "aaaSsui",
}

type Protocol = {
  name: string;
  logoUrl: string;
};

enum ProtocolId {
  SUILEND = "suilend",
  CETUS = "cetus",
  BUCKET = "bucket",
}

export default function Explore() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.CATEGORY]: router.query[QueryParams.CATEGORY] as
      | CategoryId
      | undefined,
  };

  const { appData } = useLoadedAppContext();
  const lstData = appData.lstDataMap[LstId.sSUI];

  // Categories
  const categoryMap: Record<CategoryId, Category> = useMemo(
    () => ({
      [CategoryId.ALL]: {
        name: "All",
      },
      [CategoryId.LENDING]: {
        name: "Lending",
      },
      [CategoryId.AMM]: {
        name: "AMM",
      },
      [CategoryId.CDP]: {
        name: "CDP",
      },
    }),
    [],
  );

  const selectedCategoryId =
    queryParams[QueryParams.CATEGORY] &&
    Object.values(CategoryId).includes(queryParams[QueryParams.CATEGORY])
      ? queryParams[QueryParams.CATEGORY]
      : CategoryId.ALL;
  const onSelectedCategoryIdChange = (id: CategoryId) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.CATEGORY]: id,
    });
  };

  // Pools
  const [cetusPools, setCetusPools] = useState<CetusPool[] | undefined>(
    undefined,
  );

  const getCetusPool = useCallback(
    (address: string) =>
      cetusPools?.find((pool: CetusPool) => pool.swap_account === address),
    [cetusPools],
  );

  useEffect(() => {
    try {
      (async () => {
        const url = "https://api-sui.cetus.zone/v2/sui/swap/count";
        const res = await fetch(url);
        const json = await res.json();

        setCetusPools(json.data.pools);
      })();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const cetusPoolAddressMap: Record<CetusPoolId, string> = useMemo(
    () => ({
      [CetusPoolId.SSUI_SUI]:
        "0x5c5e87f0adf458b77cc48e17a7b81a0e7bc2e9c6c609b67c0851ef059a866f3a",
      [CetusPoolId.AAA_SSUI]:
        "0x474ce7b61b0ae75cad36aa9c59aa5ca8485c00b98fd1890db33b40ef2a5ba604",
    }),
    [],
  );

  const cetusPoolMap: Record<CetusPoolId, CetusPool> = useMemo(
    () => ({
      [CetusPoolId.SSUI_SUI]: getCetusPool(
        cetusPoolAddressMap[CetusPoolId.SSUI_SUI],
      ),
      [CetusPoolId.AAA_SSUI]: getCetusPool(
        cetusPoolAddressMap[CetusPoolId.AAA_SSUI],
      ),
    }),
    [getCetusPool, cetusPoolAddressMap],
  );

  // Protocols
  const protocolMap: Record<ProtocolId, Protocol> = useMemo(
    () => ({
      [ProtocolId.SUILEND]: {
        name: "Suilend",
        logoUrl: "https://suilend.fi/assets/suilend.svg",
      },
      [ProtocolId.CETUS]: {
        name: "Cetus",
        logoUrl:
          "https://assets.coingecko.com/coins/images/30256/standard/cetus.png",
      },
      [ProtocolId.BUCKET]: {
        name: "Bucket",
        logoUrl:
          "https://miro.medium.com/v2/resize:fit:720/format:webp/1*45HP3AttugJDoqTQFh20MA.png",
      },
    }),
    [],
  );

  // Opportunities
  type Opportunity = {
    protocol: Protocol;
    title: string;
    url: string;
    coinTypesTitle?: string;
    coinTypes: string[];
    aprPercent?: BigNumber | null;
    tvlUsd?: BigNumber | null;
    categoryId: CategoryId;
    sendPointsPerDay?: BigNumber;
  };

  const opportunities: Opportunity[] = useMemo(() => {
    const result = [];

    if (lstData.suilendReserveStats !== undefined)
      result.push({
        protocol: protocolMap[ProtocolId.SUILEND],
        title: "Lend on Suilend",
        url: `https://suilend.fi/dashboard?asset=${lstData.token.symbol}`,
        coinTypes: [lstData.token.coinType],
        aprPercent: lstData.suilendReserveStats.aprPercent,
        tvlUsd: lstData.suilendReserveStats.tvlUsd,
        categoryId: CategoryId.LENDING,
        sendPointsPerDay: lstData.suilendReserveStats.sendPointsPerDay,
      });

    result.push(
      {
        protocol: protocolMap[ProtocolId.CETUS],
        title: "Provide liquidity on Cetus",
        url: `https://app.cetus.zone/liquidity/deposit/?poolAddress=${cetusPoolAddressMap[CetusPoolId.SSUI_SUI]}`,
        coinTypes: [lstData.token.coinType, NORMALIZED_SUI_COINTYPE],
        aprPercent: cetusPoolMap[CetusPoolId.SSUI_SUI]
          ? new BigNumber(+cetusPoolMap[CetusPoolId.SSUI_SUI].total_apr * 100)
          : null,
        tvlUsd: cetusPoolMap[CetusPoolId.SSUI_SUI]
          ? new BigNumber(cetusPoolMap[CetusPoolId.SSUI_SUI].tvl_in_usd)
          : null,
        categoryId: CategoryId.AMM,
      },
      {
        protocol: protocolMap[ProtocolId.CETUS],
        title: "Provide liquidity on Cetus",
        url: `https://app.cetus.zone/liquidity/deposit/?poolAddress=${cetusPoolAddressMap[CetusPoolId.AAA_SSUI]}`,
        coinTypes: [NORMALIZED_AAA_COINTYPE, lstData.token.coinType],
        aprPercent: cetusPoolMap[CetusPoolId.AAA_SSUI]
          ? new BigNumber(+cetusPoolMap[CetusPoolId.AAA_SSUI].total_apr * 100)
          : null,
        tvlUsd: cetusPoolMap[CetusPoolId.AAA_SSUI]
          ? new BigNumber(cetusPoolMap[CetusPoolId.AAA_SSUI].tvl_in_usd)
          : null,
        categoryId: CategoryId.AMM,
      },
      {
        protocol: protocolMap[ProtocolId.BUCKET],
        title: "Borrow BUCK and Earn on Bucket",
        url: "https://app.bucketprotocol.io/?tab=borrow&token=spSUI",
        coinTypesTitle: "Collateral",
        coinTypes: [lstData.token.coinType],
        aprPercent: undefined,
        tvlUsd: undefined,
        categoryId: CategoryId.CDP,
      },
    );

    return result;
  }, [
    lstData.suilendReserveStats,
    protocolMap,
    lstData.token.symbol,
    lstData.token.coinType,
    cetusPoolAddressMap,
    cetusPoolMap,
  ]);

  const opportunitiesCoinTypes = useMemo(
    () =>
      opportunities.reduce(
        (acc, opportunity) =>
          Array.from(new Set([...acc, ...opportunity.coinTypes])),
        [] as string[],
      ),
    [opportunities],
  );
  const coinMetadataMap = useCoinMetadataMap(opportunitiesCoinTypes);

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-center text-h1">Explore DeFi</p>
            <p className="text-center text-navy-600">
              <span className="whitespace-nowrap">
                Discover rewards and DeFi
              </span>{" "}
              <span className="whitespace-nowrap">
                opportunities with your {lstData.token.symbol}
              </span>
            </p>
          </div>

          <Card>
            {/* Categories */}
            <div className="flex w-full flex-row flex-nowrap gap-2 overflow-x-auto p-2 md:px-4 md:py-3.5">
              {Object.values(CategoryId)
                .filter(
                  (categoryId) =>
                    categoryId === CategoryId.ALL ||
                    opportunities.filter(
                      (opportunity) => opportunity.categoryId === categoryId,
                    ).length > 0,
                )
                .map((categoryId) => (
                  <button
                    key={categoryId}
                    className={cn(
                      "group flex h-10 flex-row items-center gap-2 rounded-[20px] px-4 transition-colors",
                      selectedCategoryId === categoryId
                        ? "bg-white"
                        : "bg-white/25",
                    )}
                    onClick={() =>
                      onSelectedCategoryIdChange(categoryId as CategoryId)
                    }
                  >
                    <p
                      className={cn(
                        "!text-p2",
                        selectedCategoryId === categoryId
                          ? "text-foreground"
                          : "text-navy-600 transition-colors group-hover:text-foreground",
                      )}
                    >
                      {categoryMap[categoryId].name}
                    </p>
                    <p
                      className={cn(
                        "!text-p3",
                        selectedCategoryId === categoryId
                          ? "text-foreground"
                          : "text-navy-600 transition-colors group-hover:text-foreground",
                      )}
                    >
                      {categoryId === CategoryId.ALL
                        ? opportunities.length
                        : opportunities.filter(
                            (opportunity) =>
                              opportunity.categoryId === categoryId,
                          ).length}
                    </p>
                  </button>
                ))}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/75" />

            {/* Opportunities */}
            <div className="flex w-full flex-col gap-2 p-2 md:gap-4 md:p-4">
              {opportunities
                .filter(
                  (opportunity) =>
                    selectedCategoryId === CategoryId.ALL ||
                    opportunity.categoryId === selectedCategoryId,
                )
                .map((opportunity, index) => {
                  const tokens = opportunity.coinTypes.map((coinType) =>
                    coinMetadataMap?.[coinType]
                      ? getToken(coinType, coinMetadataMap[coinType])
                      : null,
                  );

                  return (
                    <Link
                      key={index}
                      className="block flex w-full flex-col gap-4 rounded-md bg-white p-4"
                      href={opportunity.url}
                      target="_blank"
                    >
                      <div className="flex flex-row items-center gap-2">
                        {opportunity.protocol.logoUrl ? (
                          <Image
                            className="h-6 w-6 shrink-0"
                            src={opportunity.protocol.logoUrl}
                            alt={`${opportunity.protocol.name} logo`}
                            width={24}
                            height={24}
                            quality={100}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-[50%] bg-navy-100" />
                        )}
                        <p className="flex-1 text-h3">{opportunity.title}</p>
                      </div>

                      <div className="grid w-full grid-cols-2 justify-between gap-4 md:flex md:flex-row md:gap-0">
                        {/* Assets */}
                        <div className="flex min-w-28 flex-col gap-1.5">
                          <p className="text-p2 text-navy-500">
                            {opportunity.coinTypesTitle ?? "Assets"}
                          </p>
                          <div className="flex w-full flex-row items-center gap-1.5">
                            <div
                              className={cn(
                                "flex flex-row",
                                tokens.some((token) => token === null) &&
                                  "animate-pulse",
                              )}
                            >
                              {tokens.map((token, index) => (
                                <TokenLogo
                                  key={index}
                                  className={cn(
                                    index !== 0 &&
                                      "outline-px -ml-2 bg-white outline outline-white",
                                  )}
                                  token={
                                    token === null
                                      ? {
                                          ...appData.suiToken,
                                          iconUrl: undefined,
                                        }
                                      : token
                                  }
                                  size={20}
                                />
                              ))}
                            </div>

                            <p className="text-p2">
                              {tokens.some((token) => token === null) ? (
                                <Skeleton
                                  key={index}
                                  className={cn(
                                    "h-5",
                                    tokens.length === 1 ? "w-10" : "w-16",
                                  )}
                                />
                              ) : (
                                tokens
                                  .map((token) => (token as Token).symbol)
                                  .join("-")
                              )}
                            </p>
                          </div>
                        </div>

                        {/* APR */}
                        <div className="flex min-w-20 flex-col gap-1.5">
                          <p className="text-p2 text-navy-500">APR</p>
                          <p className="text-p2">
                            {opportunity.aprPercent === undefined ? (
                              "--"
                            ) : opportunity.aprPercent === null ? (
                              <Skeleton className="h-5 w-10" />
                            ) : (
                              formatPercent(opportunity.aprPercent)
                            )}
                          </p>
                        </div>

                        {/* TVL */}
                        <div className="flex min-w-20 flex-col gap-1.5">
                          <p className="text-p2 text-navy-500">TVL</p>
                          <p className="text-p2">
                            {opportunity.tvlUsd === undefined ? (
                              "--"
                            ) : opportunity.tvlUsd === null ? (
                              <Skeleton className="h-5 w-10" />
                            ) : (
                              formatUsd(opportunity.tvlUsd)
                            )}
                          </p>
                        </div>

                        {/* Category */}
                        <div className="flex min-w-20 flex-col gap-1.5">
                          <p className="text-p2 text-navy-500">Category</p>
                          <p className="text-p2">
                            {categoryMap[opportunity.categoryId].name}
                          </p>
                        </div>

                        {/* SEND Points */}
                        <div className="flex min-w-40 flex-col gap-1.5">
                          <p className="text-p2 text-navy-500">SEND points</p>
                          {opportunity.sendPointsPerDay === undefined ? (
                            <p className="text-p2">--</p>
                          ) : (
                            <div className="flex flex-row gap-1.5">
                              <TokenLogo
                                className="my-0.5"
                                token={appData.sendPointsToken}
                                size={16}
                              />
                              <p className="text-p2">
                                {formatPoints(opportunity.sendPointsPerDay, {
                                  dp: 3,
                                })}
                                {" / "}
                                {lstData.token.symbol}
                                {" / day"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </Card>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
