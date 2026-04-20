import { useState, type ReactNode } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Mode = "deposit" | "transfer" | "paybill" | null;

export function MoneyActions({ mode, onClose, onDone }: { mode: Mode; onClose: () => void; onDone: () => void }) {
  if (!mode) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {mode === "deposit" && <DepositForm onClose={onClose} onDone={onDone} />}
        {mode === "transfer" && <TransferForm onClose={onClose} onDone={onDone} />}
        {mode === "paybill" && <PayBillForm onClose={onClose} onDone={onDone} />}
      </div>
    </div>
  );
}

function Shell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="flex items-start justify-between p-6 border-b border-border">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-deep">{title}</h2>
          <p className="text-sm text-navy-light mt-1">{subtitle}</p>
        </div>
        <button onClick={onClose} className="text-navy-light hover:text-navy-deep" aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy-deep uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-navy-deep text-sm focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";

function Status({ error, success }: { error?: string; success?: string }) {
  if (error) return <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>;
  if (success) return <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{success}</div>;
  return null;
}

function DepositForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("ACH from external bank");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(""); setOk("");
    const { error } = await supabase.rpc("user_request_deposit", { _amount: Number(amount), _method: method });
    setBusy(false);
    if (error) return setErr(error.message);
    setOk("Deposit submitted. Funds clear within 1–3 business days.");
    onDone();
    setTimeout(onClose, 1600);
  };

  return (
    <Shell title="Deposit funds" subtitle="Request a deposit to your account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount (USD)">
          <input type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
        </Field>
        <Field label="Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
            <option>ACH from external bank</option>
            <option>Wire transfer</option>
            <option>Mobile check deposit</option>
            <option>Cash deposit at branch</option>
          </select>
        </Field>
        <Status error={err} success={ok} />
        <button disabled={busy} className="w-full bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit deposit
        </button>
      </form>
    </Shell>
  );
}

function TransferForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(""); setOk("");
    const { error } = await supabase.rpc("user_transfer_funds", { _to_account: to.trim(), _amount: Number(amount), _memo: memo });
    setBusy(false);
    if (error) return setErr(error.message);
    setOk("Transfer completed.");
    onDone();
    setTimeout(onClose, 1400);
  };

  return (
    <Shell title="Transfer money" subtitle="Send funds to another member account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Recipient account number">
          <input required value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} placeholder="10-digit account number" />
        </Field>
        <Field label="Amount (USD)">
          <input type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
        </Field>
        <Field label="Memo (optional)">
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputCls} placeholder="What's this for?" maxLength={120} />
        </Field>
        <Status error={err} success={ok} />
        <button disabled={busy} className="w-full bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send transfer
        </button>
      </form>
    </Shell>
  );
}

function PayBillForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(""); setOk("");
    const { error } = await supabase.rpc("user_pay_bill", { _payee: payee.trim(), _amount: Number(amount), _memo: memo });
    setBusy(false);
    if (error) return setErr(error.message);
    setOk("Bill payment scheduled.");
    onDone();
    setTimeout(onClose, 1400);
  };

  return (
    <Shell title="Pay a bill" subtitle="Pay a registered payee from your account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Payee">
          <input required value={payee} onChange={(e) => setPayee(e.target.value)} className={inputCls} placeholder="e.g. ConEdison, Verizon, Landlord" maxLength={80} />
        </Field>
        <Field label="Amount (USD)">
          <input type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
        </Field>
        <Field label="Account / memo (optional)">
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputCls} placeholder="Bill reference" maxLength={120} />
        </Field>
        <Status error={err} success={ok} />
        <button disabled={busy} className="w-full bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay bill
        </button>
      </form>
    </Shell>
  );
}