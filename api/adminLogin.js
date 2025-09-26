export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ ok: false, error: "Password required" });
  }

  if (password === process.env.ADMIN_KEY) {
    return res.status(200).json({ ok: true });
  } else {
    return res.status(403).json({ ok: false, error: "Invalid password" });
  }
}
