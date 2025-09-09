// pages/api/sendReport.js
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

// Playwright + Sparticuz Chromium (Vercel-д тохиромжтой)
const chromium = require("@sparticuz/chromium");
const { chromium: playwrightChromium } = require("playwright-core");

/**
 * 1) Google Sheets-ээс хүссэн табыг бүхэлд нь уншиж, header-тай нь объектын массив болгоно
 */
async function readSheet(tabName) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: tabName, // бүхэл таб
  });

  const rows = resp.data.values || [];
  if (!rows.length) return [];

  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });
}

/**
 * 2) Report-д орох бүх өгөгдлийг нэгтгэнэ (Sheets + dynamic)
 */
async function gatherReportData(payload) {
  const { testKey, riskLevel, scorePct = 0, name = "", email = "", topAnswers = [], domainsScore = [],testId = "" } = payload;

  // Sheets-ээс табуудаа авч ирнэ
  const [reportBlocks, domains, copy] = await Promise.all([
    readSheet("ReportBlocks"),
    readSheet("Domains"),
    readSheet("Copy"),
  ]);

  // ReportBlocks: тухайн testKey + riskLevel-ийн блок
  const block =
    reportBlocks.find((r) => (r.testKey || "").toLowerCase() === (testKey || "").toLowerCase() && (r.riskLevel || "").toLowerCase() === (riskLevel || "").toLowerCase()) ||
    {
      analysis_energy: "",
      analysis_focus: "",
      analysis_relationship: "",
      analysis_somatic: "",
      tips_24h: "",
      tips_7d: "",
      tips_30d: "",
      conclusion: "",
      motivation: "",
      disclaimer: "",
      intro: "",
      signals: "",
    };

  // Copy: UI гарчиг, risk-ийн шошго, footer
  const copyRow = copy.find((r) => (r.testKey || "").toLowerCase() === (testKey || "").toLowerCase()) || {
    summaryTitle: "Report — товч тайлан",
    riskLow: "Бага",
    riskMid: "Дунд",
    riskHigh: "Өндөр",
    riskSevere: "Маш өндөр",
    trustFooter: "LifeCheck ©",
  };

  const tips = {
    in24h: block.tips_24h || "",
    in7d:  block.tips_7d  || "",
    in30d: block.tips_30d || "", 
  };

  // Domains: тухайн тестийн домэйн жагсаалт (chart-д label болгоно)
  const domainList = domains
    .filter((d) => (d.testKey || "").toLowerCase() === (testKey || "").toLowerCase())
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  // domainsScore: [{domainKey, scorePct}] ирсэн бол label-тай merge
  const domainScoresMapped = domainList.map((d) => {
    const found = (domainsScore || []).find((x) => (x.domainKey || "").toLowerCase() === (d.domainKey || "").toLowerCase());
    return {
      domainKey: d.domainKey,
      label: d.label,
      scorePct: found ? Number(found.scorePct || 0) : 0,
    };
  });

  // Risk badge label
  const riskLabelMap = {
    low: copyRow.riskLow,
    mid: copyRow.riskMid,
    high: copyRow.riskHigh,
    severe: copyRow.riskSevere,
  };
  const riskLabel = riskLabelMap[(riskLevel || "low").toLowerCase()] || riskLevel;

  return {
    name,
    email,
    testKey,
    testId,
    riskLevel,
    riskLabel,
    scorePct: Number(scorePct || 0),
    topAnswers,
    block,
    tips,
    copyRow,
    domainScores: domainScoresMapped,
  };
}

/**
 * 3) Сайт шиг HTML-г угсарна (үнэгүй, external dependency хэрэггүй)
 *    - Risk meter: CSS progress bar
 *    - Domains chart: CSS-based horizontal bars
 *    - Actions: checklist
 */
function buildHTML(data) {
  const {
    name,
    email,
    testKey,
    riskLevel,
    riskLabel,
    scorePct,
    /* topAnswers = [], */ // —> ашиглахгүй болгов
    block,
    tips,
    copyRow,
    domainScores = [],
    testId
  } = data;

  // Risk өнгө
  const riskColor =
    (riskLevel === "low" && "#16a34a") ||
    (riskLevel === "mid" && "#f59e0b") ||
    (riskLevel === "high" && "#f97316") ||
    (riskLevel === "severe" && "#ef4444");

  // Signals — хоосон мөрүүдийг шүүнэ
  const signalsHTML = (block.signals || "")
    .split(/[;\n]/)
    .map(s => (s || "").trim())
    .filter(Boolean)
    .map(s => `<li>${escapeHtml(s)}</li>`)
    .join("");

  // Domains
  const clampPct = (x) => Math.max(0, Math.min(100, Math.round(Number(x) || 0)));
  const domainLevel = (pct) => {
    if (pct < 25) return { label: "🚨 Маш сул", color: "#ef4444" };
    if (pct < 50) return { label: "⚠️ Сул",    color: "#f97316" };
    if (pct < 75) return { label: "🙂 Дунд",   color: "#f59e0b" };
    return               { label: "💪 Сайн",    color: "#16a34a" };
  };
  const domainBars = (domainScores || [])
    .map((d) => {
      const raw   = clampPct(d.scorePct); // 0..100 = эрсдэлийн %
      const shown = 100 - raw;            // сайн% болгон урвуу
      const lvl   = domainLevel(shown);
      return `
        <div class="domain">
          <div class="label">${escapeHtml(d.label || d.domainKey)}</div>
          <div class="bar"><div class="fill" style="width:${shown}%; background:${lvl.color};"></div></div>
          <div class="pct">${shown}%<br><span style="font-size:12px;color:${lvl.color};">${lvl.label}</span></div>
        </div>`;
    })
    .join("");

  // Өнөөдрийн огноо
  const today = new Date().toISOString().slice(0,10);

   return `<!doctype html>
<html lang="mn">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(copyRow.summaryTitle || "LifeCheck Report – Placeholder Preview")}</title>
<style>
  :root{
    --accent:#f97316; --accent2:#fb7185; --risk:#f59e0b; --text:#0f172a;
    --muted:#64748b; --bg:#fff4ef; --line:#e5e7eb; --card:linear-gradient(315deg,#f8cbab 0%,#ffffff 100%);
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",Arial;background:var(--bg);color:var(--text)}
  .wrap{max-width:860px;margin:24px auto;padding:0 16px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;margin:12px 0;box-shadow:0 6px 14px rgba(0,0,0,.06)}
  .row{display:flex;gap:16px;align-items:center;justify-content:space-between}
  .logo{display:inline-flex;align-items:center;gap:8px}
  .logo .mark{width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,var(--accent),var(--accent2))}
  .logo span{font-weight:800;letter-spacing:.2px}
  .divider{height:1px;background:var(--line);margin:12px 0}
  h1.title{margin:.2rem 0 .35rem;font-size:22px;color:var(--accent)}
  .tagline{font-size:14px;color:var(--muted)}
  .status{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:10px}
  .badge{display:inline-block;padding:6px 10px;border-radius:999px;font-weight:700;color:#fff;background:var(--risk)}
  .chip{font-size:13px;color:#fff;background:#0ea5e9;padding:5px 10px;border-radius:999px}
  .meta-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:14px}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px;color:var(--muted)}
  .signals ul{margin:6px 0 0 18px;padding:0}
  .signals li{margin:6px 0}
  .meter{width:100%;height:14px;border:1px solid var(--line);border-radius:999px;background:#f3f4f6;overflow:hidden;position:relative}
  .meter .fill{height:100%;width:${clampPct(scorePct)}%;background:linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444)}
  .ticks{position:absolute;inset:0;display:flex;justify-content:space-between}
  .ticks span{width:1px;background:#cbd5e1;opacity:.8}
  .meterSection{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
  .meterLabel{min-width:130px;text-align:right;font-weight:700;color:#ef4444}
  .legend{font-size:12px;color:var(--muted)}
  .domains .item{display:grid;grid-template-columns:150px 1fr 56px;gap:10px;align-items:center;margin:10px 0}
  .domains .bar{height:10px;background:#f3f4f6;border:1px solid var(--line);border-radius:999px;overflow:hidden}
  .domains .bar .fill{height:100%;width:72%;background:#16a34a}
  .domains .pct{text-align:right;font-size:12px;color:var(--muted)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .p{margin:6px 0}
  .sub{font-weight:700;margin:6px 0 4px;color:#111827}
  .recs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .recCard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px}
  .recHead{font-weight:800;margin-bottom:6px}
  .recCard ul{margin:6px 0 0 18px}
  .quote{background:#fff;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:14px}
  .foot{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:12px;margin-top:8px}
  .small{font-size:12px;color:var(--muted)}
  @media (max-width:680px){
    .grid2{grid-template-columns:1fr}
    .recs{grid-template-columns:1fr}
    .domains .item{grid-template-columns:120px 1fr 46px}
  }
</style>
</head>
<body>
  <div class="wrap">

    <!-- COVER / HEADER -->
    <section class="card">
      <div class="row">
        <div class="logo"><div class="mark"></div><span>LifeCheck</span></div>
        <div class="small">Амьдралаа шалга. Эрсдлээ эрт хар.</div>
      </div>
      <div class="divider"></div>
      <h1 class="title">${escapeHtml(copyRow.summaryTitle || "LifeCheck Report")}</h1>
      <div class="tagline">${escapeHtml(block.intro || "Энэ тайлан таны үнэлгээний гол дохио, эрсдэлийн түвшин, домэйн задрал болон 24/7/30 хоногийн хэрэгжих зөвлөмжийг багтаана.")}</div>

      <div class="status">
        <span class="badge">Эрсдэл: ${escapeHtml(riskLabel || riskLevel)}</span>
        <span class="chip">Оноо: ${clampPct(scorePct)}%</span>
        ${testId ? `<span class="chip">Тест ID: ${escapeHtml(String(testId))}</span>` : ``}
      </div>

      <div class="meta-card">
        <div class="meta-grid">
          <div>Нэр: <strong>${escapeHtml(name || "-")}</strong></div>
          <div>Имэйл: <strong>${escapeHtml(email || "-")}</strong></div>
          <div>Тест: <strong>${escapeHtml(copyRow.testName || testKey || "-")}</strong></div>
          <div>Огноо: <strong>${escapeHtml(today)}</strong></div>
        </div>
      </div>

      ${signalsHTML ? `
      <div class="signals" style="margin-top:10px">
        <strong>• Гол дохио:</strong>
        <ul>${signalsHTML}</ul>
      </div>` : ``}
    </section>

    <!-- RISK METER -->
    <section class="card">
      <h2 style="margin:0 0 8px">Эрсдэлийн хэмжигч</h2>
      <div class="meterSection">
        <div class="meter">
          <div class="fill"></div>
          <div class="ticks"><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="meterLabel">Таны түвшин: ${escapeHtml(riskLabel || "-")}</div>
      </div>
      <div class="legend" style="margin-top:8px">Ногоон→Улаан градиент. Тэмдэглэгээ: 0 / 25 / 50 / 75 / 100</div>
    </section>

    <!-- DOMAINS CHART -->
    ${(domainScores || []).length ? `
    <section class="card">
      <h2 style="margin:0 0 8px">Онооны задаргаа</h2>
      <div class="legend" style="margin-bottom:8px">Холбоотой домэйнүүдийн сайн % (эрсдэлийн 100 − таны оноо)</div>
      <div class="domains">
        ${domainItems}
      </div>
    </section>` : ``}

    <!-- ANALYSIS (4 blocks) -->
    <section class="card">
      <h2 style="margin:0 0 8px">Шинжилгээ</h2>
      <div class="grid2">
        <div>
          <div class="sub">⚡ Энерги</div>
          <p class="p">${nl2br(escapeHtml(block.analysis_energy || ""))}</p>
        </div>
        <div>
          <div class="sub">🎯 Төвлөрөл</div>
          <p class="p">${nl2br(escapeHtml(block.analysis_focus || ""))}</p>
        </div>
        <div>
          <div class="sub">🤝 Харилцаа</div>
          <p class="p">${nl2br(escapeHtml(block.analysis_relationship || ""))}</p>
        </div>
        <div>
          <div class="sub">🧠 Соматик</div>
          <p class="p">${nl2br(escapeHtml(block.analysis_somatic || ""))}</p>
        </div>
      </div>
    </section>

    <!-- RECOMMENDATIONS 24/7/30 -->
    <section class="card">
      <h2 style="margin:0 0 8px">Зөвлөмж</h2>
      <div class="recs">
        ${tips.in24h ? `<div class="recCard"><div class="recHead">⏱ 24 цаг</div><ul><li>${escapeHtml(tips.in24h)}</li></ul></div>` : ``}
        ${tips.in7d  ? `<div class="recCard"><div class="recHead">📅 7 хоног</div><ul><li>${escapeHtml(tips.in7d)}</li></ul></div>` : ``}
        ${tips.in30d ? `<div class="recCard"><div class="recHead">🗓 30 хоног</div><ul><li>${escapeHtml(tips.in30d)}</li></ul></div>` : ``}
      </div>
    </section>

    <!-- CONCLUSION + MOTIVATION -->
    <section class="card">
      <h2 style="margin:0 0 8px">Дүгнэлт</h2>
      <p class="p">${nl2br(escapeHtml(block.conclusion || ""))}</p>
      ${(block.motivation || "").trim() ? `
      <div class="quote" style="margin-top:12px">
        <strong>Motivation</strong>
        <div style="margin-top:6px">“${escapeHtml(block.motivation)}”</div>
      </div>` : ``}
      <div class="small" style="text-align:center;margin-top:10px">${escapeHtml(copyRow.trustFooter || "LifeCheck ©")}</div>
    </section>

    <!-- FOOT -->
    <div class="foot">
      <div>Нууцлал: Энэхүү тайлан нь мэдээллийн зорилготой.</div>
      <div>Page 1</div>
    </div>
  </div>
</body>
</html>`;
}


// Helper-ууд
function nl2br(s = "") {
  return s.replace(/\n/g, "<br/>");
}
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 4) HTML → PDF (Playwright)
 */
async function htmlToPdfBuffer(html) {
  const browser = await playwrightChromium.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();
  return pdf;
}



/**
 * 5) Имэйлээр илгээх
 */
async function sendEmailWithPdf(to, subject, text, pdfBuffer, filename = "report.pdf") {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: `"LifeCheck" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    const payload = req.body || {};
    if (!payload.email) return res.status(400).json({ error: "email is required" });

    // === Шинэ: зөвхөн TestID авах хүсэлт үү? ===
    if (payload.onlyGenerateId) {
      const testId = await generateTestId();
      await appendLog({
        testId,
        email: payload.email,
        testKey: payload.testKey,
        riskLevel: payload.riskLevel || ""
      });
      return res.status(200).json({ success: true, testId });
    }

    if (!payload.testKey || !payload.riskLevel) return res.status(400).json({ error: "testKey & riskLevel required" });

    // Шинэ TestID үүсгэнэ
    const testId = await generateTestId();
    payload.testId = testId;

    // Тайлан бэлтгэх
    const data = await gatherReportData(payload);

    // HTML угсраад PDF болгох
    const html = buildHTML(data);
    const pdfBuffer = await htmlToPdfBuffer(html);

    // Имэйл илгээх
    const subject = `📊 ${data.copyRow?.summaryTitle || "LifeCheck Report"} — ${Math.round(data.scorePct)}% • ${data.riskLabel}`;
    const text = `${data.name || "Хэрэглэгч"}-ийн тайлан хавсралтад байна.`;
    await sendEmailWithPdf(data.email, subject, text, pdfBuffer);

    // Лог хадгалах
    await appendLog({
      testId,
      email: data.email,
      testKey: data.testKey,
      riskLevel: data.riskLevel
    });

    return res.status(200).json({ success: true, testId });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Report generation failed" });
  }
}

// Тестийн дугаар үүсгэх (LC-00001 гэх мэт)
async function generateTestId() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "Logs!B:B",
  });

  const rows = resp.data.values || [];
  let counter = 0;
  if (rows.length > 1) {
    const lastId = rows[rows.length - 1][0];
    counter = parseInt((lastId || "").replace("LC-", ""), 10) || 0;
  }
  return "LC-" + String(counter + 1).padStart(5, "0");
}

// Лог хадгалах (Timestamp | TestID | Email | TestKey | RiskLevel)
async function appendLog({ testId, email, testKey, riskLevel }) {
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
    range: "Logs",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toISOString(),
        testId,
        email,
        testKey,
        riskLevel
      ]]
    }
  });
}

