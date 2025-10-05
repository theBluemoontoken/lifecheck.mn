const handler = require("./sendReport");     // үндсэн тайлан илгээгч
const saveLog = require("./saveLog");        // нэгтгэсэн лог бичигч

async function adminSend(req, res) {
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

    // 📤 Report илгээх (sendReport.js ашиглана)
    await handler(req, {
      status: (code) => ({
        json: (obj) => ({ code, ...obj }),
      }),
    });

    // ✍️ Google Sheets-д лог үлдээх (saveLog ашиглан)
    const { email, testId, testKey, riskLevel } = req.body || {};
    const logResult = await saveLog({
      email,
      testId,
      testKey,
      riskLevel,
      type: "admin",
    });

    if (!logResult.ok) {
      console.warn("⚠️ Admin log append failed:", logResult.error);
    }

    return res.status(200).json({
      ok: true,
      message: "Admin override report sent and logged",
    });
  } catch (err) {
    console.error("❌ Admin override error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Admin override failed",
    });
  }
}

module.exports = adminSend;
