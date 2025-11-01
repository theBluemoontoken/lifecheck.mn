const postmark = require("postmark");
const path = require("path");
const fs = require("fs");
const saveLog = require("./saveLog");

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
    const baseDir = path.join(process.cwd(), "guides");
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
          <h2>Mortal, чиний судрууд бэлэн болжээ...</h2>
          <p>Дараах 3 шидэт гарын авлагыг хавсаргасан байгаа:</p>
          <ul>
            <li>🔥 Гүзээгээ шатаа</li>
            <li>🥗 Идээд л тур</li>
            <li>💧 Хөнгөрөх философи</li>
          </ul>
          <p>Хавсралт нээгдэхгүй бол имэйлийн “Download attachments” товчийг дараарай.</p>
          <hr/>
          <p style="font-size:13px;color:#555">LifeCheck.mn — Амьдралаа шалга, эрсдэлээ эрт хар 🔮</p>
        </div>
      `,
      Attachments: attachments,
    });

    console.log(`✅ Wizard guides sent to ${email}`, result.MessageID);
    // ✅ Wizard log → Google Sheets
try {
  await saveLog({
    type: "wizard",
    email,
    // testId байгаа бол дамжуулж болно: testId,
    // source талбарыг мэдэж байвал нэмэж болно: source: payload?.source || "qpay",
  });
} catch (e) {
  console.error("saveLog(wizard) failed:", e);
}

return { ok: true, sent: true };
  } catch (err) {
    console.error("❌ Wizard send error:", err.message || err);
    return { ok: false, error: err.message || "Send failed" };
  }
}

module.exports = sendWizardReport;
