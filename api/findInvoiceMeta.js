// findInvoiceMeta.js
// Webhook ирэхэд invoice_id (object_id)-аар lookup хийх

const fs = require("fs");
const path = require("path");

// Файлын байршил
const filePath = path.join(process.cwd(), "api", "invoiceMeta.json");

function findInvoiceMeta(invoiceId) {
  try {
    if (!fs.existsSync(filePath)) return null;

    const all = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const meta = all[invoiceId];

    if (!meta) {
      console.warn("⚠️ Invoice meta not found for:", invoiceId);
      return null;
    }

    console.log("🔍 Found meta for", invoiceId, "→", meta.email);
    return meta;
  } catch (err) {
    console.error("❌ findInvoiceMeta error:", err.message || err);
    return null;
  }
}

module.exports = findInvoiceMeta;
