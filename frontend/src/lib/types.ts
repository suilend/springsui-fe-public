import { StaticImageData } from "next/image";
import { ReactElement } from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

export type ParsedLiquidStakingInfo = {
  totalSuiSupply: BigNumber;
  totalLstSupply: BigNumber;
  suiToLstExchangeRate: BigNumber;
  lstToSuiExchangeRate: BigNumber;
  mintFeePercent: BigNumber;
  redeemFeePercent: BigNumber;
  fees: BigNumber;
  aprPercent: BigNumber;
  totalStakers: BigNumber;
};

export type Token = Omit<CoinMetadata, "iconUrl"> & {
  coinType: string;
  iconUrl?: StaticImageData | string | null;
};

export type SubmitButtonState = {
  icon?: ReactElement;
  title?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
};

export type Wallet = {
  id: string;
  name: string;
  isInstalled: boolean;
  logoUrl?: string;
  downloadUrls: {
    browserExtension?: string;
    iOS?: string;
    android?: string;
  };
};
