import { useWallet } from "@suiet/wallet-kit";

import { useAppContext } from "@/contexts/AppContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { useListWallets } from "@/lib/wallets";

export default function Home() {
  const { data } = useAppContext();
  const { disconnect } = useWallet();
  const { address, selectWallet } = useWalletContext();

  const { mainWallets, otherWallets } = useListWallets();

  return (
    <>
      <div className="flex flex-col gap-2">
        {!address ? (
          <>
            {mainWallets.map((w) => (
              <button key={w.name} onClick={() => selectWallet(w.name)}>
                {w.name}
              </button>
            ))}
            {otherWallets.map((w) => (
              <button key={w.name} onClick={() => selectWallet(w.name)}>
                {w.name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button onClick={disconnect}>Disconnect</button>
            <p>{data && JSON.stringify(data.coinBalancesRaw)}</p>
          </>
        )}
      </div>
    </>
  );
}
