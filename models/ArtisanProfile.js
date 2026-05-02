import mongoose from "mongoose";

const revenueEntrySchema = new mongoose.Schema(
  {
    month:  { type: Number, required: true, min: 1, max: 12 }, // 1–12
    year:   { type: Number, required: true },
    amount: { type: Number, default: 0 },
    notes:  { type: String, default: "" },
  },
  { _id: false }
);

const artisanSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    profilePhoto: { type: String, default: "" },
    phone:        String,
    region:       String,
    city:         String,
    rank:         { type: Number, default: null },
    specialite:   String,
    description:  String,
    instagram:    { type: String, default: "" },
    facebook:     { type: String, default: "" },
    tiktok:       { type: String, default: "" },
    website:      { type: String, default: "" },
    experience:   Number,
    languages:    [String],
    tags:         [String],
    extra:        { type: mongoose.Schema.Types.Mixed, default: {} },
    images:       [String],
    isApproved:   { type: Boolean, default: false },
    isPremium:    { type: Boolean, default: false },
    notes:        String,
    revenus:      { type: [revenueEntrySchema], default: [] }, // ← changed
  },
  { timestamps: true, strict: false }
);

export default mongoose.model("ArtisanProfile", artisanSchema);