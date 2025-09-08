// pages/api/sendReport.js
import { google } from "googleapis";
import nodemailer from "nodemailer";

// Playwright + Sparticuz Chromium (Vercel-д тохиромжтой)
import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";

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
  const [reportBlocks, actions, domains, copy] = await Promise.all([
    readSheet("ReportBlocks"),
    readSheet("Actions"),
    readSheet("Domains"),
    readSheet("Copy"),
  ]);

  // ReportBlocks: тухайн testKey + riskLevel-ийн блок
  const block =
    reportBlocks.find((r) => (r.testKey || "").toLowerCase() === (testKey || "").toLowerCase() && (r.riskLevel || "").toLowerCase() === (riskLevel || "").toLowerCase()) ||
    {
      analysis: "",
      advice: "",
      conclusion: "",
      motivation: "",
      disclaimer: "",
      intro: "",
      signals: "",
    };

  // Actions: тухайн testKey + riskLevel-ийн checklist
  const action =
    actions.find((r) => (r.testKey || "").toLowerCase() === (testKey || "").toLowerCase() && (r.riskLevel || "").toLowerCase() === (riskLevel || "").toLowerCase()) ||
    { in24h: "", in7d: "", in30d: "" };

  // Copy: UI гарчиг, risk-ийн шошго, footer
  const copyRow = copy.find((r) => (r.testKey || "").toLowerCase() === (testKey || "").toLowerCase()) || {
    summaryTitle: "Report — товч тайлан",
    riskLow: "Бага",
    riskMid: "Дунд",
    riskHigh: "Өндөр",
    riskSevere: "Маш өндөр",
    trustFooter: "LifeCheck ©",
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
    action,
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
    topAnswers = [],
    block,
    action,
    copyRow,
    domainScores = [],
  } = data;

  // Risk өнгө
  const riskColor =
    (riskLevel === "low" && "#16a34a") ||
    (riskLevel === "mid" && "#f59e0b") ||
    (riskLevel === "high" && "#f97316") ||
    (riskLevel === "severe" && "#ef4444"); // severe

  // Top answers HTML
  const topAnsHTML = (topAnswers || []).map((t, i) => `<li><span>${i + 1}.</span> ${escapeHtml(t)}</li>`).join("");

// domain-ийн шошго/өнгө (pct бол ЯГ ХАРУУЛАХ хувь гэж ойлгоно)
function domainLevel(pct) {
  if (pct < 25) return { label: "🚨 Маш сул", color: "#ef4444" };
  if (pct < 50) return { label: "⚠️ Сул",    color: "#f97316" };
  if (pct < 75) return { label: "🙂 Дунд зэрэг", color: "#f59e0b" };
  return               { label: "💪 Сайн",    color: "#16a34a" };
}

// Domain bars HTML
const clampPct = (x) => Math.max(0, Math.min(100, Math.round(Number(x) || 0)));
const tk = String(testKey || '').toLowerCase();

const domainBars = (domainScores || [])
  .map((d) => {
    const raw   = clampPct(d.scorePct); // 0..100 = эрсдэлийн % (их = муу)
    const shown = 100 - raw;            // сайн% болгон урвуулж зурна
    const lvl   = domainLevel(shown);   // (эсвэл domainLevel(shown, testKey) хэрвээ салгадаг бол)

    return `
      <div class="domain">
        <div class="label">${escapeHtml(d.label || d.domainKey)}</div>
        <div class="bar">
          <div class="fill" style="width:${shown}%; background:${lvl.color};"></div>
        </div>
        <div class="pct">
          ${shown}%<br>
          <span style="font-size:12px;color:${lvl.color};">${lvl.label}</span>
        </div>
      </div>`;
  })
  .join("");


  return `<!doctype html>
<html lang="mn">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(copyRow.summaryTitle || "LifeCheck Report")}</title>
<style>
  :root {
    --accent: #f97316; /* orange */
    --risk: ${riskColor};
    --text: #111827;
    --muted: #6b7280;
    --bg: ##fff4ef;
    --line: #e5e7eb;
  }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
    color: var(--text);
    background: var(--bg);
    margin: 0;
    padding: 24px;
  }
  .card {
    background: linear-gradient(
    315deg,              /* 135 → 315 = reverse */
    #f8cbab 0%,          /* будгэрүүлсэн peach (soft orange) */
    #ffffff 100%         /* white fade */
  );
    max-width: 820px;
    margin: 0 auto 16px;
    padding: 24px 28px;
    border: 1px solid var(--line);
    border-radius: 16px;
  }
  h1 { font-size: 22px; margin: 0 0 6px; color: var(--accent); }
  h2 { font-size: 18px; margin: 18px 0 10px; color: var(--accent); }
  p  { line-height: 1.55; margin: 10px 0; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; color: var(--muted); font-size: 13px; }
  .badge {
    display: inline-block; padding: 6px 10px; border-radius: 999px; font-weight: 600; color: #fff; background: var(--risk);
  }
  .meter {
    width: 100%; height: 14px; background: #f3f4f6; border-radius: 999px; overflow: hidden; border: 1px solid var(--line);
    margin-top: 8px;
  }
  .meter .fill { height: 100%; background: linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444); width: ${Math.max(
    0,
    Math.min(100, scorePct)
  )}%; }
  .meterRow { display: flex; align-items: center; gap: 12px; }
  .meterPct { font-weight: 700; color: var(--risk); min-width: 48px; text-align: right; }

  .topAnswers { margin-top: 6px; }
  .topAnswers ul { margin: 0; padding-left: 18px; }
  .topAnswers li { margin: 6px 0; }

  .domains { display: flex; flex-direction: column; gap: 10px; }
  .domain { display: grid; grid-template-columns: 140px 1fr 48px; align-items: center; gap: 10px; }
  .domain .label { font-size: 14px; color: var(--text); }
  .domain .bar { height: 10px; background: #f3f4f6; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
  .domain .bar .fill { height: 100%; background: var(--accent); }
  .domain .pct { text-align: right; font-size: 13px; color: var(--muted); }

  .list { padding-left: 18px; }
  .checklist { padding-left: 0; list-style: none; }
  .checklist li::before { content: "✓ "; color: var(--accent); font-weight: 700; }

  .footer { margin-top: 8px; color: var(--muted); font-size: 12px; text-align: center; }
</style>
</head>
<body>

  <!-- COVER -->
<section class="card">
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
    <img src="https://lifecheck.mn/images/lifechecklogo.png" alt="LifeCheck" style="height:28px;">
    <div style="font-size:12px; color:#64748b;">Амьдралаа шалга. Эрсдлээ эрт хар.</div>
  </div>

  <h1>${escapeHtml(copyRow.summaryTitle || "LifeCheck Report")}</h1>

  <p style="margin-top:12px; font-size:14px; line-height:1.6;">
  ${nl2br(escapeHtml(block.intro || ""))}
</p>

${block.signals ? `
<div style="margin-top:10px; font-size:14px;">
  <strong>• Гол дохио:</strong>
  <ul style="margin:6px 0 0 18px; padding:0; line-height:1.5;">
    ${block.signals.split(/[;\\n]/).map(s => `<li>${escapeHtml(s.trim())}</li>`).join("")}
  </ul>
</div>` : ""}


  <div class="meta">
    <div>Нэр: <strong>${escapeHtml(name || "-")}</strong></div>
    <div>Имэйл: <strong>${escapeHtml(email || "-")}</strong></div>
    <div>Тест: <strong>${escapeHtml(copyRow.testName || testKey)}</strong></div>
    <div>Тестийн дугаар: <strong>${escapeHtml(data.testId || "-")}</strong></div>
    <div>Эрсдэл: <span class="badge">${escapeHtml(riskLabel || riskLevel)}</span></div>
  </div>

  <div style="margin-top:12px">
    <div class="meterRow">
      <div class="meter" aria-label="Risk meter">
        <div class="fill"></div>
      </div>
      <div class="meterPct">${Math.round(scorePct)}%</div>
    </div>
  </div>
</section>



  <!-- DOMAINS CHART -->
  ${
    (domainScores || []).length
      ? `<section class="card">
    <h2>Онооны задаргаа</h2>
    <div class="domains">
      ${domainBars}
    </div>
  </section>`
      : ``
  }

  <!-- TOP ANSWERS -->
  ${
    (topAnswers || []).length
      ? `<section class="card topAnswers">
    <h2>Танд хамгийн их нөлөөлсөн хариултууд</h2>
    <ul>${topAnsHTML}</ul>
  </section>`
      : ``
  }

  <!-- TEXT BLOCKS -->
  <section class="card">
    <h2>Шинжилгээ</h2>
    <p>${nl2br(escapeHtml(block.analysis || ""))}</p>

    <h2>Зөвлөмж</h2>
    <p>${nl2br(escapeHtml(block.advice || ""))}</p>

    <h2>Дүгнэлт</h2>
    <p>${nl2br(escapeHtml(block.conclusion || ""))}</p>

    <h2>Motivation</h2>
    <p>${nl2br(escapeHtml(block.motivation || ""))}</p>
  </section>

  <!-- ACTIONS CHECKLIST -->
  ${
    action.in24h || action.in7d || action.in30d
      ? `<section class="card">
    <h2>Action Plan</h2>
    <ul class="checklist">
      ${action.in24h ? `<li>24 цагт: ${escapeHtml(action.in24h)}</li>` : ``}
      ${action.in7d ? `<li>7 хоногт: ${escapeHtml(action.in7d)}</li>` : ``}
      ${action.in30d ? `<li>30 хоногт: ${escapeHtml(action.in30d)}</li>` : ``}
    </ul>
  </section>`
      : ``
  }

  <!-- FOOTER -->
  <div class="footer">${escapeHtml(copyRow.trustFooter || "LifeCheck ©")}</div>

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
  const execPath = await chromium.executablePath();

  const browser = await playwrightChromium.launch({
    args: chromium.args,
    executablePath: execPath,
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  // бичгийн хэв маягтай PDF
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
  });
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
    // Frontend-ээс ирэх dynamic өгөгдөл
    // жишээ body:
    // { name, email, testKey, riskLevel, scorePct, topAnswers:[], domainsScore:[{domainKey,scorePct}] }
    const payload = req.body || {};
    if (!payload.email) return res.status(400).json({ error: "email is required" });
    if (!payload.testKey || !payload.riskLevel) return res.status(400).json({ error: "testKey & riskLevel required" });

    // Sheets + dynamic → нэгтгэсэн дата
    const data = await gatherReportData(payload);

    // HTML угсраад PDF болгох
    const html = buildHTML(data);
    const pdfBuffer = await htmlToPdfBuffer(html);

    // Имэйл илгээх
    const subject = `📊 ${data.copyRow?.summaryTitle || "LifeCheck Report"} — ${Math.round(data.scorePct)}% • ${data.riskLabel}`;
    const text = `${data.name || "Хэрэглэгч"}-ийн тайлан хавсралтад байна.`;
    await sendEmailWithPdf(data.email, subject, text, pdfBuffer, `${data.testKey}-report.pdf`);

    return res.status(200).json({ success: true, message: "Report emailed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Report generation failed" });
  }
}
