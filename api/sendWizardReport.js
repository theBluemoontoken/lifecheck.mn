const nodemailer = require("nodemailer");
const path = require("path");

async function sendWizardReport(email) {
  try {
    if (!email) {
      throw new Error("Email required");
    }

    // ✉️ Mail transporter
    const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_PORT === "465", // 465 бол SSL, 587 бол TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


    // 📂 PDF хавсралтууд
    const attachments = [
      {
        filename: "guzeegee-shataa.pdf",
        path: path.join(process.cwd(), "api", "guides", "guzeegee-shataa.pdf"),
      },
      {
        filename: "hundreh-philosophy.pdf",
        path: path.join(process.cwd(), "api", "guides", "hundreh-philosophy.pdf"),
      },
      {
        filename: "ideed-l-tur.pdf",
        path: path.join(process.cwd(), "api", "guides", "ideed-l-tur.pdf"),
      },
    ];

    // ✨ Email message
    await transporter.sendMail({
      from: `"LifeCheck Wizard" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "🔮 Таны Шидэт гарын авлагууд",
      text: "Сонгогдсон гол гарын авлага болон бэлгүүдийг хавсаргав.",
      attachments,
    });

    console.log(`Wizard report sent to ${email}`);
    return { ok: true, sent: true };
  } catch (err) {
    console.error("Wizard send error:", err);
    return { ok: false, error: "Send failed" };
  }
}

module.exports = sendWizardReport;
