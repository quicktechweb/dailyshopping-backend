import mongoose from "mongoose";

/**
 * ReferralSetting Model
 * ei model ta singleton pattern e use hobe - shudhu 1 ta document thakbe DB te
 * jekhane admin fix kore dibe:
 *  - pointsPerReferral: 1 ta successful referral e koto point pabe
 *  - takaPerPoint: 1 point er binimoye koto taka pabe
 */
const referralSettingSchema = new mongoose.Schema(
  {
    pointsPerReferral: {
      type: Number,
      required: true,
      default: 10, // default: 1 referral = 10 point
      min: 0,
    },
    takaPerPoint: {
      type: Number,
      required: true,
      default: 1, // default: 1 point = 1 taka
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // kon admin last update korlo
    },
  },
  { timestamps: true }
);

// Helper static method: settings na thakle default create kore return korbe
referralSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const ReferralSetting = mongoose.model("ReferralSetting", referralSettingSchema);

export default ReferralSetting;