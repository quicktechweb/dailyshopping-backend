import express from "express";
const router = express.Router();
import Wishlist from "../models/Wishlist.js";

// ✅ Add item to wishlist
router.post("/", async (req, res) => {
  try {
    const { userId, productId, productTitle, productPrice, productImg, productData, user } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // ✅ Check existing wishlist item by userId + productId
    let existing = await Wishlist.findOne({ userId, productId });

    if (existing) {
      // If already exists, toggle like to 1
      existing.like = 1;
      await existing.save();
      return res.status(200).json({ message: "Already in wishlist, like updated", wishlist: existing });
    }

    // Create new wishlist item with like:1
    const newItem = new Wishlist({
      userId,
      productId,
      productTitle,
      productPrice,
      productImg,
      productData,
      user,
      like: 1,
    });

    await newItem.save();
    res.status(201).json({ message: "Wishlist item added", wishlist: newItem });

  } catch (err) {
    console.error("Add Wishlist Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get wishlist by userId
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const items = await Wishlist.find({ userId }).sort({ addedAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    console.error("Get Wishlist Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ❌ REMOVE item from wishlist (by wishlist _id, but verify userId too)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const removed = await Wishlist.findOneAndDelete({ _id: id, userId });
    if (!removed) return res.status(404).json({ message: "Item not found" });

    res.status(200).json({ message: "Wishlist item deleted", removed });
  } catch (err) {
    console.error("Delete Wishlist Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;