const mongoose = require("mongoose");

const Product = require("../models/product.model.js");
const ProductVariant = require("../models/productVariant.model.js");

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableMoney(value) {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

const validateMarkazProductSettings = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const supplier =
      cleanString(req.body?.supplier).toLowerCase() || "internal";
    const supplierProductCode = cleanString(
      req.body?.supplierProductCode
    );
    const incomingVariants = req.body?.variants;

    if (!["internal", "markaz"].includes(supplier)) {
      return res.status(400).json({
        message: "Supplier must be internal or markaz.",
      });
    }

    if (supplier === "markaz") {
      if (!supplierProductCode) {
        return res.status(400).json({
          message: "Markaz product code is required.",
        });
      }

      if (supplierProductCode.length > 120) {
        return res.status(400).json({
          message: "Markaz product code cannot exceed 120 characters.",
        });
      }
    }

    if (!Array.isArray(incomingVariants)) {
      return res.status(400).json({
        message: "Variant settings must be provided as an array.",
      });
    }

    const productExists = await Product.exists({
      _id: productId,
    });

    if (!productExists) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const productVariants = await ProductVariant.find({
      product: productId,
    })
      .select("_id title sku")
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();

    /*
     * The Admin Markaz page submits the complete variant set. Require that
     * complete set here so switching a product between internal and Markaz
     * cannot leave omitted variants with stale supplier/inventory settings.
     */
    if (incomingVariants.length !== productVariants.length) {
      return res.status(400).json({
        message:
          "Markaz settings must include every variant for this product.",
      });
    }

    const variantMap = new Map(
      productVariants.map((variant) => [String(variant._id), variant])
    );
    const seenVariantIds = new Set();

    for (const incoming of incomingVariants) {
      const variantId = cleanString(incoming?._id);

      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({
          message: "One of the submitted variant IDs is invalid.",
        });
      }

      if (seenVariantIds.has(variantId)) {
        return res.status(400).json({
          message: "The same variant cannot be submitted more than once.",
        });
      }

      seenVariantIds.add(variantId);

      const variant = variantMap.get(variantId);

      if (!variant) {
        return res.status(400).json({
          message: "One of the submitted variants does not belong to this product.",
        });
      }

      if (supplier === "markaz") {
        const supplierSku = cleanString(incoming?.supplierSku).toUpperCase();
        const supplierCost = nullableMoney(incoming?.supplierCost);
        const expectedProfit = nullableMoney(incoming?.expectedProfit);
        const variantLabel = variant.title || variant.sku || "variant";

        if (!supplierSku) {
          return res.status(400).json({
            message: `Markaz SKU is required for variant ${variantLabel}.`,
          });
        }

        if (supplierSku.length > 140) {
          return res.status(400).json({
            message: `Markaz SKU cannot exceed 140 characters for variant ${variantLabel}.`,
          });
        }

        if (Number.isNaN(supplierCost) || Number.isNaN(expectedProfit)) {
          return res.status(400).json({
            message: `Supplier cost and expected profit must be valid non-negative amounts for ${variantLabel}.`,
          });
        }
      }
    }

    if (seenVariantIds.size !== variantMap.size) {
      return res.status(400).json({
        message:
          "Markaz settings must include every variant for this product.",
      });
    }

    return next();
  } catch (error) {
    console.error("Validate Markaz product settings error:", error);
    return res.status(500).json({
      message: "Could not validate Markaz product settings.",
    });
  }
};

module.exports = validateMarkazProductSettings;
