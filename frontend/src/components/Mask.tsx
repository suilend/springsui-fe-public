import { FOOTER_MD_HEIGHT } from "@/components/Footer";
import { MD_NAV_HEIGHT } from "@/components/Nav";

export default function Mask() {
  return (
    <div
      className="!pointer-events-none fixed inset-x-0 z-[2] overflow-hidden max-md:hidden"
      style={{ top: MD_NAV_HEIGHT - 8, bottom: FOOTER_MD_HEIGHT - 8 }}
    >
      <div
        className="!pointer-events-none absolute inset-0 z-[1] outline outline-[16px] outline-white"
        style={{
          borderRadius: 24 + 8,
          boxShadow: "inset 0 0 0 8px hsl(var(--white))",
        }}
      />
      <div
        className="!pointer-events-none absolute inset-[8px] z-[2] border border-[#E0EAF9]/50"
        style={{
          borderRadius: 24,
        }}
      />
    </div>
  );
}
