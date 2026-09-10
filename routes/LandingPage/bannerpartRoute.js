import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import Banner from "../../models/Landingpage/Bannerpartdata.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const IMGBB_API_KEY = "ab454291ebee91b49b021ecac51be17c"; // ⚠️ .env theke ashbe

// 🔹 Helper: single image buffer imgbb te upload
const uploadToImgbb = async (fileBuffer) => {
  const formData = new FormData();
  formData.append("image", fileBuffer.toString("base64"));

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    formData,
    { headers: formData.getHeaders() }
  );

  return {
    url: response.data.data.url,
    deleteUrl: response.data.data.delete_url,
  };
};

// ✅ POST - Multiple banner upload (ekekta image = ekta banner slide)
router.post("/banners", upload.array("images", 10), async (req, res) => {
  try {
    const files = req.files;
    const { link } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploadedBanners = [];

    for (const file of files) {
      const { url, deleteUrl } = await uploadToImgbb(file.buffer);

      const banner = await Banner.create({
        images: [{ url, deleteUrl }],
        link: link || "/",
      });

      uploadedBanners.push(banner);
    }

    res.status(201).json({
      message: "Banners uploaded successfully",
      banners: uploadedBanners,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ✅ GET - Active banners fetch (frontend eta use korbe)
router.get("/banners", async (req, res) => {
  try {
    const banners = await Banner.find({ status: "active" }).sort({ createdAt: -1 });
    res.json({ banners });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ DELETE - Banner remove
router.delete("/banners/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;