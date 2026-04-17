import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Clock, CheckCircle2, XCircle, Wifi } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";

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
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
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

  const onSubmit = async (vals: FormVals) => {
    if (!user) return;
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
          <h2 className="font-display text-xl font-bold text-navy-deep mb-3">Your cards</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {cards.map((c) => {
              const isRevealed = reveal[c.id];
              return (
                <div key={c.id} className="gradient-navy text-white rounded-2xl p-6 relative overflow-hidden shadow-elevated aspect-[1.586/1] max-w-md">
                  <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
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
              <div key={c.id + "-stats"} className="bg-white border border-border rounded-xl p-4 text-sm">
                <div className="flex justify-between"><span className="text-navy-light">Available</span><span className="font-semibold text-navy-deep">${Number(c.available_credit).toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span className="text-navy-light">Balance</span><span className="font-semibold text-navy-deep">${Number(c.current_balance).toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span className="text-navy-light">Limit</span><span className="font-semibold text-navy-deep">${Number(c.credit_limit).toLocaleString()}</span></div>
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
