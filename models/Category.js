import mongoose from "mongoose";

// ─── Main category enum ──────────────────────────────────────────────────────
export const MAIN_CATEGORIES = [
  "artisanat",
  "art-et-culture",
  "evenements-et-traditions",
  "tourisme-et-loisir",
  "langue-amazigh",
  "gda",
];

// ─── Level 4 — deepest leaf ──────────────────────────────────────────────────
// e.g. "Colliers et pendentifs", "Bracelets", "Fibules tizerzai"
const level4Schema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  slug:  { type: String },
  image: { type: String, default: "" },
});

// ─── Level 3 ─────────────────────────────────────────────────────────────────
const level3Schema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String },
  image:         { type: String, default: "" },
  subcategories: { type: [level4Schema], default: [] },  // ← explicit default
});

const level2Schema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String },
  image:         { type: String, default: "" },
  subcategories: { type: [level3Schema], default: [] },  // ← explicit default
});

// ─── Level 1 — root category ─────────────────────────────────────────────────
// e.g. "Bijoux et accessoires", "Art et culture"
const categorySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Le nom de la catégorie est requis"],
      trim:     true,
      unique:   true,
    },
    slug: { type: String, unique: true, sparse: true },

    // ── Which top-level group this category belongs to ──
    mainCategory: {
      type:     String,
      enum:     MAIN_CATEGORIES,
      required: [true, "La catégorie principale est requise"],
      index:    true,
    },

    image:        { type: String, default: "" },
    description:  { type: String, trim: true, default: "" },
    subcategories: [level2Schema],
    isActive:     { type: Boolean, default: true },
    productCount: { type: Number,  default: 0 },
  },
  { timestamps: true }
);

// ─── Auto-slug ────────────────────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// AFTER:
categorySchema.pre("save", async function () {
  if (this.isModified("name")) this.slug = toSlug(this.name);

  (this.subcategories ?? []).forEach((l2) => {
    if (!l2.slug) l2.slug = toSlug(l2.name);

    (l2.subcategories ?? []).forEach((l3) => {
      if (!l3.slug) l3.slug = toSlug(l3.name);

      (l3.subcategories ?? []).forEach((l4) => {
        if (!l4.slug) l4.slug = toSlug(l4.name);
      });
    });
  });
});
export default mongoose.model("Category", categorySchema);