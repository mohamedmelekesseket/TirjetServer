import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    phone: String,
    region: String,
    specialite: String,
    description: String,
    instagram: { type: String, default: '' },
    website:   { type: String, default: '' },

    images: [String], // photos of work

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ArtisanProfile", artisanSchema);