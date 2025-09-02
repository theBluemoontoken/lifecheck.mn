import nodemailer from "nodemailer";
import puppeteer from "puppeteer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { name, email, testName, score, risk, topAnswers = [] } = req.body;

  try {
    // Puppeteer browser эхлүүлээд HTML-ээ render хийх
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Report HTML үүсгэх (dynamic контент оруулах)
    const html = `
      <!doctype html>
      <html lang="mn">
      <head>
        <meta charset="utf-8"/>
        <title>LifeCheck Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #f97316; }
          .risk { font-weight: bold; color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>${testName} Report</h1>
        <p><strong>Нэр:</strong> ${name || "-"}</p>
        <p><strong>Оноо:</strong> ${score}</p>
        <p><strong>Risk level:</strong> <span class="risk">${risk}</span></p>
        <h3>Хамгийн чухал хариултууд:</h3>
        <ul>
          ${topAnswers.map(a => `<li>${a}</li>`).join("")}
        </ul>
        <hr/>
        <p>Энэ тайлан LifeCheck системээс автоматаар үүссэн.</p>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    // Имэйл илгээх
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LifeCheck" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `📊 Таны ${testName} тайлан`,
      text: `${name || "Хэрэглэгч"}-ийн ${testName} тайлан хавсралтад байна.`,
      attachments: [
        { filename: `${testName}-report.pdf`, content: pdfBuffer },
      ],
    });

    res.status(200).json({ success: true, message: "Report emailed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}
