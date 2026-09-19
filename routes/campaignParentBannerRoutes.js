import express from "express";
import CampaignParentBanner from "../models/CampaignParentBanner.js";

const router = express.Router();

// একটাই ডকুমেন্ট সবসময় থাকবে — না থাকলে প্রথমবার একটা খালি ডকুমেন্ট বানিয়ে দেয়
const getOrCreateBannerDoc = async () => {
  let doc = await CampaignParentBanner.findOne();
  if (!doc) {
    doc = await CampaignParentBanner.create({ images: [] });
  }
  return doc;
};

// GET /api/campaign-parent-banner
router.get("/", async (req, res) => {
  try {
    const doc = await getOrCreateBannerDoc();
    res.json(doc);
  } catch (err) {
    console.error("❌ Get parent banner error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/campaign-parent-banner/add-image
// body: { imageUrl: "https://..." }
router.post("/add-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const doc = await getOrCreateBannerDoc();
    doc.images.push(imageUrl);
    await doc.save();

    res.json(doc);
  } catch (err) {
    console.error("❌ Add parent banner image error:", err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/campaign-parent-banner/remove-image
// body: { imageUrl: "https://..." }
router.delete("/remove-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const doc = await getOrCreateBannerDoc();
    doc.images = doc.images.filter((img) => img !== imageUrl);
    await doc.save();

    res.json(doc);
  } catch (err) {
    console.error("❌ Remove parent banner image error:", err);
    res.status(400).json({ message: err.message });
  }
});

export default router;