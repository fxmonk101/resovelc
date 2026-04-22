import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Clock, CheckCircle2, XCircle, Wifi, Lock, Unlock, Sparkles, Settings2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/cards")({
  component: CardsDash,
});

const schema = z.object({
  card_type: z.string().min(2),
  requested_limit: z.coerce.number().min(500).max(50000),
  annual_income: z.coerce.number().min(0),
  employment_status: z.string().min(2),
});
type FormVals = z.infer<typeof schema>;

interface CardApp {
  id: string;
  card_type: string;
  requested_limit: number;
  status: string;
  reference: string;
  created_at: string;
}
interface IssuedCard {
  id: string;
  card_type: string;
  card_number: string;
  cvv: string;
  expiry: string;
  credit_limit: number;
  available_credit: number;
  current_balance: number;
  status: string;
  daily_limit: number | null;
  is_virtual: boolean;
}

const statusBadge = (s: string) => {
  if (s === "approved" || s === "issued") return { cls: "bg-success/10 text-success", Icon: CheckCircle2 };
  if (s === "rejected") return { cls: "bg-error/10 text-error", Icon: XCircle };
  return { cls: "bg-warning/10 text-warning", Icon: Clock };
};

function maskPan(n: string) {
  return n.replace(/(.{4})/g, "$1 ").trim();
}

function CardsDash() {
  const { user } = useAuth();
  const [apps, setApps] = useState<CardApp[]>([]);
  const [cards, setCards] = useState<IssuedCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [busyCard, setBusyCard] = useState<string | null>(null);
  const [limitDraft, setLimitDraft] = useState<Record<string, string>>({});
  const [creatingVirtual, setCreatingVirtual] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema) as never,
    defaultValues: { card_type: "Platinum Rewards", requested_limit: 5000 },
  });

  const load = async () => {
    if (!user) return;
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from("credit_card_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("credit_cards").select("*").eq("user_id", user.id),
    ]);
    setApps((a as CardApp[]) ?? []);
    setCards((c as IssuedCard[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const toggleFreeze = async (c: IssuedCard) => {
    setBusyCard(c.id);
    const next = c.status === "frozen" ? "active" : "frozen";
    const { error } = await supabase.from("credit_cards").update({ status: next }).eq("id", c.id);
    setBusyCard(null);
    if (error) return toast.error(error.message);
    toast.success(next === "frozen" ? "Card frozen" : "Card unfrozen");
    load();
  };

  const saveLimit = async (c: IssuedCard) => {
    const v = limitDraft[c.id];
    const n = v === "" || v == null ? null : Number(v);
    if (n != null && (Number.isNaN(n) || n < 0)) return toast.error("Enter a valid limit");
    setBusyCard(c.id);
    const { error } = await supabase.from("credit_cards").update({ daily_limit: n }).eq("id", c.id);
    setBusyCard(null);
    if (error) return toast.error(error.message);
    toast.success("Daily limit updated");
    load();
  };

  const createVirtual = async () => {
    if (!user) return;
    const physical = cards.find((c) => !c.is_virtual);
    if (!physical) return toast.error("Apply for a card first");
    setCreatingVirtual(true);
    const { error } = await supabase.from("credit_cards").insert({
      user_id: user.id,
      application_id: null,
      card_type: `${physical.card_type} · Virtual`,
      credit_limit: Math.min(2000, Number(physical.credit_limit)),
      available_credit: Math.min(2000, Number(physical.credit_limit)),
      is_virtual: true,
    });
    setCreatingVirtual(false);
    if (error) return toast.error(error.message);
    toast.success("Virtual card created");
    load();
  };

  const downloadStatement = async (c: IssuedCard) => {
    if (!user) return;
    const { data: txs } = await supabase
      .from("transactions").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(100);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(15, 27, 61);
    doc.text(`${BRAND.name} — Card Statement`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(80);
    doc.text(`${c.card_type} ending ${c.card_number.slice(-4)}`, 14, 26);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 32);
    doc.setFontSize(11); doc.setTextColor(15, 27, 61);
    doc.text(`Limit: $${Number(c.credit_limit).toLocaleString()}`, 14, 42);
    doc.text(`Balance: $${Number(c.current_balance).toLocaleString()}`, 70, 42);
    doc.text(`Available: $${Number(c.available_credit).toLocaleString()}`, 130, 42);
    doc.setDrawColor(220); doc.line(14, 48, 196, 48);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text("Date", 14, 55); doc.text("Description", 50, 55); doc.text("Amount", 175, 55, { align: "right" });
    let y = 62; doc.setTextColor(20);
    (txs ?? []).forEach((t) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(new Date(t.created_at).toLocaleDateString(), 14, y);
      doc.text(String(t.description).slice(0, 60), 50, y);
      const amt = Number(t.amount);
      doc.text(`${amt >= 0 ? "+" : "-"}$${Math.abs(amt).toFixed(2)}`, 196, y, { align: "right" });
      y += 6;
    });
    doc.save(`statement-${c.card_number.slice(-4)}.pdf`);
  };

  const onSubmit = async (raw: z.input<typeof schema>) => {
    if (!user) return;
    const vals = schema.parse(raw) as FormVals;
    const { error } = await supabase.from("credit_card_applications").insert({
      user_id: user.id,
      card_type: vals.card_type,
      requested_limit: vals.requested_limit,
      annual_income: vals.annual_income,
      employment_status: vals.employment_status,
    });
    if (!error) { reset(); setShowForm(false); load(); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-deep">Credit Cards</h1>
          <p className="text-body mt-1 text-sm">Apply for and manage your Resolve Case cards.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="bg-indigo hover:bg-navy text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-lg shadow-indigo/20">
          {showForm ? "Cancel" : "+ Apply for card"}
        </button>
      </div>

      {/* Issued cards */}
      {cards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-bold text-navy-deep">Your cards</h2>
            <button onClick={createVirtual} disabled={creatingVirtual} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo hover:text-indigo-dark disabled:opacity-50">
              {creatingVirtual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Create virtual card
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {cards.map((c) => {
              const isRevealed = reveal[c.id];
              const isFrozen = c.status === "frozen";
              return (
                <div key={c.id} className={`gradient-navy text-white rounded-2xl p-6 relative overflow-hidden shadow-elevated aspect-[1.586/1] max-w-md transition ${isFrozen ? "grayscale opacity-80" : ""}`}>
                  <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
                  {c.is_virtual && (
                    <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest bg-white/15 backdrop-blur px-2 py-0.5 rounded-full">Virtual</span>
                  )}
                  {isFrozen && (
                    <span className="absolute top-3 left-3 text-[9px] uppercase tracking-widest bg-white/20 backdrop-blur px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Frozen</span>
                  )}
                  <div className="relative flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/60">{BRAND.name}</div>
                        <div className="font-display text-lg font-bold mt-0.5">{c.card_type}</div>
                      </div>
                      <Wifi className="h-5 w-5 text-white/70 rotate-90" />
                    </div>
                    <div className="font-mono text-lg lg:text-xl tracking-wider">
                      {isRevealed ? maskPan(c.card_number) : "•••• •••• •••• " + c.card_number.slice(-4)}
                    </div>
                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <div className="text-white/50 text-[10px]">EXPIRES</div>
                        <div className="font-mono">{c.expiry}</div>
                      </div>
                      <div>
                        <div className="text-white/50 text-[10px]">CVV</div>
                        <div className="font-mono">{isRevealed ? c.cvv : "•••"}</div>
                      </div>
                      <button onClick={() => setReveal((r) => ({ ...r, [c.id]: !isRevealed }))} className="text-[10px] underline text-white/80 hover:text-white">
                        {isRevealed ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 right-3 flex gap-1">
                    <span className="h-7 w-7 rounded-full bg-error/70" />
                    <span className="h-7 w-7 rounded-full bg-warning/70 -ml-3" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.id + "-ctrl"} className="bg-white border border-border rounded-xl p-4 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-navy-deep">•••• {c.card_number.slice(-4)}</div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${c.status === "frozen" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-navy-light">Available</div><div className="font-semibold text-navy-deep">${Number(c.available_credit).toLocaleString()}</div></div>
                  <div><div className="text-navy-light">Balance</div><div className="font-semibold text-navy-deep">${Number(c.current_balance).toLocaleString()}</div></div>
                  <div><div className="text-navy-light">Limit</div><div className="font-semibold text-navy-deep">${Number(c.credit_limit).toLocaleString()}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5 text-navy-light" />
                  <input
                    type="number" min={0} step="50" placeholder={c.daily_limit ? `Daily limit $${c.daily_limit}` : "Set daily limit"}
                    value={limitDraft[c.id] ?? (c.daily_limit?.toString() ?? "")}
                    onChange={(e) => setLimitDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                    className="flex-1 h-8 px-2 rounded-md border border-border text-xs"
                  />
                  <button onClick={() => saveLimit(c)} disabled={busyCard === c.id} className="h-8 px-3 rounded-md bg-indigo text-white text-xs font-semibold disabled:opacity-50">Save</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFreeze(c)} disabled={busyCard === c.id} className={`flex-1 h-8 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ${c.status === "frozen" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-warning/15 text-warning hover:bg-warning/25"}`}>
                    {c.status === "frozen" ? <><Unlock className="h-3.5 w-3.5" />Unfreeze</> : <><Lock className="h-3.5 w-3.5" />Freeze card</>}
                  </button>
                  <button onClick={() => downloadStatement(c)} className="flex-1 h-8 rounded-md text-xs font-semibold border border-border text-navy hover:bg-ivory">
                    Download statement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-5">
          <h2 className="font-display text-xl font-bold text-navy-deep">Credit card application</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Card type" error={errors.card_type?.message}>
              <select {...register("card_type")} className={inputCls}>
                {["Platinum Rewards", "Cashback Plus", "Travel Elite", "Business Unlimited", "Student Starter", "Secured Builder"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Requested credit limit (USD)" error={errors.requested_limit?.message}>
              <input type="number" min={500} step="100" {...register("requested_limit")} className={inputCls} />
            </Field>
            <Field label="Annual income (USD)" error={errors.annual_income?.message}>
              <input type="number" min={0} step="100" {...register("annual_income")} className={inputCls} />
            </Field>
            <Field label="Employment status" error={errors.employment_status?.message}>
              <select {...register("employment_status")} className={inputCls}>
                {["Employed", "Self-employed", "Retired", "Student", "Unemployed"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <button disabled={isSubmitting} className="w-full bg-indigo hover:bg-navy disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition">
            {isSubmitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-navy-deep">Applications</h2>
        </div>
        {apps.length === 0 ? (
          <div className="p-12 text-center text-navy-light">
            <CreditCard className="h-10 w-10 mx-auto opacity-40" />
            <p className="mt-3 text-sm">No card applications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {apps.map((a) => {
              const sb = statusBadge(a.status);
              return (
                <div key={a.id} className="p-5 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-navy-deep">{a.card_type}</div>
                      <span className={`text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${sb.cls}`}>
                        <sb.Icon className="h-3 w-3" /> {a.status}
                      </span>
                    </div>
                    <div className="text-xs text-navy-light mt-1 font-mono">{a.reference}</div>
                  </div>
                  <div className="font-display text-lg font-bold text-navy-deep">${Number(a.requested_limit).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo transition";
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-label text-navy">{label}</label>
      <div className="mt-2">{children}</div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
