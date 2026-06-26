import mongoose from "mongoose";

const formationAmazighSchema = new mongoose.Schema(
  {
    // Step 1
    nomPrenom:     { type: String, required: true, trim: true },
    genre:         { type: String, enum: ["femme", "homme"], required: true },
    trancheAge:    { type: String, enum: ["moins25", "26-40", "41-55", "plus55"], required: true },
    email:         { type: String, required: true, trim: true, lowercase: true },
    telephone:     { type: String, required: true, trim: true },
    region:        { type: String, required: true, trim: true },
    niveauEtudes:  { type: String, enum: ["secondaire", "bac", "superieur"], required: true },

    // Step 2
    niveauOral:      { type: String, enum: ["bien", "moyen", "non"], required: true },
    niveauEcrit:     { type: String, enum: ["bien", "moyen", "non"], required: true },
    niveauTifinagh:  { type: String, enum: ["oui", "moyen", "non"], required: true },

    // Step 3
    attentes: {
      type: [String],
      validate: { validator: (v) => v.length > 0, message: "At least one attente required" },
    },
    motivation: { type: String, required: true, trim: true },

    // Meta
    status: { type: String, enum: ["nouveau", "contacté", "inscrit", "refusé"], default: "nouveau" },
  },
  { timestamps: true }
);

export default mongoose.model("FormationAmazigh", formationAmazighSchema);