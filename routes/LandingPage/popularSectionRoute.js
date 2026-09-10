import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import PopularSection from "../../models/Landingpage/PopularSection.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const IMGBB_API_KEY = "ab454291ebee91b49b021ecac51be17c";

const uploadToImgbb = async (fileBuffer) => {
  if (!IMGBB_API_KEY) throw new Error("IMGBB_API_KEY is missing");

  const formData = new FormData();
  formData.append("image", fileBuffer.toString("base64"));

  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );
    return { url: response.data.data.url };
  } catch (err) {
    console.error("IMGBB UPLOAD ERROR:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || "Imgbb upload failed");
  }
};

// ✅ GET section (na thakle default create kore dibe)
router.get("/section", async (req, res) => {
  try {
    let section = await PopularSection.findOne();
    if (!section) section = await PopularSection.create({});
    res.json({ section });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ PUT - full section update
router.put(
  "/section",
  upload.fields([
    { name: "bannerImage" },
    { name: "qrImage" },
    { name: "appStoreImage" },
    { name: "playStoreImage" },
  ]),
  async (req, res) => {
    try {
      let section = await PopularSection.findOne();
      if (!section) section = new PopularSection();

      const {
        sectionTitle,
        bannerLink,
        downloadHeadingText,
        downloadHeadingLink,
        downloadTitle,
        downloadSubtitle,
        appStoreLink,
        playStoreLink,
      } = req.body;

      if (sectionTitle !== undefined) section.sectionTitle = sectionTitle;
      if (bannerLink !== undefined) section.bannerLink = bannerLink;
      if (downloadHeadingText !== undefined) section.downloadHeadingText = downloadHeadingText;
      if (downloadHeadingLink !== undefined) section.downloadHeadingLink = downloadHeadingLink;
      if (downloadTitle !== undefined) section.downloadTitle = downloadTitle;
      if (downloadSubtitle !== undefined) section.downloadSubtitle = downloadSubtitle;
      if (appStoreLink !== undefined) section.appStoreLink = appStoreLink;
      if (playStoreLink !== undefined) section.playStoreLink = playStoreLink;

      if (req.files?.bannerImage?.[0]) {
        const { url } = await uploadToImgbb(req.files.bannerImage[0].buffer);
        section.bannerImage = url;
      }
      if (req.files?.qrImage?.[0]) {
        const { url } = await uploadToImgbb(req.files.qrImage[0].buffer);
        section.qrImage = url;
      }
      if (req.files?.appStoreImage?.[0]) {
        const { url } = await uploadToImgbb(req.files.appStoreImage[0].buffer);
        section.appStoreImage = url;
      }
      if (req.files?.playStoreImage?.[0]) {
        const { url } = await uploadToImgbb(req.files.playStoreImage[0].buffer);
        section.playStoreImage = url;
      }

      await section.save();
      res.json({ message: "Section updated", section });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  }
);

export default router;