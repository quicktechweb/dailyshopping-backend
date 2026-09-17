import Order from "../models/Order.js";
import UserData from "../models/User.js";
import Product from "../models/Product.js";
import Seller from "../models/SellerPart/SellerRegistration/SellerRegistration.js";
import SellerWalletTransaction from "../models/SellerWalletTransaction.js";
import {
  findUserForReferral,
  calculateReferralRedemption,
  commitReferralRedemption,
  refundReferralRedemption,
} from "../utils/referralRedeem.js";
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL;
const APP_KEY = process.env.BKASH_APP_KEY;
const APP_SECRET = process.env.BKASH_APP_SECRET;
const USERNAME = process.env.BKASH_USERNAME;
const PASSWORD = process.env.BKASH_PASSWORD;


const pendingPayments = {};

// Get bKash token
export const getBkashToken = async () => {
  const res = await axios.post(
    `${BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    { app_key: APP_KEY, app_secret: APP_SECRET },
    { headers: { username: USERNAME, password: PASSWORD, "Content-Type": "application/json" } }
  );
  return res.data.id_token;
};

// Create Bkash Payment
export const createBkashPayment = async (req, res) => {
  try {
    const { amount, userPhone, customer, products, totals, userAuth,userId, isSandbox = true } = req.body;

    const idToken = await getBkashToken();

    // Build request body
    const requestBody = {
      mode: "0011",
      callbackURL: `https://serverluckyshop.luckyshop.com.bd/api/orders/bkash/callback`,
      amount: amount.toString(),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: "INV-" + Date.now(),
    };

    // Handle payerReference
    if (isSandbox) {
      requestBody.payerReference = " "; // single space looks empty in sandbox
    } else if (userPhone) {
      requestBody.payerReference = userPhone; // live: only if userPhone exists
    }

    const createRes = await axios.post(
      `${BKASH_BASE_URL}/tokenized/checkout/create`,
      requestBody,
      { headers: { authorization: idToken, "x-app-key": APP_KEY, "Content-Type": "application/json" } }
    );

    const { paymentID, bkashURL } = createRes.data;

    pendingPayments[paymentID] = { customer, products, totals, userAuth,userId, idToken, amount };

    res.json({ success: true, paymentID, bkashURL });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.response?.data || err.message });
  }
};

// Bkash Callback
export const bkashCallbackHandler = async (req, res) => {
  try {
    const { paymentID } = req.query;
    const orderData = pendingPayments[paymentID];
    if (!orderData) return res.send("Order data missing!");

    // Execute payment
    const execRes = await axios.post(
      `${BKASH_BASE_URL}/tokenized/checkout/execute`,
      { paymentID },
      { headers: { authorization: orderData.idToken, "x-app-key": APP_KEY, "Content-Type": "application/json" } }
    );

    if (execRes.data.transactionStatus !== "Completed")
      return res.send("Payment not completed!");

    // Save order in DB
   const newOrder = new Order({
  customer: orderData.customer,
  products: orderData.products,
  totals: orderData.totals,
  status: "pending",
  orderPayment: "paid",
  paymentMethod: "bKash",
  paymentInfo: {
    trxID: execRes.data.trxID,
    amount: execRes.data.amount,
    phone: orderData.customer.phone,
    date: new Date(),
  },
  userAuth: orderData.userAuth,
  userId: orderData.userId || "",
  sellerId: orderData.products?.[0]?.sellerId || "",
  mobileNumber: orderData.products?.[0]?.mobileNumber || "",
  shopName: orderData.products?.[0]?.shopName || "",
  referralRedeem: orderData.referralRedeem || { used: false, pointsUsed: 0, amount: 0, takaPerPoint: 0 }, // ⬅️ NEW
});

const savedOrder = await newOrder.save();

// ⬅️ NEW - payment confirm hoise, ekhon point commit
if (orderData.referralRedeem?.used) {
  const referralUser = await findUserForReferral({ userId: orderData.userId, userAuth: orderData.userAuth });
  if (referralUser) {
    await commitReferralRedemption(referralUser, orderData.referralRedeem, savedOrder._id);
  }
}

delete pendingPayments[paymentID];


    // 🔹 Redirect to frontend with query params
    res.redirect(`https://luckyshop.com.bd/payment-success?paymentID=${execRes.data.trxID}&orderID=${savedOrder._id}`);
  } catch (err) {
    console.error(err);
    res.send("Payment failed!");
  }
};





// Cash on Delivery Order
  export const createCODOrder = async (req, res) => {
  try {
    const { customer, products, totals, userAuth, userId, useReferralCoins } = req.body;

    let referralRedeem = { used: false, pointsUsed: 0, amount: 0, takaPerPoint: 0 };
    let referralUser = null;
    const finalTotals = { ...totals, referralDiscount: 0 };

    if (useReferralCoins !== false) {
      referralUser = await findUserForReferral({ userId, userAuth });
      const redemption = await calculateReferralRedemption(referralUser, totals?.grandtotal);
      if (redemption.pointsUsed > 0) {
        referralRedeem = {
          used: true,
          pointsUsed: redemption.pointsUsed,
          amount: redemption.amount,
          takaPerPoint: redemption.takaPerPoint,
        };
        finalTotals.referralDiscount = redemption.amount;
        finalTotals.grandtotal = Number((totals.grandtotal - redemption.amount).toFixed(2));
      }
    }

    const newOrder = new Order({
      customer,
      products,
      totals: finalTotals,
      orderPayment: "unpaid",
      status: "pending",
      paymentMethod: "Cash on Delivery",
      userAuth,
      userId: userId || "",
      date: new Date(),
      sellerId: products?.[0]?.sellerId || "",
      mobileNumber: products?.[0]?.mobileNumber || "",
      shopName: products?.[0]?.shopName || "",
      referralRedeem,
    });

    const savedOrder = await newOrder.save();

    if (referralRedeem.used && referralUser) {
      await commitReferralRedemption(referralUser, referralRedeem, savedOrder._id);
    }

    res.json({ success: true, order: savedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
};


   export const walletPayController = async (req, res) => {
  try {
    const { customer, products, totals, amount, auth, userId, useReferralCoins } = req.body;

    let user;
    if (!isNaN(auth)) user = await UserData.findOne({ phoneNumber: auth });
    else user = await UserData.findOne({ email: auth });

    if (!user) return res.json({ success: false, message: "User not found" });

    let referralRedeem = { used: false, pointsUsed: 0, amount: 0, takaPerPoint: 0 };
    const finalTotals = { ...totals, referralDiscount: 0 };
    let payableAmount = amount;

    if (useReferralCoins !== false) {
      const baseTotal = totals?.grandtotal ?? amount;
      const redemption = await calculateReferralRedemption(user, baseTotal);
      if (redemption.pointsUsed > 0) {
        referralRedeem = {
          used: true,
          pointsUsed: redemption.pointsUsed,
          amount: redemption.amount,
          takaPerPoint: redemption.takaPerPoint,
        };
        finalTotals.referralDiscount = redemption.amount;
        finalTotals.grandtotal = Number((baseTotal - redemption.amount).toFixed(2));
        payableAmount = finalTotals.grandtotal;
      }
    }

    if (user.walletBalance < payableAmount) {
      return res.json({ success: false, message: "Insufficient Wallet Balance" });
    }

    const walletBefore = user.walletBalance;
    const walletAfter = walletBefore - payableAmount;
    user.walletBalance = walletAfter;
    await user.save();

    const newOrder = await Order.create({
      customer,
      products,
      totals: finalTotals,
      paymentMethod: "wallet",
      orderPayment: "paid",
      status: "pending",
      userAuth: auth,
      userId: userId || "",
      sellerId: products?.[0]?.sellerId || "",
      mobileNumber: products?.[0]?.mobileNumber || "",
      shopName: products?.[0]?.shopName || "",
      referralRedeem,
      paymentInfo: { amount: payableAmount, date: new Date(), walletBefore, walletAfter },
    });

    if (referralRedeem.used) {
      await commitReferralRedemption(user, referralRedeem, newOrder._id);
    }

    res.json({
      success: true,
      message: "Wallet payment successful",
      order: newOrder,
      updatedWalletBalance: walletAfter,
    });
  } catch (err) {
    console.error("Wallet Pay Error:", err);
    res.json({ success: false, message: "Something went wrong" });
  }
};





// mobile wallrtpay 
export const walletmobilePayController = async (req, res) => {
  try {
    console.log("---- Incoming WALLET ORDER ----");
    console.log("BODY:", req.body);

    const { auth, cartItems, products, customer, totalAmount } = req.body;

    // FIX: Accept both cartItems or products
    const items = cartItems || products;
    console.log("ITEMS RECEIVED:", items);

    if (!auth) {
      console.log("❌ No auth");
      return res.json({ success:false, message:"Auth required" });
    }

    const user = await UserData.findOne({
      $or: [{ phoneNumber: auth }, { email: auth }]
    });

    console.log("FOUND USER:", user);

    if (!user)
      return res.json({ success:false, message:"User not found" });

    if (user.walletBalance < totalAmount) {
      console.log("❌ Insufficient balance");
      return res.json({
        success:false,
        message:"Insufficient wallet balance",
        walletBalance:user.walletBalance
      });
    }

    const beforeBalance = user.walletBalance;
    user.walletBalance -= totalAmount;
    await user.save();
    console.log("Wallet updated:", beforeBalance, "→", user.walletBalance);

    // FIXED PRODUCT MAPPING
    const formattedProducts = items.map(item => ({
      productId: item.productId,
      title: item.title,
      img: item.img,
      price: item.ProductPrice || item.price,
      quantity: item.quantity,
      subtotal: (item.ProductPrice || item.price) * item.quantity,
      selectedSize: item.selectedSize || null,
      selectedColor: item.selectedColor || null,
      sellerId: item.sellerId || "",         // ⬅️ NEW
      mobileNumber: item.mobileNumber || "",  // ⬅️ NEW
      shopName: item.shopName || "",  
    }));

    console.log("FORMATTED PRODUCTS:", formattedProducts);

    const order = await Order.create({
      customer,
      products: formattedProducts,
      totals: {
        quantity: formattedProducts.reduce((n, p) => n + p.quantity, 0),
        subtotal: formattedProducts.reduce((n, p) => n + p.subtotal, 0),
        shipping: 0,
        grandtotal: totalAmount
      },
      paymentMethod: "wallet",
      orderPayment: "paid",
      status: "pending",
      statusHistory: ["pending"],
      userAuth: auth,
      sellerId: formattedProducts?.[0]?.sellerId || "",        // ⬅️ NEW
      mobileNumber: formattedProducts?.[0]?.mobileNumber || "", // ⬅️ NEW
      shopName: formattedProducts?.[0]?.shopName || "",  
      paymentInfo: {
        method:"wallet",
        before:beforeBalance,
        after:user.walletBalance,
        amount:totalAmount,
        date:new Date()
      }
    });

    console.log("ORDER CREATED:", order);

    return res.json({
      success: true,
      message: "Order placed successfully via wallet",
      order,
      newBalance: user.walletBalance
    });

  } catch (err) {
    console.log("❌ WALLET ORDER ERROR:", err);
    return res.json({ success:false, message:"Server error", error:String(err) });
  }
};










// Create new order
export const createOrder = async (req, res) => {
  try {
    const { customer, products, totals, status,userAuth,userId  } = req.body;

    if (!customer || !products || products.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    // Default status to "pending" if not provided
    const newOrder = new Order({ customer, products, totals, status: status || "pending",userAuth,
      userId: userId || "",
       sellerId: products?.[0]?.sellerId || "",        // ⬅️ NEW
      mobileNumber: products?.[0]?.mobileNumber || "", // ⬅️ NEW
      shopName: products?.[0]?.shopName || "", 
     });
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all orders (optional, for admin)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔹 Single Order Consignment Update
export const updateOrderConsignment = async (req, res) => {
  try {
    const { consignment_id, tracking_code } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { consignment_id, tracking_code },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Single Order Updated", order });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};



// seller get data 
// ✅ Get orders that belong to a specific seller only
export const getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "sellerId is required" });
    }

    // 🔒 sudhu oi sellerId er order gulai ashbe, onno seller er order dekha jabe na
    const orders = await Order.find({ sellerId }).sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// cancel data my order user part 

// 🔴 Get only cancelled orders of a specific user
export const getMyCancellations = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const cancellations = await Order.find({
      userId,
      status: "canceled",
    }).sort({ updatedAt: -1 });

    return res.json(cancellations);
  } catch (error) {
    console.error("Error fetching cancellations:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// return  refund system user 
// 🔵 Request a return (only for delivered orders)
export const requestReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Return reason is required" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // শুধু delivered/completed অর্ডারই return করা যাবে
    if (!["delivered", "completed"].includes(order.status)) {
      return res.status(400).json({
        message: "Only delivered orders are eligible for return",
      });
    }

    if (order.returnStatus) {
      return res.status(400).json({
        message: "A return request already exists for this order",
      });
    }

    const raCode =
      "RN" + Math.floor(100000000000 + Math.random() * 900000000000).toString();

    order.returnStatus = "requested";
    order.returnReason = reason;
    order.returnNote = note || "";
    order.raCode = raCode;
    order.returnRequestedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Return requested successfully",
      order,
    });
  } catch (error) {
    console.error("Return request error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔵 Get only orders that have a return request
export const getMyReturns = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const returns = await Order.find({
      userId,
      returnStatus: { $ne: null },
    }).sort({ returnRequestedAt: -1 });

    res.json(returns);
  } catch (error) {
    console.error("Error fetching returns:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔵 (Admin/Seller) Update return status
export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnStatus } = req.body;

    const valid = ["requested", "approved", "declined", "picked_up", "received", "refunded"];
    if (!valid.includes(returnStatus)) {
      return res.status(400).json({ message: "Invalid return status" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { returnStatus },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Update return status error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔵 (Admin) Get ALL return requests, regardless of user
export const getAllReturns = async (req, res) => {
  try {
    const returns = await Order.find({
      returnStatus: { $ne: null },
    }).sort({ returnRequestedAt: -1 });

    res.json(returns);
  } catch (error) {
    console.error("Error fetching all returns:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔥 MULTIPLE Order Bulk Consignment Update
export const updateBulkConsignment = async (req, res) => {
  try {
    const { orders } = req.body; // [{id,consignment_id,tracking_code}]

    if (!orders?.length) return res.status(400).json({ message: "No orders given!" });

    const updateTasks = orders.map(o =>
      Order.findByIdAndUpdate(
        o.id,
        { consignment_id: o.consignment_id, tracking_code: o.tracking_code },
        { new: true }
      )
    );

    const updatedOrders = await Promise.all(updateTasks);

    res.json({
      message: "Bulk Consignment Updated Successfully 🎉",
      updatedOrders
    });

  } catch (err) {
    console.error("Bulk Update Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update order status
  // Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status; // 🔥 পুরনো status মনে রাখলাম

    // 🧠 Ensure pending is always included at the beginning
    if (!order.statusHistory || order.statusHistory.length === 0) {
      order.statusHistory = [order.status || "pending"];
    }

    // 🧩 Add the new status only if it's not the same as the last one
    const lastStatus = order.statusHistory[order.statusHistory.length - 1];
    if (lastStatus !== status) {
      order.statusHistory.push(status);
    }

    // ✅ Update the latest status
    order.status = status;

    // ============================
    // 🔥 STOCK ADJUST LOGIC (NEW)
    // ============================
    const adjustStock = async (products, direction) => {
      // direction: "decrease" | "increase"
      for (const item of products) {
        const productId = item.productId || item._id;
        const qty = item.quantity || 1;
        if (!productId) continue;

        const change = direction === "decrease" ? -qty : qty;

        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: change } }
        );
      }
    };

    // 🔻 status "accepted" হলে stock কমবে (আগে accepted না থাকলেই শুধু)
    if (status === "accepted" && oldStatus !== "accepted") {
      await adjustStock(order.products, "decrease");
    }

    // 🔺 status "canceled" হলে stock ফিরে বাড়বে (আগে accepted থাকলেই শুধু)
    if (status === "canceled" && oldStatus === "accepted") {
      await adjustStock(order.products, "increase");
    }
    // ============================

        // ============================
    // 💰 WALLET SETTLEMENT LOGIC (NEW)
    // ============================
    if (status === "delivered" && oldStatus !== "delivered" && !order.commissionSettled) {
      for (const item of order.products) {
        const lineTotal = (item.ProductPrice || 0) * (item.quantity || 1);

        // ✅ productwiseDiscount থাকলে সেটাই commission %, নাহলে adminCommission
        const commissionPercent =
          item.productwiseDiscount > 0 ? item.productwiseDiscount : (item.adminCommission || 0);

        const adminEarning = Number(((lineTotal * commissionPercent) / 100).toFixed(2));
        const sellerEarning = Number((lineTotal - adminEarning).toFixed(2));

        // 🔹 record এর জন্য এই লাইনেই বসিয়ে রাখা হচ্ছে
        item.adminEarning = adminEarning;
        item.sellerEarning = sellerEarning;

        // 🔹 seller এর wallet এ টাকা যোগ হচ্ছে
        if (item.sellerId) {
          const updatedSeller = await Seller.findOneAndUpdate(
            { sellerId: item.sellerId },
            { $inc: { walletBalance: sellerEarning } },
            { new: true }
          );

          if (updatedSeller) {
            await SellerWalletTransaction.create({
              sellerId: item.sellerId,
              orderId: order._id,
              type: "credit",
              amount: sellerEarning,
              note: `Order #${order.paymentId} - ${item.title}`,
              balanceAfter: updatedSeller.walletBalance,
            });
          }
        }
      }

      order.commissionSettled = true; // 🔒 দ্বিতীয়বার আর settle হবে না
    }
    // ============================


    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      status: order.status,
      statusHistory: order.statusHistory,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// Delete order
export const deleteOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete order (user can only delete their own orders)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userAuth } = req.query; // pass userAuth (email or phone) from frontend

    if (!userAuth) {
      return res.status(400).json({ message: "userAuth is required" });
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if this order belongs to the user
    if (order.userAuth !== userAuth) {
      return res.status(403).json({ message: "You are not allowed to delete this order" });
    }

    // Delete order
    await Order.findByIdAndDelete(id);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get all sellers who have at least one order (for admin "Seller Orders" list)
export const getSellersWithOrders = async (req, res) => {
  try {
    const sellers = await Order.aggregate([
      { $match: { sellerId: { $ne: "" } } },
      {
        $group: {
          _id: "$sellerId",
          shopName: { $last: "$shopName" },
          mobileNumber: { $last: "$mobileNumber" },
          totalOrders: { $sum: 1 },
          totalProducts: { $sum: { $size: "$products" } },
          totalRevenue: { $sum: "$totals.grandtotal" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { lastOrderDate: -1 } },
    ]);

    const formatted = sellers.map((s) => ({
      sellerId: s._id,
      shopName: s.shopName || "N/A",
      mobileNumber: s.mobileNumber || "",
      totalOrders: s.totalOrders,
      totalProducts: s.totalProducts,
      totalRevenue: s.totalRevenue || 0,
      lastOrderDate: s.lastOrderDate,
    }));

    res.json({ success: true, sellers: formatted });
  } catch (error) {
    console.error("Error fetching sellers with orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// // Get orders of a specific user
// export const getMyOrders = async (req, res) => {
//   try {
//     const { userAuth } = req.query; // email বা phone frontend থেকে পাঠাবে

//     if (!userAuth) {
//       return res.status(400).json({ message: "userAuth is required" });
//     }

//     const myOrders = await Order.find({ userAuth }).sort({ createdAt: -1 });

//     res.json(myOrders);
//   } catch (error) {
//     console.error("Error fetching my orders:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };



const STEADFAST_URL = "https://portal.packzy.com/api/v1";
const API_KEY = "hcpm2ucs22epe7q0j4qqaqagqf2y4yx7";
const SECRET_KEY ="56onyth1a4rwfceproj6ao1o";
// const STEADFAST_URL = process.env.STEADFAST_URL;
// const API_KEY = process.env.API_KEY;
// const SECRET_KEY = process.env.SECRET_KEY;

// ⛳ Unified courier status function (backend version)
const getUnifiedStatus = async (invoice, tracking_code, consignment_id) => {
  try {
    // 1) Check by consignment_id
    if (consignment_id) {
      const res = await axios.get(`${STEADFAST_URL}/status_by_cid/${consignment_id}`, {
        headers: { "Api-Key": API_KEY, "Secret-Key": SECRET_KEY },
      });
      if (res.data?.delivery_status) return res.data.delivery_status;
    }

    // 2) Check by invoice
    if (invoice) {
      const res = await axios.get(`${STEADFAST_URL}/status_by_invoice/${invoice}`, {
        headers: { "Api-Key": API_KEY, "Secret-Key": SECRET_KEY },
      });
      if (res.data?.delivery_status) return res.data.delivery_status;
    }

    // 3) Check by tracking_code
    if (tracking_code) {
      const res = await axios.get(`${STEADFAST_URL}/status_by_trackingcode/${tracking_code}`, {
        headers: { "Api-Key": API_KEY, "Secret-Key": SECRET_KEY },
      });
      if (res.data?.delivery_status) return res.data.delivery_status;
    }

    return "pending"; // fallback
  } catch (err) {
    console.error("❌ Status fetch failed:", err.response?.data || err);
    return "pending";
  }
};

 export const getMyOrders = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // 📦 Add courier status to each order
    const fullOrders = await Promise.all(
      orders.map(async (order) => {
        const status = await getUnifiedStatus(
          `ORD-${order._id}`,
          order.tracking_code,
          order.consignment_id
        );

        return {
          ...order.toObject(),
          delivery_status: status || "pending",
        };
      })
    );

    return res.json(fullOrders);

  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
// orderController.js

// cancelorder user 

// 🔴 Cancel order with reason (user-initiated)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ইতিমধ্যে cancel/delivered হয়ে গেলে আবার cancel করতে দেবে না
    if (["canceled", "delivered", "completed"].includes(order.status)) {
      return res.status(400).json({
        message: `This order is already ${order.status}, cannot cancel now.`,
      });
    }

    const oldStatus = order.status;

    if (!order.statusHistory || order.statusHistory.length === 0) {
      order.statusHistory = [oldStatus || "pending"];
    }
    order.statusHistory.push("canceled");

    order.status = "canceled";
    order.cancelReason = reason;
    order.cancelNote = note || "";

    if (oldStatus === "accepted") {
      for (const item of order.products) {
        const productId = item.productId || item._id;
        const qty = item.quantity || 1;
        if (!productId) continue;
        await Product.updateOne({ _id: productId }, { $inc: { stock: qty } });
      }
    }
    await refundReferralRedemption(order);

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Check Bkash payment status
// Check Bkash payment status
export const getBkashPaymentStatus = async (req, res) => {
  try {
    const { paymentID } = req.params;

    // Check memory first
    let orderData = pendingPayments[paymentID];
    if (orderData) {
      return res.json({ orderPayment: "pending", message: "Payment still pending" });
    }

    // DB check: look for either trxID or paymentID
    const order = await Order.findOne({
      $or: [
        { "paymentInfo.trxID": paymentID },
        { "paymentInfo.paymentID": paymentID } // optional, if you store paymentID
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      orderPayment: order.orderPayment, // 'paid'
      orderId: order._id,
      paymentInfo: order.paymentInfo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
