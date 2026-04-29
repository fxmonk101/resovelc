import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, HandCoins, Gift, CreditCard, TrendingUp, Clock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [sendingEmails, setSendingEmails] = useState(false);

  const handleSendCotEmails = async () => {
    if (!confirm("Send cancellation emails to all users with COT-cancelled transfers?")) return;
    setSendingEmails(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }
      const resp = await fetch("/api/admin/notify-cot-cancellations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "Failed to send emails");
        return;
      }
      toast.success(`Emails queued: ${data.sent} sent, ${data.failed} failed, ${data.skipped} skipped (of ${data.total})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSendingEmails(false);
    }
  };

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

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <div className="font-semibold text-navy-deep">Notify COT-cancelled users</div>
            <div className="text-sm text-navy-light mt-0.5">Send cancellation emails to users whose pending transfers were cancelled due to missing COT codes.</div>
          </div>
        </div>
        <button
          onClick={handleSendCotEmails}
          disabled={sendingEmails}
          className="rounded-lg bg-navy-deep text-white text-sm font-semibold px-4 py-2 hover:bg-navy-deep/90 transition disabled:opacity-60 shrink-0"
        >
          {sendingEmails ? "Sending…" : "Send emails"}
        </button>
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
