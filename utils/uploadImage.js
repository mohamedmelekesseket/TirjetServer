import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file?.buffer) {
      return reject(new Error("No file buffer found"));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};