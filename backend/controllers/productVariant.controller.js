const mongoose = require("mongoose");

const Product = require("../models/product.model");
const ProductOption = require("../models/productOption.model");
const ProductVariant = require("../models/productVariant.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseBoolean(value, fallback) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function buildCombinationKey(selectedOptions = []) {
  if (!selectedOptions.length) {
    return "DEFAULT";
  }

  return selectedOptions
    .map(
      (selected) =>
        `${selected.optionId.toString()}:${selected.valueId.toString()}`
    )
    .sort()
    .join("|");
}

async function validateSelectedOptions(productId, selectedOptions) {
  if (!Array.isArray(selectedOptions)) {
    return {
      valid: false,
      status: 400,
      message: "selectedOptions must be an array",
    };
  }

  const activeOptions = await ProductOption.find({
    product: productId,
    isActive: true,
  })
    .sort({
      position: 1,
      createdAt: 1,
    })
    .lean();

  /*
   * A product with no active options uses one default variant
   * with an empty selectedOptions array.
   */
  if (!activeOptions.length) {
    if (selectedOptions.length) {
      return {
        valid: false,
        status: 400,
        message:
          "This product has no active options, so selectedOptions must be empty",
      };
    }

    return {
      valid: true,
      options: [],
    };
  }

  /*
   * Every active option must have at least one active value.
   */
  for (const option of activeOptions) {
    const activeValues = (option.values || []).filter(
      (value) => value.isActive !== false
    );

    if (!activeValues.length) {
      return {
        valid: false,
        status: 409,
        message: `Option "${option.name}" has no active values`,
      };
    }
  }

  /*
   * A real variant must represent one value from every active option.
   */
  if (selectedOptions.length !== activeOptions.length) {
    return {
      valid: false,
      status: 400,
      message:
        "A variant must choose exactly one value for every active product option",
    };
  }

  const submittedByOption = new Map();

  for (const selected of selectedOptions) {
    if (
      !selected ||
      !selected.optionId ||
      !selected.valueId
    ) {
      return {
        valid: false,
        status: 400,
        message:
          "Each selected option requires optionId and valueId",
      };
    }

    if (
      !isValidObjectId(selected.optionId) ||
      !isValidObjectId(selected.valueId)
    ) {
      return {
        valid: false,
        status: 400,
        message: "Invalid optionId or valueId",
      };
    }

    const optionId = selected.optionId.toString();

    if (submittedByOption.has(optionId)) {
      return {
        valid: false,
        status: 400,
        message:
          "A variant cannot contain the same option more than once",
      };
    }

    submittedByOption.set(optionId, selected.valueId.toString());
  }

  const activeOptionIds = new Set(
    activeOptions.map((option) => option._id.toString())
  );

  for (const optionId of submittedByOption.keys()) {
    if (!activeOptionIds.has(optionId)) {
      return {
        valid: false,
        status: 400,
        message:
          "Selected option does not belong to this product or is inactive",
      };
    }
  }

  const validatedOptions = [];

  for (const option of activeOptions) {
    const optionId = option._id.toString();
    const valueId = submittedByOption.get(optionId);

    if (!valueId) {
      return {
        valid: false,
        status: 400,
        message: `Choose a value for "${option.name}"`,
      };
    }

    const optionValue = (option.values || []).find(
      (value) =>
        value._id.toString() === valueId &&
        value.isActive !== false
    );

    if (!optionValue) {
      return {
        valid: false,
        status: 400,
        message: `Selected value for "${option.name}" is invalid or inactive`,
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
    valid: true,
    options: validatedOptions,
  };
}

async function findDuplicateCombination(
  productId,
  selectedOptions,
  excludeVariantId = null
) {
  const targetKey =
    buildCombinationKey(selectedOptions);

  const filter = {
    product: productId,
  };

  if (excludeVariantId) {
    filter._id = {
      $ne: excludeVariantId,
    };
  }

  const variants =
    await ProductVariant.find(filter)
      .select(
        "_id sku selectedOptions isActive"
      )
      .lean();

  return (
    variants.find(
      (variant) =>
        buildCombinationKey(
          variant.selectedOptions || []
        ) === targetKey
    ) || null
  );
}

function duplicateKeyResponse(res, error) {
  if (error?.code !== 11000) {
    return false;
  }

  const field =
    Object.keys(error.keyPattern || {})[0] ||
    Object.keys(error.keyValue || {})[0] ||
    "";

  const message =
    field === "sku"
      ? "SKU already exists"
      : "This option combination already exists for this product";

  res.status(409).json({
    message,
  });

  return true;
}

/*
 * POST /api/products/:productId/variants
 */
const createProductVariant = async (
  req,
  res
) => {
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

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product =
      await Product.findById(productId)
        .select("_id")
        .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

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

    if (
      typeof title !== "string"
    ) {
      return res.status(400).json({
        message: "Title must be a string",
      });
    }

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

    if (!Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array",
      });
    }

    const optionValidation =
      await validateSelectedOptions(
        productId,
        selectedOptions
      );

    if (!optionValidation.valid) {
      return res
        .status(optionValidation.status)
        .json({
          message: optionValidation.message,
        });
    }

    const validatedOptions =
      optionValidation.options;

    const duplicateCombination =
      await findDuplicateCombination(
        productId,
        validatedOptions
      );

    if (duplicateCombination) {
      return res.status(409).json({
        message:
          "This option combination already exists for this product",
      });
    }

    const requestedActive =
      parseBoolean(isActive, true);

    const activeVariantCount =
      await ProductVariant.countDocuments({
        product: productId,
        isActive: true,
      });

    const shouldBeDefault =
      activeVariantCount === 0
        ? true
        : parseBoolean(
            isDefault,
            false
          );

    if (
      shouldBeDefault &&
      !requestedActive
    ) {
      return res.status(400).json({
        message:
          "The default variant must be active",
      });
    }

    /*
     * Create first with isDefault false.
     * This avoids removing the existing default if creation fails.
     */
    const variant =
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
        isDefault: false,
        isActive: requestedActive,
      });

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

      variant.isDefault = true;
      await variant.save();
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

    if (
      duplicateKeyResponse(
        res,
        error
      )
    ) {
      return;
    }

    return res.status(500).json({
      message:
        "Failed to create product variant",
    });
  }
};

/*
 * GET /api/products/:productId/variants
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
    });
  }
};

/*
 * GET /api/products/:productId/variants/:variantId
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

    /*
     * This is a public endpoint, so do not expose archived variants.
     */
    const variant =
      await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
      }).lean();

    if (!variant) {
      return res.status(404).json({
        message:
          "Product variant not found or is inactive",
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
    });
  }
};

/*
 * PATCH /api/products/:productId/variants/:variantId
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

      const duplicateSku =
        await ProductVariant.findOne({
          sku: normalizedSku,
          _id: {
            $ne: variantId,
          },
        })
          .select("_id")
          .lean();

      if (duplicateSku) {
        return res.status(409).json({
          message: "SKU already exists",
        });
      }

      variant.sku =
        normalizedSku;
    }

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

    if (selectedOptions !== undefined) {
      const optionValidation =
        await validateSelectedOptions(
          productId,
          selectedOptions
        );

      if (!optionValidation.valid) {
        return res
          .status(optionValidation.status)
          .json({
            message:
              optionValidation.message,
          });
      }

      const validatedOptions =
        optionValidation.options;

      const duplicateCombination =
        await findDuplicateCombination(
          productId,
          validatedOptions,
          variantId
        );

      if (duplicateCombination) {
        return res.status(409).json({
          message:
            "This option combination already exists for this product",
        });
      }

      /*
       * Refresh optionName/value snapshots as well as IDs.
       */
      variant.selectedOptions =
        validatedOptions;
    }

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

    if (
      compareAtPrice !== undefined
    ) {
      if (
        compareAtPrice !== null &&
        (
          typeof compareAtPrice !== "number" ||
          !Number.isFinite(
            compareAtPrice
          ) ||
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

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          message:
            "Images must be an array",
        });
      }

      variant.images = images;
    }

    const nextIsActive =
      isActive === undefined
        ? variant.isActive
        : parseBoolean(
            isActive,
            variant.isActive
          );

    const nextIsDefault =
      isDefault === undefined
        ? variant.isDefault
        : parseBoolean(
            isDefault,
            variant.isDefault
          );

    if (
      variant.isDefault &&
      nextIsDefault === false
    ) {
      return res.status(400).json({
        message:
          "A product must have one default variant. Assign another default variant instead.",
      });
    }

    if (
      variant.isDefault &&
      nextIsActive === false
    ) {
      return res.status(400).json({
        message:
          "The default variant cannot be deactivated. Assign another default variant first.",
      });
    }

    if (
      nextIsDefault &&
      !nextIsActive
    ) {
      return res.status(400).json({
        message:
          "The default variant must be active",
      });
    }

    variant.isActive =
      nextIsActive;

    variant.isDefault =
      nextIsDefault;

    /*
     * Save the requested variant first. If it fails,
     * the existing default remains untouched.
     */
    await variant.save();

    if (nextIsDefault) {
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

    if (
      duplicateKeyResponse(
        res,
        error
      )
    ) {
      return;
    }

    return res.status(500).json({
      message:
        "Failed to update product variant",
    });
  }
};

/*
 * DELETE /api/products/:productId/variants/:variantId
 *
 * Soft delete.
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

    if (variant.isDefault) {
      return res.status(400).json({
        message:
          "Cannot archive the default variant. Assign another default variant first.",
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