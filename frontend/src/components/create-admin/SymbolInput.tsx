import { Dispatch, SetStateAction } from "react";

import Input from "@/components/create-admin/Input";
import { useLoadedAppContext } from "@/contexts/AppContext";

interface SymbolInputProps {
  symbol: string;
  setSymbol: Dispatch<SetStateAction<string>>;
  fullSymbol: string;
}

export default function SymbolInput({
  symbol,
  setSymbol,
  fullSymbol,
}: SymbolInputProps) {
  const { appData } = useLoadedAppContext();

  const existingSymbols = Object.values(appData.lstDataMap).reduce(
    (acc, lstData) => [...acc, lstData.token.symbol],
    [] as string[],
  );

  return (
    <div className="flex flex-col gap-2 max-md:w-full md:flex-1">
      <p className="text-p2 text-navy-600">Symbol</p>
      <div className="relative w-full">
        <div className="pointer-events-none absolute right-4 top-1/2 z-[2] -translate-y-1/2 bg-white">
          <p className="text-p1 text-foreground">SUI</p>
        </div>
        <Input
          className="relative z-[1]"
          placeholder="s"
          value={symbol}
          onChange={setSymbol}
        />
      </div>
      {symbol !== "" && (
        <p className="text-p3 text-navy-500">
          {`"${fullSymbol}"`} (
          {existingSymbols.includes(fullSymbol) ? "not unique" : "unique"})
        </p>
      )}
    </div>
  );
}
