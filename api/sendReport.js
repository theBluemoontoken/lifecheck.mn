import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { name, email, testName, score, risk, topAnswers = [] } = req.body;

  try {
    // PDFKit ашиглаж PDF үүсгэх
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

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
    });

    // PDF агуулга
    doc.fontSize(20).text("LifeCheck Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Тест: ${testName}`);
    doc.text(`Нэр: ${name || "-"}`);
    doc.text(`Оноо: ${score || "-"}`);
    doc.text(`Risk level: ${risk || "-"}`);
    doc.moveDown().fontSize(14).text("Хамгийн чухал хариултууд:");
    topAnswers.forEach((ans, i) => doc.text(`${i + 1}. ${ans}`));
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
