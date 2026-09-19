import express from "express";
import FooterConfig, { SOCIAL_PLATFORMS } from "../models/Footer.js";

const router = express.Router();

// ---------- helpers ----------

// Only allow safe URL schemes (blocks "javascript:" etc.)
const isSafeUrl = (u) =>
  typeof u === "string" && /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(u.trim());

// Validate + clean the followUs payload coming from the admin panel
const sanitizeFollowUs = (followUs) => {
  if (!followUs || typeof followUs !== "object") {
    return { error: "followUs object required" };
  }
  if (!Array.isArray(followUs.links)) {
    return { error: "followUs.links must be an array" };
  }

  const links = [];
  for (const item of followUs.links) {
    if (!SOCIAL_PLATFORMS.includes(item?.platform)) {
      return { error: `Invalid platform: ${item?.platform}` };
    }
    const url = (item.url || "").trim() || "#";
    if (!isSafeUrl(url)) {
      return {
        error: `Invalid URL for ${item.platform}. Use https://..., mailto:, tel: or #`,
      };
    }
    links.push({ platform: item.platform, url });
  }

  const heading = (followUs.heading || "").trim() || "Follow Us";
  return { value: { heading, links } };
};

// ✅ GET footer config (public — frontend Footer.jsx uses this)
// Auto-creates a default doc on first call so the frontend never breaks.
router.get("/", async (req, res) => {
  try {
    let config = await FooterConfig.findOne({ isActive: true });

    if (!config) {
      config = await FooterConfig.create({
        isActive: true,
        paymentMethods: [
          { img: "https://i.ibb.co.com/0ytbG6WP/download.png", alt: "PCI DSS" },
          { img: "https://i.ibb.co.com/YTJLkjNM/download-1.png", alt: "BSI" },
          { img: "https://i.ibb.co.com/BWZgnQg/Rocket.webp", alt: "Rocket" },
        ],
        appPromo: {
          heading: "Enjoy special benefits on the app:",
          benefits: [
            { icon: "tag", text: "Up to 70% discount only on the app" },
            { icon: "gift", text: "App-exclusive promotions" },
            { icon: "truck", text: "Free shipping every day" },
          ],
          qrCodeText: "Open the app by scanning the QR code or clicking the buttons below:",
          qrCodeImg: "https://i.ibb.co.com/zhnzR7d4/Playstore-Lucky.png",
          storeBadges: [
            {
              img: "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg",
              alt: "Google Play",
            },
            {
              img: "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg",
              alt: "App Store",
            },
          ],
          learnMoreText: "Learn More →",
          learnMoreLink: "#",
        },
        followUs: {
          heading: "Follow Us",
          links: [
            { platform: "facebook", url: "#" },
            { platform: "twitter", url: "#" },
            { platform: "pinterest", url: "#" },
            { platform: "instagram", url: "#" },
          ],
        },
      });
    }

    res.json({ success: true, data: config });
  } catch (err) {
    console.error("❌ Footer config fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ PUT — Admin panel updates the whole footer config (upsert)
router.put("/", async (req, res) => {
  try {
    const { paymentMethods, appPromo, followUs } = req.body;

    let config = await FooterConfig.findOne({ isActive: true });

    if (!config) {
      config = new FooterConfig({ isActive: true });
    }

    if (paymentMethods !== undefined) config.paymentMethods = paymentMethods;
    if (appPromo !== undefined) config.appPromo = { ...config.appPromo, ...appPromo };

    if (followUs !== undefined) {
      const { error, value } = sanitizeFollowUs(followUs);
      if (error) return res.status(400).json({ success: false, message: error });
      config.followUs = value;
    }

    await config.save();

    res.json({ success: true, message: "Footer updated", data: config });
  } catch (err) {
    console.error("❌ Footer config update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ PATCH — update only paymentMethods array (admin can add/remove/edit logos)
router.patch("/payment-methods", async (req, res) => {
  try {
    const { paymentMethods } = req.body;
    if (!Array.isArray(paymentMethods)) {
      return res.status(400).json({ success: false, message: "paymentMethods must be an array" });
    }

    const config = await FooterConfig.findOneAndUpdate(
      { isActive: true },
      { $set: { paymentMethods } },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Payment methods updated", data: config });
  } catch (err) {
    console.error("❌ Payment methods update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ PATCH — update only appPromo object (admin edits promo text/images/QR/badges)
router.patch("/app-promo", async (req, res) => {
  try {
    const { appPromo } = req.body;
    if (!appPromo || typeof appPromo !== "object") {
      return res.status(400).json({ success: false, message: "appPromo object required" });
    }

    const existing = await FooterConfig.findOne({ isActive: true });
    const merged = existing ? { ...existing.appPromo.toObject(), ...appPromo } : appPromo;

    const config = await FooterConfig.findOneAndUpdate(
      { isActive: true },
      { $set: { appPromo: merged } },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "App promo updated", data: config });
  } catch (err) {
    console.error("❌ App promo update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ PATCH — update only "Follow Us" (heading + social icons/links)
router.patch("/follow-us", async (req, res) => {
  try {
    const { error, value } = sanitizeFollowUs(req.body.followUs);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const config = await FooterConfig.findOneAndUpdate(
      { isActive: true },
      { $set: { followUs: value } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: "Follow Us updated", data: config });
  } catch (err) {
    console.error("❌ Follow Us update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;