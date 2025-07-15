import { Dispatch, SetStateAction } from "react";

import Input from "@/components/create-admin/Input";

interface DescriptionInputProps {
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
}

export default function DescriptionInput({
  description,
  setDescription,
}: DescriptionInputProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-p2 text-navy-600">Description</p>
      <Input
        placeholder="Infinitely liquid staking on Sui"
        value={description}
        onChange={setDescription}
      />
    </div>
  );
}
