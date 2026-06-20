import { v2 as cloudinary } from "cloudinary";
import { resolve } from "dns";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRETE,
});

const uploadOnCloudinary = async (localFilePath, retries = 3) => {
  let currentAttempt = 1;
  while (currentAttempt <= retries) {
    try {
      if (!localFilePath) return null;

      // upload on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });

      // file has been uploaded
      console.log("file uploaded on Cloudinary", response.url);

      // remove the temporary file after succesfull upload
      fs.unlinkSync(localFilePath);
      console.log("Unlinked file from local storage successfully...");

      return response;
    } catch (error) {
      console.error(`Attempt ${currentAttempt} failed, retrying again...`);

      if (currentAttempt == retries) {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath); // remove file from local which was temporarily saved as upload has failed
        }
        return null;
      }

      // wait for one second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      currentAttempt += 1;
    }
  }
};

const deletingOldCloudinaryImages = async (publicID, retries = 3) => {
  let currentAttempt = 1;
  while (currentAttempt <= retries) {
    try {
      if (!publicID) return null;

      // delete from cloudinary
      const response = await cloudinary.uploader.destroy(publicID, {
        resource_type: "image",
      });

      return response;
    } catch (error) {
      console.error(
        `Attempt ${currentAttempt} failed, retrying again...`,
        error.message,
      );

      if (currentAttempt == retries) {
        console.error("Max retries reached. Deletion failed.");
        return null;
      }

      // wait for one second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      currentAttempt += 1;
    }
  }
};

export { uploadOnCloudinary, deletingOldCloudinaryImages };
