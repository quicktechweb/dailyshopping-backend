import UserData from "../models/User.js";
import ReferralSetting from "../models/RefferalSystem.js";

// user ke _id / userId / phone-email diye khuje ber kora
export const findUserForReferral = async ({ userDocId, userId } = {}) => {
  try {
    if (userDocId) {
      const u = await UserData.findById(userDocId);
      if (u) return u;
    }
    if (userId) {
      const u = await UserData.findOne({ userId });
      if (u) return u;
    }
  
  } catch (err) {
    console.error("findUserForReferral error:", err.message);
  }
  return null;
};

// koto point/taka off hobe calculate kore (DB write hoy na)
export const calculateReferralRedemption = async (user, grandTotal) => {
  const empty = { pointsUsed: 0, amount: 0, takaPerPoint: 0, availablePoints: 0 };
  if (!user) return empty;

  const settings = await ReferralSetting.getSettings();
  const takaPerPoint = settings.takaPerPoint || 0;
  const availablePoints = user.referralBalance || 0;

  if (takaPerPoint <= 0 || availablePoints <= 0 || !grandTotal || grandTotal <= 0) {
    return { pointsUsed: 0, amount: 0, takaPerPoint, availablePoints };
  }

  const rawAmount = availablePoints * takaPerPoint;
  const cappedAmount = Math.min(rawAmount, grandTotal); // total-er beshi off hobe na
  const pointsUsed = Math.floor(cappedAmount / takaPerPoint);
  const amount = Number((pointsUsed * takaPerPoint).toFixed(2));

  return { pointsUsed, amount, takaPerPoint, availablePoints };
};

// order confirm howar por asol point ta balance theke minus kore history record kore
export const commitReferralRedemption = async (user, redemption, orderId) => {
  const { pointsUsed, amount } = redemption || {};
  if (!user || !pointsUsed || pointsUsed <= 0) return user;

  user.referralBalance = Math.max(0, (user.referralBalance || 0) - pointsUsed);
  user.referralHistory.push({
    type: "redeemed",
    amount: -pointsUsed,
    takaAmount: amount || 0,
    orderId: orderId || null,
  });
  await user.save();
  return user;
};

// order cancel hole point ferot deya
export const refundReferralRedemption = async (order) => {
  if (!order?.referralRedeem?.used) return null;
  if (order.referralRedeem.refunded) return null;
  if (!order.referralRedeem.pointsUsed || order.referralRedeem.pointsUsed <= 0) return null;

  const user = await findUserForReferral({ userId: order.userId,  });
  if (!user) return null;

  user.referralBalance = (user.referralBalance || 0) + order.referralRedeem.pointsUsed;
  user.referralHistory.push({
    type: "refunded",
    amount: order.referralRedeem.pointsUsed,
    takaAmount: order.referralRedeem.amount,
    orderId: order._id,
  });
  await user.save();

  order.referralRedeem.refunded = true;
  order.referralRedeem.refundedAt = new Date();
  return user;
};