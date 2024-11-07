import { ReactElement } from "react";

import BigNumber from "bignumber.js";

export type ParsedLiquidStakingInfo = {
  totalSuiSupply: BigNumber;
  totalLstSupply: BigNumber;
  suiToLstExchangeRate: BigNumber;
  lstToSuiExchangeRate: BigNumber;

  mintFeePercent: BigNumber;
  redeemFeePercent: BigNumber;
  spreadFeePercent: BigNumber;
  aprPercent: BigNumber;

  fees: BigNumber;
  accruedSpreadFees: BigNumber;
};

export type Token = {
  coinType: string;
  decimals: number;
  symbol: string;
  iconUrl?: string | null;
};

export type SubmitButtonState = {
  icon?: ReactElement;
  title?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
};
