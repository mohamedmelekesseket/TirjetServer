// models/favourite.model.js
import mongoose from "mongoose";

const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

// one favourite per user+product pair
favouriteSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.models.Favourite ||
  mongoose.model("Favourite", favouriteSchema);