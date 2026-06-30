// Email templates and service
// This utility handles email sending with beautiful HTML templates
import nodemailer from "nodemailer";

const getEmailTemplate = (type, data) => {
  const baseUrl = process.env.FRONTEND_URL || "https://www.tirjet.com";
  
  const styles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%); color: white; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { padding: 30px; }
      .content h2 { color: #2d6a4f; margin-top: 0; }
      .content p { margin-bottom: 15px; }
      .button { display: inline-block; padding: 12px 30px; background: #2d6a4f; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      .button:hover { background: #1b4332; }
      .info-box { background: #f8f9fa; border-left: 4px solid #2d6a4f; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      .footer a { color: #2d6a4f; text-decoration: none; }
    </style>
  `;

  const templates = {
    new_product: `
      <div class="container">
        <div class="header">
          <h1>🎨 Nouveau Produit Ajouté</h1>
        </div>
        <div class="content">
          <h2>Bonjour Admin,</h2>
          <p>Un nouveau produit a été ajouté sur la plateforme Tirjet.</p>
          <div class="info-box">
            <p><strong>Produit:</strong> ${data.productTitle}</p>
            <p><strong>Artisan:</strong> ${data.artisanName}</p>
            <p><strong>Prix:</strong> ${data.price} TND</p>
          </div>
          <a href="${baseUrl}/dashboard/admin/products" class="button">Voir le Produit</a>
          <p>Connectez-vous à votre dashboard pour plus de détails.</p>
        </div>
        <div class="footer">
          <p>© 2024 Tirjet - Plateforme Artisanale Tunisienne</p>
          <p><a href="${baseUrl}">Visiter notre site</a></p>
        </div>
      </div>
    `,

    formation_form: `
      <div class="container">
        <div class="header">
          <h1>📚 Nouvelle Demande de Formation</h1>
        </div>
        <div class="content">
          <h2>Bonjour Admin,</h2>
          <p>Une nouvelle demande de formation Amazigh a été soumise.</p>
          <div class="info-box">
            <p><strong>Nom:</strong> ${data.nomPrenom}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Téléphone:</strong> ${data.telephone}</p>
            <p><strong>Région:</strong> ${data.region}</p>
            <p><strong>Niveau d'études:</strong> ${data.niveauEtudes}</p>
          </div>
          <a href="${baseUrl}/dashboard/admin/formationFromulaire" class="button">Voir la Demande</a>
          <p>Contactez le candidat dès que possible.</p>
        </div>
        <div class="footer">
          <p>© 2024 Tirjet - Plateforme Artisanale Tunisienne</p>
          <p><a href="${baseUrl}">Visiter notre site</a></p>
        </div>
      </div>
    `,

    artisan_request: `
      <div class="container">
        <div class="header">
          <h1>👨‍🎨 Nouvelle Demande Artisan</h1>
        </div>
        <div class="content">
          <h2>Bonjour Admin,</h2>
          <p>Un nouvel artisan a soumis une demande pour rejoindre la plateforme.</p>
          <div class="info-box">
            <p><strong>Nom:</strong> ${data.userName}</p>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>Spécialité:</strong> ${data.specialite}</p>
            <p><strong>Région:</strong> ${data.region}</p>
            <p><strong>Ville:</strong> ${data.city}</p>
          </div>
          <a href="${baseUrl}/dashboard/admin/artisans" class="button">Voir la Demande</a>
          <p>Examinez le profil et approuvez ou rejetez la demande.</p>
        </div>
        <div class="footer">
          <p>© 2024 Tirjet - Plateforme Artisanale Tunisienne</p>
          <p><a href="${baseUrl}">Visiter notre site</a></p>
        </div>
      </div>
    `,

    new_order_admin: `
      <div class="container">
        <div class="header">
          <h1>🛒 Nouvelle Commande</h1>
        </div>
        <div class="content">
          <h2>Bonjour Admin,</h2>
          <p>Une nouvelle commande a été passée sur la plateforme.</p>
          <div class="info-box">
            <p><strong>Client:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Total:</strong> ${data.total} TND</p>
            <p><strong>Nombre d'articles:</strong> ${data.itemsCount}</p>
          </div>
          <a href="${baseUrl}/dashboard/admin/orders" class="button">Voir la Commande</a>
          <p>Traitez cette commande rapidement.</p>
        </div>
        <div class="footer">
          <p>© 2024 Tirjet - Plateforme Artisanale Tunisienne</p>
          <p><a href="${baseUrl}">Visiter notre site</a></p>
        </div>
      </div>
    `,

    new_order_artisan: `
      <div class="container">
        <div class="header">
          <h1>🎉 Nouvelle Commande Reçue!</h1>
        </div>
        <div class="content">
          <h2>Bonjour ${data.artisanName},</h2>
          <p>Félicitations! Vous avez reçu une nouvelle commande pour vos produits.</p>
          <div class="info-box">
            <p><strong>Client:</strong> ${data.customerName}</p>
            <p><strong>Total:</strong> ${data.total} TND</p>
            <p><strong>Nombre d'articles:</strong> ${data.itemsCount}</p>
          </div>
          <a href="${baseUrl}/dashboard/artisan/orders" class="button">Voir la Commande</a>
          <p>Préparez les articles pour l'expédition.</p>
        </div>
        <div class="footer">
          <p>© 2024 Tirjet - Plateforme Artisanale Tunisienne</p>
          <p><a href="${baseUrl}">Visiter notre site</a></p>
        </div>
      </div>
    `,

    order_status: `
      <div class="container">
        <div class="header">
          <h1>📦 Mise à jour de Commande</h1>
        </div>
        <div class="content">
          <h2>Bonjour ${data.customerName},</h2>
          <p>Votre commande a été mise à jour.</p>
          <div class="info-box">
            <p><strong>Nouveau statut:</strong> ${data.status}</p>
            <p><strong>Commande #:</strong> ${data.orderId}</p>
          </div>
          <a href="${baseUrl}/profile" class="button">Voir ma Commande</a>
          <p>Merci pour votre confiance!</p>
        </div>
        <div class="footer">
          <p>© 2024 Tirjet - Plateforme Artisanale Tunisienne</p>
          <p><a href="${baseUrl}">Visiter notre site</a></p>
        </div>
      </div>
    `,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notification Tirjet</title>
      ${styles}
    </head>
    <body>
      ${templates[type] || templates.new_product}
    </body>
    </html>
  `;
};

// Email sending function using nodemailer
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log(`[Email Service] Sending email to: ${to}`);
    console.log(`[Email Service] Subject: ${subject}`);

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@tirjet.com',
      to,
      subject,
      html: htmlContent
    });

    console.log(`[Email Service] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
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
