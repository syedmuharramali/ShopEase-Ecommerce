const Product = require("../models/product.model");
const Category = require("../models/category.model");
const ProductVariant = require(
  "../models/productVariant.model"
);
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
      search = "",
      category = "",
      brand = "",
      status = "active",
      featured,
      sort = "featured",
      minPrice,
      maxPrice,
    } = req.query;

    /*
     * ----------------------------------------
     * Pagination
     * ----------------------------------------
     */

    page = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    limit = Math.min(
      Math.max(
        parseInt(limit, 10) || 12,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    /*
     * ----------------------------------------
     * Base product filter
     * ----------------------------------------
     */

    const filter = {};

    const safeStatus = [
      "active",
      "draft",
      "archived",
    ].includes(status)
      ? status
      : "active";

    filter.status = req.allowAnyProductStatus
      ? safeStatus
      : "active";

    if (featured !== undefined) {
      filter.featured =
        featured === "true";
    }

    if (brand && brand.trim()) {
      filter.brand = new RegExp(
        `^${brand
          .trim()
          .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
        "i"
      );
    }

    /*
     * ----------------------------------------
     * Category filter
     *
     * Frontend sends category slug.
     * ----------------------------------------
     */

    if (category && category.trim()) {
      const categoryDoc =
        await Category.findOne({
          slug: category
            .trim()
            .toLowerCase(),
          isActive: true,
        })
          .select("_id")
          .lean();

      if (!categoryDoc) {
        return res.status(200).json({
          products: [],

          categories:
            await Category.find({
              isActive: true,
            })
              .select("name slug")
              .sort({ name: 1 })
              .lean(),

          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage:
              page > 1,
          },
        });
      }

      filter.category =
        categoryDoc._id;
    }

    /*
     * ----------------------------------------
     * Search
     * ----------------------------------------
     */

    if (search && search.trim()) {
      const safeSearch =
        search
          .trim()
          .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

      const searchRegex =
        new RegExp(
          safeSearch,
          "i"
        );

      filter.$or = [
        {
          name:
            searchRegex,
        },
        {
          brand:
            searchRegex,
        },
        {
          description:
            searchRegex,
        },
        {
          shortDescription:
            searchRegex,
        },
        {
          tags:
            searchRegex,
        },
      ];
    }

    /*
     * ----------------------------------------
     * Price filters
     * ----------------------------------------
     */

    const parsedMinPrice =
      minPrice !== undefined &&
      minPrice !== ""
        ? Number(minPrice)
        : null;

    const parsedMaxPrice =
      maxPrice !== undefined &&
      maxPrice !== ""
        ? Number(maxPrice)
        : null;

    /*
     * ----------------------------------------
     * Sorting
     * ----------------------------------------
     */

    let sortQuery;

    switch (sort) {
      case "price-low":
        sortQuery = {
          _priceMissing: 1,
          "storefront.minPrice": 1,
          createdAt: -1,
        };
        break;

      case "price-high":
        sortQuery = {
          _priceMissing: 1,
          "storefront.minPrice": -1,
          createdAt: -1,
        };
        break;

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
        sortQuery = {
          createdAt: -1,
        };
        break;

      case "featured":
      default:
        sortQuery = {
          featured: -1,
          createdAt: -1,
        };
        break;
    }

    /*
     * ----------------------------------------
     * Build MongoDB pipeline
     * ----------------------------------------
     */

    const pipeline = [
      /*
       * Only products matching
       * storefront filters.
       */
      {
        $match: filter,
      },

      /*
       * Get all ACTIVE variants in one
       * database operation.
       *
       * This replaces the frontend
       * making one HTTP request per product.
       */
      {
        $lookup: {
          from:
            ProductVariant
              .collection
              .name,

          let: {
            productId:
              "$_id",
          },

          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$product",
                        "$$productId",
                      ],
                    },
                    {
                      $eq: [
                        "$isActive",
                        true,
                      ],
                    },
                  ],
                },
              },
            },

            {
              $sort: {
                isDefault: -1,
                createdAt: 1,
              },
            },
          ],

          as: "activeVariants",
        },
      },

      /*
       * Build storefront information.
       */
      {
        $set: {
          storefront: {
            variants:
              "$activeVariants",

            defaultVariant: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input:
                          "$activeVariants",

                        as: "variant",

                        cond: {
                          $eq: [
                            "$$variant.isDefault",
                            true,
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },

                {
                  $arrayElemAt: [
                    "$activeVariants",
                    0,
                  ],
                },
              ],
            },

            minPrice: {
              $min:
                "$activeVariants.price",
            },

            maxPrice: {
              $max:
                "$activeVariants.price",
            },

            totalStock: {
              $sum:
                "$activeVariants.stock",
            },

            inStock: {
              $gt: [
                {
                  $sum:
                    "$activeVariants.stock",
                },
                0,
              ],
            },

            variantCount: {
              $size:
                "$activeVariants",
            },
          },
        },
      },

      /*
       * Used so products without prices
       * appear AFTER priced products.
       */
      {
        $set: {
          _priceMissing: {
            $cond: [
              {
                $eq: [
                  "$storefront.minPrice",
                  null,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    ];

    /*
     * ----------------------------------------
     * Variant-aware price filtering
     * ----------------------------------------
     */

    const priceFilter = {};

    if (
      Number.isFinite(
        parsedMinPrice
      ) &&
      parsedMinPrice >= 0
    ) {
      /*
       * Product must have at least one
       * variant whose range reaches
       * the requested minimum.
       */
      priceFilter[
        "storefront.maxPrice"
      ] = {
        ...(priceFilter[
          "storefront.maxPrice"
        ] || {}),
        $gte:
          parsedMinPrice,
      };
    }

    if (
      Number.isFinite(
        parsedMaxPrice
      ) &&
      parsedMaxPrice >= 0
    ) {
      priceFilter[
        "storefront.minPrice"
      ] = {
        ...(priceFilter[
          "storefront.minPrice"
        ] || {}),
        $lte:
          parsedMaxPrice,
      };
    }

    if (
      Object.keys(
        priceFilter
      ).length
    ) {
      pipeline.push({
        $match:
          priceFilter,
      });
    }

    /*
     * ----------------------------------------
     * Populate category
     * ----------------------------------------
     */

    pipeline.push(
      {
        $lookup: {
          from:
            Category.collection.name,

          localField:
            "category",

          foreignField:
            "_id",

          as:
            "categoryData",
        },
      },

      {
        $set: {
          category: {
            $arrayElemAt: [
              "$categoryData",
              0,
            ],
          },
        },
      },

      /*
       * Sort BEFORE pagination.
       *
       * This is important:
       * price sorting now works across
       * the entire collection.
       */
      {
        $sort:
          sortQuery,
      },

      /*
       * Get products + total count
       * using the same filtered dataset.
       */
      {
        $facet: {
          metadata: [
            {
              $count: "total",
            },
          ],

          products: [
            {
              $skip:
                skip,
            },

            {
              $limit:
                limit,
            },

            {
              $project: {
                name: 1,
                slug: 1,
                description: 1,
                shortDescription: 1,
                brand: 1,
                category: {
                  _id:
                    "$category._id",
                  name:
                    "$category.name",
                  slug:
                    "$category.slug",
                },
                images: 1,
                tags: 1,
                status: 1,
                featured: 1,
                storefront: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      }
    );

    /*
     * ----------------------------------------
     * Run products + category list
     * ----------------------------------------
     */

    const [
      result,
      categories,
    ] = await Promise.all([
      Product.aggregate(
        pipeline
      ),

      Category.find({
        isActive: true,
      })
        .select(
          "name slug"
        )
        .sort({
          name: 1,
        })
        .lean(),
    ]);

    const resultData =
      result[0] || {
        metadata: [],
        products: [],
      };

    const products =
      resultData.products || [];

    const total =
      resultData.metadata?.[0]
        ?.total || 0;

    const totalPages =
      Math.ceil(
        total / limit
      );

    /*
     * ----------------------------------------
     * Response
     * ----------------------------------------
     */

    return res.status(200).json({
      products,

      categories,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "getProducts error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch products",

      error:
        error.message,
    });
  }
};
/*
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
   const product = await Product.findOne({
  _id: req.params.id,
  ...(req.allowAnyProductStatus
    ? {}
    : { status: "active" }),
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
  status: "active",
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
const getAdminProducts = async (req, res) => {
  req.allowAnyProductStatus = true;
  return getProducts(req, res);
};

const getAdminProductById = async (
  req,
  res
) => {
  req.allowAnyProductStatus = true;
  return getProductById(req, res);
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminProductById
};