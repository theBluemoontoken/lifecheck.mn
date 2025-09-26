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
    try {
      const { email, testId, testKey, riskLevel } = req.body;
      const now = new Date();
      const timestamp = now.toLocaleString("en-GB", {
        timeZone: "Asia/Ulaanbaatar",
      });

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
        range: "Logs!A:F", // Timestamp, TestId, Email, TestKey, RiskLevel, Source
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            timestamp,
            testId || "",
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
