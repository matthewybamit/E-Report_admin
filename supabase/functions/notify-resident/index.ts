import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

const GMAIL_USER     = "renzmatthewy@gmail.com";
const GMAIL_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;
const SENDER_NAME    = "Salvacion Barangay";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { type, residentName, residentEmail, rejectionReason } = await req.json();

    if (!residentEmail || !type) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = residentName?.trim() || residentEmail;
    let subject = "";
    let body    = "";

    if (type === "approved") {
      subject = "Your Registration Has Been Approved — Barangay Salvacion";
      body    = `Hello ${name},

Your registration with Barangay Salvacion has been APPROVED.

Your account is now fully active and verified. You can now log in to the e-Report app and access all barangay services.

If you have any questions, contact the barangay office at:
${GMAIL_USER}

— Barangay Salvacion Admin Team`;

    } else if (type === "rejected") {
      subject = "Registration Update — Barangay Salvacion";
      body    = `Hello ${name},

We were unable to approve your registration with Barangay Salvacion at this time.

${rejectionReason ? `Reason: ${rejectionReason}\n` : ""}
Please visit the barangay office or resubmit your registration with the correct documents.

If you have questions, contact us at:
${GMAIL_USER}

— Barangay Salvacion Admin Team`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Send via Gmail SMTP using SmtpClient v0.7.0 ──────────────────────────
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port:     465,
        tls:      true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_PASSWORD,
        },
      },
    });

    await client.send({
      from:    `${SENDER_NAME} <${GMAIL_USER}>`,
      to:      residentEmail,
      subject,
      content: body,
    });

    await client.close();

    console.log(`[notify-resident] ✓ Sent to ${residentEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[notify-resident] Error:", String(err));
    return new Response(
      JSON.stringify({ error: "Failed to send email", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});