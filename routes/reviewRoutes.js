import express from "express";
import multer from "multer";
import {
  getPendingReviews,
  getReviewableItem,
  getReviewHistory,
  submitReview,
} from "../controllers/reviewController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/reviews/pending?userId=&userAuth=
router.get("/pending", getPendingReviews);

// GET /api/reviews/history?userId=&userAuth=
router.get("/history", getReviewHistory);

// GET /api/reviews/item/:orderId/:itemId
router.get("/item/:orderId/:itemId", getReviewableItem);

// POST /api/reviews  (multipart/form-data, field "photos" up to 6 images)
router.post("/", upload.array("photos", 6), submitReview);

export default router;