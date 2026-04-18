import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cards")({
  component: AdminCards,
});

interface CardApp {
  id: string;
  user_id: string;
  card_type: string;
  requested_limit: number;
  status: string;
  reference: string;
  created_at: string;
  annual_income: number | null;
  employment_status: string | null;
  admin_notes: string | null;
}

function AdminCards() {
  const [items, setItems] = useState<CardApp[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editing, setEditing] = useState<Record<string, { limit: string; notes: string }>>({});

  const load = async () => {
    let q = supabase.from("credit_card_applications").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data ?? []) as CardApp[]);
  };

  useEffect(() => { load(); }, [filter]);

  const setEdit = (id: string, patch: Partial<{ limit: string; notes: string }>) => {
    setEditing((p) => ({ ...p, [id]: { ...{ limit: "", notes: "" }, ...p[id], ...patch } }));
  };

  const decide = async (app: CardApp, decision: "approved" | "rejected") => {
    const e = editing[app.id] ?? { limit: "", notes: "" };
    const { error } = await supabase.from("credit_card_applications").update({ status: decision, admin_notes: e.notes || null }).eq("id", app.id);
    if (error) return toast.error(error.message);

    if (decision === "approved") {
      const limit = Number(e.limit) || app.requested_limit;
      const { error: cardErr } = await supabase.from("credit_cards").insert({
        user_id: app.user_id,
        application_id: app.id,
        card_type: app.card_type,
        credit_limit: limit,
        available_credit: limit,
      });
      if (cardErr) toast.error(`Card issued failed: ${cardErr.message}`);
    }
    toast.success(`Application ${decision}`);
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2"><CreditCard className="h-6 w-6 text-indigo" />Credit card applications</h2>
          <p className="text-sm text-navy-light mt-1">Approve to issue a virtual card with the chosen credit limit.</p>
        </div>
        <div className="flex gap-1 bg-white border border-border rounded-lg p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter === f ? "bg-indigo text-white" : "text-navy-light hover:text-navy-deep"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center text-navy-light">No {filter === "all" ? "" : filter} card applications.</div>
        ) : items.map((c) => {
          const e = editing[c.id] ?? { limit: "", notes: "" };
          return (
            <div key={c.id} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-navy-deep">{c.card_type}</span>
                    <span className="text-xs font-mono text-navy-light">#{c.reference}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-sm text-navy-light mt-1">
                    Requested limit ${Number(c.requested_limit).toLocaleString()} · Income ${Number(c.annual_income ?? 0).toLocaleString()} · {c.employment_status}
                  </div>
                </div>
                <div className="text-xs text-navy-light text-right">
                  <div>Submitted</div>
                  <div className="font-medium text-navy">{new Date(c.created_at).toLocaleString()}</div>
                </div>
              </div>

              {c.status === "pending" && (
                <>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="number" step="100" placeholder={`Approved limit $ (default ${c.requested_limit})`} value={e.limit} onChange={(ev) => setEdit(c.id, { limit: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                    <input placeholder="Admin note (optional)" value={e.notes} onChange={(ev) => setEdit(c.id, { notes: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                  </div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button onClick={() => decide(c, "rejected")} className="px-4 h-9 rounded-md border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 inline-flex items-center gap-1.5"><XCircle className="h-4 w-4" />Reject</button>
                    <button onClick={() => decide(c, "approved")} className="px-4 h-9 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Approve & issue</button>
                  </div>
                </>
              )}
              {c.status !== "pending" && c.admin_notes && (
                <div className="mt-3 text-xs text-navy-light">Note: {c.admin_notes}</div>
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
