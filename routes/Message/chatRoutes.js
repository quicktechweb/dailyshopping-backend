import express from "express";
import Conversation from "../../models/Message/Conversation.js";
import ChatMessage from "../../models/Message/ChatMessage.js";

const router = express.Router();

/* একটা buyer+seller conversation খুঁজে বের করো, না থাকলে বানাও */
router.post("/conversations/start", async (req, res) => {
  try {
    const { buyerId, buyerName, sellerId, sellerName, productId, productName, productImage } = req.body;

    if (!buyerId || !sellerId) {
      return res.status(400).json({ success: false, message: "buyerId ও sellerId লাগবে" });
    }

  // atomic upsert — একসাথে দুইটা request আসলেও duplicate key error হবে না
const conversation = await Conversation.findOneAndUpdate(
  { buyerId, sellerId },
  {
    $setOnInsert: { buyerId, sellerId },
    $set: {
      buyerName,
      sellerName,
      ...(productId ? { productId, productName, productImage } : {}),
    },
  },
  { new: true, upsert: true }
);

res.json({ success: true, conversation });
  } catch (err) {
    console.error("start conversation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Buyer এর সব conversation list */
router.get("/conversations/user/:buyerId", async (req, res) => {
  try {
    const conversations = await Conversation.find({ buyerId: req.params.buyerId }).sort({ lastMessageAt: -1 });
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Seller এর সব conversation list */
router.get("/conversations/seller/:sellerId", async (req, res) => {
  try {
    const conversations = await Conversation.find({ sellerId: req.params.sellerId }).sort({ lastMessageAt: -1 });
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* একটা conversation এর message history */
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const messages = await ChatMessage.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;