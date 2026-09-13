import express from "express";
import {
  registerSeller,
  loginSeller,
  resetPasswordSeller,
  getSellers,
  getSellerById,
  updateSellerStatus,
  deleteSeller,
  requestSellerVerification,
  getVerificationRequests,
  reviewSellerVerification,
} from "../../../controllers/SellerPartController/SellerRegistration/SellerRegistration.js";

const router = express.Router();

router.post("/register", registerSeller);
router.post("/login", loginSeller);
router.post("/reset-password", resetPasswordSeller);

// 🆕 Verification routes (specific paths আগে রাখা ভালো)
router.get("/verification/requests", getVerificationRequests);   // admin: list
router.post("/:id/request-verification", requestSellerVerification); // seller: request
router.put("/:id/verification", reviewSellerVerification);       // admin: approve/reject

router.get("/", getSellers);
router.get("/:id", getSellerById);
router.put("/:id/status", updateSellerStatus);
router.delete("/:id", deleteSeller);

export default router;