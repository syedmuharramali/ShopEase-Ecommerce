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

  // Keep the original Cloudinary asset untouched. This only changes the
  // delivery URL so Cloudinary can send a modern format at a sensible size.
  const [prefix, suffix] = value.split(CLOUDINARY_UPLOAD_MARKER);
  if (!suffix || /(^|\/)f_auto[,/]|(^|\/)q_auto(?::[^,/]+)?[,/]/.test(suffix)) {
    return value;
  }

  const transformation = `f_auto,q_auto:best,c_limit,w_${maxWidth}`;
  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${transformation}/${suffix}`;
};

const optimizePayload = (value, { maxWidth, stripVariants }) => {
  if (typeof value === "string") {
    return optimizeCloudinaryImageUrl(value, maxWidth);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      optimizePayload(item, { maxWidth, stripVariants })
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) => !(stripVariants && key === "variants")
        )
        .map(([key, item]) => [
          key,
          optimizePayload(item, { maxWidth, stripVariants }),
        ])
    );
  }

  return value;
};

const optimizeProductImages = ({
  maxWidth = 1200,
  stripVariants = false,
} = {}) =>
  (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) =>
      originalJson(
        optimizePayload(body, {
          maxWidth,
          stripVariants,
        })
      );

    next();
  };

module.exports = {
  optimizeProductImages,
};
