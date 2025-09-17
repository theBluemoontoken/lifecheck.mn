const nodemailer = require("nodemailer");
const path = require("path");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, error: "Email required" });
    }

    // ✉️ Mail transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 📂 PDF хавсралтууд (api/guides дотор байрласан)
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

    return res.status(200).json({ ok: true, sent: true });
  } catch (err) {
    console.error("Wizard send error:", err);
    return res.status(500).json({ ok: false, error: "Send failed" });
  }
}
