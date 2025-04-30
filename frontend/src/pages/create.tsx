import CreateCard from "@/components/create/CreateCard";
import FaqPopover, { FaqContent } from "@/components/FaqPopover";
import { FOOTER_MD_HEIGHT, FooterSm } from "@/components/Footer";

export default function Admin() {
  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-center text-h1">Create</p>

            <p className="text-center text-navy-600">
              Create your own SpringSui LST
            </p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <CreateCard />
          </div>

          {/* FAQ, WIDTH < md */}
          <div className="flex w-full flex-col gap-6 md:hidden">
            <div className="flex w-full flex-col gap-4 rounded-lg border border-white/75 bg-white/20 p-4 backdrop-blur-[10px]">
              <FaqContent />
            </div>
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>

      {/* Fixed, WIDTH >= md */}
      <div
        className="fixed z-[2] max-md:hidden"
        style={{ right: 8 + 32, bottom: FOOTER_MD_HEIGHT + 32 }}
      >
        <FaqPopover />
      </div>
    </>
  );
}
