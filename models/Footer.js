import mongoose from "mongoose";

// Platforms the admin can choose from (frontend maps each one to a react-icons icon)
export const SOCIAL_PLATFORMS = [
  "facebook",
  "twitter",
  "pinterest",
  "instagram",
  "youtube",
  "linkedin",
  "tiktok",
  "whatsapp",
  "telegram",
];

// One image entry (used for payment method logos & app store badges)
const ImageItemSchema = new mongoose.Schema(
  {
    img: { type: String, required: true }, // image URL
    alt: { type: String, default: "" },
    link: { type: String, default: "" }, // optional click-through link
  },
  { _id: false }
);

// One promo benefit line (e.g. "Up to 70% discount only on the app")
const PromoBenefitSchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      enum: ["tag", "gift", "truck"], // maps to FaTag / FaGift / FaTruck on frontend
      default: "tag",
    },
    text: { type: String, required: true },
  },
  { _id: false }
);

// One social media link (icon + URL)
const SocialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: SOCIAL_PLATFORMS, // maps to Fa* icon on frontend
      required: true,
    },
    url: { type: String, default: "#" },
  },
  { _id: false }
);

const FooterConfigSchema = new mongoose.Schema(
  {
    // ===== RIGHT COLUMN 1: Payment Method =====
    paymentMethods: {
      type: [ImageItemSchema],
      default: [],
    },

    // ===== RIGHT COLUMN 2: App Promo =====
    appPromo: {
      heading: {
        type: String,
        default: "Enjoy special benefits on the app:",
      },
      benefits: {
        type: [PromoBenefitSchema],
        default: [],
      },
      qrCodeText: {
        type: String,
        default: "Open the app by scanning the QR code or clicking the buttons below:",
      },
      qrCodeImg: { type: String, default: "" },
      storeBadges: {
        type: [ImageItemSchema], // Google Play / App Store / AppGallery badges
        default: [],
      },
      learnMoreText: { type: String, default: "Learn More →" },
      learnMoreLink: { type: String, default: "#" },
    },

    // ===== FOLLOW US: social icons + links =====
    followUs: {
      heading: { type: String, default: "Follow Us" },
      links: {
        type: [SocialLinkSchema],
        default: [],
      },
    },

    // Singleton flag — only one footer config document should exist
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Footer", FooterConfigSchema);