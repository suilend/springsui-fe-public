import Link from "next/link";
import { useRouter } from "next/router";

import Icon, { IconList } from "@/components/Icon";
import { DEFI_URL, ROOT_URL } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function Nav() {
  const router = useRouter();

  return (
    <div className="flex h-20 w-full flex-row items-center justify-center gap-6">
      {[
        { url: ROOT_URL, icon: IconList.STAKE, title: "Stake" },
        { url: DEFI_URL, icon: IconList.DEFI, title: "DeFi" },
        {
          icon: IconList.SPRING_SUI,
          title: "Spring Standard",
          endDecorator: "Soon",
        },
      ].map((item) => {
        const isSelected = router.pathname === item.url;
        const isDisabled = !item.url;
        const Component = !isDisabled ? Link : "div";

        return (
          <Component
            href={item.url as string}
            key={item.title}
            className={cn(
              "group flex h-10 flex-row items-center gap-2 rounded-md px-3",
              isSelected && "bg-navy-100/50",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isSelected
                  ? "text-foreground"
                  : !isDisabled
                    ? "text-navy-600 transition-colors group-hover:text-foreground"
                    : "text-navy-400",
              )}
              icon={item.icon}
              size={28}
            />
            <p
              className={cn(
                isSelected
                  ? "text-foreground"
                  : !isDisabled
                    ? "text-navy-600 transition-colors group-hover:text-foreground"
                    : "text-navy-400",
              )}
            >
              {item.title}
            </p>

            {item.endDecorator && (
              <p className="rounded-[4px] bg-navy-100 px-1 py-0.5 text-p3 text-navy-600">
                {item.endDecorator}
              </p>
            )}
          </Component>
        );
      })}
    </div>
  );
}
