
const Product = require("../models/product.model");
const ProductOption = require("../models/productOption.model");

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
 * POST /api/products/:productId/options
 *
 * Create an option such as:
 *
 * Color → Black, White, Red
 * Size  → 40, 41, 42, 43
 */
const createProductOption = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, values = [], position = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Option name is required",
      });
    }

    if (!Array.isArray(values)) {
      return res.status(400).json({
        message: "Values must be an array",
      });
    }

    const product = await Product.findById(productId)
      .select("_id")
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({
        message: "Invalid option name",
      });
    }

    const existingOption = await ProductOption.findOne({
      product: productId,
      slug,
    });

    if (existingOption) {
      return res.status(409).json({
        message: `Option "${name}" already exists for this product`,
      });
    }

    const cleanedValues = values
      .map((item, index) => {
        const value =
          typeof item === "string"
            ? item.trim()
            : item?.value?.trim();

        if (!value) {
          return null;
        }

        return {
          value,
          slug: slugify(value),
          position:
            item?.position ?? index,
          isActive:
            item?.isActive ?? true,
        };
      })
      .filter(Boolean);

    const duplicateSlugs = new Set();

    for (const value of cleanedValues) {
      if (duplicateSlugs.has(value.slug)) {
        return res.status(400).json({
          message: `Duplicate option value: ${value.value}`,
        });
      }

      duplicateSlugs.add(value.slug);
    }

    const option = await ProductOption.create({
      product: productId,
      name: name.trim(),
      slug,
      values: cleanedValues,
      position,
      isActive: true,
    });

    return res.status(201).json({
      message: "Product option created successfully",
      option,
    });
  } catch (error) {
    console.error(
      "createProductOption error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create product option",
      error: error.message,
    });
  }
};

/*
 * GET /api/products/:productId/options
 */
const getProductOptions = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.exists({
      _id: productId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const options = await ProductOption.find({
      product: productId,
      isActive: true,
    })
      .sort({
        position: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      options,
    });
  } catch (error) {
    console.error(
      "getProductOptions error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch product options",
      error: error.message,
    });
  }
};

/*
 * PATCH /api/products/:productId/options/:optionId
 *
 * Update:
 * - name
 * - values
 * - position
 * - isActive
 */
const updateProductOption = async (req, res) => {
  try {
    const {
      productId,
      optionId,
    } = req.params;

    const option =
      await ProductOption.findOne({
        _id: optionId,
        product: productId,
      });

    if (!option) {
      return res.status(404).json({
        message: "Product option not found",
      });
    }

    const {
      name,
      values,
      position,
      isActive,
    } = req.body;

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message: "Option name must be a valid string",
        });
      }

      const newSlug = slugify(name);

      const duplicate =
        await ProductOption.findOne({
          product: productId,
          slug: newSlug,
          _id: {
            $ne: optionId,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          message: `Option "${name}" already exists for this product`,
        });
      }

      option.name = name.trim();
      option.slug = newSlug;
    }

  
if (values !== undefined) {
  if (!Array.isArray(values)) {
    return res.status(400).json({
      message: "Values must be an array",
    });
  }

  const existingValues = option.values;

  const existingById = new Map(
    existingValues.map((item) => [
      item._id.toString(),
      item,
    ])
  );

  const existingBySlug = new Map(
    existingValues.map((item) => [
      item.slug,
      item,
    ])
  );

  const updatedValues = [];
  const submittedExistingIds = new Set();
  const seenSlugs = new Set();

  for (let index = 0; index < values.length; index++) {
    const item = values[index];

    const value =
      typeof item === "string"
        ? item.trim()
        : item?.value?.trim();

    if (!value) {
      continue;
    }

    const slug = slugify(value);

    if (!slug) {
      return res.status(400).json({
        message: `Invalid option value: ${value}`,
      });
    }

    /*
     * Prevent duplicate values.
     */
    if (seenSlugs.has(slug)) {
      return res.status(400).json({
        message: `Duplicate option value: ${value}`,
      });
    }

    seenSlugs.add(slug);

    let existingValue = null;

    /*
     * If an ID was supplied, it must belong to
     * this option.
     */
    if (
      item &&
      typeof item === "object" &&
      item._id
    ) {
      existingValue = existingById.get(
        item._id.toString()
      );

      if (!existingValue) {
        return res.status(400).json({
          message:
            `Option value "${value}" does not belong to this option`,
        });
      }
    }

    /*
     * If no ID was supplied, try matching by slug.
     *
     * This allows:
     *
     * { "value": "Black" }
     *
     * to preserve the existing Black ID.
     */
    if (!existingValue) {
      existingValue = existingBySlug.get(slug);
    }

    if (existingValue) {
      /*
       * Preserve the existing MongoDB _id.
       */
      existingValue.value = value;
      existingValue.slug = slug;
      existingValue.position =
        item?.position ?? index;
      existingValue.isActive =
        item?.isActive ?? true;

      submittedExistingIds.add(
        existingValue._id.toString()
      );

      updatedValues.push(existingValue);
    } else {
      /*
       * New option value.
       *
       * Mongoose will generate a new _id.
       */
      updatedValues.push({
        value,
        slug,
        position:
          item?.position ?? index,
        isActive:
          item?.isActive ?? true,
      });
    }
  }

  /*
   * Existing values that were not submitted are
   * retained but deactivated.
   *
   * This protects variants that reference them.
   */
  for (const existingValue of existingValues) {
    const id = existingValue._id.toString();

    if (!submittedExistingIds.has(id)) {
      existingValue.isActive = false;
      updatedValues.push(existingValue);
    }
  }

  /*
   * Assign the final array once.
   */
  option.values = updatedValues;
}

    if (position !== undefined) {
      if (
        typeof position !== "number" ||
        position < 0
      ) {
        return res.status(400).json({
          message: "Position must be a non-negative number",
        });
      }

      option.position = position;
    }

    if (isActive !== undefined) {
      option.isActive = Boolean(isActive);
    }

    await option.save();

    return res.status(200).json({
      message: "Product option updated successfully",
      option,
    });
  } catch (error) {
    console.error(
      "updateProductOption error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update product option",
      error: error.message,
    });
  }
};

/*
 * DELETE /api/products/:productId/options/:optionId
 *
 * Soft delete.
 *
 * We don't physically remove it because variants
 * may reference its option/value IDs.
 */
const deleteProductOption = async (req, res) => {
  try {
    const {
      productId,
      optionId,
    } = req.params;

    const option =
      await ProductOption.findOneAndUpdate(
        {
          _id: optionId,
          product: productId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        }
      );

    if (!option) {
      return res.status(404).json({
        message: "Product option not found",
      });
    }

    return res.status(200).json({
      message: "Product option archived successfully",
    });
  } catch (error) {
    console.error(
      "deleteProductOption error:",
      error
    );

    return res.status(500).json({
      message: "Failed to archive product option",
      error: error.message,
    });
  }
};

module.exports = {
  createProductOption,
  getProductOptions,
  updateProductOption,
  deleteProductOption,
};
