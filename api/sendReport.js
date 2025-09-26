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
    block,
    tips,
    copyRow,
    domainScores = [],
    testId
  } = data;

  const riskColor =
    (riskLevel === "low" && "#16a34a") ||
    (riskLevel === "mid" && "#f59e0b") ||
    (riskLevel === "high" && "#f97316") ||
    (riskLevel === "severe" && "#ef4444");

  const signalsHTML = (block.signals || "")
    .split(/[;\n]/)
    .map(s => (s || "").trim())
    .filter(Boolean)
    .map(s => `<li>${escapeHtml(s)}</li>`)
    .join("");

  const clampPct = (x) => Math.max(0, Math.min(100, Math.round(Number(x) || 0)));
  const domainLevel = (pct) => {
    if (pct < 25) return { label: "🚨 Маш сул", color: "#ef4444" };
    if (pct < 50) return { label: "⚠️ Сул",    color: "#f97316" };
    if (pct < 75) return { label: "🙂 Дунд",   color: "#f59e0b" };
    return               { label: "💪 Сайн",    color: "#16a34a" };
  };
  const domainBars = (domainScores || [])
  .filter(d => Number(d.scorePct) > 0)   // ✅ оноо байгаа domain-уудыг л авна
  .map((d) => {
    const raw   = clampPct(d.scorePct);
    const shown = 100 - raw;
    const lvl   = domainLevel(shown);
    return `
      <div class="domain">
        <div class="label">${escapeHtml(d.label || d.domainKey)}</div>
        <div class="bar"><div class="fill" style="width:${shown}%; background:${lvl.color};"></div></div>
        <div class="pct">${shown}%<br><span style="font-size:12px;color:${lvl.color};">${lvl.label}</span></div>
      </div>`;
  })
  .join("");

// ✅ Хэрэв оноотой domain байхгүй бол chart хэсгийг нуух
const domainSection = domainBars 
  ? `<div class="domains">${domainBars}</div>` 
  : `<p style="color:#6b7280;font-size:14px;">Энэ report override-оор илгээгдсэн тул domain chart байхгүй.</p>`;


  const today = new Date().toISOString().slice(0,10);

  return `<!doctype html>
<html lang="mn">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(copyRow.summaryTitle || "LifeCheck Report")}</title>
<style>
  :root { --accent:#f97316; --risk:${riskColor}; --muted:#6b7280; --line:#e5e7eb; }
  body{
  font-family:ui-sans-serif,system-ui,Roboto,Arial; 
  background:#fff4ef; 
  margin:0;
  padding:0 40px;
  color:#111827;
  display: flex;
  flex-direction: column;
  }
  .card{background:linear-gradient(315deg,#f8cbab 0%,#ffffff 100%); max-width:820px; margin:0 auto 16px; padding:24px 28px; border:1px solid var(--line); border-radius:16px;}
  h1{font-size:22px;margin:0 0 6px;color:var(--accent);}
  h2{font-size:18px;margin:18px 0 10px;color:var(--accent);}
  p{line-height:1.55;margin:10px 0;}
  .row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
  .slogan{font-size:12px;color:#64748b;}
  .status{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
  .badge{padding:6px 10px;border-radius:999px;font-weight:700;color:#fff;background:var(--risk);}
  .chip{font-size:13px;color:#fff;background:#0ea5e9;padding:5px 10px;border-radius:999px;}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px;color:var(--muted);margin-top:14px;}
  .meterRow{display:flex;align-items:center;gap:12px;margin-top:12px;}
  .meter{flex:1;height:14px;background:#f3f4f6;border:1px solid var(--line);border-radius:999px;overflow:hidden;position:relative;}
  .meter .fill{height:100%;background:linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444);width:${Math.round(scorePct)}%;}
  .ticks{position:absolute;inset:0;display:flex;justify-content:space-between;}
  .ticks span{width:1px;background:#cbd5e1;opacity:.8}
  .meterPct{font-weight:700;color:var(--risk);min-width:60px;text-align:right;}
  .legend{font-size:12px;color:var(--muted);margin-top:6px;}
  .domains{display:flex;flex-direction:column;gap:10px;}
  .domain{display:grid;grid-template-columns:140px 1fr 56px;align-items:center;gap:10px;}
  .domain .bar{height:10px;background:#f3f4f6;border:1px solid var(--line);border-radius:999px;overflow:hidden;}
  .domain .bar .fill{height:100%;}
  .checklist li::before{content:"✓ ";color:var(--accent);font-weight:700;}
  .grid2{display:flex;flex-direction:column;gap:16px;}
  .anaCard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;}
  .anaCard h3{margin:0 0 6px;}
  .recs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .recCard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;}
  .recHead{font-weight:800;margin-bottom:6px;}
  .quote{background:#fff;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:14px;margin-top:12px;}
  .footer{text-align:center;font-size:12px;color:var(--muted);margin-top:12px;}
  /* Page breaks */
.pagebreak { break-after: page; }            /* modern */
@media print { .pagebreak { page-break-after: always; } }

.section-avoid-break { break-inside: avoid; } /* блок дундуур хуваагдахгүй */
@page { size: A4; margin: 0; }
.page-group,
.analysis,
.advice,
.conclusion {
  min-height: 297mm;
  margin-top: auto;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
  /* Cover card + Domain card ижил өргөн */
.page-group .card {
  max-width: 820px;
  margin: 0 auto; 
}

/* Domains дотор grid card-ийн өргөнд дүүрнэ */
.domains {
  width: auto;
}

</style>
</head>
<body>

<section class="page-group">
  <section class="card">
  <div class="row">
    <img src="https://lifecheck.mn/images/lifechecklogo.svg" alt="LifeCheck" style="height:28px;">
    <div class="slogan">Амьдралаа шалга. Эрсдлээ эрт хар.</div>
  </div>
  <h1>${escapeHtml(copyRow.summaryTitle || "LifeCheck Report")}</h1>
  <p style="font-size:14px;">${nl2br(escapeHtml(block.intro || ""))}</p>
  <div class="status">
    <span class="badge">Эрсдэл: ${escapeHtml(riskLabel||riskLevel)}</span>
    ${testId?`<span class="chip">Тест ID: ${escapeHtml(testId)}</span>`:""}
  </div>
  ${signalsHTML?`<div style="margin-top:10px"><strong>Гол дохио:</strong><ul style="margin:6px 0 0 18px">${signalsHTML}</ul></div>`:""}
  <div class="meta">
    <div>Нэр: <strong>${escapeHtml(name||"-")}</strong></div>
    <div>Имэйл: <strong>${escapeHtml(email||"-")}</strong></div>
    <div>Тест: <strong>${escapeHtml(copyRow.testName||testKey)}</strong></div>
    <div>Огноо: <strong>${escapeHtml(today)}</strong></div>
  </div>
  <div class="meterRow">
    <div class="meter"><div class="fill"></div><div class="ticks"><span></span><span></span><span></span><span></span><span></span></div></div>
    <div class="meterPct">${Math.round(scorePct)}%</div>
  </div>
  <div class="legend">Онооны мөр: 0 / 25 / 50 / 75 / 100 (Ногоон → Улаан)</div>
  </section>

  ${
  (domainScores || []).length
    ? `<section class="card">
  <h2>Онооны задаргаа</h2>
  <p style="font-size:13px;color:#64748b;margin:4px 0 12px;">
    Харилцан холбоотой домэйнүүдийн % (0 − 100 таны оноо)
  </p>
  <div class="domains">
    ${domainBars}
  </div>
  </section>`
    : ``
  }
</section>
<div class="pagebreak"></div>

<section class="analysis">
  <section class="card">
  <h2>Дэлгэрэнгүй шинжилгээ</h2>
  <div class="grid2">
    <div class="anaCard"><h3>Энерги</h3><p>${nl2br(escapeHtml(block.analysis_energy||""))}</p></div>
    <div class="anaCard"><h3>Төвлөрөл</h3><p>${nl2br(escapeHtml(block.analysis_focus||""))}</p></div>
    <div class="anaCard"><h3>Харилцаа</h3><p>${nl2br(escapeHtml(block.analysis_relationship||""))}</p></div>
    <div class="anaCard"><h3>Соматик</h3><p>${nl2br(escapeHtml(block.analysis_somatic||""))}</p></div>
  </div>
  </section>
</section>
<div class="pagebreak"></div>

<section class="advice">
  <section class="card">
  <h2>Хувийн зөвлөмж</h2>
  <div class="recs">
    <div class="recCard"><div class="recHead">24 цагт хийх</div><p>${escapeHtml(tips.in24h||"")}</p></div>
    <div class="recCard"><div class="recHead">7 хоногт хийх</div><p>${escapeHtml(tips.in7d||"")}</p></div>
    <div class="recCard"><div class="recHead">30 хоногт хийх</div><p>${escapeHtml(tips.in30d||"")}</p></div>
  </div>
  </section>
</section>
<div class="pagebreak"></div>

<section class="conclusion">
  <section class="card">
  <h2>Дүгнэлт</h2>
  <p>${nl2br(escapeHtml(block.conclusion||""))}</p>
  <div class="quote"><strong>Motivation</strong><div style="margin-top:6px">“${escapeHtml(block.motivation||"")}”</div></div>
  </section>
  <div class="footer">${escapeHtml(copyRow.trustFooter||"LifeCheck ©")}</div>
</section>
</body></html>`;
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
    if (!payload.testKey || !payload.riskLevel) return res.status(400).json({ error: "testKey & riskLevel required" });

    // Тайлан бэлтгэх
    const data = await gatherReportData(payload);

    // HTML угсраад PDF болгох
    const html = buildHTML(data);
    const pdfBuffer = await htmlToPdfBuffer(html);

    // Имэйл илгээх
    const subject = `📊 ${data.copyRow?.summaryTitle || "LifeCheck Report"} — ${Math.round(data.scorePct)}% • ${data.riskLabel}`;
    const text = `${data.name || "Хэрэглэгч"}-ийн тайлан хавсралтад байна.`;
    await sendEmailWithPdf(data.email, subject, text, pdfBuffer);

    // ✨ Email амжилттай илгээгдсэн бол
    return res.status(200).json({ ok: true, sent: true });


  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Report generation failed" });
  }
}




