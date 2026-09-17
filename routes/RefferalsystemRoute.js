import express from "express";
import ReferralSetting from "../models/RefferalSystem.js";
import { findUserForReferral } from "../utils/referralRedeem.js";

const router = express.Router();


router.get("/referral-settings", async (req, res) => {
  try {
    const settings = await ReferralSetting.getSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


router.put("/referral-settings", async (req, res) => {
  try {
    const { pointsPerReferral, takaPerPoint } = req.body;

    if (pointsPerReferral === undefined || takaPerPoint === undefined) {
      return res.status(400).json({
        success: false,
        message: "pointsPerReferral and takaPerPoint both are required.",
      });
    }

    if (pointsPerReferral < 0 || takaPerPoint < 0) {
      return res.status(400).json({
        success: false,
        message: "Value negative hote parbe na.",
      });
    }

    let settings = await ReferralSetting.findOne();
    if (!settings) {
      settings = new ReferralSetting();
    }

    settings.pointsPerReferral = pointsPerReferral;
    settings.takaPerPoint = takaPerPoint;
    settings.updatedBy = req.user?._id;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Referral settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/refferalsystem/redeem-info?userId=USR-xxx&grandtotal=20399
router.get("/redeem-info", async (req, res) => {
  try {
    const { userId, grandtotal } = req.query;
    const user = await findUserForReferral({ userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const settings = await ReferralSetting.getSettings();
    const takaPerPoint = settings.takaPerPoint || 0;
    const availablePoints = user.referralBalance || 0;
    const rawAmount = availablePoints * takaPerPoint;

    const gt = Number(grandtotal);
    const redeemableAmount = !isNaN(gt) && gt > 0 ? Math.min(rawAmount, gt) : rawAmount;

    return res.status(200).json({
      success: true,
      data: { availablePoints, takaPerPoint, redeemableAmount },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

