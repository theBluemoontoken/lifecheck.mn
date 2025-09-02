import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { Readable } from "stream";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { name, email, testName, score, risk, topAnswers = [] } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // --- PDF generate ---
  const doc = new PDFDocument();
  let pdfBuffer = [];

  doc.on("data", pdfBuffer.push.bind(pdfBuffer));
  doc.on("end", async () => {
    const finalBuffer = Buffer.concat(pdfBuffer);

    // --- Email send ---
    try {
      // Gmail SMTP (эсвэл SendGrid тохируулах боломжтой)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER, // таны Gmail эсвэл SendGrid user
          pass: process.env.MAIL_PASS, // app password эсвэл API key
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
            content: finalBuffer,
          },
        ],
      });

      res.status(200).json({ success: true, message: "Email sent" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // PDF content
  doc.fontSize(20).text("LifeCheck Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text(`Test: ${testName}`);
  doc.text(`Name: ${name || "-"}`);
  doc.text(`Score: ${score || "-"}`);
  doc.text(`Risk level: ${risk || "-"}`);
  doc.moveDown();
  doc.text("Top answers:");
  topAnswers.forEach((ans, i) => doc.text(`${i + 1}. ${ans}`));
  doc.end();
}
