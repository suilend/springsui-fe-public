import Image from "next/image";
import { ChangeEvent, useState } from "react";

import { showErrorToast } from "@suilend/frontend-sui-next";

import Skeleton from "@/components/Skeleton";

interface IconUploadProps {
  iconUrl: string;
  setIconUrl: (url: string) => void;
}

export default function IconUpload({ iconUrl, setIconUrl }: IconUploadProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      const json = await res.json();
      if (json.url) setIconUrl(json.url);
    } catch (error) {
      showErrorToast("Failed to upload", error as Error);
      e.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        id="icon-upload"
        className="w-max text-p2 text-navy-600"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {(isUploading || iconUrl) && (
        <div className="relative flex h-16 w-16 flex-row items-center justify-center">
          {isUploading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Image
              className="h-16 w-16"
              src={iconUrl}
              alt="Icon"
              width={64}
              height={64}
              quality={100}
            />
          )}
        </div>
      )}
    </>
  );
}
