import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Wallet, PiggyBank, TrendingUp, FileCheck2, ArrowDownToLine, Smartphone,
  Send, BellRing, FileText, Receipt, ShieldCheck, X, CheckCircle2, Loader2, Download,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { MoneyActions } from "@/features/dashboard/MoneyActions";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/personal")({
  component: PersonalDash,
});

type ActionMode = "deposit" | "transfer" | "paybill" | null;
type ServiceKey =
  | "order_checks" | "direct_deposit" | "mobile_deposit" | "wire_transfer"
  | "alerts" | "statements" | "tax_documents" | "card_controls";

function PersonalDash() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ account_type: string; account_number: string; balance: number; currency: string } | null>(null);
  const [moneyMode, setMoneyMode] = useState<ActionMode>(null);
  const [service, setService] = useState<ServiceKey | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type,account_number,balance,currency").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const balance = Number(profile?.balance ?? 0);
  const cur = profile?.currency ?? "USD";

  const services: { key: ServiceKey; label: string; icon: typeof Wallet }[] = [
    { key: "order_checks", label: "Order checks", icon: FileCheck2 },
    { key: "direct_deposit", label: "Direct deposit", icon: ArrowDownToLine },
    { key: "mobile_deposit", label: "Mobile deposit", icon: Smartphone },
    { key: "wire_transfer", label: "Wire transfer", icon: Send },
    { key: "alerts", label: "Set up alerts", icon: BellRing },
    { key: "statements", label: "Statements", icon: FileText },
    { key: "tax_documents", label: "Tax documents", icon: Receipt },
    { key: "card_controls", label: "Card controls", icon: ShieldCheck },
  ];

  const handleService = (key: ServiceKey) => {
    if (key === "direct_deposit" || key === "mobile_deposit") {
      setMoneyMode("deposit");
      return;
    }
    if (key === "wire_transfer") {
      setMoneyMode("transfer");
      return;
    }
    setService(key);
  };

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
          {services.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleService(key)}
              className="text-left bg-white hover:bg-ivory hover:border-indigo border border-border rounded-lg p-4 text-sm font-semibold text-navy-deep transition shadow-sm"
            >
              <Icon className="h-4 w-4 text-indigo mb-2" />
              <span className="text-navy-deep">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <MoneyActions mode={moneyMode} onClose={() => setMoneyMode(null)} onDone={() => setMoneyMode(null)} />
      {service && (
        <ServiceModal
          service={service}
          profile={profile}
          onClose={() => setService(null)}
        />
      )}
    </div>
  );
}

function ServiceModal({
  service, profile, onClose,
}: {
  service: ServiceKey;
  profile: { account_type: string; account_number: string; balance: number; currency: string } | null;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const acct = profile?.account_number ?? "";
  const last4 = acct.slice(-4);

  const meta: Record<ServiceKey, { title: string; description: string; cta: string }> = {
    order_checks: {
      title: "Order checks",
      description: `Order a new checkbook for your account ending in ••••${last4}. Standard delivery is 5–7 business days. There's no charge for your first order.`,
      cta: "Place order",
    },
    direct_deposit: { title: "Direct deposit", description: "", cta: "" },
    mobile_deposit: { title: "Mobile deposit", description: "", cta: "" },
    wire_transfer: { title: "Wire transfer", description: "", cta: "" },
    alerts: {
      title: "Set up account alerts",
      description: "We'll email and text you for low balance, large purchases, deposits, and unusual activity. You can fine-tune individual alerts anytime.",
      cta: "Enable recommended alerts",
    },
    statements: {
      title: "Statements",
      description: "Your monthly statements are stored securely. Download a PDF copy of any of the last 12 months.",
      cta: "",
    },
    tax_documents: {
      title: "Tax documents",
      description: "1099-INT, 1098, and other tax forms for the past 7 years are available here. New forms post by January 31 each year.",
      cta: "",
    },
    card_controls: {
      title: "Card controls",
      description: "Lock your card instantly, set spending limits, or block specific merchant categories. Changes take effect immediately.",
      cta: "Lock card",
    },
  };

  const m = meta[service];

  const submit = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setDone(true);
  };

  const months = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  });

  const taxYears = Array.from({ length: 5 }).map((_, i) => new Date().getFullYear() - 1 - i);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] flex flex-col my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div>
            <h3 className="font-display text-lg font-bold text-navy-deep">{m.title}</h3>
            {last4 && <p className="text-xs text-navy-light mt-0.5">Account ••••{last4}</p>}
          </div>
          <button onClick={onClose} className="text-navy-light hover:text-navy-deep" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {m.description && <p className="text-sm text-navy-deep/80 leading-relaxed">{m.description}</p>}

          {service === "statements" && (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {months.map((label) => (
                <li key={label} className="flex items-center justify-between px-4 py-2.5 hover:bg-ivory">
                  <span className="text-sm text-navy-deep">{label}</span>
                  <button
                    onClick={() => alert(`Your ${label} statement will be emailed to you shortly.`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </li>
              ))}
            </ul>
          )}

          {service === "tax_documents" && (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {taxYears.map((y) => (
                <li key={y} className="flex items-center justify-between px-4 py-2.5 hover:bg-ivory">
                  <span className="text-sm text-navy-deep">1099-INT · Tax year {y}</span>
                  <button
                    onClick={() => alert(`Your ${y} 1099-INT will be emailed to you shortly.`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </li>
              ))}
            </ul>
          )}

          {done && (
            <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {service === "card_controls"
                ? "Card locked. New transactions will be declined until you unlock it."
                : service === "alerts"
                ? "Alerts enabled. We'll notify you of important account activity."
                : service === "order_checks"
                ? "Order placed. Your checks will arrive in 5–7 business days."
                : "Request submitted."}
            </div>
          )}

          <p className="text-[11px] text-navy-light">
            Need help? Call us 24/7 at <a href={`tel:${BRAND.phone.replace(/[^0-9+]/g, "")}`} className="text-indigo font-semibold">{BRAND.phone}</a>.
          </p>
        </div>

        <div className="flex gap-2 p-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-navy-deep text-sm font-semibold">
            {done || !m.cta ? "Close" : "Cancel"}
          </button>
          {m.cta && !done && (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex-1 py-2.5 rounded-lg bg-indigo hover:bg-indigo-dark text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {m.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
