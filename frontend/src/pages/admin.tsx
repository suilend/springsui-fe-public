import CollectFeesCard from "@/components/admin/CollectFeesCard";
import RebalanceCard from "@/components/admin/RebalanceCard";
import UpdateFeesCard from "@/components/admin/UpdateFeesCard";
import ValidatorAddressesAndWeightsCard from "@/components/admin/ValidatorAddressesAndWeightsCard";
import { FooterSm } from "@/components/Footer";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedLstContext } from "@/contexts/LstContext";

export default function Admin() {
  const { admin } = useLoadedLstContext();

  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-center text-h1">Admin</p>

            <div className="flex flex-row items-center gap-2">
              <TokenLogo token={admin.lstData.token} size={24} />
              <p className="text-navy-600">{admin.lstData.token.symbol}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <RebalanceCard />
            <UpdateFeesCard />
            <CollectFeesCard />
            <ValidatorAddressesAndWeightsCard />
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
