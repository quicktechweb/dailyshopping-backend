import mongoose from "mongoose";

const sellerWalletTransactionSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    type: { type: String, enum: ["credit", "debit"], default: "credit" },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("SellerWalletTransaction", sellerWalletTransactionSchema);