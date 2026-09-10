import mongoose from "mongoose";

const sellerFollowSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    sellerId: { type: String, required: true },
  },
  { timestamps: true }
);

sellerFollowSchema.index({ userId: 1, sellerId: 1 }, { unique: true });

export default mongoose.model("SellerFollow", sellerFollowSchema);