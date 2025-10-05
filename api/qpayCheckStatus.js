const fetch = require("node-fetch");

/**
 * QPay төлбөрийн статус шалгах API
 * GET /api/qpayCheckStatus?invoice=LC-xxxxxx
 */
async function handler(req, res) {
  try {
    const invoiceNo = req.query.invoice;
    if (!invoiceNo) {
      return res.status(400).json({ ok: false, error: "Missing invoice number" });
    }

    // 1️⃣ Access token авах
    const authHeader = "Basic " + Buffer.from(
      `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
    ).toString("base64");

    const tokenResp = await fetch("https://merchant.qpay.mn/v2/auth/token", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!tokenResp.ok) {
      console.error("❌ QPay token HTTP error:", tokenResp.status);
      return res.status(502).json({ ok: false, error: "QPay token error" });
    }

    const tokenData = await tokenResp.json();
    const access = tokenData.access_token;
    if (!access) return res.status(401).json({ ok: false, error: "Token missing" });

    // 2️⃣ Invoice-ийн төлөв шалгах
    const statusResp = await fetch(
      `https://merchant.qpay.mn/v2/payment/check/${invoiceNo}`,
      { headers: { Authorization: `Bearer ${access}` } }
    );

    const statusData = await statusResp.json();
    const paid = statusData.payment_status === "PAID";

    console.log(`🔍 [${invoiceNo}] payment_status = ${statusData.payment_status}`);
    return res.status(200).json({ ok: true, paid });
  } catch (err) {
    console.error("❌ qpayCheckStatus error:", err);
    return res.status(500).json({ ok: false, error: "Status check failed" });
  }
}

module.exports = handler;
