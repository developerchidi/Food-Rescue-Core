import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';
import { getSupportEmailTemplate } from '../lib/templates/supportEmail';
import { getPartnershipEmailTemplate } from '../lib/templates/partnershipEmail';
import { Router } from 'express';

const router = Router();

router.post('/', async (req: any, res: any) => {
  try {
    const {
      name,
      email,
      message,
      source = 'SUPPORT',
      company,
      phone,
      type
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let dbMessage = message;
    let emailContent;

    if (source === 'PARTNERSHIP') {
      dbMessage = `[YÊU CẦU HỢP TÁC]\nCông ty: ${company || 'N/A'}\nSĐT: ${phone || 'N/A'}\nLoại hình: ${type || 'N/A'}\n----------------\nNội dung:\n${message}`.trim();

      emailContent = getPartnershipEmailTemplate(
        name, email, company || 'N/A', phone || 'N/A', type || 'N/A', message
      );
    } else {
      emailContent = getSupportEmailTemplate(name, email, message);
    }

    // 1. Save to Database
    try {
      const ticket = await prisma.supportRequest.create({
        data: {
          name,
          email,
          message: dbMessage,
          status: 'PENDING'
        }
      });
      console.log("Saved to DB:", ticket.id);
    } catch (dbError) {
      console.error("Database Error:", dbError);
      return res.status(500).json({ error: "Failed to save request" });
    }

    // 2. Send Email
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Food Rescue Support" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || "admin@foodrescue.vn",
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Email Error:", emailError);
      }
    } else {
      console.warn("SMTP credentials missing. Skipping email.");
    }

    return res.json({ success: true, message: "Request received" });
  } catch (error) {
    console.error("Handler Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
