const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

const protect = async (req, res, next) => {
  const authorization =
    req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  const token =
    authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Not authorized, invalid or expired token",
    });
  }
};

/*
 * Public storefront reads remain public, but when a valid admin token is
 * present we mark the request so draft/archived products can be loaded by the
 * Admin Product Form through the same read endpoints.
 *
 * Invalid/missing tokens are ignored here because this middleware is used on
 * public GET routes. Protected writes still use protect + admin below.
 */
const allowAdminProductRead = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return next();
  }

  const token = authorization.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    )
      .select("role")
      .lean();

    if (user?.role === "admin") {
      req.allowAnyProductStatus = true;
    }
  } catch {
    // Keep public reads public. Invalid/expired optional tokens do not turn a
    // normal storefront request into an authentication error.
  }

  return next();
};

const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "admin"
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Admin access required",
  });
};

module.exports = {
  protect,
  admin,
  allowAdminProductRead,
};
