import { useWalletContext } from "@suilend/frontend-sui-next";

import ConnectedWalletPopover from "@/components/ConnectedWalletPopover";
import ConnectWalletPopover from "@/components/ConnectWalletPopover";

export default function ConnectWalletButton() {
  const { isImpersonating, wallet, address } = useWalletContext();

  const isConnected = !!address && (!isImpersonating ? !!wallet : true);

  return isConnected ? <ConnectedWalletPopover /> : <ConnectWalletPopover />;
}
