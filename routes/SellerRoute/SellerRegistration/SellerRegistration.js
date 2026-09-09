import express from "express";
import {
  registerSeller,
  loginSeller,
  resetPasswordSeller,
  getSellers,
  getSellerById,
  updateSellerStatus,
  deleteSeller,
} from "../../../controllers/SellerPartController/SellerRegistration/SellerRegistration.js";

const router = express.Router();

router.post("/register", registerSeller);
router.post("/login", loginSeller);
router.post("/reset-password", resetPasswordSeller);
router.get("/", getSellers);
router.get("/:id", getSellerById);
router.put("/:id/status", updateSellerStatus);
router.delete("/:id", deleteSeller);

export default router;