const sendReport = require("./sendReport.js");
const sendWizardReport = require("./sendWizardReport.js");

async function handler(req, res) {
  try {
    // 🧾 1. QPay webhook аль төрөл болохыг тодорхойлно (GET эсвэл POST)
    const body = req.method === "POST" ? req.body : req.query || {};

    const { object_type, payment_status, note, sender_invoice_no, qpay_payment_id } = body;

    console.log(`📩 Webhook (${req.method}) received:`, { object_type, payment_status, sender_invoice_no, qpay_payment_id });

    // 🧩 2. Төлбөр батлагдсан эсэхийг шалгана
    const isPaid = (payment_status && payment_status.toUpperCase() === "PAID");
    if (!isPaid) {
      console.log("⚠️ Payment not yet paid or invalid status:", payment_status);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // 🪄 3. note талбарыг parse хийж metadata гаргана
    let meta = {};
    try {
      meta = typeof note === "string" ? JSON.parse(note) : note || {};
    } catch {
      console.warn("⚠️ Could not parse note JSON:", note);
    }

    const { email, testKey, testId, riskLevel } = meta;
    console.log(`✅ Payment confirmed → ${email || "no email"} (${testKey || "unknown"})`);

    // 🧙 4. Wizard эсвэл бусад тестийг ялгаж имэйл илгээнэ
    if (testKey === "wizard") {
      await sendWizardReport(email);
    } else {
      await sendReport(
        { method: "POST", body: meta },
        { status: () => ({ json: () => ({}) }) }
      );
    }

    console.log("📨 Report sent successfully.");
    return res.status(200).json({ ok: true, delivered: true });

  } catch (err) {
    console.error("❌ QPay webhook fatal error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Webhook failed" });
  }
}

module.exports = handler;
