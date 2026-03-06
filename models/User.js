import mongoose from "mongoose";

const Plans = Object.freeze({
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // password: {
  //   type: String,
  //   // required: true,
  // },
  googleId: {
    type: String,
    unique: true,
  },
  profileImage: {
    type: String,
  },
  subscriptionPlan: {
    type: String,
    enum: Object.values(Plans),
    default: Plans.FREE,
  },
  subscriptionEndDate: {
    type: Date,
    default: null,
  },
  // Monthly usage tracking
  // usageResetMonth stores "YYYY-MM" of the last reset (e.g. "2026-03").
  // When the current month != usageResetMonth, the counter is reset atomically.
  monthlyTripCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  usageResetMonth: {
    type: String,
    default: "",
  },
  history: [
    {
      type: String, // Store custom tripId strings
    },
  ],
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;