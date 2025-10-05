const fetch = require("node-fetch");
const sendReport = require("./sendReport.js");
const sendWizardReport = require("./sendWizardReport.js");

async function handler(req, res) {
  try {
    // 🧾 1. Аль төрөл болохыг тодорхойлно (GET эсвэл POST)
    const body = req.method === "POST" ? req.body : req.query || {};
    let { object_type, payment_status, note, sender_invoice_no, qpay_payment_id } = body;

    console.log(`📩 Webhook (${req.method}) received:`, {
      object_type,
      payment_status,
      sender_invoice_no,
      qpay_payment_id,
    });

    // 🧩 2. Хэрвээ зөвхөн qpay_payment_id ирсэн бол QPay API-аас төлөв шалгах
    if (!payment_status && qpay_payment_id) {
      console.log("🔍 Checking QPay payment status for:", qpay_payment_id);
      try {
        const tokenResp = await fetch("https://merchant.qpay.mn/v2/auth/token", {
          method: "POST",
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
              ).toString("base64"),
            "Content-Type": "application/json",
          },
        });
        const tokenData = await tokenResp.json();

        const checkResp = await fetch(
          `https://merchant.qpay.mn/v2/payment/check/${qpay_payment_id}`,
          { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
        );

        const checkData = await checkResp.json();
        console.log("💡 QPay check result:", checkData.payment_status);

        payment_status = checkData.payment_status;
        note = checkData.note;
      } catch (err) {
        console.error("❌ Failed to check QPay payment status:", err);
      }
    }

    // 🧩 3. Төлбөр амжилттай эсэхийг шалгана
    const isPaid =
      payment_status && payment_status.toString().toUpperCase() === "PAID";
    if (!isPaid) {
      console.log("⚠️ Payment not yet paid or invalid status:", payment_status);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // 🪄 4. note талбарыг parse хийж metadata гаргана
    let meta = {};
    try {
      meta = typeof note === "string" ? JSON.parse(note) : note || {};
    } catch {
      console.warn("⚠️ Could not parse note JSON:", note);
    }

    const { email, testKey, testId, riskLevel } = meta;
    console.log(
      `✅ Payment confirmed → ${email || "no email"} (${testKey || "unknown"})`
    );

    // 🧙 5. Wizard эсвэл бусад тестийг ялгаж имэйл илгээнэ
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
    return res
      .status(500)
      .json({ ok: false, error: err.message || "Webhook failed" });
  }
}

module.exports = handler;
