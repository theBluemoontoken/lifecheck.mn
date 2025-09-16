import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { email, testId, testKey, riskLevel } = req.body;
    if (!email || !testId || !testKey) {
      return res.status(400).json({ ok: false, error: "Email, TestId, TestKey required" });
    }

    // Монголын цагийн бүсээр Timestamp авах
    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { timeZone: "Asia/Ulaanbaatar" });

    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Logs tab руу бичих
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Logs!A:E", // Timestamp, TestId, Email, TestKey, RiskLevel
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          timestamp,
          testId,
          email,
          testKey,
          riskLevel || ""
        ]],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Report log error:", err);
    return res.status(500).json({ ok: false, error: "Log failed" });
  }
}
