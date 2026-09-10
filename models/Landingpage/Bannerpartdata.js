import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    images: [
      {
        url: { type: String, required: true },
        deleteUrl: { type: String },
      },
    ],
    link: {
      type: String,
      default: "/",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bannerdailyshopping", bannerSchema);