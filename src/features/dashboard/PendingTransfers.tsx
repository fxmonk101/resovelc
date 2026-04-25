import { useCallback, useEffect, useState } from "react";
import { Clock, X, Pencil, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DT {
  id: string;
  reference: string;
  recipient_name: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
  amount: number;
  memo: string | null;
  status: string;
  created_at: string;
}

interface IT {
  id: string;
  reference: string;
  recipient_name: string;
  recipient_country: string;
  currency: string;
  amount: number;
  status: string;
  created_at: string;
}

/**
 * Lists the user's pending domestic + international transfers and lets
 * them cancel or edit (domestic only) before an admin processes them.
 */
export function PendingTransfers({ userId, onChange }: { userId: string; onChange?: () => void }) {
  const [domestic, setDomestic] = useState<DT[]>([]);
  const [intl, setIntl] = useState<IT[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DT | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: dt }, { data: it }] = await Promise.all([
      supabase.from("domestic_transfers")
        .select("id,reference,recipient_name,bank_name,routing_number,account_number,account_type,amount,memo,status,created_at")
        .eq("user_id", userId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("international_transfers")
        .select("id,reference,recipient_name,recipient_country,currency,amount,status,created_at")
        .eq("user_id", userId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setDomestic((dt as DT[]) ?? []);
    setIntl((it as IT[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const cancelDomestic = async (id: string) => {
    if (!confirm("Cancel this pending transfer? This cannot be undone.")) return;
    setBusyId(id); setMsg({});
    const { error } = await supabase.rpc("user_cancel_domestic_transfer", { _id: id });
    setBusyId(null);
    if (error) return setMsg({ err: error.message });
    setMsg({ ok: "Transfer cancelled" });
    load(); onChange?.();
  };

  const cancelIntl = async (id: string) => {
    if (!confirm("Cancel this pending wire? This cannot be undone.")) return;
    setBusyId(id); setMsg({});
    const { error } = await supabase.rpc("user_cancel_international_transfer", { _id: id });
    setBusyId(null);
    if (error) return setMsg({ err: error.message });
    setMsg({ ok: "Wire cancelled" });
    load(); onChange?.();
  };

  const total = domestic.length + intl.length;
  if (loading) {
    return (
      <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm text-navy-light"><Loader2 className="h-4 w-4 animate-spin" /> Loading pending transfers…</div>
      </div>
    );
  }
  if (total === 0) return null;

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h2 className="font-display text-base sm:text-lg font-bold text-navy-deep">Pending transfers</h2>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold">{total}</span>
        </div>
        <span className="text-[11px] text-navy-light">You can cancel or edit before processing</span>
      </div>

      {msg.err && <div className="m-4 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{msg.err}</div>}
      {msg.ok && <div className="m-4 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{msg.ok}</div>}

      <ul className="divide-y divide-border">
        {domestic.map((t) => (
          <li key={t.id} className="px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-navy-deep truncate">{t.recipient_name} · {t.bank_name}</div>
              <div className="text-[11px] text-navy-light">#{t.reference} · ••••{t.account_number.slice(-4)} · {new Date(t.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="font-mono text-sm font-bold text-navy-deep">${Number(t.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
              <button onClick={() => setEditing(t)} disabled={busyId === t.id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-ivory hover:bg-ivory-dark border border-border text-navy-deep transition disabled:opacity-50">
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button onClick={() => cancelDomestic(t.id)} disabled={busyId === t.id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive transition disabled:opacity-50">
                {busyId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Cancel
              </button>
            </div>
          </li>
        ))}
        {intl.map((t) => (
          <li key={t.id} className="px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-navy-deep truncate">{t.recipient_name} · {t.recipient_country} <span className="text-[10px] text-indigo font-bold">WIRE</span></div>
              <div className="text-[11px] text-navy-light">#{t.reference} · {new Date(t.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="font-mono text-sm font-bold text-navy-deep">{t.currency} {Number(t.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
              <button onClick={() => cancelIntl(t.id)} disabled={busyId === t.id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive transition disabled:opacity-50">
                {busyId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <EditDomesticModal
          transfer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); onChange?.(); setMsg({ ok: "Transfer updated" }); }}
        />
      )}
    </div>
  );
}

function EditDomesticModal({ transfer, onClose, onSaved }: { transfer: DT; onClose: () => void; onSaved: () => void }) {
  const [recipient, setRecipient] = useState(transfer.recipient_name);
  const [bank, setBank] = useState(transfer.bank_name);
  const [routing, setRouting] = useState(transfer.routing_number);
  const [account, setAccount] = useState(transfer.account_number);
  const [type, setType] = useState<"checking" | "savings">((transfer.account_type as "checking" | "savings") ?? "checking");
  const [amount, setAmount] = useState(String(transfer.amount));
  const [memo, setMemo] = useState(transfer.memo ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const { error } = await supabase.rpc("user_edit_domestic_transfer", {
      _id: transfer.id,
      _recipient_name: recipient.trim(),
      _bank_name: bank.trim(),
      _routing_number: routing.trim(),
      _account_number: account.trim(),
      _account_type: type,
      _amount: Number(amount),
      _memo: memo,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved();
  };

  const cls = "w-full px-3 py-2 rounded-lg border border-border bg-white text-navy-deep text-sm focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] flex flex-col my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-display text-lg font-bold text-navy-deep">Edit transfer</h3>
            <p className="text-xs text-navy-light mt-0.5">#{transfer.reference}</p>
          </div>
          <button onClick={onClose} className="text-navy-light hover:text-navy-deep" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 overflow-y-auto flex-1 space-y-3">
          <label className="block text-xs font-semibold text-navy-deep uppercase">Recipient name<input required value={recipient} onChange={(e) => setRecipient(e.target.value)} className={cls + " mt-1 normal-case"} /></label>
          <label className="block text-xs font-semibold text-navy-deep uppercase">Bank<input required value={bank} onChange={(e) => setBank(e.target.value)} className={cls + " mt-1 normal-case"} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-navy-deep uppercase">Routing<input required value={routing} onChange={(e) => setRouting(e.target.value.replace(/\D/g, ""))} maxLength={9} className={cls + " mt-1"} /></label>
            <label className="block text-xs font-semibold text-navy-deep uppercase">Type
              <select value={type} onChange={(e) => setType(e.target.value as "checking" | "savings")} className={cls + " mt-1"}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-semibold text-navy-deep uppercase">Account number<input required value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))} maxLength={20} className={cls + " mt-1"} /></label>
          <label className="block text-xs font-semibold text-navy-deep uppercase">Amount (USD)<input type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={cls + " mt-1"} /></label>
          <label className="block text-xs font-semibold text-navy-deep uppercase">Memo<input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={120} className={cls + " mt-1 normal-case"} /></label>
          {err && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{err}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-navy-deep text-sm font-semibold">Cancel</button>
            <button disabled={busy} className="flex-1 py-2.5 rounded-lg bg-indigo hover:bg-indigo-dark text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}