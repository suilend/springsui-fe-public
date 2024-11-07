import { RegisterWalletCallback, WalletType } from "@suiet/wallet-sdk";
import BigNumber from "bignumber.js";
import { ReactElement } from "react";

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

export type Wallet = {
  id: string;
  name: string;
  isInstalled: boolean;
  iconUrl?: string;
  type: WalletType;
  downloadUrls: {
    iOS?: string;
    android?: string;
    browserExtension?: string;
    registerWebWallet?: RegisterWalletCallback;
  };
};
