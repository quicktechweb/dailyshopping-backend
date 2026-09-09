import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderById,
  createBkashPayment,
  bkashCallbackHandler,
  createCODOrder,
  getMyOrders,
  getBkashPaymentStatus,
  walletPayController,
  getSellerOrders,   
  walletmobilePayController,
  updateOrderConsignment,
  updateBulkConsignment,
  cancelOrder,
  deleteOrders,
  getMyCancellations,
  requestReturn,
  getMyReturns,
  updateReturnStatus,
  getAllReturns
} from "../controllers/orderController.js";


const router = express.Router();
router.post("/orders/cod", createCODOrder);
router.post("/orders", createOrder);
router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus); // Update status
router.delete("/orders/:id", deleteOrder); // Delete order
router.delete("/ordersdata/:id", deleteOrders); // Delete order
router.get("/orders/:id", getOrderById); // single id invoice 
router.get("/my-orders", getMyOrders); // myorder
router.get("/seller-orders/:sellerId", getSellerOrders);
router.put("/orders/:id/cancel", cancelOrder);
router.get("/my-cancellations", getMyCancellations);
router.post("/orders/:id/return", requestReturn);       // ⬅️ NEW
router.get("/my-returns", getMyReturns);                 // ⬅️ NEW
router.put("/orders/:id/return-status", updateReturnStatus);
router.get("/returns", getAllReturns);

// PUT /api/orders/:id
router.put("/update-consignment/:id", updateOrderConsignment);

// Update multiple orders bulk
router.put("/bulk-consignment", updateBulkConsignment);

router.post("/orders/wallet-pay", walletPayController);
router.post("/orders/wallet-pays", walletmobilePayController);

router.get("/orders/bkash/status/:paymentID", getBkashPaymentStatus);


// Bkash payment routes
router.post("/orders/bkash/create", createBkashPayment); // create payment
router.get("/orders/bkash/callback", bkashCallbackHandler); // callback from Bkash

export default router;
