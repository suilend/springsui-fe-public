import { StaticImageData } from "next/image";
import { ReactElement } from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

export type ParsedLiquidStakingInfo = {
  totalSuiSupply: BigNumber;
  totalLstSupply: BigNumber;
  suiToLstExchangeRate: BigNumber;
  lstToSuiExchangeRate: BigNumber;
  fees: BigNumber;
};

export type Token = Omit<CoinMetadata, "iconUrl"> & {
  coinType: string;
  iconUrl?: StaticImageData | string | null;
};

export type SubmitButtonState = {
  icon?: ReactElement;
  title?: string;
  description?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
};
