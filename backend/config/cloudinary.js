
const { v2: cloudinary } = require("cloudinary");

const requiredKeys = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingKeys = requiredKeys.filter(
  (key) => !String(process.env[key] || "").trim()
);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Cloudinary environment variables: ${missingKeys.join(", ")}`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;