import ConnectedWalletPopover from "@/components/ConnectedWalletPopover";
import ConnectWalletPopover from "@/components/ConnectWalletPopover";
import { useWalletContext } from "@/contexts/WalletContext";

export default function ConnectWalletButton() {
  const { isImpersonating, wallet, address } = useWalletContext();

  const isConnected = !!address && (!isImpersonating ? !!wallet : true);

  return isConnected ? <ConnectedWalletPopover /> : <ConnectWalletPopover />;
}
