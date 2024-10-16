import ConnectWalletPopover from "@/components/ConnectWalletPopover";
import { useWalletContext } from "@/contexts/WalletContext";

export default function ConnectWalletButton() {
  const { isImpersonating, wallet, disconnectWallet, address } =
    useWalletContext();

  const isConnected = !!address && (!isImpersonating ? !!wallet : true);

  return isConnected ? (
    <button onClick={disconnectWallet}>Disconnect</button>
  ) : (
    <ConnectWalletPopover />
  );
}
