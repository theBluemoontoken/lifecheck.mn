import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { REPORT_CONTENT } from "../assets/reportContent.js"; // замыг зөв тааруулна уу

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const {
    name,
    email,
    testName,
    testKey = "burnout",
    score,
    risk = "low",
    topAnswers = []
  } = req.body;

  try {
    // 1) PDF бэлтгэх
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // 2) Имэйл илгээх
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
      {
      filename: `${testName}-report.pdf`,
      content: pdfBuffer.toString("base64"),
      encoding: "base64"
      }
    ],
  });

      

      res.status(200).json({ success: true, message: "Report emailed" });
    });

    // 3) PDF контент — Cover sheet
    doc.fontSize(20).fillColor("#f97316").text("LifeCheck Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).fillColor("black").text(`Тест: ${testName}`);
    doc.text(`Нэр: ${name || "-"}`);
    doc.text(`Имэйл: ${email || "-"}`);
    doc.text(`Оноо: ${score || "-"}`);
    doc.text(`Risk level: ${risk || "-"}`);
    if (topAnswers.length) {
      doc.moveDown().fontSize(14).text("Хамгийн чухал хариултууд:");
      topAnswers.forEach((ans, i) => doc.text(`${i + 1}. ${ans}`));
    }

    // 4) Report content (reportContent.js-ээс)
    const block = REPORT_CONTENT?.[testKey]?.[risk] || {};
    doc.addPage();

    doc.fontSize(16).fillColor("#f97316").text("Дэлгэрэнгүй шинжилгээ", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.analysis || "", { align: "justify" });

    doc.moveDown().fontSize(16).fillColor("#f97316").text("Хувийн зөвлөмжүүд", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.advice || "", { align: "justify" });

    doc.moveDown().fontSize(16).fillColor("#f97316").text("Дүгнэлт", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.conclusion || "", { align: "justify" });

    doc.moveDown().fontSize(16).fillColor("#f97316").text("Motivation boost", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.motivation || "", { align: "justify" });

    if (block.disclaimer) {
      doc.moveDown().fontSize(10).fillColor("gray").text(block.disclaimer, { align: "justify" });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
