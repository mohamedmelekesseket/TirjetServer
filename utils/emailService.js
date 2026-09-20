// Email templates and service
// Table-based + inline styles so it renders correctly in Gmail, Outlook and mobile clients.
import nodemailer from "nodemailer";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const BRAND = {
  black:  "#111111",
  ink:    "#1c1a17",
  gold:   "#c9a055",
  cream:  "#f4efe6",
  card:   "#faf7f0",
  line:   "#ece6d8",
  muted:  "#6f6a5f",
  faint:  "#a8a196",
};
const FONT = "'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif";

// Escape user-supplied values before injecting them into HTML
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STATUS_LABELS = {
  pending: "En attente",
  processing: "En cours",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

// ─── Reusable blocks ──────────────────────────────────────────────────────────
const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
    <tr>
      <td align="center" bgcolor="${BRAND.black}" style="border-radius:12px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;background:${BRAND.black};letter-spacing:0.02em;">
          ${label} &nbsp;→
        </a>
      </td>
    </tr>
  </table>`;

const infoBox = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${BRAND.card};border:1px solid ${BRAND.line};border-radius:14px;margin:24px 0;">
    <tr><td style="padding:8px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows
          .map(
            ([label, value], i) => `
        <tr>
          <td style="padding:14px 0;${i < rows.length - 1 ? `border-bottom:1px solid ${BRAND.line};` : ""}">
            <div style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">${label}</div>
            <div style="font-family:${FONT};font-size:16px;font-weight:600;color:${BRAND.black};margin-top:4px;">${value}</div>
          </td>
        </tr>`
          )
          .join("")}
      </table>
    </td></tr>
  </table>`;

const note = (html) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;">
    <tr>
      <td style="border-left:3px solid ${BRAND.gold};background:${BRAND.card};padding:14px 18px;border-radius:0 10px 10px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${BRAND.ink};">
        ${html}
      </td>
    </tr>
  </table>`;

const layout = ({ eyebrow, title, subtitle, body, footerLinks }) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>Notification Tirjet</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.cream}" style="background:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="${BRAND.black}" align="center" style="background:${BRAND.black};padding:44px 32px 38px;">
              <div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;color:${BRAND.gold};">${esc(eyebrow)}</div>
              <h1 style="margin:14px 0 0;font-family:${FONT};font-size:28px;line-height:1.25;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">${title}</h1>
              ${subtitle ? `<p style="margin:12px 0 0;font-family:${FONT};font-size:15px;color:${BRAND.faint};">${subtitle}</p>` : ""}
            </td>
          </tr>
          <tr><td height="4" bgcolor="${BRAND.gold}" style="background:${BRAND.gold};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 36px 36px;font-family:${FONT};font-size:15px;line-height:1.7;color:#4a463f;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="${BRAND.black}" align="center" style="background:${BRAND.black};padding:30px 32px;font-family:${FONT};">
              <div style="font-size:15px;font-weight:800;letter-spacing:0.28em;text-transform:uppercase;color:#ffffff;">Tirjet</div>
              <div style="font-size:12px;color:${BRAND.faint};margin-top:8px;">Plateforme Artisanale Tunisienne</div>
              <div style="font-size:13px;margin-top:16px;color:${BRAND.faint};">${footerLinks}</div>
              <div style="font-size:11px;color:#6b665c;margin-top:18px;">© ${new Date().getFullYear()} Tirjet. Tous droits réservés.</div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Templates ────────────────────────────────────────────────────────────────
export const getEmailTemplate = (type, data = {}) => {
  const baseUrl = process.env.FRONTEND_URL || "https://www.tirjet.com";
  const link = (href, label) =>
    `<a href="${href}" style="color:${BRAND.gold};text-decoration:none;font-weight:600;">${label}</a>`;
  const siteLink = link(baseUrl, "Visiter notre site");
  const today = new Date().toLocaleDateString("fr-TN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const templates = {
    new_product: () => ({
      eyebrow: "Nouveau produit",
      title: "Un produit vient d’être ajouté",
      body: `
        <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.black};">Bonjour Admin,</h2>
        <p style="margin:0;">Un nouveau produit a été ajouté sur la plateforme Tirjet.</p>
        ${infoBox([
          ["Produit", esc(data.productTitle)],
          ["Artisan", esc(data.artisanName)],
          ["Prix", `${esc(data.price)} TND`],
        ])}
        ${button(`${baseUrl}/dashboard/admin/products`, "Voir le produit")}
        <p style="margin:0;text-align:center;color:${BRAND.muted};font-size:14px;">Connectez-vous à votre dashboard pour plus de détails.</p>`,
      footerLinks: siteLink,
    }),

    formation_form: () => ({
      eyebrow: "Formation Amazigh",
      title: "Nouvelle demande de formation",
      body: `
        <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.black};">Bonjour Admin,</h2>
        <p style="margin:0;">Une nouvelle demande de formation Amazigh a été soumise.</p>
        ${infoBox([
          ["Nom", esc(data.nomPrenom)],
          ["Email", esc(data.email)],
          ["Téléphone", esc(data.telephone)],
          ["Région", esc(data.region)],
          ["Niveau d’études", esc(data.niveauEtudes)],
        ])}
        ${button(`${baseUrl}/dashboard/admin/formationFromulaire`, "Voir la demande")}
        <p style="margin:0;text-align:center;color:${BRAND.muted};font-size:14px;">Contactez le candidat dès que possible.</p>`,
      footerLinks: siteLink,
    }),

    artisan_request: () => ({
      eyebrow: "Artisans",
      title: "Nouvelle demande artisan",
      body: `
        <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.black};">Bonjour Admin,</h2>
        <p style="margin:0;">Un nouvel artisan a soumis une demande pour rejoindre la plateforme.</p>
        ${infoBox([
          ["Nom", esc(data.userName)],
          ["Email", esc(data.userEmail)],
          ["Spécialité", esc(data.specialite)],
          ["Région", esc(data.region)],
          ["Ville", esc(data.city)],
        ])}
        ${button(`${baseUrl}/dashboard/admin/artisans`, "Voir la demande")}
        <p style="margin:0;text-align:center;color:${BRAND.muted};font-size:14px;">Examinez le profil et approuvez ou rejetez la demande.</p>`,
      footerLinks: siteLink,
    }),

    new_order_admin: () => ({
      eyebrow: "Commandes",
      title: "Nouvelle commande",
      body: `
        <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.black};">Bonjour Admin,</h2>
        <p style="margin:0;">Une nouvelle commande a été passée sur la plateforme.</p>
        ${infoBox([
          ["Client", esc(data.customerName)],
          ["Email", esc(data.customerEmail)],
          ["Total", `${esc(data.total)} TND`],
          ["Nombre d’articles", esc(data.itemsCount)],
        ])}
        ${button(`${baseUrl}/dashboard/admin/orders`, "Voir la commande")}
        <p style="margin:0;text-align:center;color:${BRAND.muted};font-size:14px;">Traitez cette commande rapidement.</p>`,
      footerLinks: siteLink,
    }),

    new_order_artisan: () => {
      const items = Array.isArray(data.items) ? data.items : [];
      return {
        eyebrow: "Nouvelle commande reçue",
        title: "Un client vient de commander vos produits",
        body: `
          <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.black};">Bonjour ${esc(data.artisanName)},</h2>
          <p style="margin:0;">Excellent ! Vous avez reçu une nouvelle commande sur Tirjet. Voici les détails :</p>
          ${infoBox([
            ["Client", esc(data.customerName)],
            ["Total de la commande", `<span style="color:${BRAND.black};font-size:20px;font-weight:800;">${esc(data.total)} TND</span>`],
            ["Nombre d’articles", esc(data.itemsCount)],
            ["Date", esc(today)],
          ])}
          ${
            items.length
              ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="border:1px solid ${BRAND.line};border-radius:14px;margin:24px 0;">
            <tr><td colspan="2" style="padding:16px 20px 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">Résumé de la commande</td></tr>
            ${items
              .map(
                (item) => `
            <tr>
              <td style="padding:12px 20px;border-top:1px solid ${BRAND.line};font-size:14px;font-weight:600;color:${BRAND.black};">${esc(item.name)} <span style="color:${BRAND.muted};font-weight:500;">× ${esc(item.quantity)}</span></td>
              <td align="right" style="padding:12px 20px;border-top:1px solid ${BRAND.line};font-size:14px;font-weight:700;color:${BRAND.black};white-space:nowrap;">${esc(item.price)} TND</td>
            </tr>`
              )
              .join("")}
            <tr>
              <td bgcolor="${BRAND.black}" style="background:${BRAND.black};padding:16px 20px;font-size:14px;font-weight:700;color:#ffffff;border-radius:0 0 0 13px;">Total</td>
              <td bgcolor="${BRAND.black}" align="right" style="background:${BRAND.black};padding:16px 20px;font-size:16px;font-weight:800;color:${BRAND.gold};border-radius:0 0 13px 0;white-space:nowrap;">${esc(data.total)} TND</td>
            </tr>
          </table>`
              : ""
          }
          ${button(`${baseUrl}/dashboard/artisan/orders`, "Voir la commande")}
          ${note(`<strong>Conseil :</strong> préparez les articles rapidement et mettez à jour le statut de la commande pour une meilleure expérience client.`)}`,
        footerLinks: `${siteLink} &nbsp;•&nbsp; ${link(`${baseUrl}/dashboard/artisan/orders`, "Mes commandes")}`,
      };
    },

    order_status: () => ({
      eyebrow: "Suivi de commande",
      title: "Votre commande a été mise à jour",
      body: `
        <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.black};">Bonjour ${esc(data.customerName)},</h2>
        <p style="margin:0;">Bonne nouvelle ! Le statut de votre commande a été mis à jour.</p>
        ${infoBox([
          ["Numéro de commande", `<span style="color:${BRAND.gold};">#${esc(data.orderId)}</span>`],
          [
            "Nouveau statut",
            `<span style="display:inline-block;background:${BRAND.black};color:#ffffff;padding:6px 16px;border-radius:100px;font-size:13px;font-weight:700;">${esc(STATUS_LABELS[data.status] || data.status)}</span>`,
          ],
          ["Total", `${esc(data.total)} TND`],
          ["Nombre d’articles", esc(data.itemsCount)],
          ["Date", esc(today)],
        ])}
        ${button(`${baseUrl}/Panier`, "Voir ma commande")}
        ${note(`<strong>Info :</strong> vous pouvez suivre l’évolution de votre commande depuis votre espace personnel.`)}
        <p style="margin:24px 0 0;text-align:center;color:${BRAND.muted};font-size:14px;">Merci pour votre confiance et votre soutien aux artisans tunisiens !</p>`,
      footerLinks: `${siteLink} &nbsp;•&nbsp; ${link(`${baseUrl}/Panier`, "Mes commandes")}`,
    }),
  };

  return layout((templates[type] || templates.new_product)());
};

// ─── Email sending function using nodemailer ──────────────────────────────────
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log(`[Email Service] Sending email to: ${to}`);
    console.log(`[Email Service] Subject: ${subject}`);

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@tirjet.com",
      to,
      subject,
      html: htmlContent,
    });

    console.log(`[Email Service] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return false;
  }
};

// Helper function to send notification email
export const sendNotificationEmail = async (recipientEmail, type, data) => {
  const subjectMap = {
    new_product: "Nouveau Produit Ajouté - Tirjet",
    formation_form: "Nouvelle Demande de Formation - Tirjet",
    artisan_request: "Nouvelle Demande Artisan - Tirjet",
    new_order_admin: "Nouvelle Commande - Tirjet",
    new_order_artisan: "Nouvelle Commande Reçue - Tirjet",
    order_status: "Mise à jour de Commande - Tirjet",
  };

  const htmlContent = getEmailTemplate(type, data);
  const subject = subjectMap[type] || "Notification - Tirjet";

  return await sendEmail(recipientEmail, subject, htmlContent);
};