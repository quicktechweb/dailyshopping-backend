import mongoose from "mongoose";

const popularSectionSchema = new mongoose.Schema(
  {
    // Left side title
    sectionTitle: { type: String, default: "Popular Category" },

    // Banner
    bannerImage: { type: String, default: "" },
    bannerLink: { type: String, default: "/" },

    // "Download Daily Shopping App" heading
    downloadHeadingText: { type: String, default: "Daily Shopping App" },
    downloadHeadingLink: { type: String, default: "/" },

    // QR
    qrImage: { type: String, default: "" },

    // Download card text
    downloadTitle: { type: String, default: "Download the Daily Shopping" },
    downloadSubtitle: { type: String, default: "Scan the QR code to download" },

    // App Store
    appStoreImage: {
      type: String,
      default: "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg",
    },
    appStoreLink: { type: String, default: "" },

    // Play Store
    playStoreImage: {
      type: String,
      default: "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg",
    },
    playStoreLink: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("PopularSectionparts", popularSectionSchema);