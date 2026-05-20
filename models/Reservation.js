import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    maison:     { type: mongoose.Schema.Types.ObjectId, ref: "MaisonDhote", required: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    host:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    checkIn:    { type: Date, required: true },
    checkOut:   { type: Date, required: true },
    nights:     { type: Number, required: true },
    guests:     { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
    currency:   { type: String, default: "TND" },
    message:    { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    phone:      { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);