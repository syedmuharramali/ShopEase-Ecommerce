const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const ProductReview = require("../models/productReview.model");

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeOrderNumber = (value) =>
  String(value || "").trim().toUpperCase();

const parsePage = (value) => Math.max(Number.parseInt(value, 10) || 1, 1);
const parseLimit = (value, fallback = 8, maximum = 25) =>
  Math.min(Math.max(Number.parseInt(value, 10) || fallback, 1), maximum);

const orderContainsProduct = (order, productId) => {
  const targetId = String(productId);

  if (
    Array.isArray(order?.items) &&
    order.items.some((item) => String(item?.product || "") === targetId)
  ) {
    return true;
  }

  return String(order?.product || "") === targetId;
};

const contactMatchesOrder = (order, rawContact) => {
  const contact = String(rawContact || "").trim();
  if (!contact) return false;

  if (contact.includes("@")) {
    return normalizeEmail(order?.email) === normalizeEmail(contact);
  }

  const phone = normalizePhone(contact);
  return Boolean(phone) && normalizePhone(order?.phoneNumber) === phone;
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productExists = await Product.exists({
      _id: productId,
      status: "active",
    });

    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 8, 20);
    const skip = (page - 1) * limit;
    const filter = { product: productId, status: "approved" };

    const [reviews, total, ratingData] = await Promise.all([
      ProductReview.find(filter)
        .select(
          "reviewerName rating title comment verifiedPurchase createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductReview.countDocuments(filter),
      ProductReview.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
            five: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            four: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            three: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            two: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            one: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const aggregate = ratingData[0] || {};
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      reviews,
      summary: {
        averageRating: aggregate.averageRating
          ? Number(aggregate.averageRating.toFixed(1))
          : 0,
        reviewCount: aggregate.reviewCount || 0,
        distribution: {
          5: aggregate.five || 0,
          4: aggregate.four || 0,
          3: aggregate.three || 0,
          2: aggregate.two || 0,
          1: aggregate.one || 0,
        },
      },
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
    console.error("getProductReviews error:", error);
    return res.status(500).json({ message: "Failed to load product reviews" });
  }
};

const createProductReview = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    })
      .select("_id name")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const orderNumber = normalizeOrderNumber(req.body?.orderNumber);
    const contact = String(req.body?.contact || "").trim();
    const reviewerName = String(req.body?.reviewerName || "").trim();
    const title = String(req.body?.title || "").trim();
    const comment = String(req.body?.comment || "").trim();
    const rating = Number(req.body?.rating);

    if (!orderNumber || !contact) {
      return res.status(400).json({
        message: "Order number and checkout email or phone are required",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Choose a rating from 1 to 5" });
    }

    if (reviewerName.length > 80) {
      return res.status(400).json({ message: "Reviewer name is too long" });
    }

    if (title.length > 120) {
      return res.status(400).json({ message: "Review title is too long" });
    }

    if (comment.length < 20 || comment.length > 1500) {
      return res.status(400).json({
        message: "Review must be between 20 and 1500 characters",
      });
    }

    const order = await Order.findOne({ orderNumber }).lean();

    if (!order || !contactMatchesOrder(order, contact)) {
      return res.status(404).json({
        message: "We could not verify that delivered order with those details",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        message: "Reviews can be submitted after the order is delivered",
      });
    }

    if (!orderContainsProduct(order, productId)) {
      return res.status(404).json({
        message: "We could not verify that product in the supplied order",
      });
    }

    const duplicate = await ProductReview.findOne({
      product: productId,
      order: order._id,
    })
      .select("_id status")
      .lean();

    if (duplicate) {
      return res.status(409).json({
        message: "A review for this product has already been submitted from that order",
      });
    }

    const review = await ProductReview.create({
      product: productId,
      order: order._id,
      orderNumber,
      reviewerName: reviewerName || String(order.name || "Verified customer").trim(),
      rating,
      title,
      comment,
      verifiedPurchase: true,
      status: "pending",
    });

    return res.status(201).json({
      message: "Review submitted successfully and is awaiting approval",
      review: {
        _id: review._id,
        status: review.status,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A review for this product has already been submitted from that order",
      });
    }

    console.error("createProductReview error:", error);
    return res.status(500).json({ message: "Failed to submit review" });
  }
};

const getAdminReviews = async (req, res) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 20, 50);
    const skip = (page - 1) * limit;
    const status = String(req.query.status || "").trim().toLowerCase();
    const filter = {};

    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const [reviews, total] = await Promise.all([
      ProductReview.find(filter)
        .populate("product", "name slug")
        .select(
          "product orderNumber reviewerName rating title comment verifiedPurchase status moderatedAt createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductReview.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      reviews,
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
    console.error("getAdminReviews error:", error);
    return res.status(500).json({ message: "Failed to load reviews" });
  }
};

const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const status = String(req.body?.status || "").trim().toLowerCase();

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Review status must be approved or rejected",
      });
    }

    const review = await ProductReview.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          status,
          moderatedBy: req.user?._id || null,
          moderatedAt: new Date(),
        },
      },
      { returnDocument: "after", runValidators: true }
    )
      .populate("product", "name slug")
      .lean();

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.status(200).json({
      message: `Review ${status}`,
      review,
    });
  } catch (error) {
    console.error("moderateReview error:", error);
    return res.status(500).json({ message: "Failed to update review" });
  }
};

module.exports = {
  getProductReviews,
  createProductReview,
  getAdminReviews,
  moderateReview,
};