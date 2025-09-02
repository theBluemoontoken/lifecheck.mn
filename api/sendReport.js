import PDFDocument from "pdfkit";
import path from "path";
import nodemailer from "nodemailer";
import { REPORT_CONTENT } from "../assets/reportContent.js"; // замаа зөв шалгаарай

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
    // === FONT register ===
    const fontRegular = path.join(process.cwd(), "assets", "fonts", "NunitoSans-VariableFont.ttf");
    const fontItalic = path.join(process.cwd(), "assets", "fonts", "NunitoSans-Italic-VariableFont.ttf");

    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    // Register fonts
    doc.registerFont("Nunito", fontRegular);
    doc.registerFont("Nunito-Italic", fontItalic);

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // === Nodemailer ===
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
            encoding: "base64",
            contentType: "application/pdf",
          },
        ],
      });

      res.status(200).json({ success: true, message: "Report emailed" });
    });

    // === Cover sheet ===
    doc.font("Nunito").fontSize(20).fillColor("#f97316").text("LifeCheck Report", { align: "center" });
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

    // === Report content ===
    const block = REPORT_CONTENT?.[testKey]?.[risk] || {};
    doc.addPage();

    doc.font("Nunito").fontSize(16).fillColor("#f97316").text("Дэлгэрэнгүй шинжилгээ", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.analysis || "", { align: "justify" });

    doc.moveDown().fontSize(16).fillColor("#f97316").text("Хувийн зөвлөмжүүд", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.advice || "", { align: "justify" });

    doc.moveDown().fontSize(16).fillColor("#f97316").text("Дүгнэлт", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.conclusion || "", { align: "justify" });

    doc.moveDown().fontSize(16).fillColor("#f97316").text("Motivation boost", { underline: true });
    doc.moveDown(0.5).fontSize(12).fillColor("black").text(block.motivation || "", { align: "justify" });

    if (block.disclaimer) {
      doc.moveDown().font("Nunito-Italic").fontSize(10).fillColor("gray").text(block.disclaimer, { align: "justify" });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
