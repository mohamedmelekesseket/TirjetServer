import mongoose from "mongoose";

const maisonDhoteSchema = new mongoose.Schema(
  {
    // ── Core info ────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },

    // ── Type (the only classification needed) ────────────────────
    type: {
      type: String,
      enum: ["traditionnelle", "moderne"],
      required: [true, "Type is required"],
    },

    // ── Location ─────────────────────────────────────────────────
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    region: { type: String },
    governorate: { type: String },
    tag: { type: String }, // card label: "FOREST", "MEDINA", etc.

    // ── Pricing ──────────────────────────────────────────────────
    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: 0,
    },
    currency: { type: String, default: "TND" },
    minNights: { type: Number, default: 1 },

    // ── Contact ───────────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },

    // ── Amenities & Images ───────────────────────────────────────
    amenities: [String],
    images: [String],

    // ── Host (vendor) ────────────────────────────────────────────
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Ratings (denormalised) ────────────────────────────────────
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // ── Admin flags ───────────────────────────────────────────────
    isApproved: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    isEditorsPick: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // ── Analytics ─────────────────────────────────────────────────
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

maisonDhoteSchema.index({ name: "text", description: "text", location: "text" });

const MaisonDhote = mongoose.model("MaisonDhote", maisonDhoteSchema);
export default MaisonDhote;