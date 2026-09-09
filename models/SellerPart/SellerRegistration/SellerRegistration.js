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
  },
  { timestamps: true }
);

const Seller = mongoose.model("Seller", sellerSchema);
export default Seller;