import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe2, Send, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/dashboard/international")({
  head: () => ({ meta: [{ title: "International Wire — Resolva Credix" }] }),
  component: InternationalPage,
});

const COUNTRIES = ["United Kingdom","Germany","France","Spain","Italy","Netherlands","Switzerland","Canada","Mexico","Brazil","Argentina","Japan","China","South Korea","Singapore","Hong Kong","India","UAE","Saudi Arabia","South Africa","Nigeria","Kenya","Ghana","Australia","New Zealand"];
const CURRENCIES = ["USD","EUR","GBP","CAD","AUD","JPY","CHF","CNY","HKD","SGD","INR","AED","ZAR","NGN","KES","BRL","MXN"];

interface Row {
  id: string; reference: string; recipient_name: string; recipient_country: string;
  currency: string; amount: number; fee: number; status: string; created_at: string;
}

function InternationalPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({
    recipient_name: "", recipient_bank: "", swift_bic: "", iban: "",
    country: COUNTRIES[0], recipient_address: "", currency: "USD", amount: "", purpose: "",
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("international_transfers").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(""); setOk("");
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { setErr("Enter a positive amount"); setBusy(false); return; }
    const { error } = await supabase.rpc("user_submit_international_transfer", {
      _recipient_name: form.recipient_name.trim(),
      _recipient_bank: form.recipient_bank.trim(),
      _swift_bic: form.swift_bic.trim().toUpperCase(),
      _iban: form.iban.trim().toUpperCase(),
      _country: form.country,
      _recipient_address: form.recipient_address || "",
      _currency: form.currency,
      _amount: amt,
      _purpose: form.purpose || "",
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOk("International wire submitted. Funds typically arrive in 1–3 business days.");
    setForm({ ...form, recipient_name: "", recipient_bank: "", swift_bic: "", iban: "", recipient_address: "", amount: "", purpose: "" });
    load();
  };

  const cls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-indigo" /> International wire transfer
        </h2>
        <p className="text-sm text-navy-light mt-1">Send money worldwide via SWIFT. Fee: $25 or 0.5% (whichever is higher).</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-white border border-border p-6 space-y-4">
        <h3 className="font-display font-bold text-navy-deep">Recipient & bank details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Recipient full name"><input required value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className={cls} maxLength={120} /></Field>
          <Field label="Recipient bank name"><input required value={form.recipient_bank} onChange={(e) => setForm({ ...form, recipient_bank: e.target.value })} className={cls} maxLength={120} /></Field>
          <Field label="SWIFT / BIC"><input required value={form.swift_bic} onChange={(e) => setForm({ ...form, swift_bic: e.target.value })} className={cls} placeholder="e.g. DEUTDEFF" maxLength={11} /></Field>
          <Field label="IBAN / Account number"><input required value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} className={cls} placeholder="e.g. DE89 3704 0044 0532 0130 00" maxLength={40} /></Field>
          <Field label="Recipient country">
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={cls}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Recipient address (optional)"><input value={form.recipient_address} onChange={(e) => setForm({ ...form, recipient_address: e.target.value })} className={cls} maxLength={200} /></Field>
        </div>

        <h3 className="font-display font-bold text-navy-deep pt-2">Amount</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Currency">
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={cls}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={`Amount (${form.currency})`}>
              <input type="number" min="1" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={cls} placeholder="0.00" />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Purpose of transfer (optional)"><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={cls} placeholder="e.g. Family support, supplier payment" maxLength={200} /></Field>
          </div>
        </div>

        {form.amount && Number(form.amount) > 0 && (
          <div className="rounded-lg bg-ivory border border-border p-3 text-sm flex items-center justify-between">
            <span className="text-navy-light">Estimated fee</span>
            <span className="font-semibold text-navy-deep">${Math.max(25, Number(form.amount) * 0.005).toFixed(2)}</span>
          </div>
        )}

        {err && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{err}</div>}
        {ok && <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{ok}</div>}

        <button disabled={busy} className="bg-indigo hover:bg-navy disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send wire
        </button>
      </form>

      <div className="rounded-2xl bg-white border border-border p-6">
        <h3 className="font-display font-bold text-navy-deep mb-3">Recent international transfers</h3>
        {rows.length === 0 ? (
          <div className="text-sm text-navy-light py-6 text-center">No international transfers yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-navy-deep text-sm truncate">{r.recipient_name} · {r.recipient_country}</div>
                  <div className="text-xs text-navy-light">{new Date(r.created_at).toLocaleString()} · #{r.reference}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-navy-deep">{r.currency} {Number(r.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                  <StatusBadge s={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy-deep uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { c: string; Icon: typeof Clock }> = {
    pending:    { c: "bg-amber-500/10 text-amber-700",   Icon: Clock },
    processing: { c: "bg-indigo/10 text-indigo",         Icon: Clock },
    completed:  { c: "bg-emerald-500/10 text-emerald-700", Icon: CheckCircle2 },
    failed:     { c: "bg-destructive/10 text-destructive", Icon: AlertCircle },
  };
  const m = map[s] ?? map.pending;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${m.c}`}><m.Icon className="h-3 w-3" />{s}</span>;
}