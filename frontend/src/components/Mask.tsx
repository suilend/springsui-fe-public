import { MD_NAV_HEIGHT } from "@/components/Nav";

export default function Mask() {
  return (
    <div
      className="!pointer-events-none fixed inset-x-0 bottom-0 z-[2] overflow-hidden max-md:hidden"
      style={{ top: MD_NAV_HEIGHT - 8 }}
    >
      <div
        className="!pointer-events-none absolute inset-0 outline outline-[16px] outline-white"
        style={{
          borderRadius: 24 + 8,
          boxShadow: "inset 0 0 0 8px hsl(var(--white))",
        }}
      />
    </div>
  );
}
