const express = require("express");
const cors = require("cors");
const qpayCreateInvoice = require("./qpayCreateInvoice.js");
const qpayWebhook = require("./qpayWebhook.js");

const app = express();
app.use(express.json());

// ✅ CORS зөвшөөрөх ( зөвхөн frontend домэйнийг )
app.use(cors({
  origin: "https://www.lifecheck.mn"
}));

// Endpoints
app.post("/api/qpayCreateInvoice", qpayCreateInvoice);
app.post("/api/qpayWebhook", qpayWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LifeCheck payment API running on port ${PORT}`);
});

