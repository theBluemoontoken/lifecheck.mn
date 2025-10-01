const fetch = require("node-fetch");

async function handler(req, res) {
  try {
    const { email, amount, testKey, testId, riskLevel } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ ok: false, error: "Email & amount required" });
    }

    // 1. Access Token авах
    const tokenResp = await fetch("https://merchant.qpay.mn/v2/auth/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(
          process.env.QPAY_USERNAME + ":" + process.env.QPAY_PASSWORD
        ).toString("base64"),
        "Content-Type": "application/json"
      }
    });

    const tokenText = await tokenResp.text();
    console.log("🔎 QPay token raw response:", tokenText);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      console.error("❌ Invalid JSON from QPay:", tokenText);
      return res.status(502).json({ ok: false, error: "Invalid JSON from QPay" });
    }

    if (!tokenData.access_token) {
      console.error("❌ QPay auth failed, details:", tokenData);
      return res.status(401).json({ ok: false, error: "QPay auth failed", details: tokenData });
    }

    // 2. Invoice үүсгэх
    const invoiceResp = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        invoice_code: process.env.QPAY_INVOICE_CODE,
        sender_invoice_no: `LC-${Date.now()}`,
        invoice_description: `LifeCheck Report: ${testKey}`,
        amount,
        callback_url: process.env.QPAY_CALLBACK_URL,
        invoice_receiver_code: email,
        note: JSON.stringify({ email, testKey, testId, riskLevel })
      })
    });

    const invoiceText = await invoiceResp.text();
    console.log("🔎 QPay invoice raw response:", invoiceText);

    let invoiceData;
    try {
      invoiceData = JSON.parse(invoiceText);
    } catch (e) {
      return res.status(502).json({ ok: false, error: "Invalid JSON from QPay invoice" });
    }

    return res.status(200).json({ ok: true, invoice: invoiceData });
  } catch (err) {
    console.error("❌ QPay invoice error:", err);
    return res.status(500).json({ ok: false, error: "Invoice create failed" });
  }
}

module.exports = handler;

