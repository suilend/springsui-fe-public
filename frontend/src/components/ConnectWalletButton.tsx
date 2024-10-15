import { useWallet } from "@suiet/wallet-kit";

import ConnectWalletPopover from "@/components/ConnectWalletPopover";
import { useWalletContext } from "@/contexts/WalletContext";
import { useListWallets } from "@/lib/wallets";

export default function ConnectWalletButton() {
  const { adapter } = useWallet();
  const { address, isImpersonatingAddress, disconnectWallet } =
    useWalletContext();

  const wallets = useListWallets();
  const connectedWallet = wallets.find((w) => w.id === adapter?.name);

  const isConnected =
    address && (!isImpersonatingAddress ? connectedWallet : true);

  return isConnected ? (
    <button onClick={disconnectWallet}>Disconnect</button>
  ) : (
    <ConnectWalletPopover />
  );
}
