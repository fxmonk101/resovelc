import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Bell, CreditCard, Gift, LayoutDashboard, LogOut, Plus, Send, Settings as SettingsIcon, Shield, User, Wallet } from "lucide-react";
import { useAuth, signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Resolve Case" }],
  }),
  component: DashboardPage,
});

interface Profile {
  first_name: string;
  last_name: string;
  username: string;
  account_type: string;
  account_number: string;
  balance: number;
  currency: string;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name,last_name,username,account_type,account_number,balance,currency")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-slate-light">Loading…</div>;
  }

  const masked = profile?.account_number ? `••••${profile.account_number.slice(-4)}` : "••••----";

  return (
    <div className="min-h-screen flex bg-ivory">
      <aside className="hidden lg:flex w-64 bg-slate-deep text-white flex-col">
        <Link to="/" className="flex items-center gap-2 px-6 py-6 border-b border-white/10">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-terra"><Shield className="h-5 w-5" /></span>
          <span className="font-display text-lg font-bold">{BRAND.name}</span>
        </Link>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: Wallet, label: "Transactions" },
            { icon: CreditCard, label: "Cards" },
            { icon: Send, label: "Send Money" },
            { icon: Gift, label: "Grants" },
            { icon: User, label: "Profile" },
            { icon: SettingsIcon, label: "Settings" },
          ].map((it) => (
            <button key={it.label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${it.active ? "bg-terra text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              <it.icon className="h-4 w-4" /> {it.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6">
          <div>
            <h1 className="font-display text-lg font-bold text-slate-deep">{greeting()}, {profile?.first_name ?? "there"}</h1>
            <p className="text-xs text-slate-light hidden sm:block">Here's what's happening with your money</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-ivory-dark text-slate-deep relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-terra" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-terra text-white text-sm font-semibold">
              {(profile?.first_name?.[0] ?? "").toUpperCase()}{(profile?.last_name?.[0] ?? "").toUpperCase()}
            </div>
            <button onClick={handleSignOut} className="lg:hidden text-slate-light" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-deep text-white rounded-2xl p-7 lg:p-9 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-terra/30 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <div className="text-label text-white/60">{profile?.account_type ?? "Account"}</div>
                <div className="font-mono text-sm mt-1 text-white/80">{masked}</div>
                <div className="font-display text-5xl lg:text-6xl font-bold mt-4">
                  {profile?.currency ?? "USD"} {(profile?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button className="inline-flex items-center gap-2 bg-terra hover:bg-terra-dark px-5 py-3 rounded-lg font-semibold transition self-start">
                <Plus className="h-4 w-4" /> Add Funds
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Send, label: "Send Money" },
              { icon: ArrowDownLeft, label: "Pay Bills" },
              { icon: Plus, label: "Add Money" },
              { icon: ArrowUpRight, label: "Exchange" },
            ].map((q) => (
              <button key={q.label} className="bg-white border border-border rounded-2xl p-5 hover:border-terra hover:shadow-card transition text-left">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-terra/10 text-terra"><q.icon className="h-5 w-5" /></span>
                <div className="mt-3 font-semibold text-slate-deep text-sm">{q.label}</div>
              </button>
            ))}
          </div>

          <div className="bg-white border border-border rounded-2xl p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-slate-deep">Recent transactions</h2>
              <button className="text-sm text-terra font-semibold hover:underline">View all</button>
            </div>
            <div className="py-12 text-center text-slate-light">
              <Wallet className="h-10 w-10 mx-auto opacity-40" />
              <p className="mt-3 text-sm">No transactions yet. They'll show up here.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
