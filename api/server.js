require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const qpayCreateInvoice = require("./qpayCreateInvoice.js");
const qpayWebhook = require("./qpayWebhook.js");
const adminLogin = require("./adminLogin.js");
const adminSendReport = require("./adminSendReport.js");
const waitReport = require("./waitReport.js");

const app = express();

// === Middleware ===
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: ["https://www.lifecheck.mn", "https://lifecheck.mn"],
  methods: ["GET", "POST"],
}));
app.use(morgan("tiny"));

// === Health check ===
app.get("/", (req, res) => {
  res.json({ ok: true, service: "LifeCheck backend API", uptime: process.uptime().toFixed(1) });
});

// === Public API ===
app.post("/api/qpayCreateInvoice", qpayCreateInvoice);
app.post("/api/qpayWebhook", qpayWebhook);
app.get("/api/qpayWebhook", qpayWebhook);

const qpayCheckStatus = require("./qpayCheckStatus.js");
app.get("/api/qpayCheckStatus", qpayCheckStatus);

// === Admin API ===
app.post("/api/admin/login", adminLogin);
app.post("/api/admin/sendReport", adminSendReport);

app.get("/api/waitReport", waitReport);

// === 404 fallback ===
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Endpoint not found" });
});

// === Error catcher ===
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

// === Start ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LifeCheck API running on port ${PORT}`);
});
