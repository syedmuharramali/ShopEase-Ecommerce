import axios from "axios";

const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

const optimizeCloudinaryUrl = (value, maxWidth = 1000) => {
  if (
    typeof value !== "string" ||
    !value.includes(CLOUDINARY_HOST) ||
    !value.includes(CLOUDINARY_UPLOAD_MARKER)
  ) {
    return value;
  }

  const [prefix, suffix] = value.split(CLOUDINARY_UPLOAD_MARKER);

  if (!suffix) return value;

  // If the backend already supplied an optimized Cloudinary URL, keep it.
  if (/(^|\/)f_auto[,/]|(^|\/)q_auto(?::[^,/]+)?[,/]/.test(suffix)) {
    return value;
  }

  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}f_auto,q_auto:best,c_limit,w_${maxWidth}/${suffix}`;
};

const optimizePayload = (value) => {
  if (typeof value === "string") {
    return optimizeCloudinaryUrl(value);
  }

  if (Array.isArray(value)) {
    return value.map(optimizePayload);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, optimizePayload(item)])
    );
  }

  return value;
};

let installed = false;

export const installProductImageOptimization = () => {
  if (installed) return;
  installed = true;

  axios.interceptors.response.use((response) => {
    const requestUrl = String(response.config?.url || "");
    const method = String(response.config?.method || "get").toLowerCase();

    const isPublicProductRead =
      method === "get" &&
      requestUrl.includes("/products") &&
      !requestUrl.includes("/products/admin");

    if (isPublicProductRead) {
      response.data = optimizePayload(response.data);
    }

    return response;
  });
};
