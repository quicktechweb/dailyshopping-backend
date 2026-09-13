import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Seller from "../models/SellerPart/SellerRegistration/SellerRegistration.js";
import SellerFollow from "../models/SellerFollow.js";

const router = express.Router();

/**
 * GET /api/seller-shop/:sellerId
 * One combined API for the Seller Shop header:
 * shop info + product count + overall rating + follower count + following status
 */
router.get("/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { userId } = req.query;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: "sellerId required" });
    }

    // Shop basic info (falls back to product snapshot if seller doc not found)
    const seller = await Seller.findOne({ sellerId }).lean();

    // Product count + rating summary from all of this seller's products
    const ratingAgg = await Product.aggregate([
      { $match: { sellerId } },
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          productIds: { $addToSet: "$_id" },
          totalReviews: {
            $sum: { $cond: [{ $ifNull: ["$reviews._id", false] }, 1, 0] },
          },
          avgRating: { $avg: "$reviews.rating" },
        },
      },
    ]);

    const summary = ratingAgg[0] || { productIds: [], totalReviews: 0, avgRating: 0 };

    // Fallback shop name/mobile from a product if seller isn't registered separately
    let fallbackProduct = null;
    if (!seller) {
      fallbackProduct = await Product.findOne({ sellerId }).lean();
    }

    const followerCount = await SellerFollow.countDocuments({ sellerId });
    let following = false;
    if (userId) {
      following = !!(await SellerFollow.findOne({ userId, sellerId }));
    }

    res.json({
      success: true,
      shop: {
        sellerId,
        shopName: seller?.shopName || fallbackProduct?.shopName || "Shop",
        mobileNumber: seller?.mobileNumber || fallbackProduct?.mobileNumber || "",
        city: seller?.city || "",
        email: seller?.email || "",
      },
      productCount: summary.productIds.length,
      rating: {
        average: summary.avgRating ? Math.round(summary.avgRating * 10) / 10 : 0,
        count: summary.totalReviews,
      },
      followerCount,
      following,
    });
  } catch (err) {
    console.error("Seller shop overview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /api/seller-shop/:sellerId/reviews?rating=5&sort=newest&page=1&limit=10
 * Dynamic reviews for the Seller Reviews tab, pulled from every product
 * this seller owns, with a live 5/4/3/2/1 star breakdown.
 */
router.get("/:sellerId/reviews", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { rating, sort = "newest", page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const matchStage = { sellerId };
    const reviewMatch = rating ? { "reviews.rating": Number(rating) } : {};

    // Star breakdown (always over ALL reviews, ignoring the rating filter)
    const breakdownAgg = await Product.aggregate([
      { $match: matchStage },
      { $unwind: "$reviews" },
      { $group: { _id: "$reviews.rating", count: { $sum: 1 } } },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalReviews = 0;
    let ratingSum = 0;
    breakdownAgg.forEach((b) => {
      breakdown[b._id] = b.count;
      totalReviews += b.count;
      ratingSum += b._id * b.count;
    });
    const average = totalReviews ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;
    const satisfiedCount = breakdown[5] + breakdown[4];
    const satisfiedPercent = totalReviews ? Math.round((satisfiedCount / totalReviews) * 100) : 0;

    // Actual review list (filtered + paginated)
    const sortStage = sort === "oldest" ? { "reviews.date": 1 } : { "reviews.date": -1 };

    const reviews = await Product.aggregate([
      { $match: matchStage },
      { $unwind: "$reviews" },
      { $match: reviewMatch },
      { $sort: sortStage },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productTitle: { $ifNull: ["$reviews.productTitleSnapshot", "$title"] },
          productImg: {
            $ifNull: ["$reviews.productImgSnapshot", { $arrayElemAt: ["$images", 0] }],
          },
          variant: "$reviews.color",
          size: "$reviews.size",
          username: "$reviews.username",
          anonymous: "$reviews.anonymous",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          photos: "$reviews.photos",
          likes: "$reviews.likes",
          date: "$reviews.date",
        },
      },
    ]);

    res.json({
      success: true,
      summary: {
        average,
        totalReviews,
        satisfiedPercent,
        breakdown,
      },
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalReviews,
        totalPages: Math.ceil(totalReviews / limitNum),
      },
    });
  } catch (err) {
    console.error("Seller reviews fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;