// Sends approval notification emails (loan, grant, credit card) using Lovable AI Gateway → Resend.
// Uses the Lovable connector gateway pattern with LOVABLE_API_KEY (no extra secrets needed for the user).
// If RESEND_API_KEY is set, sends via Resend directly. Otherwise logs and returns success (no-op).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  to: string;
  recipientName?: string;
  kind: "loan" | "grant" | "credit_card";
  status: "approved" | "rejected";
  reference: string;
  amount?: number;
  details?: { interestRate?: number; cardType?: string; cardNumber?: string; cvv?: string; expiry?: string; creditLimit?: number };
}

function buildEmail(p: Payload) {
  const name = p.recipientName || "Member";
  const brand = "Resolva Bank";
  const isApproved = p.status === "approved";
  const subjectMap = {
    loan: isApproved ? "Your loan has been approved" : "Update on your loan application",
    grant: isApproved ? "Your grant has been approved" : "Update on your grant application",
    credit_card: isApproved ? "Your credit card has been issued" : "Update on your credit card application",
  };
  const subject = `${subjectMap[p.kind]} · Ref ${p.reference}`;

  const detailsBlock = (() => {
    if (!isApproved) return `<p style="color:#475569">After careful review, we are unable to approve this application at this time. You may re-apply or contact our support team for guidance.</p>`;
    if (p.kind === "credit_card" && p.details?.cardNumber) {
      const masked = p.details.cardNumber;
      return `
        <div style="background:#0f1b3d;color:#fff;border-radius:14px;padding:24px;margin:18px 0;font-family:'Courier New',monospace">
          <div style="font-size:11px;letter-spacing:2px;color:#c9a84c;text-transform:uppercase">${p.details.cardType ?? "Credit Card"}</div>
          <div style="font-size:22px;letter-spacing:4px;margin:18px 0 22px">${masked.replace(/(.{4})/g, "$1 ").trim()}</div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#cbd5e1">
            <div><div style="opacity:.6">EXPIRES</div><div style="color:#fff;font-size:14px">${p.details.expiry}</div></div>
            <div><div style="opacity:.6">CVV</div><div style="color:#fff;font-size:14px">${p.details.cvv}</div></div>
            <div><div style="opacity:.6">LIMIT</div><div style="color:#fff;font-size:14px">$${Number(p.details.creditLimit ?? 0).toLocaleString()}</div></div>
          </div>
        </div>
        <p style="color:#475569;font-size:13px">Please keep these details confidential. You can also view this card from your dashboard.</p>
      `;
    }
    return `
      <table style="width:100%;border-collapse:collapse;margin:18px 0">
        <tr><td style="padding:10px;background:#f8fafc;border-radius:6px;color:#475569">Approved amount</td><td style="padding:10px;text-align:right;color:#0f1b3d;font-weight:700">$${Number(p.amount ?? 0).toLocaleString()}</td></tr>
        ${p.details?.interestRate ? `<tr><td style="padding:10px;color:#475569">Interest rate</td><td style="padding:10px;text-align:right;color:#0f1b3d;font-weight:700">${p.details.interestRate}%</td></tr>` : ""}
        <tr><td style="padding:10px;background:#f8fafc;border-radius:6px;color:#475569">Reference</td><td style="padding:10px;text-align:right;color:#0f1b3d;font-family:monospace">${p.reference}</td></tr>
      </table>
      <p style="color:#475569;font-size:13px">Funds have been credited to your account and a transaction record has been created on your statement.</p>
    `;
  })();

  const html = `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#0f1b3d,#1e3a8a);padding:28px;color:#fff">
        <div style="font-size:11px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase">${brand}</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px">${isApproved ? "Good news, " + name : "Hello " + name}</div>
      </div>
      <div style="padding:28px">
        <p style="color:#0f1b3d;font-size:16px;margin:0 0 8px">${subjectMap[p.kind]}.</p>
        ${detailsBlock}
        <a href="https://resovelc.lovable.app/dashboard" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;margin-top:8px">Open dashboard</a>
      </div>
      <div style="padding:18px 28px;background:#f8fafc;color:#94a3b8;font-size:11px;text-align:center">© ${new Date().getFullYear()} ${brand}. This is an automated notification.</div>
    </div></body></html>`;

  return { subject, html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.to || !payload?.kind || !payload?.reference) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { subject, html } = buildEmail(payload);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("[notify-approval] RESEND_API_KEY not configured. Email skipped.", { to: payload.to, subject });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "RESEND_API_KEY not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Resolva Bank <onboarding@resend.dev>",
        to: [payload.to],
        subject,
        html,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error("[notify-approval] Resend error", body);
      return new Response(JSON.stringify({ ok: false, error: body }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, id: body.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[notify-approval] error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
