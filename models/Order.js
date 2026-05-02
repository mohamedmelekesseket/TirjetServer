import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    artisan: {                                   // ← added
      type: mongoose.Schema.Types.ObjectId,
      ref: "ArtisanProfile",
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
      },
    ],

    total: Number,

    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"], // ← removed "paid"
      default: "pending",
    },

    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
      notes: String,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "cash_on_delivery"],
      default: "cash_on_delivery",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);