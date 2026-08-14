const mongoose = require("mongoose");

const Category = require("../models/category.model");
const Product = require("../models/product.model");

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function buildUniqueSlug(name, excludeId = null) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    return "";
  }

  let slug = baseSlug;
  let counter = 1;

  while (
    await Category.exists({
      slug,
      ...(excludeId
        ? {
            _id: {
              $ne: excludeId,
            },
          }
        : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

/*
 * GET /api/categories
 *
 * Public endpoint.
 * Only active categories are returned to the storefront/admin forms.
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    })
      .sort({
        name: 1,
      })
      .lean();

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("getCategories error:", error);

    return res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};

/*
 * POST /api/categories
 *
 * Admin only.
 */
const createCategory = async (req, res) => {
  try {
    const name = cleanString(req.body?.name);
    const description = cleanString(req.body?.description);

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    if (name.length > 120) {
      return res.status(400).json({
        message: "Category name is too long",
      });
    }

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${escapeRegex(name)}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      if (existingCategory.isActive) {
        return res.status(409).json({
          message: "Category already exists",
        });
      }

      existingCategory.isActive = true;
      existingCategory.description = description;

      await existingCategory.save();

      return res.status(200).json({
        message: "Category restored successfully",
        category: existingCategory,
      });
    }

    const slug = await buildUniqueSlug(name);

    if (!slug) {
      return res.status(400).json({
        message: "Category name must contain letters or numbers",
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      isActive: true,
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("createCategory error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: "Category name or slug already exists",
      });
    }

    if (error?.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;

      return res.status(400).json({
        message: firstMessage || "Please check the category details",
      });
    }

    return res.status(500).json({
      message: "Failed to create category",
    });
  }
};

/*
 * PATCH /api/categories/:id
 *
 * Admin only.
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const name =
      req.body?.name !== undefined
        ? cleanString(req.body.name)
        : category.name;

    const description =
      req.body?.description !== undefined
        ? cleanString(req.body.description)
        : category.description || "";

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    if (name.length > 120) {
      return res.status(400).json({
        message: "Category name is too long",
      });
    }

    const duplicate = await Category.findOne({
      _id: {
        $ne: id,
      },
      name: {
        $regex: `^${escapeRegex(name)}$`,
        $options: "i",
      },
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        message: "Another category already uses this name",
      });
    }

    if (name !== category.name) {
      const slug = await buildUniqueSlug(name, id);

      if (!slug) {
        return res.status(400).json({
          message: "Category name must contain letters or numbers",
        });
      }

      category.slug = slug;
    }

    category.name = name;
    category.description = description;

    await category.save();

    return res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("updateCategory error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: "Category name or slug already exists",
      });
    }

    if (error?.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;

      return res.status(400).json({
        message: firstMessage || "Please check the category details",
      });
    }

    return res.status(500).json({
      message: "Failed to update category",
    });
  }
};

/*
 * DELETE /api/categories/:id
 *
 * Soft archive.
 *
 * A category cannot be archived while a non-archived product
 * still uses it. This prevents existing product forms/storefront
 * data from pointing at a hidden category.
 */
const archiveCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const productsUsingCategory = await Product.countDocuments({
      category: id,
      status: {
        $ne: "archived",
      },
    });

    if (productsUsingCategory > 0) {
      return res.status(409).json({
        message:
          productsUsingCategory === 1
            ? "This category is still used by 1 product. Move or archive that product first."
            : `This category is still used by ${productsUsingCategory} products. Move or archive those products first.`,
      });
    }

    category.isActive = false;

    await category.save();

    return res.status(200).json({
      message: "Category archived successfully",
    });
  } catch (error) {
    console.error("archiveCategory error:", error);

    return res.status(500).json({
      message: "Failed to archive category",
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory,
};