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
<<<<<<< HEAD
    instagram: { type: String, default: '' },
    website:   { type: String, default: '' },
=======

>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    images: [String], // photos of work

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ArtisanProfile", artisanSchema);