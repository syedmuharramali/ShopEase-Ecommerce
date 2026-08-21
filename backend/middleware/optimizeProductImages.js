const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/*
 * Private/internal fields that must never leave the public storefront list
 * response. The product list is built with a MongoDB aggregation, which does
 * not apply Mongoose `select: false`, so this is a final response-level safety
 * boundary in addition to the schema protections.
 */
const PRIVATE_STOREFRONT_KEYS = new Set([
  "supplier",
  "supplierProductCode",
  "fulfillmentType",
  "supplierLastCheckedAt",
  "supplierSku",
  "supplierCost",
  "expectedProfit",
  "inventoryType",
]);

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

const isPlainObject = (value) => {
  if (!value || typeof value !== "object") return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const shouldStripStorefrontKey = (key, stripVariants) =>
  stripVariants &&
  (key === "variants" || PRIVATE_STOREFRONT_KEYS.has(key));

const optimizePayload = (value, { maxWidth, stripVariants }) => {
  if (typeof value === "string") {
    return optimizeCloudinaryImageUrl(value, maxWidth);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      optimizePayload(item, { maxWidth, stripVariants })
    );
  }

  // Only rebuild normal JSON-like objects. BSON ObjectId instances and other
  // special objects must keep their prototype so Express/Mongoose can
  // serialize them correctly instead of turning them into plain objects.
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) => !shouldStripStorefrontKey(key, stripVariants)
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
