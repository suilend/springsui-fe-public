import Image from "next/image";
import { ChangeEvent, useState } from "react";

import { showErrorToast } from "@suilend/frontend-sui-next";

import Skeleton from "@/components/Skeleton";

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB in bytes

interface IconUploadProps {
  iconUrl: string;
  setIconUrl: (url: string) => void;
}

export default function IconUpload({ iconUrl, setIconUrl }: IconUploadProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      showErrorToast(
        "Invalid file type",
        new Error("Please upload a PNG, JPEG, or SVG image"),
      );
      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showErrorToast(
        "File too large",
        new Error("Please upload an image smaller than 1 MB"),
      );
      e.target.value = "";
      return;
    }

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
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
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
