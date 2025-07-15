import { Dispatch, SetStateAction } from "react";

import Input from "@/components/create-admin/Input";

interface NameInputProps {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  fullName: string;
}

export default function NameInput({ name, setName, fullName }: NameInputProps) {
  return (
    <div className="flex flex-col gap-2 max-md:w-full md:flex-[2]">
      <p className="text-p2 text-navy-600">Name</p>
      <div className="relative w-full">
        <div className="pointer-events-none absolute right-4 top-1/2 z-[2] -translate-y-1/2 bg-white">
          <p className="text-p1 text-foreground">Staked SUI</p>
        </div>
        <Input
          className="relative z-[1]"
          placeholder="Spring"
          value={name}
          onChange={setName}
        />
      </div>
      {name !== "" && (
        <p className="text-p3 text-navy-500">{`"${fullName}"`}</p>
      )}
    </div>
  );
}
