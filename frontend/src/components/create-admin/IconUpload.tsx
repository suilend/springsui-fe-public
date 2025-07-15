import {
  ChangeEvent,
  Dispatch,
  DragEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import BigNumber from "bignumber.js";
import { X } from "lucide-react";
import { Metadata } from "sharp";

import { formatNumber } from "@suilend/sui-fe";
import { showErrorToast } from "@suilend/sui-fe-next";

import Skeleton from "@/components/Skeleton";
import {
  BROWSE_FILE_SIZE_ERROR_MESSAGE,
  BROWSE_MAX_FILE_SIZE_BYTES,
} from "@/lib/createLst";

const MAX_BASE64_LENGTH = 2 ** 16; // 65,536 characters (~49KB file size)

const VALID_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

interface IconUploadProps {
  iconUrl: string;
  setIconUrl: Dispatch<SetStateAction<string>>;
  iconFilename: string;
  setIconFilename: Dispatch<SetStateAction<string>>;
  iconFileSize: string;
  setIconFileSize: Dispatch<SetStateAction<string>>;
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

  const resizeImageAndSetIconUrl = async (base64: string, file: File) => {
    const res = await fetch("/api/resize-image", {
      method: "POST",
      body: JSON.stringify({
        base64: base64.split(",")[1],
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json: { base64: string; metadata: Metadata } = await res.json();
    if (!json.metadata.size) throw new Error("Failed to resize image");

    const processedBase64 = `data:image/webp;base64,${json.base64}`;
    if (processedBase64.length > MAX_BASE64_LENGTH)
      throw new Error(BROWSE_FILE_SIZE_ERROR_MESSAGE);

    setIconUrl(processedBase64);
    setIconFilename(file.name);
    setIconFileSize(
      json.metadata.size > 1024 * 1024
        ? `${formatNumber(new BigNumber(json.metadata.size / 1024 / 1024), { dp: 1 })} MB`
        : `${formatNumber(new BigNumber(json.metadata.size / 1024), { dp: 1 })} KB`,
    );
  };

  const handleFile = async (file: File) => {
    try {
      reset();
      setIsProcessing(true);

      // Validate file type
      if (!VALID_MIME_TYPES.includes(file.type))
        throw new Error("Please upload a PNG, JPEG, WebP, or SVG image");

      // Validate file size
      if (file.size > BROWSE_MAX_FILE_SIZE_BYTES)
        throw new Error(BROWSE_FILE_SIZE_ERROR_MESSAGE);

      // Read file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64String = e.target?.result as string;

          resizeImageAndSetIconUrl(base64String, file);
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to upload image", err as Error);

          reset();
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        try {
          throw new Error("Failed to upload image");
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to upload image", err as Error);

          reset();
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to upload image", err as Error);

      reset();
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      reset();
      return;
    }

    await handleFile(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) {
      reset();
      return;
    }

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
          {isProcessing || !!iconUrl ? (
            <>
              {!isProcessing && !!iconUrl && (
                <button
                  className="absolute right-1 top-1 z-[2] rounded-md bg-white p-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={reset}
                >
                  <X className="h-4 w-4 text-navy-600 transition-colors hover:text-foreground" />
                </button>
              )}

              <div className="pointer-events-none relative z-[1] flex h-24 w-24">
                {!!iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="absolute left-4 top-4 z-[2] h-16 w-16"
                    src={iconUrl}
                    alt="Icon"
                    width={64}
                    height={64}
                    onLoad={() => setIsProcessing(false)}
                  />
                )}
                {isProcessing && (
                  <Skeleton className="absolute left-4 top-4 z-[1] h-16 w-16" />
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
            accept={VALID_MIME_TYPES.join(",")}
            onChange={handleFileSelect}
            disabled={isProcessing}
            autoComplete="off"
          />
        </div>

        {/* Metadata */}
        <div className="flex flex-1 flex-col gap-1">
          <p className="break-all text-p2 text-navy-600">
            {iconFilename || "--"}
          </p>
          <p className="text-p3 text-navy-500">{iconFileSize || "--"}</p>
        </div>
      </div>
    </>
  );
}
