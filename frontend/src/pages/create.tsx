import CreateCard from "@/components/create/CreateCard";
import { FooterSm } from "@/components/Footer";

export default function Admin() {
  return (
    <>
      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Title */}
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-center text-h1">Create</p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <CreateCard />
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>
    </>
  );
}
