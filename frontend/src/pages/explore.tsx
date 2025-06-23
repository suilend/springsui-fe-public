import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useEffect, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { BucketClient } from "bucket-protocol-sdk";
import DOMPurify from "dompurify";

import {
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  Token,
  formatPercent,
  formatUsd,
  getToken,
} from "@suilend/sui-fe";
import { shallowPushQuery, useSettingsContext } from "@suilend/sui-fe-next";
import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";

import Card from "@/components/Card";
import FaqPopover, { FaqContent } from "@/components/FaqPopover";
import { FOOTER_MD_HEIGHT, FooterSm } from "@/components/Footer";
import Skeleton from "@/components/Skeleton";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import {
  NORMALIZED_AAA_COINTYPE,
  NORMALIZED_FRATT_COINTYPE,
} from "@/lib/coinType";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
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
  SSUI_FRATT = "ssuiFratt",
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

  const { rpc } = useSettingsContext();
  const { appData } = useLoadedAppContext();
  const lstData = appData.lstDataMap[NORMALIZED_sSUI_COINTYPE];

  // Cetus Pools
  const [cetusPools, setCetusPools] = useState<CetusPool[] | undefined>(
    undefined,
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

  // sBUCK Savings Pool
  const [sBuckSavingsPoolStats, setSBuckSavingsPoolStats] = useState<
    { tvlUsd: BigNumber; aprPercent: BigNumber } | undefined
  >(undefined);

  useEffect(() => {
    try {
      (async () => {
        const bucketSdk = new BucketClient(rpc.url);

        const tvlUsd = await bucketSdk.getSBUCKTvl();
        const aprPercent = await bucketSdk.getSavingApr();

        setSBuckSavingsPoolStats({
          tvlUsd: new BigNumber(tvlUsd),
          aprPercent: new BigNumber(aprPercent),
        });
      })();
    } catch (err) {
      console.error(err);
    }
  }, [rpc.url]);

  // Categories
  const categoryMap: Record<CategoryId, Category> = useMemo(
    () => ({
      [CategoryId.ALL]: { name: "All" },
      [CategoryId.LENDING]: { name: "Lending" },
      [CategoryId.AMM]: { name: "AMM" },
      [CategoryId.CDP]: { name: "CDP" },
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

  // Protocols
  const protocolMap: Record<ProtocolId, Protocol> = useMemo(
    () => ({
      [ProtocolId.SUILEND]: {
        name: "Suilend",
        logoUrl: `${SUILEND_ASSETS_URL}/Suilend.svg`,
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
  type OpportunityGroup = {
    protocol: Protocol;
    title: string;
    opportunities: Opportunity[];
    categoryId: CategoryId;
  };

  type Opportunity = {
    url: string;
    coinTypesTitle?: string;
    coinTypes: string[];
    aprPercent?: BigNumber | null;
    tvlUsd?: BigNumber | null;
  };

  const cetusPoolOpportunityMap: Record<
    CetusPoolId,
    { poolAddress: string; coinTypes: string[] }
  > = useMemo(
    () => ({
      [CetusPoolId.SSUI_SUI]: {
        poolAddress:
          "0x5c5e87f0adf458b77cc48e17a7b81a0e7bc2e9c6c609b67c0851ef059a866f3a",
        coinTypes: [lstData.token.coinType, NORMALIZED_SUI_COINTYPE],
      },
      [CetusPoolId.AAA_SSUI]: {
        poolAddress:
          "0x474ce7b61b0ae75cad36aa9c59aa5ca8485c00b98fd1890db33b40ef2a5ba604",
        coinTypes: [NORMALIZED_AAA_COINTYPE, lstData.token.coinType],
      },
      [CetusPoolId.SSUI_FRATT]: {
        poolAddress:
          "0x67a8d4ccd58ef92a4cfee3f064cbe0a3bb59cee29b3148020cc3c607c542774e",
        coinTypes: [lstData.token.coinType, NORMALIZED_FRATT_COINTYPE],
      },
    }),
    [lstData.token.coinType],
  );

  const opportunityGroups: OpportunityGroup[] = useMemo(() => {
    const result = [];

    if (lstData.suilendReserveStats !== undefined)
      result.push({
        protocol: protocolMap[ProtocolId.SUILEND],
        title: "Lend on Suilend",
        opportunities: [
          {
            url: `https://suilend.fi/dashboard?asset=${lstData.token.symbol}`,
            coinTypes: [lstData.token.coinType],
            aprPercent: lstData.suilendReserveStats.aprPercent.plus(
              lstData.aprPercent,
            ),
            tvlUsd: lstData.suilendReserveStats.tvlUsd,
          },
        ],
        categoryId: CategoryId.LENDING,
      });
    result.push(
      // {
      //   protocol: protocolMap[ProtocolId.CETUS],
      //   title: "Provide liquidity on Cetus",
      //   opportunities: Object.values(cetusPoolOpportunityMap).map(
      //     (opportunity) => {
      //       const cetusPool = cetusPools?.find(
      //         (pool: CetusPool) =>
      //           pool.swap_account === opportunity.poolAddress,
      //       );

      //       return {
      //         url: `https://app.cetus.zone/liquidity/deposit/?poolAddress=${opportunity.poolAddress}`,
      //         coinTypes: opportunity.coinTypes,
      //         aprPercent: cetusPool
      //           ? new BigNumber(+cetusPool.total_apr * 100)
      //           : null,
      //         tvlUsd: cetusPool ? new BigNumber(cetusPool.tvl_in_usd) : null,
      //       };
      //     },
      //   ),
      //   categoryId: CategoryId.AMM,
      // },
      {
        protocol: protocolMap[ProtocolId.BUCKET],
        title: "Borrow BUCK and Earn on Bucket",
        opportunities: [
          {
            url: "https://app.bucketprotocol.io/?tab=borrow&token=spSUI",
            coinTypesTitle: "Collateral",
            coinTypes: [lstData.token.coinType],
            aprPercent:
              sBuckSavingsPoolStats !== undefined
                ? sBuckSavingsPoolStats.aprPercent
                : null,
            tvlUsd:
              sBuckSavingsPoolStats !== undefined
                ? sBuckSavingsPoolStats.tvlUsd
                : null,
          },
        ],
        categoryId: CategoryId.CDP,
      },
    );

    return result;
  }, [
    lstData.suilendReserveStats,
    protocolMap,
    lstData.token.symbol,
    lstData.token.coinType,
    lstData.aprPercent,
    // cetusPoolOpportunityMap,
    // cetusPools,
    sBuckSavingsPoolStats,
  ]);

  const opportunitiesCoinTypes = useMemo(
    () =>
      opportunityGroups.reduce(
        (acc, og) =>
          Array.from(
            new Set([
              ...acc,
              ...og.opportunities.reduce(
                (acc2, opportunity) => [...acc2, ...opportunity.coinTypes],
                [] as string[],
              ),
            ]),
          ),
        [] as string[],
      ),
    [opportunityGroups],
  );
  const coinMetadataMap = useCoinMetadataMap(opportunitiesCoinTypes);

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-3">
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
                    opportunityGroups.filter(
                      (og) => og.categoryId === categoryId,
                    ).length > 0,
                )
                .map((categoryId) => (
                  <button
                    key={categoryId}
                    className={cn(
                      "group flex h-10 flex-row items-center gap-2 rounded-[20px] px-4",
                      categoryId === selectedCategoryId
                        ? "cursor-default bg-white"
                        : "bg-white/25 transition-colors",
                    )}
                    onClick={() =>
                      onSelectedCategoryIdChange(categoryId as CategoryId)
                    }
                  >
                    <p
                      className={cn(
                        "!text-p2",
                        categoryId === selectedCategoryId
                          ? "text-foreground"
                          : "text-navy-600 transition-colors group-hover:text-foreground",
                      )}
                    >
                      {categoryMap[categoryId].name}
                    </p>
                    <p
                      className={cn(
                        "!text-p3",
                        categoryId === selectedCategoryId
                          ? "text-foreground"
                          : "text-navy-600 transition-colors group-hover:text-foreground",
                      )}
                    >
                      {categoryId === CategoryId.ALL
                        ? opportunityGroups.reduce(
                            (acc, og) => (acc += og.opportunities.length),
                            0,
                          )
                        : opportunityGroups
                            .filter((og) => og.categoryId === categoryId)
                            .reduce(
                              (acc, og) => (acc += og.opportunities.length),
                              0,
                            )}
                    </p>
                  </button>
                ))}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/75" />

            {/* Opportunities */}
            <div className="flex w-full flex-col gap-2 p-2 md:gap-4 md:p-4">
              {opportunityGroups
                .filter(
                  (og) =>
                    selectedCategoryId === CategoryId.ALL ||
                    og.categoryId === selectedCategoryId,
                )
                .map((og) => (
                  <Fragment key={og.title}>
                    {og.opportunities.map((opportunity) => {
                      const tokens = opportunity.coinTypes.map((coinType) =>
                        coinMetadataMap?.[coinType]
                          ? getToken(coinType, coinMetadataMap[coinType])
                          : null,
                      );

                      return (
                        <Link
                          key={opportunity.url}
                          className="block flex w-full flex-col gap-4 rounded-md bg-white p-4"
                          href={opportunity.url}
                          target="_blank"
                        >
                          <div className="flex flex-row items-center gap-2">
                            {og.protocol.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="h-6 w-6 shrink-0"
                                src={DOMPurify.sanitize(og.protocol.logoUrl)}
                                alt={`${og.protocol.name} logo`}
                                width={24}
                                height={24}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-[50%] bg-navy-100" />
                            )}
                            <p className="flex-1 text-h3">{og.title}</p>
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
                                {categoryMap[og.categoryId].name}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </Fragment>
                ))}
            </div>
          </Card>

          {/* FAQ, WIDTH < md */}
          <div className="flex w-full flex-col gap-6 md:hidden">
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
        style={{ right: 8 + 32, bottom: FOOTER_MD_HEIGHT + 32 }}
      >
        <FaqPopover />
      </div>
    </>
  );
}
