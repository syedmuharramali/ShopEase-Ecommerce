const mongoose = require("mongoose");

const Product = require("../models/product.model");
const ProductOption = require("../models/productOption.model");
const ProductVariant = require("../models/productVariant.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/*
 * ----------------------------------------
 * Validate selected options
 * ----------------------------------------
 *
 * This is shared by create + update.
 *
 * It verifies:
 *
 * 1. selectedOptions is an array
 * 2. optionId/valueId are valid ObjectIds
 * 3. option belongs to the product
 * 4. value belongs to the option
 * 5. same option isn't selected twice
 */
async function validateSelectedOptions(
  productId,
  selectedOptions
) {
  if (!Array.isArray(selectedOptions)) {
    return {
      error: "selectedOptions must be an array",
    };
  }

  const validatedOptions = [];
  const optionIds = new Set();

  for (const selected of selectedOptions) {
    if (
      !selected ||
      !selected.optionId ||
      !selected.valueId
    ) {
      return {
        error:
          "Each selected option requires optionId and valueId",
      };
    }

    if (
      !isValidObjectId(selected.optionId) ||
      !isValidObjectId(selected.valueId)
    ) {
      return {
        error:
          "Invalid optionId or valueId",
      };
    }

    const optionId =
      selected.optionId.toString();

    /*
     * Don't allow the same option twice.
     */
    if (optionIds.has(optionId)) {
      return {
        error:
          "A variant cannot contain the same option more than once",
      };
    }

    optionIds.add(optionId);

    const option =
      await ProductOption.findOne({
        _id: selected.optionId,
        product: productId,
        isActive: true,
      });

    if (!option) {
      return {
        error:
          "Selected option does not belong to this product",
      };
    }

    const optionValue =
      option.values.id(selected.valueId);

    if (!optionValue) {
      return {
        error:
          `Value does not belong to option "${option.name}"`,
      };
    }

    validatedOptions.push({
      optionId: option._id,
      optionName: option.name,
      valueId: optionValue._id,
      value: optionValue.value,
    });
  }

  return {
    validatedOptions,
  };
}

/*
 * ----------------------------------------
 * Create Variant
 * ----------------------------------------
 *
 * POST
 * /api/products/:productId/variants
 */
const createProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      sku,
      title = "",
      selectedOptions = [],
      price,
      compareAtPrice = null,
      stock = 0,
      images = [],
      isDefault = false,
      isActive = true,
    } = req.body;

    /*
     * ----------------------------------------
     * Validate product ID
     * ----------------------------------------
     */

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    /*
     * ----------------------------------------
     * Validate product
     * ----------------------------------------
     */

    const product = await Product.findById(
      productId
    )
      .select("_id")
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    /*
     * ----------------------------------------
     * Validate SKU
     * ----------------------------------------
     */

    if (
      typeof sku !== "string" ||
      !sku.trim()
    ) {
      return res.status(400).json({
        message: "SKU is required",
      });
    }

    const normalizedSku =
      sku.trim().toUpperCase();

    /*
     * ----------------------------------------
     * Validate title
     * ----------------------------------------
     */

    if (
      typeof title !== "string"
    ) {
      return res.status(400).json({
        message: "Title must be a string",
      });
    }

    /*
     * ----------------------------------------
     * Validate price
     * ----------------------------------------
     */

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        message:
          "Price must be a number greater than or equal to 0",
      });
    }

    /*
     * ----------------------------------------
     * Validate stock
     * ----------------------------------------
     */

    if (
      typeof stock !== "number" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return res.status(400).json({
        message:
          "Stock must be a non-negative integer",
      });
    }

    /*
     * ----------------------------------------
     * Validate compare-at price
     * ----------------------------------------
     */

    if (
      compareAtPrice !== null &&
      (
        typeof compareAtPrice !== "number" ||
        !Number.isFinite(compareAtPrice) ||
        compareAtPrice < 0
      )
    ) {
      return res.status(400).json({
        message:
          "compareAtPrice must be null or a non-negative number",
      });
    }

    /*
     * ----------------------------------------
     * Validate images
     * ----------------------------------------
     */

    if (!Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array",
      });
    }

    /*
     * ----------------------------------------
     * Check SKU uniqueness
     * ----------------------------------------
     */

    const existingSku =
      await ProductVariant.findOne({
        sku: normalizedSku,
      })
        .select("_id")
        .lean();

    if (existingSku) {
      return res.status(409).json({
        message: "SKU already exists",
      });
    }

    /*
     * ----------------------------------------
     * Validate selected options
     * ----------------------------------------
     */

    const optionValidation =
      await validateSelectedOptions(
        productId,
        selectedOptions
      );

    if (optionValidation.error) {
      return res.status(400).json({
        message: optionValidation.error,
      });
    }

    const validatedOptions =
      optionValidation.validatedOptions;

    /*
     * ----------------------------------------
     * Default variant
     * ----------------------------------------
     */

    const variantCount =
      await ProductVariant.countDocuments({
        product: productId,
      });

    const shouldBeDefault =
      variantCount === 0
        ? true
        : Boolean(isDefault);

    /*
     * ----------------------------------------
     * Create variant
     *
     * combinationKey is generated by the
     * ProductVariant schema.
     * ----------------------------------------
     */

    let variant;

    try {
      variant =
        await ProductVariant.create({
          product: productId,

          sku: normalizedSku,

          title: title.trim(),

          selectedOptions:
            validatedOptions,

          price,

          compareAtPrice,

          stock,

          images,

          isDefault: shouldBeDefault,

          isActive: Boolean(isActive),
        });
    } catch (error) {
      /*
       * MongoDB duplicate key.
       *
       * This can happen for:
       *
       * - duplicate SKU
       * - duplicate product + combinationKey
       * - duplicate default variant
       */

      if (error.code === 11000) {
        const duplicateFields =
          Object.keys(
            error.keyPattern || {}
          );

        if (
          duplicateFields.includes("sku")
        ) {
          return res.status(409).json({
            message: "SKU already exists",
          });
        }

        if (
          duplicateFields.includes(
            "combinationKey"
          )
        ) {
          return res.status(409).json({
            message:
              "A variant with the same option combination already exists",
          });
        }

        if (
          duplicateFields.includes(
            "isDefault"
          )
        ) {
          return res.status(409).json({
            message:
              "This product already has a default variant",
          });
        }

        return res.status(409).json({
          message:
            "Duplicate variant data",
        });
      }

      throw error;
    }

    /*
     * ----------------------------------------
     * If this variant is default,
     * remove default from all other variants.
     *
     * We do this AFTER successful creation so
     * a failed variant creation doesn't destroy
     * the existing default.
     * ----------------------------------------
     */

    if (shouldBeDefault) {
      await ProductVariant.updateMany(
        {
          product: productId,
          _id: {
            $ne: variant._id,
          },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    return res.status(201).json({
      message:
        "Product variant created successfully",

      variant,
    });
  } catch (error) {
    console.error(
      "createProductVariant error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create product variant",
      error: error.message,
    });
  }
};

/*
 * ----------------------------------------
 * Get Variants
 * ----------------------------------------
 *
 * GET
 * /api/products/:productId/variants
 */
const getProductVariants = async (
  req,
  res
) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product =
      await Product.exists({
        _id: productId,
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const variants =
      await ProductVariant.find({
        product: productId,
        isActive: true,
      })
        .sort({
          isDefault: -1,
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      variants,
    });
  } catch (error) {
    console.error(
      "getProductVariants error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch product variants",
      error: error.message,
    });
  }
};

/*
 * ----------------------------------------
 * Get Single Variant
 * ----------------------------------------
 *
 * GET
 * /api/products/:productId/variants/:variantId
 */
const getProductVariant = async (
  req,
  res
) => {
  try {
    const {
      productId,
      variantId,
    } = req.params;

    if (
      !isValidObjectId(productId) ||
      !isValidObjectId(variantId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product or variant ID",
      });
    }

    const variant =
      await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
      }).lean();

    if (!variant) {
      return res.status(404).json({
        message:
          "Product variant not found",
      });
    }

    return res.status(200).json(
      variant
    );
  } catch (error) {
    console.error(
      "getProductVariant error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch product variant",
      error: error.message,
    });
  }
};

/*
 * ----------------------------------------
 * Update Variant
 * ----------------------------------------
 *
 * PATCH
 * /api/products/:productId/variants/:variantId
 */
const updateProductVariant = async (
  req,
  res
) => {
  try {
    const {
      productId,
      variantId,
    } = req.params;

    if (
      !isValidObjectId(productId) ||
      !isValidObjectId(variantId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product or variant ID",
      });
    }

    const variant =
      await ProductVariant.findOne({
        _id: variantId,
        product: productId,
      });

    if (!variant) {
      return res.status(404).json({
        message:
          "Product variant not found",
      });
    }

    const {
      sku,
      title,
      selectedOptions,
      price,
      compareAtPrice,
      stock,
      images,
      isDefault,
      isActive,
    } = req.body;

    /*
     * ----------------------------------------
     * SKU
     * ----------------------------------------
     */

    if (sku !== undefined) {
      if (
        typeof sku !== "string" ||
        !sku.trim()
      ) {
        return res.status(400).json({
          message:
            "SKU must be a valid string",
        });
      }

      const normalizedSku =
        sku.trim().toUpperCase();

      const duplicate =
        await ProductVariant.findOne({
          sku: normalizedSku,
          _id: {
            $ne: variantId,
          },
        })
          .select("_id")
          .lean();

      if (duplicate) {
        return res.status(409).json({
          message: "SKU already exists",
        });
      }

      variant.sku =
        normalizedSku;
    }

    /*
     * ----------------------------------------
     * Title
     * ----------------------------------------
     */

    if (title !== undefined) {
      if (
        typeof title !== "string"
      ) {
        return res.status(400).json({
          message:
            "Title must be a string",
        });
      }

      variant.title =
        title.trim();
    }

    /*
     * ----------------------------------------
     * Selected options
     * ----------------------------------------
     *
     * If selectedOptions is supplied,
     * completely revalidate the combination.
     * ----------------------------------------
     */

    if (
      selectedOptions !== undefined
    ) {
      const optionValidation =
        await validateSelectedOptions(
          productId,
          selectedOptions
        );

      if (optionValidation.error) {
        return res.status(400).json({
          message:
            optionValidation.error,
        });
      }

      variant.selectedOptions =
        optionValidation.validatedOptions;
    }

    /*
     * ----------------------------------------
     * Price
     * ----------------------------------------
     */

    if (price !== undefined) {
      if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          message:
            "Price must be a non-negative number",
        });
      }

      variant.price = price;
    }

    /*
     * ----------------------------------------
     * Compare-at price
     * ----------------------------------------
     */

    if (
      compareAtPrice !== undefined
    ) {
      if (
        compareAtPrice !== null &&
        (
          typeof compareAtPrice !== "number" ||
          !Number.isFinite(compareAtPrice) ||
          compareAtPrice < 0
        )
      ) {
        return res.status(400).json({
          message:
            "compareAtPrice must be null or a non-negative number",
        });
      }

      variant.compareAtPrice =
        compareAtPrice;
    }

    /*
     * ----------------------------------------
     * Stock
     * ----------------------------------------
     */

    if (stock !== undefined) {
      if (
        typeof stock !== "number" ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        return res.status(400).json({
          message:
            "Stock must be a non-negative integer",
        });
      }

      variant.stock = stock;
    }

    /*
     * ----------------------------------------
     * Images
     * ----------------------------------------
     */

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          message:
            "Images must be an array",
        });
      }

      variant.images = images;
    }

    /*
     * ----------------------------------------
     * Default variant
     * ----------------------------------------
     */

    if (isDefault === true) {
      await ProductVariant.updateMany(
        {
          product: productId,
          _id: {
            $ne: variantId,
          },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      variant.isDefault = true;
    }

    if (isDefault === false) {
      /*
       * Don't allow the product to end up
       * without a default variant.
       */

      if (variant.isDefault) {
        return res.status(400).json({
          message:
            "A product must have one default variant",
        });
      }

      variant.isDefault = false;
    }

    /*
     * ----------------------------------------
     * Active state
     * ----------------------------------------
     */

    if (isActive !== undefined) {
      variant.isActive =
        Boolean(isActive);
    }

    /*
     * ----------------------------------------
     * Save
     *
     * The schema pre('validate') hook
     * regenerates combinationKey whenever
     * selectedOptions changes.
     * ----------------------------------------
     */

    try {
      await variant.save();
    } catch (error) {
      if (error.code === 11000) {
        const duplicateFields =
          Object.keys(
            error.keyPattern || {}
          );

        if (
          duplicateFields.includes("sku")
        ) {
          return res.status(409).json({
            message:
              "SKU already exists",
          });
        }

        if (
          duplicateFields.includes(
            "combinationKey"
          )
        ) {
          return res.status(409).json({
            message:
              "A variant with the same option combination already exists",
          });
        }

        if (
          duplicateFields.includes(
            "isDefault"
          )
        ) {
          return res.status(409).json({
            message:
              "This product already has a default variant",
          });
        }

        return res.status(409).json({
          message:
            "Duplicate variant data",
        });
      }

      throw error;
    }

    return res.status(200).json({
      message:
        "Product variant updated successfully",

      variant,
    });
  } catch (error) {
    console.error(
      "updateProductVariant error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update product variant",
      error: error.message,
    });
  }
};

/*
 * ----------------------------------------
 * Delete Variant
 * ----------------------------------------
 *
 * Soft delete.
 *
 * DELETE
 * /api/products/:productId/variants/:variantId
 */
const deleteProductVariant = async (
  req,
  res
) => {
  try {
    const {
      productId,
      variantId,
    } = req.params;

    if (
      !isValidObjectId(productId) ||
      !isValidObjectId(variantId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product or variant ID",
      });
    }

    const variant =
      await ProductVariant.findOne({
        _id: variantId,
        product: productId,
      });

    if (!variant) {
      return res.status(404).json({
        message:
          "Product variant not found",
      });
    }

    /*
     * Don't delete the default variant.
     */

    if (variant.isDefault) {
      return res.status(400).json({
        message:
          "Cannot delete the default variant. Assign another default variant first.",
      });
    }

    variant.isActive = false;

    await variant.save();

    return res.status(200).json({
      message:
        "Product variant archived successfully",
    });
  } catch (error) {
    console.error(
      "deleteProductVariant error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to archive product variant",
      error: error.message,
    });
  }
};

module.exports = {
  createProductVariant,
  getProductVariants,
  getProductVariant,
  updateProductVariant,
  deleteProductVariant,
};
