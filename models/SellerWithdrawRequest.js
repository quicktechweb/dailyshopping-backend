import mongoose from "mongoose";

const sellerWithdrawRequestSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true }, // Seller.sellerId (e.g. SLR-000001)
    shopName: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    paymentNumber: { type: String, required: true },
    method: {
      type: String,
      enum: ["bKash", "Nagad", "Rocket", "Bank"],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Balance snapshot at the time of request — useful for admin auditing
    walletBalanceAtRequest: { type: Number, default: 0 },
    adminNote: { type: String, default: "" },
    adminActionBy: { type: String, default: null },
    actionedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const SellerWithdrawRequest = mongoose.model(
  "SellerWithdrawRequest",
  sellerWithdrawRequestSchema,
  "seller_withdraw_requests"
);

export default SellerWithdrawRequest;