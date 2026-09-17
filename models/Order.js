import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    
    // 📦 Courier Consignment Fields (🚀 Newly Added)
    consignment_id: { type: String, default: null },
    tracking_code: { type: String, default: null },
    products: [
      {
         productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        types: String,
        ProductPrice: Number,
        purchasePrice: Number,
        quantity: Number,
        img: String,
        selectedSize: { type: String, default: null },
        selectedColor: { type: String, default: null },
         sellerId: { type: String, default: "" },        // ⬅️ NEW
    mobileNumber: { type: String, default: "" },     // ⬅️ NEW
    shopName: { type: String, default: "" }, 
    commissionSettled: { type: Boolean, default: false },
     reviewed: { type: Boolean, default: false },
     adminCommission: { type: Number, default: 0 },
    productwiseDiscount: { type: Number, default: 0 },
     adminEarning: { type: Number, default: 0 },   // এই লাইন থেকে admin কত পেয়েছে
        sellerEarning: { type: Number, default: 0 },
      },
      
    ],
    totals: {
      quantity: Number,
      subtotal: Number,
      tax: Number,
      shipping: Number,
      grandtotal: Number,
    },

    referralRedeem: {
  used: { type: Boolean, default: false },
  pointsUsed: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  takaPerPoint: { type: Number, default: 0 },
  refunded: { type: Boolean, default: false },
  refundedAt: { type: Date, default: null },
},

    commissionSettled: { type: Boolean, default: false },
   status: {
  type: String,
  enum: [
    "pending",       
    "confirmed",     
    "processing",   
    "shipped",       
    "out_for_delivery", 
    "delivered",    
    "cancelled",     
    "returned",     
    "refunded",    
    "failed",        
  ],
  default: "pending",
},
    orderPayment: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    statusHistory: {
      type: [String],
      default: ["pending"],
    },
    cancelReason: { type: String, default: null },   // ⬅️ NEW
cancelNote: { type: String, default: null }, 
returnStatus: {
  type: String,
  enum: ["requested", "approved", "declined", "picked_up", "received", "refunded", null],
  default: null,
},
returnReason: { type: String, default: null },
returnNote: { type: String, default: null },
raCode: { type: String, default: null },
returnRequestedAt: { type: Date, default: null },
    paymentId: {
      type: String,
      default: () => Math.floor(10000000 + Math.random() * 90000000).toString(), // 8 digit
      unique: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["bKash", "Cash on Delivery","wallet"],
      required: true,
    },
    paymentInfo: {
      trxID: { type: String, default: null }, // Bkash transaction ID
      amount: { type: Number, default: null }, // Paid amount
      phone: { type: String, default: null },  // Bkash phone number
      date: { type: Date, default: null },

       walletBefore: { type: Number, default: null },
  walletAfter: { type: Number, default: null }
    },
    userAuth: { type: String, required: false },
    userId: { type: String, default: "" },
    sellerId: { type: String, default: "" },       // ⬅️ NEW
    mobileNumber: { type: String, default: "" },   // ⬅️ NEW
    shopName: { type: String, default: "" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;
