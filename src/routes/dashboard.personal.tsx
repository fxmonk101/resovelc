import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/personal")({
  component: PersonalDash,
});

function PersonalDash() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ account_type: string; account_number: string; balance: number; currency: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type,account_number,balance,currency").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const balance = Number(profile?.balance ?? 0);
  const cur = profile?.currency ?? "USD";

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-deep">Personal Banking</h1>
        <p className="text-body mt-1">Your everyday checking, savings, and investment accounts.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 gradient-indigo text-white rounded-2xl p-7 relative overflow-hidden shadow-elevated">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <div className="text-label text-white/60">{profile?.account_type ?? "Checking"}</div>
          <div className="font-mono text-xs mt-1 text-white/70">•••• {profile?.account_number?.slice(-4) ?? "----"}</div>
          <div className="font-display text-5xl font-bold mt-4">{cur} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-white/70 mt-2">Available balance</div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3"><PiggyBank className="h-5 w-5 text-indigo" /><div className="text-label text-navy-light">Savings APY</div></div>
            <div className="font-display text-3xl font-bold text-navy-deep mt-2">4.50%</div>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-success" /><div className="text-label text-navy-light">Month YTD</div></div>
            <div className="font-display text-3xl font-bold text-success mt-2">+0.00</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 lg:p-7">
        <h2 className="font-display text-xl font-bold text-navy-deep mb-4">Account services</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {["Order checks", "Direct deposit", "Mobile deposit", "Wire transfer", "Set up alerts", "Statements", "Tax documents", "Card controls"].map((s) => (
            <button
              key={s}
              className="text-left bg-white hover:bg-ivory border border-border rounded-lg p-4 text-sm font-semibold text-navy-deep transition shadow-sm"
            >
              <Wallet className="h-4 w-4 text-indigo mb-2" />
              <span className="text-navy-deep">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
