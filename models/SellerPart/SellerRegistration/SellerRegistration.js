import mongoose from "mongoose";

const sellerSchema = mongoose.Schema(
  {
    sellerId: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    city: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    nidNumber: { type: String, required: true, trim: true },
    nidFrontImg: { type: String, default: "" },
    nidBackImg: { type: String, default: "" },
    tradeLicenseNumber: { type: String, trim: true, default: "" },
    tradeLicenseImg: { type: String, default: "" },
    tinNumber: { type: String, trim: true, default: "" },
    tinCertificateImg: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
       // 🆕 Seller Verification (Badge) System
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["Not Requested", "Pending", "Approved", "Rejected"],
      default: "Not Requested",
    },
    verificationRequestedAt: { type: Date, default: null },
    verificationReviewedAt: { type: Date, default: null },
    verificationRejectReason: { type: String, default: "" },
  },
  { timestamps: true }
);

const Seller = mongoose.model("Seller", sellerSchema);
export default Seller;