import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is missing. Email not sent.');
    return { success: false, error: 'Resend API key missing' };
  }
  
  try {
    const data = await resend.emails.send({
      from: `OneCandle <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    
    if (data.error) {
      return { success: false, error: data.error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}
