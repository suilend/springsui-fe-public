import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useState } from "react";

import BigNumber from "bignumber.js";
import { X } from "lucide-react";

import { formatNumber } from "@suilend/frontend-sui";
import { showErrorToast } from "@suilend/frontend-sui-next";

import Skeleton from "@/components/Skeleton";

export const MAX_BASE64_LENGTH = 2 ** 16; // 65,536 characters
export const MAX_FILE_SIZE_BYTES = Math.floor((MAX_BASE64_LENGTH * 3) / 4); // ~49KB to ensure base64 stays under 2^16

const FILE_SIZE_ERROR_MESSAGE = `Please upload an image smaller than ${formatNumber(new BigNumber(MAX_FILE_SIZE_BYTES / 1024), { dp: 0 })} KB`;

interface IconUploadProps {
  iconUrl: string;
  setIconUrl: (url: string) => void;
  iconFilename: string;
  setIconFilename: (filename: string) => void;
  iconFileSize: string;
  setIconFileSize: (fileSize: string) => void;
}

export default function IconUpload({
  iconUrl,
  setIconUrl,
  iconFilename,
  setIconFilename,
  iconFileSize,
  setIconFileSize,
}: IconUploadProps) {
  // Handle drag and drop
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsDragging(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    document.addEventListener("dragover", handleGlobalDragOver as any);
    document.addEventListener("dragleave", handleGlobalDragLeave as any);
    document.addEventListener("drop", handleGlobalDrop as any);

    return () => {
      document.removeEventListener("dragover", handleGlobalDragOver as any);
      document.removeEventListener("dragleave", handleGlobalDragLeave as any);
      document.removeEventListener("drop", handleGlobalDrop as any);
    };
  }, []);

  // Process file
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const reset = () => {
    setIconUrl("");
    setIconFilename("");
    setIconFileSize("");
    (document.getElementById("icon-upload") as HTMLInputElement).value = "";
  };

  const handleFile = async (file: File) => {
    try {
      setIsProcessing(true);

      // Set filename and fileSize
      setIconFilename(file.name);
      setIconFileSize(
        `${formatNumber(new BigNumber(file.size / 1024), { dp: 1 })} KB`,
      );

      // Validate file type
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.type))
        throw new Error("Please upload a PNG, JPEG, or SVG image");

      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES)
        throw new Error(FILE_SIZE_ERROR_MESSAGE);

      // Read file
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (base64String.length > MAX_BASE64_LENGTH)
          throw new Error(FILE_SIZE_ERROR_MESSAGE);

        setIconUrl(base64String);
      };
      reader.onerror = () => {
        throw new Error("Failed to upload image");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to upload image", err as Error);

      reset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFile(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await handleFile(file);
  };

  return (
    <>
      {isDragging && (
        <div
          className="absolute -inset-px z-50 flex flex-row items-center justify-center rounded-xl bg-white/80 backdrop-blur-lg"
          onDrop={handleDrop}
        >
          <p className="text-p2 text-foreground">Drop to upload image</p>
        </div>
      )}

      <div className="flex w-full flex-row items-center gap-4">
        {/* Icon */}
        <div className="group relative flex w-max flex-row items-center justify-center rounded-md bg-white/50">
          {isProcessing || iconUrl ? (
            <>
              <button
                className="absolute right-1 top-1 z-[3] rounded-md border bg-background p-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                onClick={reset}
              >
                <X className="h-4 w-4 text-navy-600 transition-colors hover:text-foreground" />
              </button>

              <div className="pointer-events-none relative z-[2] flex h-24 w-24 flex-row items-center justify-center p-2">
                {isProcessing ? (
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
            </>
          ) : (
            <div className="pointer-events-none relative z-[2] flex h-24 w-24 flex-col items-center justify-center gap-0.5">
              <p className="text-p3 text-navy-500">Drag & drop</p>
              <p className="text-p3 text-navy-500">or browse</p>
            </div>
          )}

          <input
            id="icon-upload"
            className="absolute inset-0 z-[1] appearance-none opacity-0"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
        </div>

        {/* Metadata */}
        {iconFilename && iconFileSize && (
          <div className="flex flex-1 flex-col gap-1">
            <p className="break-all text-p2 text-navy-600">{iconFilename}</p>
            <p className="text-p3 text-navy-500">{iconFileSize}</p>
          </div>
        )}
      </div>
    </>
  );
}
