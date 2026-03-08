import { Resend } from "resend";
import {
  isValidEmail,
  isValidString,
  sanitizeString,
} from "@/lib/inputValidation";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = sanitizeString(body.name);
  const email = sanitizeString(body.email);
  const message = sanitizeString(body.message);

  if (!isValidString(name) || !isValidEmail(email) || !isValidString(message)) {
    return Response.json(
      { error: "Name, a valid email, and message are required." },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return Response.json(
      { error: "Message must be under 2000 characters." },
      { status: 400 }
    );
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [process.env.CONTACT_EMAIL || process.env.RESEND_FROM],
      replyTo: email,
      subject: `Contact form: message from ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#7c3aed;margin-bottom:16px;">New Contact Message — Trip Tailor</h2>
          <p style="margin:8px 0;"><strong>Name:</strong> ${safeName}</p>
          <p style="margin:8px 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>
          <p style="margin:8px 0;"><strong>Message:</strong></p>
          <p style="background:#f9fafb;padding:16px;border-radius:8px;line-height:1.6;">${safeMessage}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>
          <p style="font-size:12px;color:#9ca3af;">Sent from the Trip Tailor contact form. Reply directly to this email to respond to ${safeName}.</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[Contact API] Failed to send email:", err);
    return Response.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

export function GET() {
  return new Response(null, { status: 405 });
}
