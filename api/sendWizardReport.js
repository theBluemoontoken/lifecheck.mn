const nodemailer = require("nodemailer");
const path = require("path");

module.exports.handler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, error: "Email required" });
    }

    // ✉️ Mail transporter (Gmail эсвэл SMTP ашиглаж болно)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 📂 PDF хавсралтууд (root/api/guides дотор байршуулсан)
    const attachments = [
          {
            filename: "guzeegee-shataa.pdf",
            path: path.join(__dirname, "guides", "guzeegee-shataa.pdf"),
          },
          {
            filename: "hundreh-philosophy.pdf",
            path: path.join(__dirname, "guides", "hundreh-philosophy.pdf"),
          },
          {
            filename: "ideed-l-tur.pdf",
            path: path.join(__dirname, "guides", "ideed-l-tur.pdf"),
          },
        ];

    // ✨ Email message
    await transporter.sendMail({
      from: `"LifeCheck Wizard" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "🔮 Таны Wizard Scrolls",
      text: "Сонгогдсон гол guide болон бэлгүүдийг хавсаргав.",
      attachments,
    });

    return res.status(200).json({ ok: true, sent: true });
  } catch (err) {
    console.error("Wizard send error:", err);
    return res.status(500).json({ ok: false, error: "Send failed" });
  }
};
