import { Dispatch, SetStateAction } from "react";

import { Minus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

import Button from "@/components/create-admin/Button";
import Input from "@/components/create-admin/Input";

interface ValidatorsInputsProps {
  vaw: { id: string; validatorAddress: string; weight: string }[];
  setVaw: Dispatch<
    SetStateAction<{ id: string; validatorAddress: string; weight: string }[]>
  >;
}

export default function ValidatorsInputs({
  vaw,
  setVaw,
}: ValidatorsInputsProps) {
  const onVawChange = (id: string, key: string, value: string) =>
    setVaw((vaw) =>
      vaw.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );

  const removeVawRow = (id: string) =>
    setVaw((vaw) => vaw.filter((row) => row.id !== id));

  const addVawRow = () => {
    const rowId = uuidv4();
    setVaw((vaw) => [...vaw, { id: rowId, validatorAddress: "", weight: "" }]);

    setTimeout(() => {
      document.getElementById(`validator-address-${rowId}`)?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {vaw.map((row, index) => (
        <div key={row.id} className="flex flex-row gap-4">
          {/* Address */}
          <div className="flex flex-1 flex-col gap-2">
            {index === 0 && <p className="text-p2 text-navy-600">Address</p>}
            <TextareaAutosize
              id={`validator-address-${row.id}`}
              className="min-h-10 w-full rounded-sm bg-white px-4 py-2 font-sans text-p1 text-foreground placeholder:text-navy-500 focus-within:shadow-[inset_0_0_0_1px_hsl(var(--blue))] focus-visible:outline-none"
              value={row.validatorAddress}
              onChange={(e) =>
                onVawChange(row.id, "validatorAddress", e.target.value)
              }
              minRows={1}
            />
          </div>

          {/* Weight */}
          <div className="flex w-[125px] flex-col gap-2">
            {index === 0 && (
              <p className="text-p2 text-navy-600">Weight (0–100%)</p>
            )}
            <Input
              type="number"
              value={row.weight}
              onChange={(value) => onVawChange(row.id, "weight", value)}
            />
            {index === vaw.length - 1 && (
              <p className="text-p3 text-navy-500">Must add up to 100%</p>
            )}
          </div>

          {/* Remove */}
          <div className="flex flex-col gap-2">
            {index === 0 && <p className="text-p2 opacity-0">-</p>}
            <Button
              className="w-10 bg-navy-600"
              isDisabled={vaw.length < 2}
              onClick={() => removeVawRow(row.id)}
            >
              <Minus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ))}

      <Button className="mr-14 w-auto bg-navy-600" onClick={addVawRow}>
        Add row
      </Button>
    </div>
  );
}
