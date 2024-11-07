import BigNumber from "bignumber.js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Card from "@/components/Card";
import { FooterSm } from "@/components/Footer";
import Skeleton from "@/components/Skeleton";
import TokenLogo from "@/components/TokenLogo";
import { AppData, useAppDataContext } from "@/contexts/AppDataContext";
import {
  NORMALIZED_AAA_COINTYPE,
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SEND_POINTS_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { formatPercent, formatPoints, formatUsd } from "@/lib/format";
import { shallowPushQuery } from "@/lib/router";
import { cn } from "@/lib/utils";

enum QueryParams {
  CATEGORY = "category",
}

export default function Explore() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.CATEGORY]: router.query[QueryParams.CATEGORY] as
      | Category
      | undefined,
  };

  const appDataContext = useAppDataContext();
  const appData = appDataContext.appData as AppData;

  const lstToken = appData.tokenMap[NORMALIZED_LST_COINTYPE];

  // Categories
  enum Category {
    ALL = "all",
    LENDING = "lending",
    AMM = "amm",
  }

  const categories = [
    { id: Category.ALL, title: "All" },
    { id: Category.LENDING, title: "Lending" },
    { id: Category.AMM, title: "AMM" },
  ];

  const selectedCategory =
    queryParams[QueryParams.CATEGORY] &&
    Object.values(Category).includes(queryParams[QueryParams.CATEGORY])
      ? queryParams[QueryParams.CATEGORY]
      : Category.ALL;
  const onSelectedCategoryChange = (category: Category) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.CATEGORY]: category,
    });
  };

  // Opportunities
  const [cetusPools, setCetusPools] = useState<any | undefined>(undefined);

  const getCetusPool = (address: string) =>
    cetusPools?.find((pool: any) => pool.swap_account === address);

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

  enum CetusPool {
    SSUI_SUI = "ssuiSui",
    AAA_SSUI = "aaaSsui",
  }
  const cetusPoolAddresses: Record<CetusPool, string> = {
    [CetusPool.SSUI_SUI]:
      "0x5c5e87f0adf458b77cc48e17a7b81a0e7bc2e9c6c609b67c0851ef059a866f3a",
    [CetusPool.AAA_SSUI]:
      "0x474ce7b61b0ae75cad36aa9c59aa5ca8485c00b98fd1890db33b40ef2a5ba604",
  };
  const cetusPoolMap: Record<CetusPool, any> = {
    [CetusPool.SSUI_SUI]: getCetusPool(cetusPoolAddresses[CetusPool.SSUI_SUI]),
    [CetusPool.AAA_SSUI]: getCetusPool(cetusPoolAddresses[CetusPool.AAA_SSUI]),
  };

  enum Protocol {
    SUILEND = "suilend",
    CETUS = "cetus",
  }
  const protocolMap: Record<Protocol, { name: string; logoUrl: string }> = {
    [Protocol.SUILEND]: {
      name: "Suilend",
      logoUrl: "https://suilend.fi/assets/suilend.svg",
    },
    [Protocol.CETUS]: {
      name: "Cetus",
      logoUrl:
        "https://assets.coingecko.com/coins/images/30256/standard/cetus.png",
    },
  };

  const opportunities = [
    {
      protocol: protocolMap[Protocol.SUILEND],
      title: "Lend on Suilend",
      url: `https://suilend.fi/dashboard?asset=${lstToken.symbol}`,
      assets: [{ coinType: NORMALIZED_LST_COINTYPE }],
      aprPercent: appData.lstReserveAprPercent,
      tvlUsd: appData.lstReserveTvlUsd,
      category: Category.LENDING,
      sendPointsPerDay: appData.lstReserveSendPointsPerDay,
    },
    {
      protocol: protocolMap[Protocol.CETUS],
      title: "Provide liquidity on Cetus",
      url: `https://app.cetus.zone/liquidity/deposit/?poolAddress=${cetusPoolAddresses[CetusPool.SSUI_SUI]}`,
      assets: [
        { coinType: NORMALIZED_LST_COINTYPE },
        { coinType: NORMALIZED_SUI_COINTYPE },
      ],
      aprPercent: cetusPoolMap[CetusPool.SSUI_SUI]
        ? new BigNumber(+cetusPoolMap[CetusPool.SSUI_SUI].total_apr * 100)
        : null,
      tvlUsd: cetusPoolMap[CetusPool.SSUI_SUI]
        ? new BigNumber(cetusPoolMap[CetusPool.SSUI_SUI].tvl_in_usd)
        : null,
      category: Category.AMM,
    },
    {
      protocol: protocolMap[Protocol.CETUS],
      title: "Provide liquidity on Cetus",
      url: `https://app.cetus.zone/liquidity/deposit/?poolAddress=${cetusPoolAddresses[CetusPool.AAA_SSUI]}`,
      assets: [
        { coinType: NORMALIZED_AAA_COINTYPE },
        { coinType: NORMALIZED_LST_COINTYPE },
      ],
      aprPercent: cetusPoolMap[CetusPool.AAA_SSUI]
        ? new BigNumber(+cetusPoolMap[CetusPool.AAA_SSUI].total_apr * 100)
        : null,
      tvlUsd: cetusPoolMap[CetusPool.AAA_SSUI]
        ? new BigNumber(cetusPoolMap[CetusPool.AAA_SSUI].tvl_in_usd)
        : null,
      category: Category.AMM,
    },
  ];

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
                opportunities with your {lstToken.symbol}
              </span>
            </p>
          </div>

          <Card>
            {/* Categories */}
            <div className="flex w-full flex-row flex-nowrap gap-2 overflow-x-auto p-2 md:px-4 md:py-3.5">
              {categories
                .filter(
                  (category) =>
                    category.id === Category.ALL ||
                    opportunities.filter(
                      (opportunity) => opportunity.category === category.id,
                    ).length > 0,
                )
                .map((category) => (
                  <button
                    key={category.id}
                    className={cn(
                      "group flex h-10 flex-row items-center gap-2 rounded-[20px] px-4 transition-colors",
                      selectedCategory === category.id
                        ? "bg-white"
                        : "bg-white/25",
                    )}
                    onClick={() => onSelectedCategoryChange(category.id)}
                  >
                    <p
                      className={cn(
                        "!text-p2 transition-colors",
                        selectedCategory === category.id
                          ? "text-foreground"
                          : "text-navy-600 group-hover:text-foreground",
                      )}
                    >
                      {category.title}
                    </p>
                    <p
                      className={cn(
                        "!text-p3 transition-colors",
                        selectedCategory === category.id
                          ? "text-foreground"
                          : "text-navy-600 group-hover:text-foreground",
                      )}
                    >
                      {category.id === Category.ALL
                        ? opportunities.length
                        : opportunities.filter(
                            (opportunity) =>
                              opportunity.category === category.id,
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
                    selectedCategory === Category.ALL ||
                    opportunity.category === selectedCategory,
                )
                .map((opportunity, index) => (
                  <Link
                    key={index}
                    className="block flex w-full flex-col gap-4 rounded-md bg-white p-4"
                    href={opportunity.url}
                    target="_blank"
                  >
                    <div className="flex flex-row items-center gap-2">
                      {opportunity.protocol.logoUrl ? (
                        <Image
                          className="h-6 w-6"
                          src={opportunity.protocol.logoUrl}
                          alt={`${opportunity.protocol.name} logo`}
                          width={24}
                          height={24}
                          quality={100}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-[50%] bg-navy-100" />
                      )}
                      <p className="text-h3">{opportunity.title}</p>
                    </div>

                    <div className="grid w-full grid-cols-2 justify-between gap-4 md:flex md:flex-row md:gap-0">
                      {/* Assets */}
                      <div className="flex min-w-20 flex-col gap-1.5">
                        <p className="text-p2 text-navy-500">Assets</p>
                        <div className="flex w-full flex-row items-center gap-1.5">
                          <div className="flex flex-row">
                            {opportunity.assets.map((a, index) => (
                              <TokenLogo
                                key={a.coinType}
                                className={cn(
                                  index !== 0 &&
                                    "outline-px -ml-2 outline outline-white",
                                )}
                                token={appData.tokenMap[a.coinType]}
                                size={20}
                              />
                            ))}
                          </div>

                          <p className="text-p2">
                            {opportunity.assets
                              .map((a) => appData.tokenMap[a.coinType].symbol)
                              .join("-")}
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
                          {
                            categories.find(
                              (c) => c.id === opportunity.category,
                            )?.title
                          }
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
                              token={
                                appData.tokenMap[
                                  NORMALIZED_SEND_POINTS_COINTYPE
                                ]
                              }
                              size={16}
                            />
                            <p className="text-p2">
                              {formatPoints(opportunity.sendPointsPerDay, {
                                dp: 3,
                              })}
                              {" / "}
                              {lstToken.symbol}
                              {" / day"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </Card>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
