// qpayCreateInvoice.js — FINAL version
const fetch = require("node-fetch");
const saveInvoiceMeta = require("./saveInvoiceMeta");

async function handler(req, res) {
  try {
    const { email, amount, testKey, testId, riskLevel, scorePct, domainsScore } = req.body || {};

    if (!email || !amount) {
      return res.status(400).json({ ok: false, error: "Email & amount required" });
    }

    // === 1️⃣ Token авах ===
    const authHeader =
      "Basic " +
      Buffer.from(`${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`).toString("base64");

    const tokenResp = await fetch("https://merchant.qpay.mn/v2/auth/token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!tokenResp.ok) {
      console.error("❌ QPay token HTTP error:", tokenResp.status, tokenResp.statusText);
      return res.status(tokenResp.status).json({ ok: false, error: "QPay token fetch failed" });
    }

    const tokenData = await tokenResp.json().catch(() => ({}));
    if (!tokenData.access_token) {
      console.error("❌ QPay auth failed:", tokenData);
      return res.status(401).json({ ok: false, error: "Invalid token data", details: tokenData });
    }

    // === 2️⃣ Invoice үүсгэх ===
    const payload = {
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: testId || `LC-${Date.now()}`,
      invoice_description: `LifeCheck Report: ${testKey || "unknown"}`,
      amount: Number(amount),
      callback_url: process.env.QPAY_CALLBACK_URL,
      invoice_receiver_code: email,
      note: JSON.stringify({ email, testKey, testId, riskLevel }),
    };

    const invoiceResp = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!invoiceResp.ok) {
      console.error("❌ QPay invoice HTTP error:", invoiceResp.status, invoiceResp.statusText);
      const text = await invoiceResp.text();
      return res
        .status(invoiceResp.status)
        .json({ ok: false, error: "Invoice HTTP error", body: text });
    }

    const invoiceData = await invoiceResp.json().catch(() => ({}));
    if (!invoiceData.invoice_id) {
      console.warn("⚠️ Invoice missing invoice_id:", invoiceData);
    }

    // ✅ Invoice metadata-г JSON файлд хадгалах
    if (invoiceData.invoice_id) {
  saveInvoiceMeta({
    invoice_id: invoiceData.invoice_id,
    email,
    testKey,
    riskLevel,
    testId,
    amount,
    scorePct,
    domainsScore
  });
}

    // === 3️⃣ Хариу буцаах ===
    return res.status(200).json({ ok: true, invoice: invoiceData });
  } catch (err) {
    console.error("❌ QPay invoice exception:", err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || "Invoice create failed" });
  }
}

module.exports = handler;
