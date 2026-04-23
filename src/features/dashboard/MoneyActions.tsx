import { useState, type ReactNode } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Copy, ArrowRight, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

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

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-navy-deep text-sm placeholder:text-navy-light/60 focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";

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
  const [kind, setKind] = useState<"internal" | "external">("internal");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [bankName, setBankName] = useState("");
  const [routing, setRouting] = useState("");
  const [extAccount, setExtAccount] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState<null | {
    reference: string;
    amount: number;
    recipient: string;
    bank?: string;
    accountMasked?: string;
    kind: "internal" | "external";
  }>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    if (kind === "internal") {
      const { error } = await supabase.rpc("user_transfer_funds", {
        _to_account: to.trim(),
        _amount: Number(amount),
        _memo: memo,
      });
      setBusy(false);
      if (error) return setErr(error.message);
      setReceipt({
        reference: `RC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        amount: Number(amount),
        recipient: to.trim(),
        accountMasked: `••••${to.trim().slice(-4)}`,
        kind: "internal",
      });
      onDone();
      return;
    } else {
      if (!/^\d{9}$/.test(routing.trim())) { setBusy(false); return setErr("Routing number must be exactly 9 digits"); }
      if (!/^\d{5,20}$/.test(extAccount.trim())) { setBusy(false); return setErr("Account number must be 5–20 digits"); }
      const { data, error } = await supabase.rpc("user_submit_domestic_transfer", {
        _recipient_name: recipientName.trim(),
        _bank_name: bankName.trim(),
        _routing_number: routing.trim(),
        _account_number: extAccount.trim(),
        _account_type: accountType,
        _amount: Number(amount),
        _memo: memo,
      });
      setBusy(false);
      if (error) return setErr(error.message);
      const ref = (data as { reference?: string } | null)?.reference ?? "DT-PENDING";
      setReceipt({
        reference: ref,
        amount: Number(amount),
        recipient: recipientName.trim(),
        bank: bankName.trim(),
        accountMasked: `••••${extAccount.trim().slice(-4)}`,
        kind: "external",
      });
      onDone();
      return;
    }
  };

  if (receipt) {
    return (
      <Shell title="Transfer submitted" subtitle="Keep this reference for your records" onClose={onClose}>
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg bg-success/10 border border-success/30 px-4 py-3">
            <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
            <div className="text-sm text-navy-deep">
              {receipt.kind === "external"
                ? "Your external transfer is being processed. Funds typically arrive in 1–3 business days."
                : "Your transfer to the member account was completed successfully."}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-cream/40 p-4">
            <div className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Reference ID</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="font-mono text-lg font-bold text-navy-deep">{receipt.reference}</div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(receipt.reference)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo hover:text-indigo-dark font-semibold"
                aria-label="Copy reference"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>

          <dl className="text-sm divide-y divide-border rounded-lg border border-border overflow-hidden">
            <div className="flex justify-between px-4 py-2.5 bg-white">
              <dt className="text-navy-light">Amount</dt>
              <dd className="font-semibold text-navy-deep">${receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
            </div>
            <div className="flex justify-between px-4 py-2.5 bg-white">
              <dt className="text-navy-light">Recipient</dt>
              <dd className="font-semibold text-navy-deep text-right">{receipt.recipient}</dd>
            </div>
            {receipt.bank && (
              <div className="flex justify-between px-4 py-2.5 bg-white">
                <dt className="text-navy-light">Bank</dt>
                <dd className="font-semibold text-navy-deep text-right">{receipt.bank}</dd>
              </div>
            )}
            {receipt.accountMasked && (
              <div className="flex justify-between px-4 py-2.5 bg-white">
                <dt className="text-navy-light">Account</dt>
                <dd className="font-mono font-semibold text-navy-deep">{receipt.accountMasked}</dd>
              </div>
            )}
            <div className="flex justify-between px-4 py-2.5 bg-white">
              <dt className="text-navy-light">Status</dt>
              <dd className="font-semibold text-navy-deep">{receipt.kind === "external" ? "Pending" : "Completed"}</dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 rounded-lg transition"
            >
              View transfer status <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center bg-white border border-border text-navy-deep font-semibold py-2.5 rounded-lg hover:bg-cream/40 transition"
            >
              Done
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Transfer money" subtitle="Send funds to another member account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Transfer to">
          <select value={kind} onChange={(e) => setKind(e.target.value as "internal" | "external")} className={inputCls}>
            <option value="internal">Internal Resolva account</option>
            <option value="external">External US bank / credit union</option>
          </select>
        </Field>

        {kind === "internal" ? (
          <Field label="Member account number">
            <input
              required
              value={to}
              onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={20}
              className={inputCls}
              placeholder="Enter recipient account number"
            />
          </Field>
        ) : (
          <>
            <Field label="Recipient full name">
              <input required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={120} className={inputCls} placeholder="Jane Doe" />
            </Field>
            <Field label="Bank or credit union name">
              <input required value={bankName} onChange={(e) => setBankName(e.target.value)} maxLength={120} className={inputCls} placeholder="e.g. Navy Federal Credit Union" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Routing number (ABA)">
                <input required value={routing} onChange={(e) => setRouting(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={9} pattern="\d{9}" className={inputCls} placeholder="9 digits" />
              </Field>
              <Field label="Account type">
                <select value={accountType} onChange={(e) => setAccountType(e.target.value as "checking" | "savings")} className={inputCls}>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </Field>
            </div>
            <Field label="Account number">
              <input required value={extAccount} onChange={(e) => setExtAccount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={20} className={inputCls} placeholder="Up to 20 digits" />
            </Field>
          </>
        )}

        <Field label="Amount (USD)">
          <input type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
        </Field>
        <Field label="Memo (optional)">
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputCls} placeholder="What's this for?" maxLength={120} />
        </Field>
        <Status error={err} />
        <button disabled={busy} className="w-full bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {kind === "internal" ? "Send transfer" : "Submit external transfer"}
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