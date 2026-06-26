import FormationAmazigh from "../models/FormationAmazigh.js";

// ─────────────────────────────────────────
// @desc    Submit formation amazigh form
// @route   POST /api/formation-amazigh
// @access  Public
// ─────────────────────────────────────────
export const submitForm = async (req, res) => {
  try {
    const {
      nomPrenom, genre, trancheAge, email, telephone, region, niveauEtudes,
      niveauOral, niveauEcrit, niveauTifinagh, attentes, motivation,
    } = req.body;

    // Basic validation
    const required = { nomPrenom, genre, trancheAge, email, telephone, region, niveauEtudes, niveauOral, niveauEcrit, niveauTifinagh, motivation };
    const missing = Object.entries(required)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      return res.status(400).json({ message: "Champs manquants", fields: missing });
    }

    if (!attentes || attentes.length === 0) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins une attente" });
    }

    const form = await FormationAmazigh.create({
      nomPrenom, genre, trancheAge, email, telephone, region, niveauEtudes,
      niveauOral, niveauEcrit, niveauTifinagh, attentes, motivation,
    });

    res.status(201).json({ message: "Formulaire soumis avec succès", id: form._id });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get all form submissions (admin)
// @route   GET /api/formation-amazigh
// @access  Private / Admin
// ─────────────────────────────────────────
export const getAllForms = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const total = await FormationAmazigh.countDocuments(filter);
    const forms = await FormationAmazigh.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ total, page: Number(page), forms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get single form submission
// @route   GET /api/formation-amazigh/:id
// @access  Private / Admin
// ─────────────────────────────────────────
export const getFormById = async (req, res) => {
  try {
    const form = await FormationAmazigh.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update form status (admin)
// @route   PATCH /api/formation-amazigh/:id/status
// @access  Private / Admin
// ─────────────────────────────────────────
export const updateFormStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["nouveau", "contacté", "inscrit", "refusé"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const form = await FormationAmazigh.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!form) return res.status(404).json({ message: "Formulaire introuvable" });

    res.json({ message: "Statut mis à jour", form });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Delete a form submission (admin)
// @route   DELETE /api/formation-amazigh/:id
// @access  Private / Admin
// ─────────────────────────────────────────
export const deleteForm = async (req, res) => {
  try {
    const form = await FormationAmazigh.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ message: "Formulaire introuvable" });
    res.json({ message: "Formulaire supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};