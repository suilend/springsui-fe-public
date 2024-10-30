export const msPerYear = 31556952000; // Approx. 1000 * 60 * 60 * 24 * 365;

export const TWITTER = "@springsui_";

export const TITLE =
  "SpringSui: Liquid Staking on Sui | Stake and Earn Passive Rewards";
export const DESCRIPTION =
  "Stake SUI with SpringSui and earn passive rewards with liquid staking. Maximize earnings while keeping your tokens liquid and secure.";

export const TOAST_DURATION_MS = 4 * 1000;
export const TX_TOAST_DURATION_MS = 10 * 1000;

export const SUI_GAS_MIN = 0.05;

enum Network {
  MAINNET = "mainnet",
  TESTNET = "testnet",
}
const NETWORK: Network = Network.MAINNET;
export const isOnTestnet = (NETWORK as Network) === Network.TESTNET;
export const isOnMainnet = (NETWORK as Network) === Network.MAINNET;

export const RPC = isOnTestnet
  ? {
      name: "Full Node",
      url: "https://fullnode.testnet.sui.io",
    }
  : {
      name: "Triton One",
      url: `https://solendf-suishar-0c55.mainnet.sui.rpcpool.com/${
        process.env.NEXT_PUBLIC_SUI_TRITON_ONE_DEV_API_KEY ?? ""
      }`,
    };

export const EXPLORER = {
  name: "Suiscan",
  buildAddressUrl: (address: string) =>
    `https://suiscan.xyz/${NETWORK}/account/${address}`,
  buildObjectUrl: (id: string) => `https://suiscan.xyz/${NETWORK}/object/${id}`,
  buildCoinUrl: (coinType: string) =>
    `https://suiscan.xyz/${NETWORK}/coin/${coinType}`,
  buildTxUrl: (digest: string) => `https://suiscan.xyz/${NETWORK}/tx/${digest}`,
};
