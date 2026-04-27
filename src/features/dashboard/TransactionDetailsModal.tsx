import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, ArrowDownLeft, ArrowUpRight, Calendar, Hash, Tag, Copy, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditDomesticModal } from "./PendingTransfers";

export interface TxRow {
  id: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  reference?: string;
}

type LinkedKind = "domestic" | "intl" | null;

function extractTransferReference(tx: TxRow) {
  const direct = tx.reference?.trim();
  if (direct && /^(DT|INT)-[A-Z0-9]+$/i.test(direct)) return direct.toUpperCase();
  return tx.description.match(/\b(?:DT|INT)-[A-Z0-9]+\b/i)?.[0]?.toUpperCase() ?? direct ?? null;
}

/**
 * Shows full details for a transaction. If the transaction is still pending
 * and matches a domestic/international transfer by reference, the user can
 * cancel it directly from this modal.
 */
export function TransactionDetailsModal({
  tx, onClose, onChange,
}: { tx: TxRow; onClose: () => void; onChange?: () => void }) {
  const [linked, setLinked] = useState<{ kind: LinkedKind; id: string | null; record?: any }>({ kind: null, id: null });
  const [resolving, setResolving] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingTx, setEditingTx] = useState(false);
  const [editAmount, setEditAmount] = useState(String(Math.abs(Number(tx.amount))));
  const [editDesc, setEditDesc] = useState(tx.description);
  const credit = tx.type === "credit" || tx.type === "admin_credit" || Number(tx.amount) > 0;
  const isPending = tx.status === "pending";
  const transferReference = extractTransferReference(tx);
  const canManageTransfer = Boolean(linked.id) && !msg.ok;
  // Fallback: any pending transaction the user owns can be cancelled/edited
  // even if it's not linked to a domestic/international transfer (e.g. a
  // pending deposit request created by an admin).
  const canManageTx = isPending && !msg.ok && !canManageTransfer;
  const isDomesticTransfer = linked.kind === "domestic" && Boolean(linked.record);
  const isExternalTransferType = tx.type === "domestic_transfer" || tx.type === "international_transfer";
  const showPendingBanner = isPending && isExternalTransferType;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLinked({ kind: null, id: null });
      setResolving(true);
      if (!transferReference) {
        setResolving(false);
        return;
      }
      const [{ data: dt }, { data: it }] = await Promise.all([
        supabase.from("domestic_transfers").select("id,reference,recipient_name,bank_name,routing_number,account_number,account_type,amount,memo,status,created_at").eq("reference", transferReference).maybeSingle(),
        supabase.from("international_transfers").select("id,status").eq("reference", transferReference).maybeSingle(),
      ]);
      if (!alive) return;
      if (dt && dt.status === "pending") setLinked({ kind: "domestic", id: dt.id, record: dt });
      else if (it && it.status === "pending") setLinked({ kind: "intl", id: it.id });
      setResolving(false);
    })();
    return () => { alive = false; };
  }, [transferReference]);

  const cancel = async () => {
    if (!linked.id) return;
    setBusy(true); setMsg({});
    const fn = linked.kind === "intl" ? "user_cancel_international_transfer" : "user_cancel_domestic_transfer";
    const { error } = await supabase.rpc(fn, { _id: linked.id });
    setBusy(false);
    if (error) { setMsg({ err: error.message }); return; }
    setMsg({ ok: "Transfer cancelled" });
    setConfirming(false);
    onChange?.();
  };

  const cancelTx = async () => {
    setBusy(true); setMsg({});
    const { error } = await supabase.rpc("user_cancel_pending_transaction", { _id: tx.id });
    setBusy(false);
    if (error) { setMsg({ err: error.message }); return; }
    setMsg({ ok: "Transaction cancelled" });
    setConfirming(false);
    onChange?.();
  };

  const saveTx = async () => {
    const amt = Number(editAmount);
    if (!isFinite(amt) || amt <= 0) { setMsg({ err: "Enter a valid amount greater than 0" }); return; }
    if (!editDesc.trim()) { setMsg({ err: "Description is required" }); return; }
    setBusy(true); setMsg({});
    const { error } = await supabase.rpc("user_edit_pending_transaction", {
      _id: tx.id, _amount: amt, _description: editDesc.trim(),
    });
    setBusy(false);
    if (error) { setMsg({ err: error.message }); return; }
    setMsg({ ok: "Transaction updated" });
    setEditingTx(false);
    onChange?.();
  };

  const cancelLabel = linked.kind === "intl" ? "Cancel wire" : "Cancel transfer";

  const copy = (val: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] flex flex-col my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`grid h-10 w-10 place-items-center rounded-full shrink-0 ${credit ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {credit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-navy-deep truncate">{tx.description}</h3>
              <p className="text-[11px] text-navy-light capitalize">{tx.type.replace(/_/g, " ")} · {tx.status}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-light hover:text-navy-deep" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {showPendingBanner && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">This transfer is being processed</p>
              <p className="mt-1 text-xs leading-relaxed">
                The amount has been debited from your account. Funds will arrive in
                the recipient's bank within <strong>12–24 hours</strong>. You can
                edit or cancel this transfer while it remains pending — if it is
                cancelled or fails, the money is automatically refunded.
              </p>
            </div>
          )}
          <div className="text-center">
            <div className={`font-display text-3xl font-bold ${credit ? "text-success" : "text-navy-deep"}`}>
              {credit ? "+" : "−"}${Math.abs(Number(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-ivory border border-border text-navy-deep capitalize">
              <span className={`h-1.5 w-1.5 rounded-full ${tx.status === "completed" ? "bg-success" : tx.status === "pending" ? "bg-amber-500" : "bg-destructive"}`} />
              {tx.status}
            </div>
          </div>

          <dl className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            <Row icon={Calendar} label="Date">
              {new Date(tx.created_at).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}
            </Row>
            {transferReference && (
              <Row icon={Hash} label="Reference">
                <button onClick={() => copy(transferReference)} className="font-mono text-xs inline-flex items-center gap-1.5 hover:text-indigo">
                  {transferReference} <Copy className="h-3 w-3" />
                </button>
              </Row>
            )}
            <Row icon={Tag} label="Type">
              <span className="capitalize">{tx.type.replace(/_/g, " ")}</span>
            </Row>
          </dl>

          {msg.err && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{msg.err}</div>}
          {msg.ok && <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{msg.ok}</div>}

          {editingTx && canManageTx && (
            <div className="rounded-lg border border-border bg-ivory p-3 space-y-2">
              <label className="block text-[11px] font-semibold text-navy-deep uppercase">Description
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={200}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-navy-deep focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
              </label>
              <label className="block text-[11px] font-semibold text-navy-deep uppercase">Amount (USD)
                <input type="number" min="0.01" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-navy-deep focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
              </label>
            </div>
          )}
        </div>

        {confirming && (canManageTransfer || canManageTx) && (
          <div className="mx-4 mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Cancel this pending transaction?</p>
                <p className="mt-0.5 text-xs text-navy-light">This will cancel the pending transaction and cannot be undone.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border-t border-border shrink-0">
          <button type="button" onClick={confirming ? () => setConfirming(false) : editingTx ? () => setEditingTx(false) : onClose} className="w-full py-2.5 rounded-lg border border-border text-navy-deep text-sm font-semibold">
            {confirming ? "Keep transaction" : editingTx ? "Discard" : "Close"}
          </button>
          {canManageTransfer && isDomesticTransfer && !confirming && (
            <button
              type="button" onClick={() => setEditing(true)} disabled={busy}
              className="w-full py-2.5 rounded-lg bg-indigo/10 hover:bg-indigo/20 border border-indigo/30 text-indigo text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          {canManageTransfer && (
            <button
              type="button" onClick={confirming ? cancel : () => setConfirming(true)} disabled={busy}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 ${confirming ? "bg-destructive hover:bg-destructive/90 text-white" : "bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive"}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {confirming ? "Yes, cancel" : cancelLabel}
            </button>
          )}
          {canManageTx && !confirming && (
            <button
              type="button" onClick={editingTx ? saveTx : () => setEditingTx(true)} disabled={busy}
              className="w-full py-2.5 rounded-lg bg-indigo/10 hover:bg-indigo/20 border border-indigo/30 text-indigo text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {busy && editingTx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />} {editingTx ? "Save changes" : "Edit"}
            </button>
          )}
          {canManageTx && !editingTx && (
            <button
              type="button" onClick={confirming ? cancelTx : () => setConfirming(true)} disabled={busy}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 ${confirming ? "bg-destructive hover:bg-destructive/90 text-white" : "bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive"}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {confirming ? "Yes, cancel" : "Cancel transaction"}
            </button>
          )}
        </div>
        {editing && linked.kind === "domestic" && linked.record && (
          <EditDomesticModal
            transfer={linked.record}
            onClose={() => setEditing(false)}
            onSaved={() => { setEditing(false); setMsg({ ok: "Transfer updated" }); onChange?.(); }}
          />
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof Calendar; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs text-navy-light"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="text-sm text-navy-deep text-right truncate">{children}</div>
    </div>
  );
}
