import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true },   // user._id
    buyerName: { type: String, default: "" },
    sellerId: { type: String, required: true },  // seller.sellerId
    sellerName: { type: String, default: "" },

    // last chat kon product niye shuru hoyeche, ei info UI te dekhanor jonno
    productId: { type: String, default: "" },
    productName: { type: String, default: "" },
    productImage: { type: String, default: "" },

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },

    unreadForBuyer: { type: Number, default: 0 },
    unreadForSeller: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ekই buyer + seller er jonno ekta e conversation thakbe
conversationSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;