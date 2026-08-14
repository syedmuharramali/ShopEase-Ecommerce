const jwt = require("jsonwebtoken");

const User = require("../models/user.model.js");

function cleanEmail(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function generateToken(id) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN ||
        "8h",
    }
  );
}

/*
 * POST /api/users/login
 *
 * Admin-only login.
 */
exports.loginAdmin = async (
  req,
  res
) => {
  try {
    const email =
      cleanEmail(req.body?.email);

    const password =
      typeof req.body?.password ===
      "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    /*
     * Password is select:false in the hardened User model,
     * so explicitly request it for authentication.
     */
    const user =
      await User.findOne({
        email,
        role: "admin",
      }).select("+password");

    const passwordMatches =
      user &&
      (await user.matchPassword(
        password
      ));

    if (!passwordMatches) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token =
      generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(
      "loginAdmin error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to sign in right now",
    });
  }
};

/*
 * Secure admin bootstrap.
 *
 * The previous project used hard-coded credentials.
 * This version only creates an admin from environment
 * variables and never contains a default password.
 *
 * Required only when bootstrapping a NEW database:
 *
 * ADMIN_NAME=...
 * ADMIN_EMAIL=...
 * ADMIN_PASSWORD=...
 */
exports.createDefaultAdmin =
  async () => {
    try {
      const name =
        typeof process.env
          .ADMIN_NAME === "string"
          ? process.env.ADMIN_NAME.trim()
          : "";

      const email =
        cleanEmail(
          process.env.ADMIN_EMAIL
        );

      const password =
        typeof process.env
          .ADMIN_PASSWORD === "string"
          ? process.env.ADMIN_PASSWORD
          : "";

      /*
       * Existing deployments may already have an admin.
       * If bootstrap values are not configured, simply skip.
       */
      if (
        !name ||
        !email ||
        !password
      ) {
        console.log(
          "Admin bootstrap skipped: ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are not fully configured."
        );
        return;
      }

      if (
        !/^\S+@\S+\.\S+$/.test(
          email
        )
      ) {
        console.error(
          "Admin bootstrap skipped: ADMIN_EMAIL is invalid."
        );
        return;
      }

      if (
        password.length < 12
      ) {
        console.error(
          "Admin bootstrap skipped: ADMIN_PASSWORD must be at least 12 characters."
        );
        return;
      }

      const existingUser =
        await User.findOne({
          email,
        }).select(
          "_id email role"
        );

      if (existingUser) {
        if (
          existingUser.role !==
          "admin"
        ) {
          console.error(
            "Admin bootstrap skipped: ADMIN_EMAIL already belongs to a non-admin user."
          );
        }

        return;
      }

      await User.create({
        name,
        email,
        password,
        role: "admin",
      });

      console.log(
        "Admin account created from environment configuration."
      );
    } catch (error) {
      /*
       * Do not print credentials or password values.
       */
      console.error(
        "createDefaultAdmin error:",
        error.message
      );
    }
  };