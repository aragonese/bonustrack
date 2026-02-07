// netlify/functions/send-bonus-track.js
const sgMail = require("@sendgrid/mail");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
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
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const FROM_NAME = process.env.FROM_NAME || "Il Potere di un Amore Presente";
    const BONUS_TRACK_URL = process.env.BONUS_TRACK_URL;
    const REPLY_TO = process.env.REPLY_TO || FROM_EMAIL;

    if (!SENDGRID_API_KEY || !FROM_EMAIL || !BONUS_TRACK_URL) {
      return json(500, { error: "Config mancante sul server." });
    }

    sgMail.setApiKey(SENDGRID_API_KEY);

    await sgMail.send({
      to: safeEmail,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      replyTo: REPLY_TO,
      subject: "Bonus Track — Il passaggio obbligato dell’amore",
      html: `
        <div style="font-family:system-ui;line-height:1.55;color:#141414">
          <p>Ciao,</p>
          <p>come promesso, ecco la <b>Bonus Track</b>.</p>
          <p>
            <a href="${BONUS_TRACK_URL}">Apri / scarica la Bonus Track</a>
          </p>
          <p style="color:#5a5a5a;font-size:13px">
            Se non avevi richiesto tu questo invio, puoi ignorare questa email.
          </p>
          <p>— Salvatore</p>
        </div>
      `
    });

    return json(200, { ok: true });
  } catch (e) {
    console.error("SEND ERROR:", e);
    return json(500, { error: "Errore server.", detail: String(e.message || e) });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

