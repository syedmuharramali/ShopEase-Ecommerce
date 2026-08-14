const mongoose = require("mongoose");

const Product =
  require("../models/product.model");

const ProductDeliveryRate =
  require(
    "../models/productDeliveryRate.model"
  );

const {
  DELIVERY_REGIONS,
} = require(
  "../models/productDeliveryRate.model"
);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(
    id
  );
}

function parseBoolean(
  value,
  fallback = true
) {
  if (
    value === true ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return fallback;
}

/*
 * ----------------------------------------
 * Validate rates
 * ----------------------------------------
 */

function validateRates(rates) {
  if (!Array.isArray(rates)) {
    return {
      valid: false,
      message:
        "Delivery rates must be an array",
    };
  }

  if (
    rates.length !==
    DELIVERY_REGIONS.length
  ) {
    return {
      valid: false,
      message:
        "Delivery charges must be configured for all delivery regions",
    };
  }

  const regionMap =
    new Map();

  for (const rate of rates) {
    const region =
      typeof rate?.region ===
      "string"
        ? rate.region.trim()
        : "";

    if (
      !DELIVERY_REGIONS.includes(
        region
      )
    ) {
      return {
        valid: false,
        message:
          `Invalid delivery region: ${region}`,
      };
    }

    if (
      regionMap.has(region)
    ) {
      return {
        valid: false,
        message:
          `Duplicate delivery region: ${region}`,
      };
    }

    const isAvailable =
      parseBoolean(
        rate.isAvailable,
        true
      );

    const charge =
      Number(rate.charge);

    if (isAvailable) {
      if (
        !Number.isFinite(charge) ||
        charge <= 0
      ) {
        return {
          valid: false,
          message:
            `Delivery charge for ${region} must be greater than 0`,
        };
      }
    }

    regionMap.set(region, {
      region,

      charge:
        isAvailable
          ? charge
          : 0,

      isAvailable,
    });
  }

  const normalizedRates =
    DELIVERY_REGIONS.map(
      (region) =>
        regionMap.get(region)
    );

  return {
    valid: true,
    rates: normalizedRates,
  };
}

/*
 * ----------------------------------------
 * Public
 *
 * GET
 * /api/products/:productId/delivery-rates
 * ----------------------------------------
 */

const getProductDeliveryRates =
  async (req, res) => {
    try {
      const {
        productId,
      } = req.params;

      if (
        !isValidObjectId(
          productId
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid product ID",
          });
      }

      /*
       * Public customers should only
       * retrieve delivery information
       * for active products.
       *
       * Admin wrapper can bypass this.
       */

      const product =
        req.allowAnyProductStatus
          ? await Product.findById(
              productId
            )
              .select(
                "_id status"
              )
              .lean()
          : await Product.findOne({
              _id: productId,
              status: "active",
            })
              .select(
                "_id status"
              )
              .lean();

      if (!product) {
        return res
          .status(404)
          .json({
            message:
              "Product not found",
          });
      }

      const delivery =
        await ProductDeliveryRate.findOne(
          {
            product:
              productId,
          }
        ).lean();

      /*
       * Existing products may not
       * have delivery configuration yet.
       */

      if (!delivery) {
        return res
          .status(200)
          .json({
            product:
              productId,

            configured:
              false,

            rates:
              DELIVERY_REGIONS.map(
                (region) => ({
                  region,
                  charge: 0,
                  isAvailable:
                    false,
                })
              ),
          });
      }

      return res
        .status(200)
        .json({
          product:
            productId,

          configured:
            true,

          rates:
            delivery.rates,
        });
    } catch (error) {
      console.error(
        "getProductDeliveryRates error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to load delivery charges",
        });
    }
  };

/*
 * ----------------------------------------
 * Admin
 *
 * PUT
 * /api/products/:productId/delivery-rates
 * ----------------------------------------
 */

const saveProductDeliveryRates =
  async (req, res) => {
    try {
      const {
        productId,
      } = req.params;

      if (
        !isValidObjectId(
          productId
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid product ID",
          });
      }

      const product =
        await Product.findById(
          productId
        )
          .select("_id")
          .lean();

      if (!product) {
        return res
          .status(404)
          .json({
            message:
              "Product not found",
          });
      }

      const validation =
        validateRates(
          req.body?.rates
        );

      if (
        !validation.valid
      ) {
        return res
          .status(400)
          .json({
            message:
              validation.message,
          });
      }

      const delivery =
        await ProductDeliveryRate.findOneAndUpdate(
          {
            product:
              productId,
          },
          {
            $set: {
              rates:
                validation.rates,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators:
              true,
            setDefaultsOnInsert:
              true,
          }
        ).lean();

      return res
        .status(200)
        .json({
          message:
            "Delivery charges saved successfully",

          delivery,
        });
    } catch (error) {
      console.error(
        "saveProductDeliveryRates error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            message:
              "Delivery configuration already exists for this product",
          });
      }

      return res
        .status(500)
        .json({
          message:
            "Failed to save delivery charges",
        });
    }
  };

/*
 * Admin GET wrapper
 */

const getAdminProductDeliveryRates =
  async (req, res) => {
    req.allowAnyProductStatus =
      true;

    return getProductDeliveryRates(
      req,
      res
    );
  };

module.exports = {
  getProductDeliveryRates,
  getAdminProductDeliveryRates,
  saveProductDeliveryRates,
};