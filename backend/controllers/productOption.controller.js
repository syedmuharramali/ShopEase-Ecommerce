const mongoose = require("mongoose");

const Product = require("../models/product.model");
const ProductOption = require("../models/productOption.model");
const ProductVariant = require("../models/productVariant.model");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseBoolean(value, fallback) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function cleanOptionValues(values = []) {
  const cleanedValues = [];
  const seenSlugs = new Set();

  for (let index = 0; index < values.length; index++) {
    const item = values[index];

    const value =
      typeof item === "string"
        ? item.trim()
        : typeof item?.value === "string"
          ? item.value.trim()
          : "";

    if (!value) {
      continue;
    }

    const slug = slugify(value);

    if (!slug) {
      return {
        valid: false,
        message: `Invalid option value: ${value}`,
      };
    }

    if (seenSlugs.has(slug)) {
      return {
        valid: false,
        message: `Duplicate option value: ${value}`,
      };
    }

    seenSlugs.add(slug);

    cleanedValues.push({
      source: item,
      value,
      slug,
      position:
        Number.isFinite(Number(item?.position))
          ? Number(item.position)
          : index,
      isActive:
        parseBoolean(
          item?.isActive,
          true
        ),
    });
  }

  return {
    valid: true,
    values: cleanedValues,
  };
}

async function hasActiveVariants(productId) {
  return Boolean(
    await ProductVariant.exists({
      product: productId,
      isActive: true,
    })
  );
}

async function hasActiveVariantUsingOption(
  productId,
  optionId
) {
  return Boolean(
    await ProductVariant.exists({
      product: productId,
      isActive: true,
      selectedOptions: {
        $elemMatch: {
          optionId,
        },
      },
    })
  );
}

async function getActiveVariantsUsingValues(
  productId,
  optionId,
  valueIds
) {
  if (!valueIds.length) {
    return [];
  }

  return ProductVariant.find({
    product: productId,
    isActive: true,
    selectedOptions: {
      $elemMatch: {
        optionId,
        valueId: {
          $in: valueIds,
        },
      },
    },
  })
    .select(
      "_id sku title selectedOptions isDefault"
    )
    .lean();
}

async function syncVariantOptionSnapshots(
  productId,
  option
) {
  /*
   * Variant selectedOptions store human-readable snapshots
   * (optionName and value) as well as stable IDs.
   *
   * When an admin renames an option/value, keep every
   * existing variant snapshot in sync.
   */
  await ProductVariant.updateMany(
    {
      product: productId,
      "selectedOptions.optionId":
        option._id,
    },
    {
      $set: {
        "selectedOptions.$[selected].optionName":
          option.name,
      },
    },
    {
      arrayFilters: [
        {
          "selected.optionId":
            option._id,
        },
      ],
    }
  );

  for (const value of option.values || []) {
    await ProductVariant.updateMany(
      {
        product: productId,
        selectedOptions: {
          $elemMatch: {
            optionId:
              option._id,
            valueId:
              value._id,
          },
        },
      },
      {
        $set: {
          "selectedOptions.$[selected].value":
            value.value,
        },
      },
      {
        arrayFilters: [
          {
            "selected.optionId":
              option._id,
            "selected.valueId":
              value._id,
          },
        ],
      }
    );
  }
}

/*
 * POST /api/products/:productId/options
 *
 * Create an option such as:
 *
 * Color → Black, White, Red
 * Size  → 40, 41, 42, 43
 */
const createProductOption = async (
  req,
  res
) => {
  try {
    const { productId } =
      req.params;

    const {
      name,
      values = [],
      position = 0,
    } = req.body;

    if (
      !isValidObjectId(productId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product ID",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message:
          "Option name is required",
      });
    }

    if (name.trim().length > 120) {
      return res.status(400).json({
        message:
          "Option name is too long",
      });
    }

    if (!Array.isArray(values)) {
      return res.status(400).json({
        message:
          "Values must be an array",
      });
    }

    const product =
      await Product.findById(
        productId
      )
        .select("_id")
        .lean();

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found",
      });
    }

    /*
     * Adding a new active option after variants already exist
     * would instantly make every existing variant incomplete.
     *
     * Keep the catalog safe: define options first, variants second.
     */
    if (
      await hasActiveVariants(
        productId
      )
    ) {
      return res.status(409).json({
        message:
          "Cannot add a new product option while active variants already exist. Add all options before creating variants.",
      });
    }

    const slug =
      slugify(name);

    if (!slug) {
      return res.status(400).json({
        message:
          "Invalid option name",
      });
    }

    const existingOption =
      await ProductOption.findOne({
        product: productId,
        slug,
      })
        .select("_id isActive")
        .lean();

    if (existingOption) {
      return res.status(409).json({
        message:
          `Option "${name.trim()}" already exists for this product`,
      });
    }

    const cleaned =
      cleanOptionValues(values);

    if (!cleaned.valid) {
      return res.status(400).json({
        message:
          cleaned.message,
      });
    }

    const activeValues =
      cleaned.values.filter(
        (item) =>
          item.isActive !== false
      );

    if (!activeValues.length) {
      return res.status(400).json({
        message:
          "An active product option must have at least one active value",
      });
    }

    const normalizedPosition =
      Number(position);

    if (
      !Number.isFinite(
        normalizedPosition
      ) ||
      normalizedPosition < 0
    ) {
      return res.status(400).json({
        message:
          "Position must be a non-negative number",
      });
    }

    const option =
      await ProductOption.create({
        product: productId,
        name: name.trim(),
        slug,
        values:
          cleaned.values.map(
            (item) => ({
              value:
                item.value,
              slug:
                item.slug,
              position:
                item.position,
              isActive:
                item.isActive,
            })
          ),
        position:
          normalizedPosition,
        isActive: true,
      });

    return res.status(201).json({
      message:
        "Product option created successfully",
      option,
    });
  } catch (error) {
    console.error(
      "createProductOption error:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "This product option already exists",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create product option",
    });
  }
};

/*
 * GET /api/products/:productId/options
 */
const getProductOptions = async (
  req,
  res
) => {
  try {
    const { productId } =
      req.params;

    if (
      !isValidObjectId(productId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product ID",
      });
    }

    const product =
      await Product.exists({
        _id: productId,
      });

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found",
      });
    }

    const options =
      await ProductOption.find({
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
      message:
        "Failed to fetch product options",
    });
  }
};

/*
 * PATCH /api/products/:productId/options/:optionId
 *
 * Safe updates:
 * - option rename → variant snapshots updated
 * - value rename  → variant snapshots updated
 * - value removal blocked while active variants use it
 * - option deactivation blocked while active variants use it
 */
const updateProductOption = async (
  req,
  res
) => {
  try {
    const {
      productId,
      optionId,
    } = req.params;

    if (
      !isValidObjectId(productId) ||
      !isValidObjectId(optionId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product or option ID",
      });
    }

    const product =
      await Product.exists({
        _id: productId,
      });

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found",
      });
    }

    const option =
      await ProductOption.findOne({
        _id: optionId,
        product: productId,
      });

    if (!option) {
      return res.status(404).json({
        message:
          "Product option not found",
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
          message:
            "Option name must be a valid string",
        });
      }

      if (name.trim().length > 120) {
        return res.status(400).json({
          message:
            "Option name is too long",
        });
      }

      const newSlug =
        slugify(name);

      if (!newSlug) {
        return res.status(400).json({
          message:
            "Invalid option name",
        });
      }

      const duplicate =
        await ProductOption.findOne({
          product: productId,
          slug: newSlug,
          _id: {
            $ne: optionId,
          },
        })
          .select("_id")
          .lean();

      if (duplicate) {
        return res.status(409).json({
          message:
            `Option "${name.trim()}" already exists for this product`,
        });
      }

      option.name =
        name.trim();

      option.slug =
        newSlug;
    }

    if (values !== undefined) {
      if (!Array.isArray(values)) {
        return res.status(400).json({
          message:
            "Values must be an array",
        });
      }

      const cleaned =
        cleanOptionValues(
          values
        );

      if (!cleaned.valid) {
        return res.status(400).json({
          message:
            cleaned.message,
        });
      }

      const existingValues =
        option.values || [];

      const existingById =
        new Map(
          existingValues.map(
            (item) => [
              item._id.toString(),
              item,
            ]
          )
        );

      const existingBySlug =
        new Map(
          existingValues.map(
            (item) => [
              item.slug,
              item,
            ]
          )
        );

      const nextValues = [];
      const submittedIds =
        new Set();

      for (
        let index = 0;
        index <
        cleaned.values.length;
        index++
      ) {
        const item =
          cleaned.values[index];

        const source =
          item.source;

        let existingValue = null;

        if (
          source &&
          typeof source === "object" &&
          source._id
        ) {
          if (
            !isValidObjectId(
              source._id
            )
          ) {
            return res.status(400).json({
              message:
                `Invalid option value ID for "${item.value}"`,
            });
          }

          existingValue =
            existingById.get(
              source._id.toString()
            );

          if (!existingValue) {
            return res.status(400).json({
              message:
                `Option value "${item.value}" does not belong to this option`,
            });
          }
        }

        /*
         * If the frontend did not send an ID,
         * reuse an existing value by slug when possible.
         */
        if (!existingValue) {
          existingValue =
            existingBySlug.get(
              item.slug
            );
        }

        if (existingValue) {
          existingValue.value =
            item.value;

          existingValue.slug =
            item.slug;

          existingValue.position =
            item.position;

          existingValue.isActive =
            item.isActive;

          submittedIds.add(
            existingValue._id.toString()
          );

          nextValues.push(
            existingValue
          );
        } else {
          nextValues.push({
            value:
              item.value,
            slug:
              item.slug,
            position:
              item.position,
            isActive:
              item.isActive,
          });
        }
      }

      /*
       * Existing values omitted from the request are soft-deactivated,
       * never physically removed.
       */
      const valuesBecomingInactive =
        [];

      for (
        const existingValue
        of existingValues
      ) {
        const id =
          existingValue._id.toString();

        const nextEntry =
          nextValues.find(
            (item) =>
              item._id &&
              item._id.toString() === id
          );

        const remainsActive =
          nextEntry
            ? nextEntry.isActive !== false
            : false;

        if (
          existingValue.isActive !== false &&
          !remainsActive
        ) {
          valuesBecomingInactive.push(
            existingValue
          );
        }

        if (!nextEntry) {
          existingValue.isActive =
            false;

          nextValues.push(
            existingValue
          );
        }
      }

      /*
       * Do not let an active storefront variant point to a value
       * that is being deactivated.
       */
      if (
        valuesBecomingInactive.length
      ) {
        const affectedVariants =
          await getActiveVariantsUsingValues(
            productId,
            option._id,
            valuesBecomingInactive.map(
              (value) =>
                value._id
            )
          );

        if (
          affectedVariants.length
        ) {
          const affectedValueNames =
            valuesBecomingInactive
              .map(
                (value) =>
                  value.value
              )
              .join(", ");

          return res.status(409).json({
            message:
              `Cannot remove/deactivate ${option.name} value(s): ${affectedValueNames}. Active variants still use them. Edit or archive those variants first.`,
          });
        }
      }

      const resultingActiveValues =
        nextValues.filter(
          (item) =>
            item.isActive !== false
        );

      const nextOptionActive =
        parseBoolean(
          isActive,
          option.isActive
        );

      if (
        nextOptionActive &&
        !resultingActiveValues.length
      ) {
        return res.status(400).json({
          message:
            "An active product option must have at least one active value",
        });
      }

      option.values =
        nextValues;
    }

    if (position !== undefined) {
      const normalizedPosition =
        Number(position);

      if (
        !Number.isFinite(
          normalizedPosition
        ) ||
        normalizedPosition < 0
      ) {
        return res.status(400).json({
          message:
            "Position must be a non-negative number",
        });
      }

      option.position =
        normalizedPosition;
    }

    if (isActive !== undefined) {
      const nextActive =
        parseBoolean(
          isActive,
          option.isActive
        );

      if (
        option.isActive !== false &&
        nextActive === false &&
        await hasActiveVariantUsingOption(
          productId,
          option._id
        )
      ) {
        return res.status(409).json({
          message:
            `Cannot deactivate "${option.name}" while active variants still use it. Edit or archive those variants first.`,
        });
      }

      if (
        nextActive &&
        !(option.values || []).some(
          (value) =>
            value.isActive !== false
        )
      ) {
        return res.status(400).json({
          message:
            "An active product option must have at least one active value",
        });
      }

      option.isActive =
        nextActive;
    }

    await option.save();

    /*
     * Keep variant optionName/value snapshots synchronized.
     * IDs stay unchanged, so option combinations remain stable.
     */
    await syncVariantOptionSnapshots(
      productId,
      option
    );

    return res.status(200).json({
      message:
        "Product option updated successfully",
      option,
    });
  } catch (error) {
    console.error(
      "updateProductOption error:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "This product option/value already exists",
      });
    }

    return res.status(500).json({
      message:
        "Failed to update product option",
    });
  }
};

/*
 * DELETE /api/products/:productId/options/:optionId
 *
 * Soft delete.
 */
const deleteProductOption = async (
  req,
  res
) => {
  try {
    const {
      productId,
      optionId,
    } = req.params;

    if (
      !isValidObjectId(productId) ||
      !isValidObjectId(optionId)
    ) {
      return res.status(400).json({
        message:
          "Invalid product or option ID",
      });
    }

    const option =
      await ProductOption.findOne({
        _id: optionId,
        product: productId,
      });

    if (!option) {
      return res.status(404).json({
        message:
          "Product option not found",
      });
    }

    if (
      await hasActiveVariantUsingOption(
        productId,
        option._id
      )
    ) {
      return res.status(409).json({
        message:
          `Cannot archive "${option.name}" while active variants still use it. Edit or archive those variants first.`,
      });
    }

    option.isActive = false;

    await option.save();

    return res.status(200).json({
      message:
        "Product option archived successfully",
    });
  } catch (error) {
    console.error(
      "deleteProductOption error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to archive product option",
    });
  }
};

module.exports = {
  createProductOption,
  getProductOptions,
  updateProductOption,
  deleteProductOption,
};