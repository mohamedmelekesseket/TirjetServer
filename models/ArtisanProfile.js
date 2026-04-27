import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    profilePhoto: { type: String, default: "" },
    phone:       String,
    region:      String,
    city:        String,
    rank: { type: Number, default: null }, // null = unranked
    specialite:  String,
    description: String,
    instagram:   { type: String, default: "" },
    facebook:    { type: String, default: "" },
    tiktok:      { type: String, default: "" },
    website:     { type: String, default: "" },
    experience:  Number,
    languages:   [String],
    tags:        [String],
    extra:       { type: mongoose.Schema.Types.Mixed, default: {} },
    images:      [String],
    isApproved:  { type: Boolean, default: false },
    isFeatured:  { type: Boolean, default: false },
    notes:       String,
  },
  { timestamps: true, strict: false }
);

export default mongoose.model("ArtisanProfile", artisanSchema);