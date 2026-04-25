import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, ArrowDownLeft, ArrowUpRight, Calendar, Hash, Tag, Copy, Pencil } from "lucide-react";
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
  const credit = tx.type === "credit" || tx.type === "admin_credit" || Number(tx.amount) > 0;
  const isPending = tx.status === "pending";

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isPending || !tx.reference) {
        setResolving(false);
        return;
      }
      const [{ data: dt }, { data: it }] = await Promise.all([
        supabase.from("domestic_transfers").select("id,reference,recipient_name,bank_name,routing_number,account_number,account_type,amount,memo,status,created_at").eq("reference", tx.reference).maybeSingle(),
        supabase.from("international_transfers").select("id,status").eq("reference", tx.reference).maybeSingle(),
      ]);
      if (!alive) return;
      if (dt && dt.status === "pending") setLinked({ kind: "domestic", id: dt.id, record: dt });
      else if (it && it.status === "pending") setLinked({ kind: "intl", id: it.id });
      setResolving(false);
    })();
    return () => { alive = false; };
  }, [tx.reference, isPending]);

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
            {tx.reference && (
              <Row icon={Hash} label="Reference">
                <button onClick={() => copy(tx.reference!)} className="font-mono text-xs inline-flex items-center gap-1.5 hover:text-indigo">
                  {tx.reference} <Copy className="h-3 w-3" />
                </button>
              </Row>
            )}
            <Row icon={Tag} label="Type">
              <span className="capitalize">{tx.type.replace(/_/g, " ")}</span>
            </Row>
          </dl>

          {msg.err && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{msg.err}</div>}
          {msg.ok && <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{msg.ok}</div>}

          {isPending && !resolving && !linked.id && !msg.ok && (
            <p className="text-[11px] text-navy-light text-center">
              This pending item is being processed. To cancel a pending transfer, use the “Pending transfers” panel on your dashboard.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-navy-deep text-sm font-semibold">
            Close
          </button>
          {isPending && linked.id && !msg.ok && (
            <>
            {linked.kind === "domestic" && !confirming && (
              <button
                type="button" onClick={() => setEditing(true)} disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-indigo/10 hover:bg-indigo/20 border border-indigo/30 text-indigo text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {confirming ? (
              <button
                type="button" onClick={cancel} disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm cancel
              </button>
            ) : (
              <button
                type="button" onClick={() => setConfirming(true)} disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive text-sm font-semibold disabled:opacity-60"
              >
                Cancel transfer
              </button>
            )}
            </>
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
