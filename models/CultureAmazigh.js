import mongoose from "mongoose";

const cultureamazighSchema = new mongoose.Schema(
  {
    // ── Core info ────────────────────────────────────────────────
    Auteur : {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },

    // ── Type (the only classification needed) ────────────────────
    type: {
      type: String,
      enum: ["Langue amazigh", "Événements & traditions","Symboles et motifs berbères","Musique amazigh","Patrimoine et Traditions","Agriculture amazigh","Architecture amazigh","Documentation"],
      required: [true, "Type is required"],
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


const MaisonDhote = mongoose.model("CultureAmazigh", cultureamazighSchema);
export default MaisonDhote;