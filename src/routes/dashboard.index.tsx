import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Briefcase, CreditCard, Gift, HandCoins, Plus, Send, ShieldCheck, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

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

function Overview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState({ loans: 0, grants: 0, cards: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: lc }, { count: gc }, { count: cc }] = await Promise.all([
        supabase.from("profiles").select("first_name,account_type,account_number,balance,currency,is_verified").eq("user_id", user.id).maybeSingle(),
        supabase.from("loan_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("grant_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("credit_cards").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setProfile(p as Profile | null);
      setCounts({ loans: lc ?? 0, grants: gc ?? 0, cards: cc ?? 0 });
    })();
  }, [user]);

  const masked = profile?.account_number ? `••••${profile.account_number.slice(-4)}` : "••••----";
  const balance = Number(profile?.balance ?? 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {!profile?.is_verified && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-navy-deep flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-warning" />
          <span>Your account is under review. An admin will fund your balance and approve applications shortly.</span>
        </div>
      )}

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-indigo text-white rounded-2xl p-7 lg:p-9 relative overflow-hidden shadow-elevated"
      >
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute inset-0 bg-grid-dots opacity-30" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="text-label text-white/60">{profile?.account_type ?? "Checking"} · {masked}</div>
            <div className="text-xs text-white/60 mt-2">Available balance</div>
            <div className="font-display text-5xl lg:text-6xl font-bold mt-1">
              {profile?.currency ?? "USD"} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 bg-white text-navy-deep hover:bg-white/90 px-4 py-2.5 rounded-lg font-semibold text-sm transition">
              <Plus className="h-4 w-4" /> Deposit
            </button>
            <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2.5 rounded-lg font-semibold text-sm transition border border-white/20">
              <Send className="h-4 w-4" /> Transfer
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Wallet, label: "Personal", to: "/dashboard/personal", color: "indigo" },
          { icon: Briefcase, label: "Business", to: "/dashboard/business", color: "navy" },
          { icon: CreditCard, label: "Cards", to: "/dashboard/cards", color: "indigo" },
          { icon: HandCoins, label: "Loans", to: "/dashboard/loans", color: "navy" },
        ].map((q) => (
          <Link key={q.label} to={q.to} className="bg-white border border-border rounded-2xl p-5 hover:border-indigo hover:shadow-card transition text-left group">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo/10 text-indigo group-hover:bg-indigo group-hover:text-white transition">
              <q.icon className="h-5 w-5" />
            </span>
            <div className="mt-3 font-semibold text-navy-deep text-sm">{q.label}</div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: "Active loans", value: counts.loans, icon: HandCoins, to: "/dashboard/loans" },
          { label: "Grant applications", value: counts.grants, icon: Gift, to: "/dashboard/grants" },
          { label: "Credit cards", value: counts.cards, icon: CreditCard, to: "/dashboard/cards" },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="bg-white border border-border rounded-xl p-5 flex items-center justify-between hover:border-indigo transition">
            <div>
              <div className="text-xs text-navy-light">{s.label}</div>
              <div className="font-display text-3xl font-bold text-navy-deep mt-1">{s.value}</div>
            </div>
            <s.icon className="h-8 w-8 text-indigo/40" />
          </Link>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white border border-border rounded-2xl p-6 lg:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-navy-deep">Recent transactions</h2>
          <button className="text-sm text-indigo font-semibold hover:underline">View all</button>
        </div>
        <div className="py-12 text-center text-navy-light">
          <Wallet className="h-10 w-10 mx-auto opacity-40" />
          <p className="mt-3 text-sm">No transactions yet. Once your account is funded by an admin, activity will appear here.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl p-4">
          <ArrowDownLeft className="h-4 w-4 text-success" />
          <span className="text-body">Direct deposit, ACH and wire transfers supported.</span>
        </div>
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl p-4">
          <ArrowUpRight className="h-4 w-4 text-indigo" />
          <span className="text-body">Send money to anyone in 100+ countries.</span>
        </div>
      </div>
    </div>
  );
}
