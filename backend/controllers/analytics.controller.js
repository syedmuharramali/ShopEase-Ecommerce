const Order = require("../models/order.model.js");
const Product = require("../models/product.model.js");
const ProductVariant = require("../models/productVariant.model.js");

const clampThreshold = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(Math.floor(parsed), 0), 50);
};

const getOrderValueExpression = () => ({
  $cond: [
    { $gt: [{ $ifNull: ["$total", 0] }, 0] },
    { $ifNull: ["$total", 0] },
    { $ifNull: ["$subtotal", 0] },
  ],
});

const buildMonthBuckets = (rows, monthCount = 6) => {
  const rowMap = new Map(
    rows.map((row) => [
      `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      row,
    ])
  );

  const output = [];
  const now = new Date();

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)
    );

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const row = rowMap.get(key);

    output.push({
      key,
      label: date.toLocaleDateString("en-PK", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      sales: Number(row?.sales || 0),
      orders: Number(row?.orders || 0),
    });
  }

  return output;
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    const lowStockThreshold = clampThreshold(req.query.lowStockThreshold);
    const monthCount = 6;

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    monthStart.setUTCMonth(monthStart.getUTCMonth() - (monthCount - 1));

    const orderValue = getOrderValueExpression();

    const [
      orderOverviewRows,
      monthlyRows,
      topProductRows,
      paymentRows,
      recentOrders,
      totalProducts,
      activeProducts,
      draftProducts,
      archivedProducts,
      activeVariants,
      outOfStockVariants,
      lowStockVariantCount,
      lowStockVariants,
    ] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            nonCancelledOrders: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, 1, 0],
              },
            },
            salesValue: {
              $sum: {
                $cond: [
                  { $ne: ["$status", "cancelled"] },
                  orderValue,
                  0,
                ],
              },
            },
            deliveredSales: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered"] }, orderValue, 0],
              },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            confirmed: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
            },
            processing: {
              $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
            },
            shipped: {
              $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] },
            },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            status: { $ne: "cancelled" },
            createdAt: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            sales: { $sum: orderValue },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $project: {
            effectiveItems: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
                "$items",
                [
                  {
                    product: "$product",
                    quantity: { $ifNull: ["$quantity", 1] },
                    subtotal: { $ifNull: ["$subtotal", 0] },
                    productSnapshot: {
                      name: "Product",
                    },
                  },
                ],
              ],
            },
          },
        },
        { $unwind: "$effectiveItems" },
        {
          $match: {
            "effectiveItems.product": { $ne: null },
          },
        },
        {
          $group: {
            _id: "$effectiveItems.product",
            unitsSold: {
              $sum: { $ifNull: ["$effectiveItems.quantity", 1] },
            },
            productSales: {
              $sum: { $ifNull: ["$effectiveItems.subtotal", 0] },
            },
            snapshotName: {
              $first: "$effectiveItems.productSnapshot.name",
            },
          },
        },
        { $sort: { unitsSold: -1, productSales: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: Product.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            unitsSold: 1,
            sales: "$productSales",
            name: {
              $ifNull: [
                { $arrayElemAt: ["$product.name", 0] },
                "$snapshotName",
              ],
            },
            slug: {
              $ifNull: [{ $arrayElemAt: ["$product.slug", 0] }, ""],
            },
          },
        },
      ]),

      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $ifNull: ["$paymentMethod", "cod"] },
            orders: { $sum: 1 },
            sales: { $sum: orderValue },
          },
        },
        { $sort: { orders: -1 } },
      ]),

      Order.find({})
        .select(
          "orderNumber name status total subtotal paymentMethod payment createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      Product.countDocuments({}),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "draft" }),
      Product.countDocuments({ status: "archived" }),

      ProductVariant.countDocuments({ isActive: true }),
      ProductVariant.countDocuments({
        isActive: true,
        stock: { $lte: 0 },
      }),
      ProductVariant.countDocuments({
        isActive: true,
        stock: { $gt: 0, $lte: lowStockThreshold },
      }),

      ProductVariant.find({
        isActive: true,
        stock: { $lte: lowStockThreshold },
      })
        .select("product sku title stock price isDefault selectedOptions")
        .populate("product", "name slug status images")
        .sort({ stock: 1, updatedAt: -1 })
        .limit(12)
        .lean(),
    ]);

    const overview = orderOverviewRows[0] || {
      totalOrders: 0,
      nonCancelledOrders: 0,
      salesValue: 0,
      deliveredSales: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    const averageOrderValue =
      overview.nonCancelledOrders > 0
        ? Number(
            (
              Number(overview.salesValue || 0) /
              Number(overview.nonCancelledOrders)
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      lowStockThreshold,
      summary: {
        totalOrders: Number(overview.totalOrders || 0),
        nonCancelledOrders: Number(overview.nonCancelledOrders || 0),
        salesValue: Number(overview.salesValue || 0),
        deliveredSales: Number(overview.deliveredSales || 0),
        averageOrderValue,
        totalProducts,
        activeProducts,
        draftProducts,
        archivedProducts,
        activeVariants,
        lowStockVariants: lowStockVariantCount,
        outOfStockVariants,
      },
      orderStatuses: {
        pending: Number(overview.pending || 0),
        confirmed: Number(overview.confirmed || 0),
        processing: Number(overview.processing || 0),
        shipped: Number(overview.shipped || 0),
        delivered: Number(overview.delivered || 0),
        cancelled: Number(overview.cancelled || 0),
      },
      monthlySales: buildMonthBuckets(monthlyRows, monthCount),
      topProducts: topProductRows.map((item) => ({
        ...item,
        unitsSold: Number(item.unitsSold || 0),
        sales: Number(item.sales || 0),
      })),
      paymentMethods: paymentRows.map((item) => ({
        method: item._id || "cod",
        orders: Number(item.orders || 0),
        sales: Number(item.sales || 0),
      })),
      lowStock: lowStockVariants.map((variant) => ({
        _id: variant._id,
        product: variant.product,
        sku: variant.sku,
        title: variant.title || "",
        stock: Number(variant.stock || 0),
        price: Number(variant.price || 0),
        isDefault: Boolean(variant.isDefault),
        selectedOptions: Array.isArray(variant.selectedOptions)
          ? variant.selectedOptions
          : [],
      })),
      recentOrders,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      message: "Failed to load commerce analytics",
    });
  }
};