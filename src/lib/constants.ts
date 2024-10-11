export const TWITTER = "@springsui_";

export const SUI_GAS_MIN = 0.05;

export enum Rpc {
  TRITON_ONE = "tritonOne",
}

export const RPCS = [
  {
    id: Rpc.TRITON_ONE,
    name: "Triton One",
    url: `https://solendf-suishar-0c55.mainnet.sui.rpcpool.com/${
      process.env.NEXT_PUBLIC_SUI_TRITON_ONE_DEV_API_KEY ?? ""
    }`,
  },
];

export enum Explorer {
  SUI_SCAN = "suiScan",
}

export const EXPLORERS = [
  {
    id: Explorer.SUI_SCAN,
    name: "Suiscan",
    buildAddressUrl: (address: string) =>
      `https://suiscan.xyz/mainnet/account/${address}`,
    buildObjectUrl: (id: string) => `https://suiscan.xyz/mainnet/object/${id}`,
    buildCoinUrl: (coinType: string) =>
      `https://suiscan.xyz/mainnet/coin/${coinType}`,
    buildTxUrl: (digest: string) => `https://suiscan.xyz/mainnet/tx/${digest}`,
  },
];
