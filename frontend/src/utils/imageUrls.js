const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

export const PRODUCT_IMAGE_FALLBACK = "/product-placeholder.svg";

const getRawImagePath = (image) =>
  typeof image === "string" ? image : image?.url || "";

const getServerOrigin = (apiBaseUrl = "") => {
  if (!apiBaseUrl) return "";

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
};

export const resolveImageUrl = (
  image,
  { apiBaseUrl = "", assetBaseUrl = "", fallback = PRODUCT_IMAGE_FALLBACK } = {}
) => {
  const rawPath = getRawImagePath(image);

  if (!rawPath) return fallback;

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath) || cleanPath.startsWith("data:")) {
    return cleanPath;
  }

  const baseUrl = assetBaseUrl || getServerOrigin(apiBaseUrl);
  if (!baseUrl) return `/${cleanPath.replace(/^\/+/, "")}`;

  return `${baseUrl.replace(/\/+$/, "")}/${cleanPath.replace(/^\/+/, "")}`;
};

const hasGeneratedDeliveryTransform = (segment = "") =>
  segment.includes("f_auto") &&
  segment.includes("q_auto") &&
  (segment.includes("w_") || segment.includes("c_limit"));

export const resizeCloudinaryImage = (
  value,
  { width, quality = "auto:good" } = {}
) => {
  if (
    !Number.isFinite(Number(width)) ||
    typeof value !== "string" ||
    !value.includes(CLOUDINARY_HOST) ||
    !value.includes(CLOUDINARY_UPLOAD_MARKER)
  ) {
    return value;
  }

  const [prefix, suffix] = value.split(CLOUDINARY_UPLOAD_MARKER);
  if (!suffix) return value;

  const pathSegments = suffix.split("/");

  // ShopEase's backend adds one delivery-only transformation segment. Replace
  // that segment so the browser can request the size it actually needs while
  // leaving the original Cloudinary asset and any creative transforms intact.
  if (hasGeneratedDeliveryTransform(pathSegments[0])) {
    pathSegments.shift();
  }

  const transformation = `f_auto,q_${quality},c_limit,w_${Math.round(
    Number(width)
  )}`;

  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${transformation}/${pathSegments.join(
    "/"
  )}`;
};

export const getResponsiveImageProps = (
  image,
  {
    apiBaseUrl = "",
    assetBaseUrl = "",
    fallback = PRODUCT_IMAGE_FALLBACK,
    width = 960,
    widths = [480, 720, 960],
    sizes = "100vw",
    quality = "auto:good",
  } = {}
) => {
  const resolvedUrl = resolveImageUrl(image, {
    apiBaseUrl,
    assetBaseUrl,
    fallback,
  });

  if (
    !resolvedUrl.includes(CLOUDINARY_HOST) ||
    !resolvedUrl.includes(CLOUDINARY_UPLOAD_MARKER)
  ) {
    return { src: resolvedUrl };
  }

  const normalizedWidths = [...new Set(widths.map(Number))]
    .filter((itemWidth) => Number.isFinite(itemWidth) && itemWidth > 0)
    .sort((left, right) => left - right);

  return {
    src: resizeCloudinaryImage(resolvedUrl, { width, quality }),
    srcSet: normalizedWidths
      .map(
        (itemWidth) =>
          `${resizeCloudinaryImage(resolvedUrl, {
            width: itemWidth,
            quality,
          })} ${itemWidth}w`
      )
      .join(", "),
    sizes,
  };
};

