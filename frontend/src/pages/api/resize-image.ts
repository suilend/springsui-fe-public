import { NextApiRequest, NextApiResponse } from "next";

import sharp from "sharp";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Set appropriate size limit for base64 images
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: "No image provided" });

    const originalBuffer = Buffer.from(base64, "base64");
    const originalMetadata = await sharp(originalBuffer).metadata();
    if (!originalMetadata.width || !originalMetadata.height)
      throw new Error("Invalid image");

    const s = sharp(originalBuffer);
    if (originalMetadata.width > 128 || originalMetadata.height > 128)
      s.resize(128, 128, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

    const processedBuffer = await s.webp().toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();
    if (!processedMetadata.size) throw new Error("Failed to resize image");

    return res.status(200).json({
      base64: processedBuffer.toString("base64"),
      metadata: processedMetadata,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to resize image" });
  }
}
