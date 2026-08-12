const Product = require("../models/product.model");
const Category = require("../models/category.model");

function filesToProductImages(
  files,
  productName,
  startPosition = 0
) {
  return (files || []).map(
    (file, index) => ({
      url: `uploads/${file.filename}`,

      alt: productName || "",

      position:
        startPosition + index,
    })
  );
}
function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function parseBoolean(value, fallback = false) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return fallback;
}

/*
 * GET /api/products
 *
 * Supports:
 * ?page=1
 * ?limit=12
 * ?search=shoe
 * ?category=footwear
 * ?brand=nike
 * ?status=active
 * ?featured=true
 * ?sort=newest
 * ?minPrice=1000
 * ?maxPrice=5000
 */
const getProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      status = "active",
      featured,
      sort = "newest",
      minPrice,
      maxPrice,
    } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(
      Math.max(parseInt(limit, 10) || 12, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {};

    /*
     * ----------------------------------------
     * Status
     * ----------------------------------------
     */

    if (status) {
      filter.status = status;
    }

    /*
     * ----------------------------------------
     * Featured
     * ----------------------------------------
     */

    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    /*
     * ----------------------------------------
     * Brand
     * ----------------------------------------
     */

    if (brand) {
      filter.brand = brand;
    }

    /*
     * ----------------------------------------
     * Category
     *
     * Accepts category slug.
     * ----------------------------------------
     */

    if (category) {
      const categoryDoc = await Category.findOne({
        slug: category.toLowerCase(),
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!categoryDoc) {
        return res.status(200).json({
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      filter.category = categoryDoc._id;
    }

    /*
     * ----------------------------------------
     * Search
     * ----------------------------------------
     */

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: searchRegex },
      ];
    }

    /*
     * ----------------------------------------
     * Price filtering
     *
     * IMPORTANT:
     *
     * Price now belongs to ProductVariant.
     *
     * We'll add proper variant-aware filtering
     * after the Variant API is implemented.
     *
     * These values are therefore not applied yet.
     * ----------------------------------------
     */

    /*
     * ----------------------------------------
     * Sorting
     * ----------------------------------------
     */

    let sortQuery = {
      createdAt: -1,
    };

    switch (sort) {
      case "oldest":
        sortQuery = {
          createdAt: 1,
        };
        break;

      case "name_asc":
        sortQuery = {
          name: 1,
        };
        break;

      case "name_desc":
        sortQuery = {
          name: -1,
        };
        break;

      case "newest":
      default:
        sortQuery = {
          createdAt: -1,
        };
        break;
    }

    /*
     * ----------------------------------------
     * Query
     * ----------------------------------------
     */

    const [products, total] =
      await Promise.all([
        Product.find(filter)
          .populate(
            "category",
            "name slug"
          )
          .select(
            "name slug shortDescription brand category images status featured createdAt"
          )
          .sort(sortQuery)
          .skip(skip)
          .limit(limit)
          .lean(),

        Product.countDocuments(filter),
      ]);

    const totalPages =
      Math.ceil(total / limit);

    return res.status(200).json({
      products,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "getProducts error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

/*
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    )
      .populate(
        "category",
        "name slug description"
      )
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(
      "getProductById error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

/*
 * GET /api/products/slug/:slug
 */
const getProductBySlug = async (req, res) => {
  try {
    const product =
      await Product.findOne({
        slug: req.params.slug.toLowerCase(),
      })
        .populate(
          "category",
          "name slug description"
        )
        .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(
      "getProductBySlug error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

/*
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description = "",
      shortDescription = "",
      brand = "",
      category,
      tags = [],
      attributes = {},
      status = "draft",
      featured = false,
    } = req.body;

    /*
     * ----------------------------------------
     * Basic validation
     * ----------------------------------------
     */

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Product name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    /*
     * ----------------------------------------
     * Verify category
     * ----------------------------------------
     */

    const categoryDoc =
      await Category.findById(category);

    if (!categoryDoc) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    /*
     * ----------------------------------------
     * Generate slug
     * ----------------------------------------
     */

    const baseSlug = slugify(name);

    let slug = baseSlug;
    let counter = 1;

    while (
      await Product.exists({ slug })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    /*
     * ----------------------------------------
     * Create product
     * ----------------------------------------
     */
    const uploadedImages = filesToProductImages(
  req.files,
  name.trim()
);

    const product =
      await Product.create({
        name: name.trim(),
        slug,
        description,
        shortDescription,
        brand,
        category: categoryDoc._id,
        images:uploadedImages,
        tags,
        attributes,
        status,
        featured:parseBoolean(featured,false),
        createdBy: req.user._id,
      });

    const populatedProduct =
      await Product.findById(product._id)
        .populate(
          "category",
          "name slug"
        )
        .lean();

    return res.status(201).json({
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(
      "createProduct error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

/*
 * PATCH /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    // Find the existing product first
    const currentProduct =
      await Product.findById(req.params.id);

    if (!currentProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Fields admin is allowed to update
    const allowedFields = [
      "name",
      "description",
      "shortDescription",
      "brand",
      "category",
      "tags",
      "attributes",
      "status",
      "featured",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // FormData sends booleans as strings
    if (updates.featured !== undefined) {
      updates.featured = parseBoolean(
        updates.featured,
        currentProduct.featured
      );
    }

    // Validate category if changed
    if (updates.category) {
      const category =
        await Category.findById(
          updates.category
        );

      if (!category) {
        return res.status(400).json({
          message: "Invalid category",
        });
      }
    }

    // Update slug if product name changes
    if (updates.name) {
      updates.name = updates.name.trim();

      if (
        updates.name !== currentProduct.name
      ) {
        const baseSlug =
          slugify(updates.name);

        let slug = baseSlug;
        let counter = 1;

        while (
          await Product.exists({
            slug,
            _id: {
              $ne: req.params.id,
            },
          })
        ) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        updates.slug = slug;
      }
    }

    // If new images were uploaded,
    // keep old images and add the new ones
    if (req.files?.length) {
      const existingImages =
        (currentProduct.images || []).map(
          (image, index) => ({
            url: image.url,
            alt:
              image.alt ||
              currentProduct.name,
            position:
              image.position ?? index,
          })
        );

      const uploadedImages =
        filesToProductImages(
          req.files,
          updates.name ||
            currentProduct.name,
          existingImages.length
        );

      updates.images = [
        ...existingImages,
        ...uploadedImages,
      ];
    }

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "category",
          "name slug"
        )
        .lean();

    return res.status(200).json({
      message:
        "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(
      "updateProduct error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update product",
      error: error.message,
    });
  }
};

/*
 * DELETE /api/products/:id
 *
 * For now this is a soft delete.
 */
const deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: "archived",
          },
        },
        {
          new: true,
        }
      );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product archived successfully",
    });
  } catch (error) {
    console.error(
      "deleteProduct error:",
      error
    );

    return res.status(500).json({
      message: "Failed to archive product",
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};