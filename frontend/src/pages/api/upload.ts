import { createReadStream } from "fs";

import { NextApiRequest, NextApiResponse } from "next";

import formidable from "formidable";
import * as tus from "tus-js-client";

// Disable parsing the body by Next.js default behavior
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse the form data
    const form = formidable({});
    const [, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      throw new Error("No file uploaded");
    }

    // Create a readable stream from the file
    const fileStream = createReadStream(file.filepath);

    // Create a Promise to handle the upload completion
    const uploadUrl = await new Promise<string>((resolve, reject) => {
      const upload = new tus.Upload(fileStream, {
        endpoint: "https://api.tusky.io/uploads/",
        headers: {
          "Api-Key": process.env.TUSKY_API_KEY as string,
        },
        metadata: {
          filename: file.originalFilename || "unknown",
          filetype: file.mimetype || "application/octet-stream",
          vaultId: "2603001c-3339-4f71-852e-68ee5b59c362",
        },
        onError: (error) => {
          console.error("Upload failed:", error.message);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          console.log(
            `Progress: ${percentage}% (${bytesUploaded}/${bytesTotal} bytes)`,
          );
        },
        onSuccess: () => {
          if (!upload.url) {
            reject(new Error("Upload completed but no URL was returned"));
            return;
          }
          resolve(upload.url);
        },
      });

      upload.start();
    });

    const id = uploadUrl.split("/").pop();
    const url = `https://api.tusky.io/files/${id}/data`;

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
