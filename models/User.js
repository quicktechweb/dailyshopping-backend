import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const walletHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ["add"], default: "add" },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const referralHistorySchema = new mongoose.Schema({
  // direct/indirect = referral bonus পাওয়ার entry (point credit)
  // redeemed        = checkout এ coins ব্যবহার করে taka off পাওয়ার entry (point debit)
  // refunded        = order cancel হলে redeemed point ফেরত দেওয়ার entry (point credit)
  type: { type: String, enum: ["direct", "indirect", "redeemed", "refunded"], required: true },
  amount: { type: Number, required: true }, // point (redeemed/refunded হলে amount = kotogula point +/-)
  takaAmount: { type: Number, default: 0 }, // redeemed/refunded হলে koto taka off hoyeche seta
  referredUser: { type: String },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  createdAt: { type: Date, default: Date.now }
});

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    landmark: { type: String, default: "" },
    province: { type: String, default: "" },
    city: { type: String, default: "" },
    zone: { type: String, default: "" },
    address: { type: String, required: true },
    label: { type: String, enum: ["HOME", "OFFICE"], default: "HOME" },
    isDefaultShipping: { type: Boolean, default: false },
    isDefaultBilling: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ নতুন: Payment Method subdocument schema
const paymentMethodSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["card", "wallet"], required: true },

    // Card fields
    cardNumber: { type: String }, // e.g. "7792******7289"
    expiryDate: { type: String }, // e.g. "08/32"
    cardBrand: { type: String, default: "visa" }, // visa / mastercard etc

    // Wallet fields
    walletProvider: { type: String }, // e.g. "bKash", "Nagad"
    walletNumber: { type: String }, // e.g. "017******518"
  },
  { timestamps: true }
);

const userDataSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    displayName: { type: String, required: true },
    referralCode: { type: String },
    userId: {
  type: String,
  unique: true,
},
     myrefferalcode: { type: String, unique: true, sparse: true },
    status: { type: String, default: "active" },
    birthday: { type: String },        // ✅ add
    gender: { type: String },
    address: { type: String },
    avatar: { type: String },

      addresses: [addressSchema],
      paymentMethods: [paymentMethodSchema],

    // newpartroles: { type: String, enum: ["user","subadmin","admin","SUPERadmin","Moderator","Support"], default:"user"},
      newpartroles: { type: String, default: "user" },
    newpartuser: { type: String, enum: ["user"], default:"user"},
  permissions: { type: Object, default: {} },
  walletBalance: { type: Number, default: 0 },
  referralBalance: { type: Number, default: 0 },
  addBkashAmount: { type: Number, default: 0 },
   referralCount: { type: Number, default: 0 }, // Direct referral count
  badge: { type: String, default: "None" },
  walletHistory: [walletHistorySchema],
  referralHistory: [referralHistorySchema],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


userDataSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) return false;

  // hashed password
  if (this.password.startsWith("$2")) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // old plain password (for migration)
  if (enteredPassword === this.password) {
    // hash it now for future
    this.password = await bcrypt.hash(enteredPassword, 12);
    await this.save();
    console.log(`Old password hashed for user ${this.phoneNumber || this.email}`);
    return true;
  }

  return false;
};

// MongoDB collection এর নাম হবে **userdata**
const UserData = mongoose.model("UserData", userDataSchema, "userdata");

export default UserData;