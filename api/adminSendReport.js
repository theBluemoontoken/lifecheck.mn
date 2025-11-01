import handler from "./sendReport"; // тайлан илгээх үндсэн функц

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

    // sendReport-д дамжуулахдаа "source" талбарыг admin гэж тэмдэглэе
    req.body = { ...(req.body || {}), source: "admin" };

    // ✅ ТАЙЛАНГ sendReport-оор илгээнэ (sendReport дотор saveLog дуудна)
    return await handler(req, res);
  } catch (err) {
    console.error("❌ Admin override error:", err);
    return res.status(500).json({ ok: false, error: "Admin override failed" });
  }
}
