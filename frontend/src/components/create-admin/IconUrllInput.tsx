import { Dispatch, SetStateAction } from "react";

import { BigNumber } from "bignumber.js";

import { formatNumber } from "@suilend/sui-fe";

import IconUpload from "@/components/create-admin/IconUpload";
import { BROWSE_MAX_FILE_SIZE_BYTES } from "@/lib/createLst";

interface IconUrllInputProps {
  iconUrl: string;
  setIconUrl: Dispatch<SetStateAction<string>>;
  iconFilename: string;
  setIconFilename: Dispatch<SetStateAction<string>>;
  iconFileSize: string;
  setIconFileSize: Dispatch<SetStateAction<string>>;
}

export default function IconUrllInput({
  iconUrl,
  setIconUrl,
  iconFilename,
  setIconFilename,
  iconFileSize,
  setIconFileSize,
}: IconUrllInputProps) {
  return (
    <div className="flex flex-col gap-2 max-md:w-full md:flex-1">
      <div className="flex w-full flex-col gap-1">
        <p className="text-p2 text-navy-600">Icon</p>
        <p className="text-p3 text-navy-500">
          {[
            "PNG, JPEG, WebP, or SVG.",
            `Max ${formatNumber(
              new BigNumber(BROWSE_MAX_FILE_SIZE_BYTES / 1024 / 1024),
              { dp: 0 },
            )} MB.`,
            `128x128 or larger recommended`,
          ].join(" ")}
        </p>
      </div>
      <IconUpload
        iconUrl={iconUrl}
        setIconUrl={setIconUrl}
        iconFilename={iconFilename}
        setIconFilename={setIconFilename}
        iconFileSize={iconFileSize}
        setIconFileSize={setIconFileSize}
      />
    </div>
  );
}
