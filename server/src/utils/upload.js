// utils/upload.js
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "./errors.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

const uploadFile = async (file, folder) => {
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    throw new ApiError(500, "AWS S3 bucket not configured");
  }

  const key = `${folder}/${uuidv4()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "private",
  });

  try {
    await s3Client.send(command);
    return key;
  } catch (error) {
    throw new ApiError(500, `Failed to upload file: ${error.message}`);
  }
};

const createSignedUrl = async (key) => {
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    throw new ApiError(500, "AWS S3 bucket not configured");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    throw new ApiError(500, `Failed to generate signed URL: ${error.message}`);
  }
};

export { uploadFile, createSignedUrl };
