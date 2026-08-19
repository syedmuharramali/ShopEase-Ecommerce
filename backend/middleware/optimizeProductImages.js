const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

const optimizeCloudinaryImageUrl = (value, maxWidth) => {
  if (
    typeof value !== "string" ||
    !value.includes(CLOUDINARY_HOST) ||
    !value.includes(CLOUDINARY_UPLOAD_MARKER)
  ) {
    return value;
  }

  // Avoid stacking another optimization block on URLs that are already
  // transformed. The original asset stored in Cloudinary is never modified.
  const [prefix, suffix] = value.split(CLOUDINARY_UPLOAD_MARKER);
  if (!suffix || /(^|\/)f_auto[,/]|(^|\/)q_auto(?::[^,/]+)?[,/]/.test(suffix)) {
    return value;
  }

  const transformation = `f_auto,q_auto:best,c_limit,w_${maxWidth}`;
  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${transformation}/${suffix}`;
};

const optimizePayloadImages = (value, maxWidth) => {
  if (typeof value === "string") {
    return optimizeCloudinaryImageUrl(value, maxWidth);
  }

  if (Array.isArray(value)) {
    return value.map((item) => optimizePayloadImages(item, maxWidth));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        optimizePayloadImages(item, maxWidth),
      ])
    );
  }

  return value;
};

const optimizeProductImages = ({ maxWidth = 1200 } = {}) =>
  (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => originalJson(optimizePayloadImages(body, maxWidth));

    next();
  };

module.exports = {
  optimizeProductImages,
};
