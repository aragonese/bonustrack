// netlify/functions/send-bonus-track.js
const sgMail = require("@sendgrid/mail");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  console.log("=== FUNCTION START ===");
  console.log("HTTP METHOD:", event.httpMethod);

  try {
    if (event.httpMethod !== "POST") {
      console.log("❌ Method not allowed");
      return json(405, { error: "Method not allowed" });
    }

    console.log("RAW BODY:", event.body);

    const parsedBody = JSON.parse(event.body || "{}");
    console.log("PARSED BODY:", parsedBody);

    const { email } = parsedBody;
    const safeEmail = (email || "").trim().toLowerCase();

    console.log("SAFE EMAIL:", safeEmail);

    if (!EMAIL_RE.test(safeEmail)) {
      console.log("❌ Invalid email");
      return json(400, { error: "Email non valida." });
    }

    // ENV DEBUG (SENZA stampare la key)
    console.log("ENV CHECK:", {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? "OK" : "MISSING",
      FROM_EMAIL: process.env.FROM_EMAIL,
      FROM_NAME: process.env.FROM_NAME,
      BONUS_TRACK_URL: process.env.BONUS_TRACK_URL,
      REPLY_TO: process.env.REPLY_TO
    });

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const FROM_NAME = process.env.FROM_NAME || "Il Potere di un Amore Presente";
    const BONUS_TRACK_URL = process.env.BONUS_TRACK_URL;
    const REPLY_TO = process.env.REPLY_TO || FROM_EMAIL;

    if (!SENDGRID_API_KEY || !FROM_EMAIL || !BONUS_TRACK_URL) {
      console.log("❌ Missing ENV config");
      return json(500, { error: "Config mancante sul server." });
    }

    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log("✅ SendGrid API key set");

    const msg = {
      to: safeEmail,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      replyTo: { email: REPLY_TO },
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
    };

    console.log("SENDGRID PAYLOAD (safe):", {
      to: msg.to,
      from: msg.from,
      replyTo: msg.replyTo,
      subject: msg.subject
    });

    await sgMail.send(msg);

    console.log("✅ EMAIL SENT");

    return json(200, { ok: true });
  } catch (e) {
    console.error("🔥 SEND ERROR FULL:", {
      message: e.message,
      code: e.code,
      response: e.response?.body
    });

    return json(500, {
      error: "Errore server.",
      detail: e.message
    });
  } finally {
    console.log("=== FUNCTION END ===");
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

