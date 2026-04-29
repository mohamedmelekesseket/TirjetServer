import mongoose from "mongoose";

const productViewSchema = new mongoose.Schema(
  {
    product:    { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    identifier: { type: String, required: true }, // userId OR anonymous cookie ID
  },
  { timestamps: true }
);

// ← This is the key: unique pair = one view per person per product
productViewSchema.index({ product: 1, identifier: 1 }, { unique: true });

export default mongoose.model("ProductView", productViewSchema);