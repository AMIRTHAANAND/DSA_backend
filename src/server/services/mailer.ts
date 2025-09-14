import nodemailer from 'nodemailer';
import { loadEnv } from '../config/env';

const env = loadEnv();

export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT ? Number(env.SMTP_PORT) : 587,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
});

mailer.use('compile', (_mail, done) => done());

export function defaultSender() {
  return env.SMTP_FROM || 'no-reply@example.com';
}

export async function send(to: string, subject: string, html: string) {
  await mailer.sendMail({ from: defaultSender(), to, subject, html });
}

