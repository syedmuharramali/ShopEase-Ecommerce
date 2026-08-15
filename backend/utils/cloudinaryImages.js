const cloudinary = require("../config/cloudinary.js");

const PRODUCT_FOLDER = "shopease/products";

const uploadBuffer = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: PRODUCT_FOLDER,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        transformation: [
          {
            width: 1800,
            height: 1800,
            crop: "limit",
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });

const destroyPublicId = async (publicId) => {
  if (!publicId) return;

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (
    result?.result !== "ok" &&
    result?.result !== "not found"
  ) {
    throw new Error(
      `Cloudinary could not delete image ${publicId}`
    );
  }
};

const destroyCloudinaryImages = async (images = []) => {
  const publicIds = images
    .map((image) => image?.publicId)
    .filter(Boolean);

  if (!publicIds.length) return;

  const results = await Promise.allSettled(
    publicIds.map(destroyPublicId)
  );

  const failures = results.filter(
    (result) => result.status === "rejected"
  );

  if (failures.length) {
    console.error(
      "Cloudinary cleanup failed for one or more images:",
      failures.map((failure) => failure.reason?.message)
    );
  }
};

const uploadProductImages = async (
  files = [],
  productName = "",
  startPosition = 0
) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadedImages = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      if (!file?.buffer) {
        throw new Error("Uploaded image buffer is missing");
      }

      const result = await uploadBuffer(file);

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        alt: productName || "",
        position: startPosition + index,
      });
    }

    return uploadedImages;
  } catch (error) {
    await destroyCloudinaryImages(uploadedImages);
    throw error;
  }
};

module.exports = {
  uploadProductImages,
  destroyCloudinaryImages,
  destroyPublicId,
};