import { useRouter } from "next/router";

import { cloneDeep } from "lodash";
import { VenetianMask } from "lucide-react";

import {
  QueryParams as WalletContextQueryParams,
  useWalletContext,
} from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/format";
import { shallowPushQuery } from "@/lib/router";

export default function ImpersonationModeBanner() {
  const router = useRouter();

  const { isImpersonating, address } = useWalletContext();

  const onImpersonationModeBannerClick = () => {
    const restQuery = cloneDeep(router.query);
    delete restQuery[WalletContextQueryParams.WALLET];
    shallowPushQuery(router, restQuery);
  };

  return (
    isImpersonating &&
    address && (
      <button
        className="flex w-full flex-row items-center justify-start gap-4 rounded-lg bg-white/25 p-4 text-left backdrop-blur-[10px] md:rounded-xl"
        onClick={onImpersonationModeBannerClick}
      >
        <VenetianMask className="h-6 w-6" />
        <div className="flex flex-1 flex-col gap-1">
          <p>{formatAddress(address, 12)}</p>
          <p className="text-p2 text-navy-600">
            Click this banner to exit impersonation mode.
          </p>
        </div>
      </button>
    )
  );
}
