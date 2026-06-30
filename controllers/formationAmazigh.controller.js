import FormationAmazigh from "../models/FormationAmazigh.js";
import { createNotification, getAdminUsers } from "./notification.controller.js";
import { sendNotificationEmail } from "../utils/emailService.js";

console.log("[Controller] Formation Amazigh controller loaded");

// ─────────────────────────────────────────
// @desc    Submit formation amazigh form
// @route   POST /api/formation-amazigh
// @access  Public
// ─────────────────────────────────────────
export const submitForm = async (req, res) => {
  console.log("[Formation Form] Form submission received");
  console.log("[Formation Form] Body:", req.body);
  
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

    console.log("[Formation Form] Form created successfully, ID:", form._id);

    // ── Create notification for admins ───────────────────────────────────────
    try {
      console.log("[Formation Form] Starting notification process...");
      const admins = await getAdminUsers();
      console.log("[Formation Form] Admins found:", admins.length);
      
      if (admins.length === 0) {
        console.log("[Formation Form] WARNING: No admin users found in database");
      } else {
        for (const admin of admins) {
          console.log("[Formation Form] Creating notification for admin:", admin.email);
          await createNotification({
            recipient: admin._id,
            type: "formation_form",
            title: "Nouvelle Demande de Formation",
            message: `${nomPrenom} a soumis une demande de formation Amazigh`,
            relatedId: form._id,
            relatedModel: "FormationAmazigh",
          });

          // Send email to admin
          console.log("[Formation Form] Sending email to:", admin.email);
          await sendNotificationEmail(admin.email, "formation_form", {
            nomPrenom,
            email,
            telephone,
            region,
            niveauEtudes,
          });
        }
        console.log("[Formation Form] Notification process completed");
      }
    } catch (notifError) {
      console.error("[Formation Form] Error in notification process:", notifError);
      // Don't fail the form submission if notification fails
    }

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