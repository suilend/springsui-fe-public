import { MD_NAV_HEIGHT } from "@/components/Nav";

export default function Mask() {
  return (
    <div
      className="!pointer-events-none fixed inset-x-0 bottom-0 z-[2] overflow-hidden max-md:hidden"
      style={{ top: MD_NAV_HEIGHT - 8 }}
    >
      <div className="absolute inset-x-0 top-[8px] z-[1] h-px bg-[#DAE3EC]/50" />
      <div className="absolute inset-x-0 bottom-[8px] z-[1] h-px bg-[#DAE3EC]/50" />

      <div
        className="!pointer-events-none absolute inset-0 z-[2] outline outline-[16px] outline-white"
        style={{
          borderRadius: 24 + 8,
          boxShadow: "inset 0 0 0 8px hsl(var(--white))",
        }}
      />
    </div>
  );
}
