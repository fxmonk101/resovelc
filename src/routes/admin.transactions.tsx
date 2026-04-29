import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Search, CheckCircle2, XCircle, Ban, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Pending transactions — Admin" }] }),
  component: AdminTransactions,
});

interface PendingTx {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  reference: string;
  status: string;
  created_at: string;
  admin_notes?: string | null;
  user_email?: string;
  user_name?: string;
}

type Decision = "completed" | "failed" | "cancelled";

function AdminTransactions() {
  const [rows, setRows] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ tx: PendingTx; decision: Decision } | null>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: txData, error } = await supabase
      .from("transactions")
      .select("id,user_id,type,amount,description,reference,status,created_at,admin_notes")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const txs = (txData ?? []) as PendingTx[];

    // hydrate user info
    const userIds = Array.from(new Set(txs.map((t) => t.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,first_name,last_name")
        .in("user_id", userIds);
      const { data: users } = await supabase.rpc("admin_list_users");
      const emailMap = new Map<string, string>();
      const nameMap = new Map<string, string>();
      for (const u of (users ?? []) as Array<{ user_id: string; email: string }>) {
        emailMap.set(u.user_id, u.email);
      }
      for (const p of (profs ?? []) as Array<{ user_id: string; first_name: string; last_name: string }>) {
        nameMap.set(p.user_id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim());
      }
      for (const t of txs) {
        t.user_email = emailMap.get(t.user_id);
        t.user_name = nameMap.get(t.user_id);
      }
    }
    setRows(txs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.description, r.reference, r.type, r.user_email, r.user_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [rows, q]);

  const submit = async () => {
    if (!editing) return;
    setBusyId(editing.tx.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }
      const resp = await fetch("/api/admin/update-transaction-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          transactionId: editing.tx.id,
          newStatus: editing.decision,
          adminNotes: note.trim() || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "Failed to update transaction");
        return;
      }
      const emailMsg = data.email?.status === "sent"
        ? "User notified by email"
        : data.email?.status === "skipped"
          ? "No email on file — in-app notification sent"
          : `Email failed: ${data.email?.error || "unknown"}`;
      toast.success(`Transaction marked ${editing.decision}. ${emailMsg}`);
      setEditing(null);
      setNote("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2">
            <Clock className="h-5 w-5" /> Pending transactions
          </h2>
          <p className="text-sm text-navy-light mt-1">
            Approve, fail, or cancel pending transactions. The user receives a dashboard notification and an email with your note.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description, ref, user…"
            className="pl-9 pr-3 h-10 w-72 rounded-md border border-border bg-white text-sm text-navy-deep placeholder:text-navy-light/60"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-navy-light flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-navy-light">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
            No pending transactions.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const credit = Number(t.amount) >= 0;
              return (
                <div key={t.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-navy-deep truncate">{t.description}</div>
                    <div className="text-xs text-navy-light mt-0.5">
                      {t.user_name || "User"} · {t.user_email || t.user_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-navy-light mt-0.5">
                      {new Date(t.created_at).toLocaleString()} · #{t.reference} · {t.type.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className={`text-base font-bold shrink-0 ${credit ? "text-emerald-700" : "text-destructive"}`}>
                    {credit ? "+" : "−"}${Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditing({ tx: t, decision: "completed" }); setNote(t.admin_notes ?? ""); }}
                      disabled={busyId === t.id}
                      className="h-9 px-3 rounded-md bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </button>
                    <button
                      onClick={() => { setEditing({ tx: t, decision: "failed" }); setNote(t.admin_notes ?? ""); }}
                      disabled={busyId === t.id}
                      className="h-9 px-3 rounded-md bg-destructive text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-destructive/90 disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Fail
                    </button>
                    <button
                      onClick={() => { setEditing({ tx: t, decision: "cancelled" }); setNote(t.admin_notes ?? ""); }}
                      disabled={busyId === t.id}
                      className="h-9 px-3 rounded-md bg-amber-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-amber-700 disabled:opacity-60"
                    >
                      <Ban className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busyId && setEditing(null)}>
          <div className="bg-white rounded-xl shadow-elevated w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-navy-deep flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Mark as <span className="capitalize">{editing.decision}</span>
            </h3>
            <p className="text-sm text-navy-light mt-1">{editing.tx.description}</p>
            <p className="text-xs text-navy-light mt-0.5">#{editing.tx.reference} · {editing.tx.user_email}</p>

            <label className="block mt-4 text-xs font-semibold text-navy-deep uppercase">
              Reason / note for the user
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={editing.decision === "completed"
                ? "Optional confirmation note (sent in email)"
                : "Explain why this transaction was " + editing.decision + " (sent in email)"}
              className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-white text-sm text-navy-deep focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            />
            <p className="text-[11px] text-navy-light mt-1">
              {editing.decision !== "completed" && Number(editing.tx.amount) < 0 && (
                <>The user will be automatically refunded ${Math.abs(Number(editing.tx.amount)).toFixed(2)}.</>
              )}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                disabled={busyId !== null}
                className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busyId !== null}
                className={`h-10 px-4 rounded-md text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 ${
                  editing.decision === "completed" ? "bg-emerald-600 hover:bg-emerald-700" :
                  editing.decision === "failed" ? "bg-destructive hover:bg-destructive/90" :
                  "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm & notify user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}