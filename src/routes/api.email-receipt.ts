import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/email-receipt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return json({ error: "Unauthorized" }, 401);
          }
          const token = authHeader.slice(7);

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const RESEND_API_KEY = process.env.RESEND_API_KEY;
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
            return json({ error: "Email service not configured" }, 500);
          }

          const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
          if (claimsErr || !claims?.claims?.sub) {
            return json({ error: "Unauthorized" }, 401);
          }

          const body = await request.json();
          const {
            email,
            reference,
            amount,
            recipient,
            bank,
            accountMasked,
            kind,
          } = body ?? {};

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
            return json({ error: "Valid email required" }, 400);
          }
          if (!reference || typeof reference !== "string" || reference.length > 64) {
            return json({ error: "Invalid reference" }, 400);
          }
          if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
            return json({ error: "Invalid amount" }, 400);
          }
          if (!recipient || typeof recipient !== "string" || recipient.length > 200) {
            return json({ error: "Invalid recipient" }, 400);
          }
          if (kind !== "internal" && kind !== "external") {
            return json({ error: "Invalid kind" }, 400);
          }

          const safe = (s: string) =>
            String(s).replace(/[&<>"']/g, (c) =>
              ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
            );

          const amountStr = `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} USD`;
          const statusStr = kind === "external" ? "Pending (1–3 business days)" : "Completed";
          const typeStr = kind === "external" ? "External US bank / credit union" : "Internal Resolva account";

          const html = `
<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;color:#1a1a2e;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#1e2952;color:#fff;padding:24px 32px;">
      <div style="font-size:20px;font-weight:bold;">Resolva Credix</div>
      <div style="font-size:13px;opacity:.85;margin-top:4px;">Transfer confirmation receipt</div>
    </div>
    <div style="padding:28px 32px;">
      <div style="font-size:18px;font-weight:bold;margin:0 0 6px;">
        ${kind === "external" ? "Transfer submitted" : "Transfer completed"}
      </div>
      <div style="font-size:13px;color:#5a5a6a;margin:0 0 20px;">
        ${kind === "external"
          ? "Funds typically arrive in 1–3 business days."
          : "Your internal transfer was processed successfully."}
      </div>
      <div style="background:#f8f7f2;border:1px solid #e5e2d8;border-radius:8px;padding:14px 18px;margin-bottom:22px;">
        <div style="font-size:11px;color:#888;letter-spacing:.06em;">REFERENCE ID</div>
        <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:bold;margin-top:4px;">${safe(reference)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row("Amount", amountStr)}
        ${row("Recipient", safe(recipient))}
        ${bank ? row("Bank", safe(String(bank))) : ""}
        ${accountMasked ? row("Account", safe(String(accountMasked))) : ""}
        ${row("Type", typeStr)}
        ${row("Status", statusStr)}
        ${row("Date", new Date().toLocaleString())}
      </table>
      <div style="margin-top:26px;padding-top:18px;border-top:1px solid #ececec;font-size:12px;color:#888;">
        Keep this receipt for your records. For questions, contact Resolva Credix support.
      </div>
    </div>
  </div>
</body></html>`;

          const text = [
            `Resolva Credix — Transfer receipt`,
            ``,
            `Reference: ${reference}`,
            `Amount: ${amountStr}`,
            `Recipient: ${recipient}`,
            bank ? `Bank: ${bank}` : null,
            accountMasked ? `Account: ${accountMasked}` : null,
            `Type: ${typeStr}`,
            `Status: ${statusStr}`,
            `Date: ${new Date().toLocaleString()}`,
          ].filter(Boolean).join("\n");

          const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: "Resolva Credix <onboarding@resend.dev>",
              to: [email],
              subject: `Transfer receipt · ${reference}`,
              html,
              text,
            }),
          });

          if (!resp.ok) {
            const errBody = await resp.text();
            return json({ error: `Email failed: ${errBody.slice(0, 200)}` }, 502);
          }

          return json({ ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          return json({ error: msg }, 500);
        }
      },
    },
  },
});

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;color:#777;border-bottom:1px solid #f0f0f0;">${label}</td>
    <td style="padding:10px 0;text-align:right;font-weight:bold;color:#1a1a2e;border-bottom:1px solid #f0f0f0;">${value}</td>
  </tr>`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}