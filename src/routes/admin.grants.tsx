import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/grants")({
  component: AdminGrants,
});

interface Grant {
  id: string;
  user_id: string;
  program: string;
  amount_requested: number;
  approved_amount: number | null;
  purpose: string;
  status: string;
  reference: string;
  created_at: string;
  household_size: number | null;
  household_income: number | null;
  hardship_description: string | null;
  admin_notes: string | null;
}

function AdminGrants() {
  const [items, setItems] = useState<Grant[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editing, setEditing] = useState<Record<string, { amount: string; notes: string }>>({});

  const load = async () => {
    let q = supabase.from("grant_applications").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data ?? []) as Grant[]);
  };

  useEffect(() => { load(); }, [filter]);

  const setEdit = (id: string, patch: Partial<{ amount: string; notes: string }>) => {
    setEditing((p) => ({ ...p, [id]: { amount: "", notes: "", ...p[id], ...patch } }));
  };

  const decide = async (g: Grant, decision: "approved" | "rejected") => {
    const e = editing[g.id] ?? { amount: "", notes: "" };
    const update: Record<string, unknown> = { status: decision, admin_notes: e.notes || null };
    if (decision === "approved") update.approved_amount = Number(e.amount) || g.amount_requested;

    const { error } = await supabase.from("grant_applications").update(update).eq("id", g.id);
    if (error) return toast.error(error.message);

    if (decision === "approved") {
      const amt = Number(update.approved_amount);
      const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", g.user_id).maybeSingle();
      if (profile) {
        await supabase.from("profiles").update({ balance: Number(profile.balance) + amt }).eq("user_id", g.user_id);
        await supabase.from("transactions").insert({
          user_id: g.user_id, amount: amt, type: "grant_award",
          description: `Grant award · ${g.program} (${g.reference})`,
        });
      }
    }
    toast.success(`Grant ${decision}`);
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2"><Gift className="h-6 w-6 text-indigo" />Grant applications</h2>
          <p className="text-sm text-navy-light mt-1">Review hardship and program grant requests.</p>
        </div>
        <div className="flex gap-1 bg-white border border-border rounded-lg p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter === f ? "bg-indigo text-white" : "text-navy-light hover:text-navy-deep"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center text-navy-light">No {filter === "all" ? "" : filter} grant applications.</div>
        ) : items.map((g) => {
          const e = editing[g.id] ?? { amount: "", notes: "" };
          return (
            <div key={g.id} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-navy-deep">{g.program}</span>
                    <span className="text-xs font-mono text-navy-light">#{g.reference}</span>
                    <StatusBadge status={g.status} />
                  </div>
                  <div className="text-sm text-navy-light mt-1">
                    Requested ${Number(g.amount_requested).toLocaleString()} · Household {g.household_size} · Income ${Number(g.household_income ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-navy mt-2 max-w-2xl"><strong>Purpose:</strong> {g.purpose}</div>
                  {g.hardship_description && <div className="text-xs text-navy-light mt-1 max-w-2xl"><strong>Hardship:</strong> {g.hardship_description}</div>}
                </div>
                <div className="text-xs text-navy-light text-right">
                  <div>Submitted</div>
                  <div className="font-medium text-navy">{new Date(g.created_at).toLocaleString()}</div>
                </div>
              </div>

              {g.status === "pending" && (
                <>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="number" step="0.01" placeholder={`Approved $ (default ${g.amount_requested})`} value={e.amount} onChange={(ev) => setEdit(g.id, { amount: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                    <input placeholder="Admin note (optional)" value={e.notes} onChange={(ev) => setEdit(g.id, { notes: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                  </div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button onClick={() => decide(g, "rejected")} className="px-4 h-9 rounded-md border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 inline-flex items-center gap-1.5"><XCircle className="h-4 w-4" />Reject</button>
                    <button onClick={() => decide(g, "approved")} className="px-4 h-9 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Approve & award</button>
                  </div>
                </>
              )}
              {g.status !== "pending" && (g.approved_amount || g.admin_notes) && (
                <div className="mt-3 text-xs text-navy-light">
                  {g.approved_amount && <>Awarded: <span className="font-semibold text-emerald-700">${Number(g.approved_amount).toLocaleString()}</span> · </>}
                  {g.admin_notes && <>Note: {g.admin_notes}</>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; Icon: typeof Clock }> = {
    pending: { c: "bg-amber-500/10 text-amber-700", Icon: Clock },
    approved: { c: "bg-emerald-500/10 text-emerald-700", Icon: CheckCircle2 },
    rejected: { c: "bg-destructive/10 text-destructive", Icon: XCircle },
  };
  const m = map[status] ?? map.pending;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${m.c}`}><m.Icon className="h-3 w-3" />{status}</span>;
}
