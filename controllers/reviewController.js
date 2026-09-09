import axios from "axios";
import FormData from "form-data";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const IMGBB_KEY = "746adaf1da9a1a48b000bec014639aeb";

// Daraz-style rating labels
const RATING_LABELS = {
  1: "Terrible",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Delightful",
};

const uploadPhotosToImgbb = async (files = []) => {
  const urls = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("image", file.buffer.toString("base64"));

    const imgbbRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );

    urls.push(imgbbRes.data?.data?.url);
  }
  return urls.filter(Boolean);
};

// Recalculate the top-level `rating` field on a Product from its reviews array
const recalcProductRating = async (productId) => {
  const product = await Product.findById(productId).select("reviews");
  if (!product) return;

  const validRatings = product.reviews
    .map((r) => r.rating)
    .filter((r) => typeof r === "number");

  const avg =
    validRatings.length > 0
      ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
  });
};

/**
 * GET /api/reviews/pending?userId=
 * Returns every purchased line-item that is delivered/completed
 * and has not been reviewed yet by this user.
 */
export const getPendingReviews = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const orders = await Order.find({
      userId,
      status: { $in: ["delivered", "completed"] },
    }).sort({ updatedAt: -1 });

    const pending = [];

    orders.forEach((order) => {
      order.products.forEach((item) => {
        // ⚠️ Only show items that have a linked productId (needed to store the review)
        if (!item.reviewed && item.productId) {
          pending.push({
            orderId: order._id,
            itemId: item._id,
            productId: item.productId,
            title: item.title,
            img: item.img,
            color: item.selectedColor || "",
            size: item.selectedSize || "",
            quantity: item.quantity,
            price: item.ProductPrice,
            sellerId: item.sellerId || order.sellerId,
            shopName: item.shopName || order.shopName,
            deliveredOn: order.updatedAt,
            purchasedOn: order.createdAt,
          });
        }
      });
    });

    res.json({ count: pending.length, items: pending });
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/reviews/item/:orderId/:itemId
 * Returns everything needed to render the "Write Review" page for one line item.
 */
export const getReviewableItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.products.id(itemId);
    if (!item) return res.status(404).json({ message: "Order item not found" });

    if (item.reviewed) {
      return res.status(400).json({ message: "This item has already been reviewed" });
    }

    res.json({
      orderId: order._id,
      itemId: item._id,
      productId: item.productId,
      title: item.title,
      img: item.img,
      color: item.selectedColor || "",
      size: item.selectedSize || "",
      quantity: item.quantity,
      price: item.ProductPrice,
      sellerId: item.sellerId || order.sellerId,
      shopName: item.shopName || order.shopName,
      deliveredOn: order.updatedAt,
      purchasedOn: order.createdAt,
    });
  } catch (error) {
    console.error("Error fetching reviewable item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/reviews/history?userId=
 * Returns every review this user has already submitted, newest first.
 */
export const getReviewHistory = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const match = { "reviews.userId": userId };

    const results = await Product.aggregate([
      { $match: match },
      { $unwind: "$reviews" },
      { $match: match },
      { $sort: { "reviews.date": -1 } },
      {
        $project: {
          _id: 0,
          reviewId: "$reviews._id",
          productId: "$_id",
          orderId: "$reviews.orderId",
          title: { $ifNull: ["$reviews.productTitleSnapshot", "$title"] },
          img: {
            $ifNull: [
              "$reviews.productImgSnapshot",
              { $arrayElemAt: ["$images", 0] },
            ],
          },
          color: "$reviews.color",
          size: "$reviews.size",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          photos: "$reviews.photos",
          likes: "$reviews.likes",
          anonymous: "$reviews.anonymous",
          shopName: "$reviews.shopName",
          sellerRating: "$reviews.sellerRating",
          sellerComment: "$reviews.sellerComment",
          deliveryRating: "$reviews.deliveryRating",
          deliveryComment: "$reviews.deliveryComment",
          date: "$reviews.date",
        },
      },
    ]);

    const withLabels = results.map((r) => ({
      ...r,
      ratingLabel: RATING_LABELS[r.rating] || "",
    }));

    res.json({ count: withLabels.length, items: withLabels });
  } catch (error) {
    console.error("Error fetching review history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * POST /api/reviews  (multipart/form-data — field name for photos: "photos", max 6)
 * Submits a full Daraz-style review: product rating/comment/photos,
 * seller rating/comment, delivery rating/comment.
 */
export const submitReview = async (req, res) => {
  try {
    const {
      userId,
      userAuth,
      username,
      orderId,
      itemId,
      rating,
      comment,
      sellerRating,
      sellerComment,
      deliveryRating,
      deliveryComment,
      anonymous,
    } = req.body;

    if (!userId || !orderId || !itemId || !rating) {
      return res.status(400).json({
        message: "userId, orderId, itemId and rating are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🔒 Make sure this order really belongs to the reviewer
    if (order.userId !== userId) {
      return res.status(403).json({ message: "You cannot review this order" });
    }

    const item = order.products.id(itemId);
    if (!item) return res.status(404).json({ message: "Order item not found" });

    if (item.reviewed) {
      return res.status(400).json({ message: "You have already reviewed this item" });
    }

    if (!item.productId) {
      return res.status(400).json({ message: "This item has no linked product" });
    }

    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

     console.log("product type:", typeof product);
    console.log("is Mongoose doc?", product instanceof Product);
    console.log("has save?", typeof product.save);

    const isAnonymous = anonymous === "true" || anonymous === true;
    const photos = await uploadPhotosToImgbb(req.files || []);

    const newReview = {
      userId,
      userAuth: userAuth || "",
      username: isAnonymous ? "Anonymous" : username || "Anonymous",
      anonymous: isAnonymous,

      orderId: order._id,
      itemId: item._id,

      color: item.selectedColor || "",
      size: item.selectedSize || "",
      productTitleSnapshot: item.title,
      productImgSnapshot: item.img,

      rating: Number(rating),
      comment: comment || "",
      photos,

      sellerId: item.sellerId || order.sellerId || "",
      shopName: item.shopName || order.shopName || "",
      sellerRating:
        sellerRating !== undefined && sellerRating !== "" ? Number(sellerRating) : null,
      sellerComment: sellerComment || "",

      deliveryRating:
        deliveryRating !== undefined && deliveryRating !== "" ? Number(deliveryRating) : null,
      deliveryComment: deliveryComment || "",

      date: new Date(),
    };

       product.reviews.push(newReview);
    await Product.findByIdAndUpdate(product._id, {
      $push: { reviews: newReview },
    });

    item.reviewed = true;
    await Order.updateOne(
      { _id: order._id, "products._id": item._id },
      { $set: { "products.$.reviewed": true } }
    );

    await recalcProductRating(product._id);

    res.status(201).json({
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};