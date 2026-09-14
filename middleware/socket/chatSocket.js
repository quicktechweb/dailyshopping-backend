import Conversation from "../../models/Message/Conversation.js";
import ChatMessage from "../../models/Message/ChatMessage.js";

// role অনুযায়ী room name বানানো — এভাবে নির্দিষ্ট user/seller কে message push করা যায়
const roomName = (role, id) => `${role}_${id}`;

export default function registerChatSocket(io) {
  io.on("connection", (socket) => {
    console.log("🔌 socket connected:", socket.id);

    // Client connect হওয়ার সাথে সাথে নিজের room এ join করবে
    socket.on("join", ({ role, id }) => {
      if (!role || !id) return;
      socket.join(roomName(role, id));
      socket.data.role = role;
      socket.data.id = id;
    });

    // নতুন message পাঠানো
    socket.on("send_message", async (payload, callback) => {
      try {
        const {
          conversationId,
          buyerId,
          buyerName,
          sellerId,
          sellerName,
          senderRole, // "user" | "seller"
          text,
          productId,
          productName,
          productImage,
        } = payload;

        if (!text?.trim()) return;

        let conversation = conversationId
          ? await Conversation.findById(conversationId)
          : await Conversation.findOne({ buyerId, sellerId });

        if (!conversation) {
          conversation = await Conversation.create({
            buyerId,
            buyerName,
            sellerId,
            sellerName,
            productId,
            productName,
            productImage,
          });
        }

        const message = await ChatMessage.create({
          conversationId: conversation._id,
          senderId: senderRole === "user" ? buyerId : sellerId,
          senderRole,
          text: text.trim(),
        });

        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();
        if (senderRole === "user") {
          conversation.unreadForSeller += 1;
        } else {
          conversation.unreadForBuyer += 1;
        }
        await conversation.save();

        const outgoing = {
          _id: message._id,
          conversationId: conversation._id,
          senderId: message.senderId,
          senderRole: message.senderRole,
          text: message.text,
          createdAt: message.createdAt,
        };

        // দুই পক্ষকেই realtime এ পাঠিয়ে দাও (buyer + seller)
        io.to(roomName("user", conversation.buyerId)).emit("receive_message", outgoing);
        io.to(roomName("seller", conversation.sellerId)).emit("receive_message", outgoing);

        callback?.({ success: true, conversation, message: outgoing });
      } catch (err) {
        console.error("send_message error:", err);
        callback?.({ success: false, message: "Message send failed" });
      }
    });

    // Typing indicator
    socket.on("typing", ({ conversationId, buyerId, sellerId, fromRole }) => {
      const toRole = fromRole === "user" ? "seller" : "user";
      const toId = fromRole === "user" ? sellerId : buyerId;
      io.to(roomName(toRole, toId)).emit("typing", { conversationId, fromRole });
    });

    socket.on("stop_typing", ({ conversationId, buyerId, sellerId, fromRole }) => {
      const toRole = fromRole === "user" ? "seller" : "user";
      const toId = fromRole === "user" ? sellerId : buyerId;
      io.to(roomName(toRole, toId)).emit("stop_typing", { conversationId });
    });

    // Message read mark
    socket.on("mark_read", async ({ conversationId, role }) => {
      try {
        const update = role === "user" ? { unreadForBuyer: 0 } : { unreadForSeller: 0 };
        await Conversation.findByIdAndUpdate(conversationId, update);
        await ChatMessage.updateMany(
          { conversationId, senderRole: role === "user" ? "seller" : "user" },
          { read: true }
        );
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ socket disconnected:", socket.id);
    });
  });
}