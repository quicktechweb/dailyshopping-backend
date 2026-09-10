import express from "express";
import SellerFollow from "../models/SellerFollow.js";
import Seller from "../models/SellerPart/SellerRegistration/SellerRegistration.js";

const router = express.Router();

// Follow / Unfollow toggle (1 userId = 1 bar follow)
router.post("/toggle", async (req, res) => {
  try {
    const { userId, sellerId } = req.body;
    if (!userId || !sellerId) {
      return res.status(400).json({ message: "userId and sellerId required" });
    }

    const existing = await SellerFollow.findOne({ userId, sellerId });

    if (existing) {
      await SellerFollow.deleteOne({ _id: existing._id });
      const followerCount = await SellerFollow.countDocuments({ sellerId });
      return res.json({ following: false, followerCount });
    }

    await SellerFollow.create({ userId, sellerId });
    const followerCount = await SellerFollow.countDocuments({ sellerId });
    res.json({ following: true, followerCount });
  } catch (err) {
    if (err.code === 11000) {
      const followerCount = await SellerFollow.countDocuments({ sellerId: req.body.sellerId });
      return res.json({ following: true, followerCount });
    }
    console.error("Follow toggle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Ekta seller-er follow status + follower count
router.get("/status", async (req, res) => {
  try {
    const { userId, sellerId } = req.query;
    if (!sellerId) return res.status(400).json({ message: "sellerId required" });

    const followerCount = await SellerFollow.countDocuments({ sellerId });
    let following = false;
    if (userId) {
      following = !!(await SellerFollow.findOne({ userId, sellerId }));
    }
    res.json({ following, followerCount });
  } catch (err) {
    console.error("Follow status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// User je je store follow korse (FollowedStores page)
router.get("/my", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const follows = await SellerFollow.find({ userId }).sort({ createdAt: -1 }).lean();
    const sellerIds = follows.map((f) => f.sellerId);
    const sellers = await Seller.find({ sellerId: { $in: sellerIds } }).lean();

    const merged = follows.map((f) => {
      const seller = sellers.find((s) => s.sellerId === f.sellerId) || {};
      return {
        sellerId: f.sellerId,
        shopName: seller.shopName || "Shop",
      };
    });

    res.json({ success: true, data: merged });
  } catch (err) {
    console.error("Get my follows error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;