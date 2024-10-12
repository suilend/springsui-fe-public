export const TWITTER = "@springsui_";

export const SUI_GAS_MIN = 0.05;

enum Network {
  MAINNET = "mainnet",
  TESTNET = "testnet",
}
const NETWORK: Network = Network.TESTNET;

export const RPC =
  (NETWORK as Network) === Network.TESTNET
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
