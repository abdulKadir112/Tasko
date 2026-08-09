import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import * as streamifier from "streamifier";

function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "video" | "raw"
) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}

/**
 * IMAGE
 */
export async function uploadImage(
  req: Request,
  res: Response
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image selected",
      });
    }

    const result = await uploadToCloudinary(
      req.file,
      "service-marketplace/images",
      "image"
    );

    return res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        imageUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error: any) {
    console.log("Image Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * VOICE
 */
export async function uploadVoice(
  req: Request,
  res: Response
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No voice selected",
      });
    }

    const result = await uploadToCloudinary(
      req.file,
      "service-marketplace/voices",
      "video"
    );

    return res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        voiceUrl: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        bytes: result.bytes,
        format: result.format,
      },
    });
  } catch (error: any) {
    console.log("Voice Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * DOCUMENT
 */
export async function uploadDocument(
  req: Request,
  res: Response
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document selected",
      });
    }

    const result = await uploadToCloudinary(
      req.file,
      "service-marketplace/documents",
      "raw"
    );

    return res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        documentUrl: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
      },
    });
  } catch (error: any) {
    console.log("Document Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}