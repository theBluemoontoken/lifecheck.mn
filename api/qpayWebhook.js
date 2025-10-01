const sendReport = require("./sendReport.js");

async function handler(req, res) {
  try {
    const { object_type, payment_status, note, sender_invoice_no } = req.body;

    if (object_type === "INVOICE" && payment_status === "PAID") {
      const meta = JSON.parse(note || "{}");

      console.log("✅ Paid invoice:", sender_invoice_no, meta.email);

      // Report илгээх
      await sendReport(
        { method: "POST", body: meta },
        { status: () => ({ json: (o) => o }) } // fake Express res
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ QPay webhook error:", err);
    return res.status(500).json({ ok: false, error: "Webhook failed" });
  }
}

module.exports = handler;
