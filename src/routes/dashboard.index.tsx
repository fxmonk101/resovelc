import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, Briefcase, CreditCard, Eye, EyeOff,
  Gift, HandCoins, Plus, Send, ShieldCheck, Wallet, TrendingUp,
  PiggyBank, FileText, Smartphone, Phone, MapPin, Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { MoneyActions } from "@/features/dashboard/MoneyActions";
import { KycCard } from "@/features/dashboard/KycCard";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

interface Profile {
  first_name: string;
  account_type: string;
  account_number: string;
  balance: number;
  currency: string;
  is_verified: boolean;
}
interface Tx {
  id: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

function Overview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState({ loans: 0, grants: 0, cards: 0 });
  const [txs, setTxs] = useState<Tx[]>([]);
  const [hide, setHide] = useState(false);
  const [action, setAction] = useState<"deposit" | "transfer" | "paybill" | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
      const [{ data: p }, { count: lc }, { count: gc }, { count: cc }, { data: t }] = await Promise.all([
        supabase.from("profiles").select("first_name,account_type,account_number,balance,currency,is_verified").eq("user_id", user.id).maybeSingle(),
        supabase.from("loan_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("grant_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("credit_cards").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("transactions").select("id,description,amount,type,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
      ]);
      setProfile(p as Profile | null);
      setCounts({ loans: lc ?? 0, grants: gc ?? 0, cards: cc ?? 0 });
      setTxs((t as Tx[]) ?? []);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const masked = profile?.account_number ? `••••${profile.account_number.slice(-4)}` : "••••----";
  const balance = Number(profile?.balance ?? 0);
  const fmt = (n: number) => `${profile?.currency ?? "USD"} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Show only the real personal banking account so the overview total matches the actual balance.
  const accounts = [
    { name: "Primary Checking", number: masked, balance, type: "Checking", color: "indigo" },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <KycCard />

      {/* Top: Balance + spending chart */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 gradient-indigo text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-elevated"
        >
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid-dots opacity-30" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="text-label text-white/60">Total available balance</div>
              <button onClick={() => setHide(!hide)} className="text-white/70 hover:text-white" aria-label="Toggle balance">
                {hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="font-display text-5xl lg:text-6xl font-bold mt-2">
              {hide ? "•••••••" : fmt(accounts.reduce((s, a) => s + a.balance, 0))}
            </div>
            <div className="text-xs text-white/60 mt-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span>+2.4% vs last month</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => setAction("deposit")} className="inline-flex items-center gap-2 bg-white text-navy-deep hover:bg-white/90 px-4 py-2.5 rounded-lg font-semibold text-sm transition">
                <Plus className="h-4 w-4" /> Deposit
              </button>
              <button onClick={() => setAction("transfer")} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2.5 rounded-lg font-semibold text-sm transition border border-white/20">
                <Send className="h-4 w-4" /> Transfer
              </button>
              <button onClick={() => setAction("paybill")} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2.5 rounded-lg font-semibold text-sm transition border border-white/20">
                <FileText className="h-4 w-4" /> Pay bills
              </button>
              <button onClick={() => setAction("deposit")} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2.5 rounded-lg font-semibold text-sm transition border border-white/20">
                <Smartphone className="h-4 w-4" /> Mobile deposit
              </button>
            </div>
          </div>
        </motion.div>

        {/* Spending chart */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-navy-light">Spending · last 7 days</div>
              <div className="font-display text-2xl font-bold text-navy-deep mt-1">{hide ? "•••••" : fmt(balance * 0.04)}</div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">−12%</span>
          </div>
          <svg viewBox="0 0 200 80" className="w-full h-24 mt-3">
            <defs>
              <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.22 270)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="oklch(0.55 0.22 270)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,60 L30,45 L60,55 L90,30 L120,40 L150,20 L180,28 L200,15 L200,80 L0,80 Z" fill="url(#spend)" />
            <path d="M0,60 L30,45 L60,55 L90,30 L120,40 L150,20 L180,28 L200,15" fill="none" stroke="oklch(0.55 0.22 270)" strokeWidth="2" />
          </svg>
          <div className="flex justify-between text-[10px] text-navy-light mt-1">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>

      {/* Accounts list (BofA-style) */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-deep">My accounts</h2>
          <Link to="/dashboard/personal" className="text-sm text-indigo font-semibold hover:underline">Manage</Link>
        </div>
        <div className="divide-y divide-border">
          {accounts.map((a) => (
            <div key={a.name} className="flex items-center justify-between px-6 py-4 hover:bg-ivory transition">
              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo/10 text-indigo">
                  {a.type.startsWith("Sav") ? <PiggyBank className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </span>
                <div>
                  <div className="font-semibold text-navy-deep text-sm">{a.name}</div>
                  <div className="text-xs text-navy-light">{a.type} · {a.number}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-bold text-navy-deep">{hide ? "•••••" : fmt(a.balance)}</div>
                <div className="text-[10px] text-navy-light">Available</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Wallet, label: "Personal", to: "/dashboard/personal" },
          { icon: Briefcase, label: "Business", to: "/dashboard/business" },
          { icon: CreditCard, label: "Cards", to: "/dashboard/cards" },
          { icon: HandCoins, label: "Loans", to: "/dashboard/loans" },
        ].map((q) => (
          <Link key={q.label} to={q.to} className="bg-white border border-border rounded-2xl p-5 hover:border-indigo hover:shadow-card transition text-left group">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo/10 text-indigo group-hover:bg-indigo group-hover:text-white transition">
              <q.icon className="h-5 w-5" />
            </span>
            <div className="mt-3 font-semibold text-navy-deep text-sm">{q.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent transactions + sidebar */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl shadow-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-display text-lg font-bold text-navy-deep">Recent transactions</h2>
            <Link to="/dashboard/personal" className="text-sm text-indigo font-semibold hover:underline">View all</Link>
          </div>
          {txs.length === 0 ? (
            <div className="py-14 text-center text-navy-light px-6">
              <Wallet className="h-10 w-10 mx-auto opacity-40" />
              <p className="mt-3 text-sm">No transactions yet. Activity will appear here once your account is funded.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {txs.map((t) => {
                const credit = t.type === "credit" || Number(t.amount) > 0;
                return (
                  <li key={t.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-ivory transition">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-full ${credit ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-navy-deep">{t.description}</div>
                        <div className="text-[11px] text-navy-light flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          <span>·</span>
                          <span className="capitalize">{t.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono font-semibold text-sm ${credit ? "text-success" : "text-navy-deep"}`}>
                      {credit ? "+" : "−"}{fmt(Math.abs(Number(t.amount)))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {/* Stats summary */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-display font-bold text-navy-deep text-sm">Your products</h3>
            <div className="mt-3 space-y-3">
              {[
                { label: "Active loans", value: counts.loans, icon: HandCoins, to: "/dashboard/loans" },
                { label: "Grant applications", value: counts.grants, icon: Gift, to: "/dashboard/grants" },
                { label: "Credit cards", value: counts.cards, icon: CreditCard, to: "/dashboard/cards" },
              ].map((s) => (
                <Link key={s.label} to={s.to} className="flex items-center justify-between hover:bg-ivory rounded-lg px-2 py-1.5 -mx-2 transition">
                  <div className="flex items-center gap-2.5">
                    <s.icon className="h-4 w-4 text-indigo" />
                    <span className="text-sm text-navy-deep">{s.label}</span>
                  </div>
                  <span className="font-display font-bold text-navy-deep">{s.value}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Customer service */}
          <div className="bg-navy-deep text-white rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm">We're here 24/7</h3>
            <p className="text-xs text-white/60 mt-1">Talk to a real person, anytime.</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href={`tel:${BRAND.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-2 hover:text-terra-light transition">
                <Phone className="h-3.5 w-3.5 text-terra-light" /> {BRAND.phone}
              </a>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-terra-light" /> 4,300+ branches nationwide</div>
            </div>
          </div>

          {/* FDIC reassurance */}
          <div className="bg-success/5 border border-success/20 rounded-2xl p-5">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h3 className="font-display font-bold text-navy-deep text-sm mt-2">FDIC Insured</h3>
            <p className="text-xs text-navy-light mt-1">Your deposits are insured up to $250,000 per depositor.</p>
          </div>
        </div>
      </div>

      <MoneyActions mode={action} onClose={() => setAction(null)} onDone={loadAll} />
    </div>
  );
}
