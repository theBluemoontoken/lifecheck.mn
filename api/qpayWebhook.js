const sendReport = require("./sendReport.js");
const sendWizardReport = require("./sendWizardReport.js");

async function handler(req, res) {
  try {
    const { object_type, payment_status, note, sender_invoice_no } = req.body || {};

    // 1️⃣ QPay webhook basic log
    console.log("📩 Webhook received:", object_type, payment_status, sender_invoice_no);

    // 2️⃣ Зөв төрлийн webhook эсэх
    if (object_type !== "INVOICE" || payment_status !== "PAID") {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // 3️⃣ Metadata parse (note → JSON)
    let meta = {};
    try {
      meta = JSON.parse(note || "{}");
    } catch (err) {
      console.error("❌ Invalid note JSON:", note);
      return res.status(400).json({ ok: false, error: "Invalid note JSON" });
    }

    console.log(`✅ Payment confirmed: ${sender_invoice_no} → ${meta.email || "no email"} (${meta.testKey || "-"})`);

    // 4️⃣ Email илгээх
    if (meta.testKey === "wizard") {
      // 🧙 Wizard report илгээх
      sendWizardReport(meta.email)
        .then(() => console.log(`📨 Wizard guides sent → ${meta.email}`))
        .catch(err => console.error("Wizard send error:", err));
    } else {
      // 📊 LifeCheck Report илгээх
      sendReport(
        { method: "POST", body: meta },
        { status: () => ({ json: () => ({}) }) }
      )
        .then(() => console.log(`📨 LifeCheck report sent → ${meta.email}`))
        .catch(err => console.error("Report send error:", err));
    }

    // 5️⃣ Хариу буцаах (QPay retry-ээс сэргийлэх)
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ QPay webhook fatal error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Webhook failed" });
  }
}

module.exports = handler;
