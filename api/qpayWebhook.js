// qpayWebhook.js — FINAL version
const fetch = require("node-fetch");
const sendReport = require("./sendReport");
const sendWizardReport = require("./sendWizardReport");
const findInvoiceMeta = require("./findInvoiceMeta");

async function handler(req, res) {
  try {
    const paymentId = req.query.qpay_payment_id;
    if (!paymentId)
      return res.status(400).json({ ok: false, error: "Missing payment_id" });

    console.log("📩 Webhook received:", paymentId);

    // 1️⃣ Token авах
    const tokenResp = await fetch("https://merchant.qpay.mn/v2/auth/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
          ).toString("base64"),
      },
    });
    const tokenData = await tokenResp.json();
    const token = tokenData.access_token;
    if (!token) throw new Error("Token missing");

    // 2️⃣ Payment info авах
    const payResp = await fetch(
      `https://merchant.qpay.mn/v2/payment/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const payData = await payResp.json();
    console.log("💡 payment_get:", payData);

    const invoiceId = payData?.object_id;
    const status = payData?.payment_status;

    // ✅ Invoice metadata-г JSON store-оос сэргээх
    const meta = findInvoiceMeta(invoiceId);
    if (!meta) {
      console.warn("⚠️ Meta not found for invoice:", invoiceId);
      return res.json({ ok: false, error: "Meta not found" });
    }

    const { email, testKey, riskLevel, testId } = meta;

    // 3️⃣ Хэрвээ төлөгдөөгүй бол /payment/check-р баталгаажуулах
    if (status !== "PAID" && payData?.object_id) {
      const checkResp = await fetch(
        "https://merchant.qpay.mn/v2/payment/check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            object_type: "INVOICE",
            object_id: payData.object_id,
            offset: { page_number: 1, page_limit: 1 },
          }),
        }
      );
      const checkData = await checkResp.json();
      console.log("💡 payment_check:", checkData);
      if (checkData?.rows?.[0]?.payment_status === "PAID") {
        payData.payment_status = "PAID";
      }
    }

    // 4️⃣ PAID үед имэйл илгээх
    if (payData.payment_status === "PAID") {
      console.log("✅ PAID confirmed:", invoiceId, email, testKey);

      if (testKey === "wizard") {
        await sendWizardReport(email);
        console.log("📨 Wizard guides sent:", email);
      } else {
        await sendReport(
          { body: meta, method: "POST" },
          { status: () => ({ json: (o) => o }) }
        );
        console.log("📊 Report sent:", email);
      }

      return res.json({ ok: true, paid: true });
    } else {
      console.warn("⚠️ Payment not completed:", payData.payment_status);
      return res.json({
        ok: false,
        paid: false,
        status: payData.payment_status,
      });
    }
  } catch (err) {
    console.error("❌ QPay webhook error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = handler;
