import handler from "./sendReport"; // тайлан илгээх үндсэн функц
import { google } from "googleapis";

export default async function adminSend(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    // 🔐 Admin key шалгах
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (token !== process.env.ADMIN_KEY) {
      return res.status(403).json({ ok: false, error: "Unauthorized" });
    }

    // Report илгээх (sendReport.js reuse)
    await handler(req, res);

    // ✍️ Sheets-д log үлдээх
    // ✍️ Sheets-д log үлдээх
try {
  const { email, testId, testKey, riskLevel } = req.body;
  const now = new Date();
  const timestamp = now.toLocaleString("en-GB", {
    timeZone: "Asia/Ulaanbaatar",
  });

  // ✅ Хэрэв testId байхгүй бол автоматаар үүсгэнэ
  const autoId = testId && testId.trim()
    ? testId
    : `LC-OVERRIDE-${now.getFullYear().toString().slice(-2)}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "Logs!A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        timestamp,
        autoId,            // ✅ автоматаар генерэйт хийсэн ID
        email || "",
        testKey || "",
        riskLevel || "",
        "manual override"
      ]],
    },
  });
} catch (logErr) {
  console.error("⚠️ Admin override log failed:", logErr);
}


  } catch (err) {
    console.error("❌ Admin override error:", err);
    return res.status(500).json({ ok: false, error: "Admin override failed" });
  }
}
