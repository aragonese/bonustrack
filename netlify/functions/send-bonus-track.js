// netlify/functions/send-bonus-track.js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const { email } = JSON.parse(event.body || "{}");
    const safeEmail = (email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(safeEmail)) {
      return json(400, { error: "Email non valida." });
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL;       // es: "noreply@tuodominio.com"
    const FROM_NAME = process.env.FROM_NAME || "Il Potere di un Amore Presente";
    const BONUS_TRACK_URL = process.env.BONUS_TRACK_URL; // link al PDF
    const REPLY_TO = process.env.REPLY_TO || FROM_EMAIL;

    if (!SENDGRID_API_KEY || !FROM_EMAIL || !BONUS_TRACK_URL) {
      return json(500, { error: "Config mancante sul server." });
    }

    const subject = "Bonus Track — Il passaggio obbligato dell’amore";
    const html = `
      <div style="font-family:system-ui;line-height:1.55;color:#141414">
        <p>Ciao,</p>
        <p>come promesso, ecco la <b>Bonus Track</b>.</p>
        <p>
          <a href="${BONUS_TRACK_URL}" style="color:#111">Apri / scarica la Bonus Track</a>
        </p>
        <p style="color:#5a5a5a;font-size:13px">
          Se non avevi richiesto tu questo invio, puoi ignorare questa email.
        </p>
        <p>— Salvatore</p>
      </div>
    `;

    const payload = {
      personalizations: [{ to: [{ email: safeEmail }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: REPLY_TO },
      subject,
      content: [{ type: "text/html", value: html }],
    };

    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return json(502, { error: "Invio email fallito.", detail: text.slice(0, 500) });
    }

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: "Errore server.", detail: String(e?.message || e) });
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}
