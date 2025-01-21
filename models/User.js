import mongoose from "mongoose";
import Chats from "./Trip";

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
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;