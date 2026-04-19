import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
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
      default: null, // null pour Google/Facebook
    },

    image: {
      type: String, // avatar (Google/Facebook)
    },

    provider: {
      type: String,
      enum: ["credentials", "google", "facebook"],
      default: "credentials",
    },

    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "vendor",
    },

    isVerified: {
      type: Boolean,
      default: true, // OAuth users = true direct
    },

    status: {
      type: String,
      enum: ["active", "pending", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);