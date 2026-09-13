import bcrypt from "bcryptjs";
import Seller from "../../../models/SellerPart/SellerRegistration/SellerRegistration.js";
import Product from "../../../models/Product.js";

// Register new seller
export const registerSeller = async (req, res) => {
  try {
    const {
      mobileNumber, email, city, shopName, password, confirmPassword,
      nidNumber, nidFrontImg, nidBackImg, tradeLicenseNumber,
      tradeLicenseImg, tinNumber, tinCertificateImg,
    } = req.body;

    if (!mobileNumber || !email || !city || !shopName || !password || !nidNumber) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields" });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const existingSeller = await Seller.findOne({ $or: [{ mobileNumber }, { email }] });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: "A seller with this mobile number or email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🔹 Auto-generate unique Seller ID (e.g. SLR-000001)
    const sellerId = await generateSellerId();

    const newSeller = new Seller({
      sellerId,
      mobileNumber, email, city, shopName, password: hashedPassword,
      nidNumber, nidFrontImg, nidBackImg, tradeLicenseNumber,
      tradeLicenseImg, tinNumber, tinCertificateImg,
      // status defaults to "Pending" automatically — this IS the verification request
    });

    const savedSeller = await newSeller.save();
    const { password: _pw, ...sellerData } = savedSeller.toObject();

    res.status(201).json({
      success: true,
      message: "Seller registration submitted successfully. Waiting for admin verification.",
      seller: sellerData,
    });
  } catch (err) {
    console.error("Seller registration error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to register seller" });
  }
};

// 🔹 Helper — sequential unique Seller ID generate করে (SLR-000001, SLR-000002, ...)
const generateSellerId = async () => {
  const lastSeller = await Seller.findOne().sort({ createdAt: -1 });

  let nextNumber = 1;
  if (lastSeller?.sellerId) {
    const lastNumber = parseInt(lastSeller.sellerId.split("-")[1], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  const padded = String(nextNumber).padStart(6, "0");
  return `SLR-${padded}`;
};

// Seller login
export const loginSeller = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required",
      });
    }

    const seller = await Seller.findOne({ mobileNumber });
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const { password: _pw, ...sellerData } = seller.toObject();

    res.status(200).json({
      success: true,
      message: "Login successful",
      seller: sellerData,
    });
  } catch (err) {
    console.error("Seller login error:", err);
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
};

// 🔹 Reset password — শুধু mobile number দিয়ে, কোনো OTP/verification ছাড়া
export const resetPasswordSeller = async (req, res) => {
  try {
    const { mobileNumber, newPassword, confirmNewPassword } = req.body;

    if (!mobileNumber || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and new password are required",
      });
    }

    if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const seller = await Seller.findOne({ mobileNumber });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "No seller account found with this mobile number",
      });
    }

    const salt = await bcrypt.genSalt(10);
    seller.password = await bcrypt.hash(newPassword, salt);
    await seller.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to reset password",
    });
  }
};

// Get all sellers (admin use) — supports ?status=Pending to show only verification requests
export const getSellers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const sellers = await Seller.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).select("-password");
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Seller side — check my own verification status using sellerId (e.g. SLR-000001)
export const getSellerVerificationStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findOne({ sellerId }).select("sellerId shopName status");
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    res.json({
      success: true,
      sellerId: seller.sellerId,
      shopName: seller.shopName,
      status: seller.status, // "Pending" | "Approved" | "Rejected"
      isMall: seller.status === "Approved",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 Seller side — send / re-send a verification request
// (used by the "Request Verification" button on the seller dashboard)
export const requestVerification = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findOne({ sellerId });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    if (seller.status === "Approved") {
      return res.status(400).json({ success: false, message: "This shop is already verified" });
    }

    seller.status = "Pending";
    seller.verificationRequestedAt = new Date();
    await seller.save();

    res.json({
      success: true,
      message: "Verification request sent. Please wait for admin approval.",
      status: seller.status,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin approves / rejects a seller's verification request
export const updateSellerStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Approved" | "Rejected" | "Pending"

    const updated = await Seller.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // 🏬 Sync the Mall badge onto EVERY product this seller already has
    // (old ones uploaded before verification get updated too — no per-product check needed)
    await Product.updateMany(
      { sellerId: updated.sellerId },
      { isMall: status === "Approved" }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteSeller = async (req, res) => {
  try {
    await Seller.findByIdAndDelete(req.params.id);
    res.json({ message: "Seller deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🆕 Seller নিজে verification request পাঠাবে
export const requestSellerVerification = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    if (seller.verificationStatus === "Pending") {
      return res.status(400).json({ success: false, message: "Verification already pending, wait for admin review" });
    }
    if (seller.verificationStatus === "Approved") {
      return res.status(400).json({ success: false, message: "You are already verified" });
    }

    seller.verificationStatus = "Pending";
    seller.verificationRequestedAt = new Date();
    seller.verificationRejectReason = "";
    await seller.save();

    const { password: _pw, ...sellerData } = seller.toObject();
    res.json({ success: true, message: "Verification request sent to admin", seller: sellerData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🆕 Admin — সব pending verification request দেখবে
export const getVerificationRequests = async (req, res) => {
  try {
    const { status } = req.query; // ?status=Pending (optional filter)
    const filter = status ? { verificationStatus: status } : { verificationStatus: { $ne: "Not Requested" } };
    const sellers = await Seller.find(filter).select("-password").sort({ verificationRequestedAt: -1 });
    res.json({ success: true, sellers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🆕 Admin — Approve / Reject করবে
export const reviewSellerVerification = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: "approve" | "reject"
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    if (action === "approve") {
      seller.verified = true;
      seller.verificationStatus = "Approved";
      seller.verificationRejectReason = "";

      // ✅ এই seller এর সব product এ verified flag বসিয়ে দেওয়া হচ্ছে
      await Product.updateMany({ sellerId: seller.sellerId }, { $set: { verified: true } });
    } else if (action === "reject") {
      seller.verified = false;
      seller.verificationStatus = "Rejected";
      seller.verificationRejectReason = reason || "Documents not valid";

      // চাইলে reject হলে product গুলো unverified করে দিতে পারো
      await Product.updateMany({ sellerId: seller.sellerId }, { $set: { verified: false } });
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    seller.verificationReviewedAt = new Date();
    await seller.save();

    const { password: _pw, ...sellerData } = seller.toObject();
    res.json({ success: true, message: `Seller ${action}d`, seller: sellerData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};