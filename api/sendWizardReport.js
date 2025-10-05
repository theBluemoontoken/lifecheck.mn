const postmark = require("postmark");
const path = require("path");
const fs = require("fs");

async function sendWizardReport(email) {
  try {
    if (!email) throw new Error("Email required");

    const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

    // === 1️⃣ PDF файлуудын нэр
    const files = [
      "guzeegee-shataa.pdf",
      "hundreh-philosophy.pdf",
      "ideed-l-tur.pdf",
    ];

    // === 2️⃣ Файл аюулгүй унших
    const baseDir = path.join(process.cwd(), "api", "guides");

    const attachments = [];

    for (const name of files) {
      const filePath = path.join(baseDir, name);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Missing file: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath).toString("base64");
      attachments.push({
        Name: name,
        Content: content,
        ContentType: "application/pdf",
      });
    }

    if (attachments.length === 0) {
      throw new Error("No guide PDFs found in /guides folder");
    }

    // === 3️⃣ Имэйл илгээх
    const result = await client.sendEmail({
      From: process.env.POSTMARK_SENDER || "LifeCheck.mn <noreply@lifecheck.mn>",
      To: email,
      Subject: "🔮 Таны Шидэт гарын авлагууд",
      HtmlBody: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
          <h2>✨ Mortal, чиний судрууд бэлэн боллоо</h2>
          <p>Доорх 3 шидэт гарын авлага хавсаргасан байна:</p>
          <ul>
            <li>🔥 Гүзээгээ шатаа</li>
            <li>🥗 Идээд л тур</li>
            <li>💧 Хөнгөрөх философи</li>
          </ul>
          <p>Хавсралт нээгдэхгүй бол имэйлийн “Download attachments” товчийг дар.</p>
          <hr/>
          <p style="font-size:13px;color:#555">LifeCheck.mn — Unlock Your Inner Scroll 🔮</p>
        </div>
      `,
      Attachments: attachments,
    });

    console.log(`✅ Wizard guides sent to ${email}`, result.MessageID);
    return { ok: true, sent: true };
  } catch (err) {
    console.error("❌ Wizard send error:", err.message || err);
    return { ok: false, error: err.message || "Send failed" };
  }
}

module.exports = sendWizardReport;
