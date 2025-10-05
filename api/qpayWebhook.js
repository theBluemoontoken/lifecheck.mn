const fetch = require("node-fetch");
const sendReport = require("./sendReport.js");
const sendWizardReport = require("./sendWizardReport.js");

async function handler(req, res) {
  try {
    const body = req.method === "POST" ? req.body : req.query || {};
    let {
      object_type,
      payment_status,
      note,
      sender_invoice_no,
      qpay_payment_id,
    } = body;

    console.log(`📩 Webhook (${req.method}) received:`, {
      object_type,
      payment_status,
      sender_invoice_no,
      qpay_payment_id,
    });

    // 🧩 Хэрвээ зөвхөн qpay_payment_id ирсэн бол төлбөрийн статусыг QPay API-аас шалгах
    if (!payment_status && qpay_payment_id) {
      console.log("🔍 Checking QPay payment status for:", qpay_payment_id);
      try {
        // 1️⃣ Access token авах
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

        // 2️⃣ Төлбөр шалгах — албан ёсны аргаар
        const checkResp = await fetch("https://merchant.qpay.mn/v2/payment/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify({
            object_type: "INVOICE",
            object_id: qpay_payment_id,
            offset: { page_number: 1, page_limit: 1 },
          }),
        });

        const checkData = await checkResp.json();
        console.log("💡 QPay check raw:", checkData);

        // 🧩 Хариуны бүтэц янз бүр байдаг тул уян хатан шалгах
        if (checkData.rows && checkData.rows.length > 0) {
          payment_status = checkData.rows[0].payment_status;
          note = checkData.rows[0].note;
        } else {
          payment_status = checkData.payment_status;
          note = checkData.note;
        }

        console.log("💡 QPay check result (parsed):", payment_status);
      } catch (err) {
        console.error("❌ Failed to check QPay payment status:", err);
      }
    }

    // 🧩 3️⃣ Төлбөр амжилттай эсэхийг шалгах
    const isPaid =
      payment_status && payment_status.toString().toUpperCase() === "PAID";
    if (!isPaid) {
      console.log("⚠️ Payment not yet paid or invalid status:", payment_status);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // 🪄 4️⃣ note талбарыг parse хийх
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

    // 🧙 5️⃣ Тайлан илгээх
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
