async function adminLogin(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ ok: false, error: "Password required" });
    }

    const valid = password === process.env.ADMIN_KEY;
    if (!valid) {
      console.warn(`⚠️ Failed admin login attempt at ${new Date().toISOString()}`);
      return res.status(403).json({ ok: false, error: "Invalid credentials" });
    }

    console.log(`✅ Admin logged in at ${new Date().toISOString()}`);
    return res.status(200).json({ ok: true, message: "Access granted" });
  } catch (err) {
    console.error("❌ Admin login error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}

module.exports = adminLogin;
