import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: "Email required" });
    }

    const userId = "WIZ-" + Date.now();
    const timestamp = new Date().toISOString();

    // ✅ Google Sheets API Auth (sendReport.js-тэй адил)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 📌 WizardLogs tab руу бичих
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "WizardLogs!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[timestamp, userId, email]],
      },
    });

    return res.status(200).json({ ok: true, userId, timestamp });
  } catch (err) {
    console.error("Wizard log error:", err);
    return res.status(500).json({ ok: false, error: "Log failed" });
  }
}
