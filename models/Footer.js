import mongoose from "mongoose";

const FooterSchema = new mongoose.Schema(
  {
    quickLinks: [String],
    luckyShop: [String],
    payment: [
      {
        name: String,
        icon: String,
      },
    ],
    shipping: [
      {
        label: String,
        emoji: String,
        subtitle: String,
      },
    ],
    citiesCovered: [String],
    support: {
      title: String,
    },
   boxed: {
  title: { type: String, default: "📞 Customer Support" },
  note: { type: String, default: "Get responses in your native language" },
  servicesLabel: { type: String, default: "📱 Services:" },
  phone: { type: String, default: "+8801091271236" },
  downloadAppLabel: { type: String, default: "📲 Download our App" },
  appImages: {
    apple: { type: String, default: "https://sellularr.netlify.app/images/appstore.png" },
    google: { type: String, default: "https://sellularr.netlify.app/images/playstore.png" },
  },
},

    appImages: {
      apple: String,
      google: String,
    },
    certifications: [
      {
        alt: String,
        img: String,
      },
    ],
    copyright: String,
    bottomLinks: [String],
    followUsLabel: String,
   social: [
  {
    name: String,
    icon: String,
    url: { type: String, default: "" },          // 🔥 নতুন: social media link
    status: { type: String, enum: ["active", "inactive"], default: "active" }, // 🔥 নতুন
    order: { type: Number, default: 0 },          // 🔥 নতুন: display order
  },
],
    headings: Object,
    smallText: Object,
  },
  {
    timestamps: true,       // ✅ createdAt & updatedAt
    collection: "Footer",   // ✅ fixed collection name
  }
);

export default mongoose.model("Footer", FooterSchema);
