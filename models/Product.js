import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price:       { type: Number, required: true },
    solde:       Number,
    images:      [String],

    // ── L1 root category ─────────────────────────────────────────────────────
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Category",
      required: true,
    },

    // ── L2 → L3 → L4 stored as slug + name pairs ─────────────────────────────
    // Slugs are used for fast filtering; names are denormalised for display
    // without extra population queries.
    subcategoryL2: { slug: String, name: String },
    subcategoryL3: { slug: String, name: String },
    subcategoryL4: { slug: String, name: String },

    // Legacy field kept for backward compat — mirrors subcategoryL2.slug
    subcategory: { slug: String, name: String },

    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },

    stock:       { type: Number,  default: 1 },
    isApproved:  { type: Boolean, default: true },
    isHome:      { type: Boolean, default: false },
    isReported:  { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },

    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);