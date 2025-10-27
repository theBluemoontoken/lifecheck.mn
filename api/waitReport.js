const { wait } = require("./reportNotifier");

async function handler(req, res) {
  try {
    const invoice = req.query.invoice;
    if (!invoice) return res.status(400).json({ ok: false, error: "invoice required" });

    res.setHeader("Cache-Control", "no-store");
    const result = await wait(invoice, 90000);
    return res.status(200).json(result);
  } catch (err) {
    console.error("waitReport error:", err);
    return res.status(500).json({ ok: false });
  }
}

module.exports = handler;
