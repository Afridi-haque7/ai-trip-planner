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
  history: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip", // Reference the Trip model
    },
  ],
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;