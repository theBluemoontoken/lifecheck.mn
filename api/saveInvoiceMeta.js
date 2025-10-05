// saveInvoiceMeta.js
// Invoice metadata-г JSON файлд хадгалах (local cache store)

const fs = require("fs");
const path = require("path");

// Файлын байршил
const filePath = path.join(__dirname, "invoiceMeta.json");

function saveInvoiceMeta(meta) {
  try {
    // Одоо байгаа бичлэгүүдийг унших
    const all = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : {};

    // Шинэ invoice_id-г түлхүүр болгон хадгалах
    all[meta.invoice_id] = {
      email: meta.email || "",
      testKey: meta.testKey || "",
      riskLevel: meta.riskLevel || "",
      testId: meta.testId || "",
      amount: meta.amount || "",
      createdAt: new Date().toISOString(),
    };

    // Файлыг overwrite хийх
    fs.writeFileSync(filePath, JSON.stringify(all, null, 2));

    console.log("💾 Saved invoice meta:", meta.invoice_id, meta.email);
  } catch (err) {
    console.error("❌ saveInvoiceMeta error:", err.message || err);
  }
}

module.exports = saveInvoiceMeta;
