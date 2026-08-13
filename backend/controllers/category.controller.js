const Category = require(
  "../models/category.model"
);

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
 * GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories =
      await Category.find({
        isActive: true,
      })
        .sort({ name: 1 })
        .lean();

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error(
      "getCategories error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch categories",
    });
  }
};

/*
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const {
      name,
      description = "",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message:
          "Category name is required",
      });
    }

    const cleanName = name.trim();

    const existingCategory =
      await Category.findOne({
        name: {
          $regex:
            `^${cleanName.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}$`,
          $options: "i",
        },
      });

    if (existingCategory) {
      if (!existingCategory.isActive) {
        existingCategory.isActive = true;
        existingCategory.description =
          description.trim();

        await existingCategory.save();

        return res.status(200).json({
          message:
            "Category restored successfully",
          category:
            existingCategory,
        });
      }

      return res.status(409).json({
        message:
          "Category already exists",
      });
    }

    const baseSlug =
      slugify(cleanName);

    let slug = baseSlug;
    let counter = 1;

    while (
      await Category.exists({ slug })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category =
      await Category.create({
        name: cleanName,
        slug,
        description:
          description.trim(),
      });

    return res.status(201).json({
      message:
        "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(
      "createCategory error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create category",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
};