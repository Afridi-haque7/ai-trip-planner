import mongoose from "mongoose";

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
  password: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    unique: true,
  },
  history: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chats", // Reference the Chats model
    },
  ],
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;