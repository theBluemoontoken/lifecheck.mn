const { google } = require("googleapis");

let cachedAuth;

async function getSheets() {
  if (!cachedAuth) {
    cachedAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return google.sheets({ version: "v4", auth: cachedAuth });
}

/**
 * Нэгтгэсэн лог бичигч
 * @param {Object} options - { email, testId, testKey, riskLevel, type }
 * type = 'report' | 'wizard' | 'admin'
 */
async function saveLog({ email, testId, testKey, riskLevel, type = "report" }) {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.SHEET_ID;

    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { timeZone: "Asia/Ulaanbaatar" });

    // ✨ ямар таб руу бичихийг тодорхойлох
    let range = "Logs!A:F";
    if (type === "wizard") range = "WizardLogs!A:C";
    if (type === "admin") range = "Logs!A:F";

    // 🆔 testId байхгүй бол автоматаар үүсгэх
    const autoId = testId && testId.trim()
      ? testId
      : `LC-${now.getFullYear().toString().slice(-2)}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(1000 + Math.random()*9000)}`;

    // 🧾 Бичих мөр
const values =
  type === "wizard"
    ? [[timestamp, autoId, email || ""]]
    : [[timestamp, autoId, email || "", testKey || "", riskLevel || "", type]];


    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    console.log(`✅ Log saved (${type}) → ${email || "unknown"}`);
    return { ok: true };
  } catch (err) {
    console.error("❌ saveLog error:", err);
    return { ok: false, error: err.message };
  }
}

module.exports = saveLog;
