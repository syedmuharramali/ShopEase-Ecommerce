const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
      },

      password: {
        type: String,
        required: true,
        minlength: 12,
        select: false,
      },

      role: {
        type: String,
        enum: [
          "admin",
          "customer",
        ],
        default: "customer",
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * Promise-style middleware.
 *
 * Do not use an async middleware with a `next` parameter.
 * Awaiting the hash is enough for Mongoose to continue.
 */
userSchema.pre(
  "save",
  async function () {
    if (
      !this.isModified(
        "password"
      )
    ) {
      return;
    }

    const salt =
      await bcrypt.genSalt(12);

    this.password =
      await bcrypt.hash(
        this.password,
        salt
      );
  }
);

userSchema.methods.matchPassword =
  async function (
    enteredPassword
  ) {
    if (
      !enteredPassword ||
      !this.password
    ) {
      return false;
    }

    return bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

module.exports =
  mongoose.model(
    "User",
    userSchema
  );