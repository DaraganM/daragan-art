// The only server-side code: one point function for commission requests.
// Everything else is served as static files from ./dist.
import { EmailMessage } from "cloudflare:email";

const TYPES = [
  "D&D or fantasy character",
  "Portrait",
  "Urban sketch or architecture",
  "Vehicle or machine",
  "Science fiction or space",
  "Other",
];

const clean = (value, max) =>
  String(value ?? "").replace(/\r/g, "").trim().slice(0, max);

const base64 = (text) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).match(/.{1,76}/g).join("\r\n");
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/commission") return env.ASSETS.fetch(request);
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
    }

    const go = (path) => Response.redirect(new URL(path, url), 303);
    const form = await request.formData();

    // Honeypot: real visitors never fill this field. Bots get a silent "success".
    if (clean(form.get("website"), 100)) return go("/thanks/");

    const turnstileToken = clean(form.get("cf-turnstile-response"), 2048);

    const name = clean(form.get("name"), 100).replace(/\n+/g, " ");
    const email = clean(form.get("email"), 200);
    const brief = clean(form.get("brief"), 4000);
    const picked = clean(form.get("type"), 60);
    const type = TYPES.includes(picked) ? picked : "Other";
    const links = clean(form.get("links"), 1000);
    const deadline = clean(form.get("deadline"), 100);
    const budget = clean(form.get("budget"), 100);

    if (!name || !brief || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return go("/commissions/?error=1#request");
    }
    if (!env.NOTIFY_EMAIL || !env.FROM_ADDRESS || !env.TURNSTILE_SECRET) {
      console.error("NOTIFY_EMAIL, FROM_ADDRESS or TURNSTILE_SECRET is not set");
      return go("/commissions/?error=1#request");
    }

    if (!turnstileToken) {
  return go("/commissions/?error=1#request");
}
const turnstileForm = new FormData();
turnstileForm.append("secret", env.TURNSTILE_SECRET);
turnstileForm.append("response", turnstileToken);

const remoteIp = request.headers.get("CF-Connecting-IP");
if (remoteIp) turnstileForm.append("remoteip", remoteIp);
try {
  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: turnstileForm,
    }
  );

  const verification = await verifyResponse.json();
  if (!verification.success) {
    console.warn("Turnstile rejected request", verification["error-codes"]);
    return go("/commissions/?error=1#request");
  }
} catch (error) {
  console.error("Turnstile verification failed", error);
  return go("/commissions/?error=1#request");
}

    const body = [
  "NEW COMMISSION REQUEST",
  "",
  `Client: ${name}`,
  `Reply to: ${email}`,
  "",
  `Type: ${type}`,
  `Deadline: ${deadline || "-"}`,
  `Budget: ${budget || "-"}`,
  `References: ${links || "-"}`,
  "",
  "Brief:",
  brief,
].join("\n");

    const raw = [
      `From: DARAGAN site <${env.FROM_ADDRESS}>`,
      `To: ${env.NOTIFY_EMAIL}`,
      `Reply-To: ${email}`,
      `Subject: Commission - ${name} - ${type}`,
      `Message-ID: <${crypto.randomUUID()}@daragan.art>`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64(body),
    ].join("\r\n");

    try {
      await env.SEND_EMAIL.send(new EmailMessage(env.FROM_ADDRESS, env.NOTIFY_EMAIL, raw));
    } catch (error) {
      console.error("Send failed", error);
      return go("/commissions/?error=1#request");
    }
    return go("/thanks/");
  },
};
