import mongoose from "mongoose";

// এটা কোনো নির্দিষ্ট campaign-এর সাথে যুক্ত না — সব campaign/promo
// সেকশনের উপরে কমন ব্যানার হিসেবে দেখানোর জন্য একটাই "parent" ডকুমেন্ট,
// যার ভেতরে একাধিক ইমেজ (array) থাকবে।
const campaignParentBannerSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("CampaignParentBanner", campaignParentBannerSchema);