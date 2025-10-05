const postmark = require("postmark");
const path = require("path");
const fs = require("fs");

async function sendWizardReport(email) {
  try {
    if (!email) throw new Error("Email required");

    const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

    const files = [
      "guzeegee-shataa.pdf",
      "hundreh-philosophy.pdf",
      "ideed-l-tur.pdf",
    ];

    const attachments = files.map((name) => ({
      Name: name,
      Content: fs.readFileSync(path.join(process.cwd(), "api", "guides", name)).toString("base64"),
      ContentType: "application/pdf",
    }));

    await client.sendEmail({
      From: process.env.POSTMARK_SENDER,
      To: email,
      Subject: "🔮 Таны Шидэт гарын авлагууд",
      TextBody: "Сонгогдсон гол гарын авлага болон бэлгүүдийг хавсаргав.",
      Attachments: attachments,
    });

    console.log(`Wizard report sent to ${email}`);
    return { ok: true, sent: true };
  } catch (err) {
    console.error("Wizard send error:", err);
    return { ok: false, error: "Send failed" };
  }
}

module.exports = sendWizardReport;
