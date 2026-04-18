import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, HandCoins, Gift, CreditCard, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

interface Stats {
  users: number;
  pendingLoans: number;
  pendingGrants: number;
  pendingCards: number;
  totalBalance: number;
  activeCards: number;
}

function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [usersR, loansR, grantsR, cardsR, balR, activeC] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("loan_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("grant_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("credit_card_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("balance"),
        supabase.from("credit_cards").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);
      const totalBalance = (balR.data ?? []).reduce((a, r) => a + Number(r.balance ?? 0), 0);
      setStats({
        users: usersR.count ?? 0,
        pendingLoans: loansR.count ?? 0,
        pendingGrants: grantsR.count ?? 0,
        pendingCards: cardsR.count ?? 0,
        activeCards: activeC.count ?? 0,
        totalBalance,
      });
    })();
  }, []);

  const cards = [
    { label: "Total members", value: stats?.users ?? 0, icon: Users, to: "/admin/users", color: "indigo" },
    { label: "Active credit cards", value: stats?.activeCards ?? 0, icon: CreditCard, to: "/admin/cards", color: "navy" },
    { label: "Total deposits", value: `$${(stats?.totalBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, to: "/admin/funds", color: "emerald" },
  ];

  const queues = [
    { label: "Pending loans", value: stats?.pendingLoans ?? 0, icon: HandCoins, to: "/admin/loans" },
    { label: "Pending grants", value: stats?.pendingGrants ?? 0, icon: Gift, to: "/admin/grants" },
    { label: "Pending card applications", value: stats?.pendingCards ?? 0, icon: CreditCard, to: "/admin/cards" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy-deep">Operational overview</h2>
        <p className="text-sm text-navy-light mt-1">Real-time system health and pending review queues.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="group rounded-xl border border-border bg-white p-6 hover:border-indigo/40 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo/10 text-indigo">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-xs text-navy-light uppercase tracking-wider">View →</span>
            </div>
            <div className="mt-5">
              <div className="text-3xl font-display font-bold text-navy-deep">{c.value}</div>
              <div className="text-sm text-navy-light mt-1">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Review queues
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {queues.map((q) => (
            <Link key={q.label} to={q.to} className="rounded-xl border border-border bg-white p-5 hover:border-gold-500 hover:shadow transition flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-500/10 text-gold-600">
                  <q.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-navy-deep">{q.label}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${q.value > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700"}`}>
                {q.value} {q.value === 1 ? "item" : "items"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
