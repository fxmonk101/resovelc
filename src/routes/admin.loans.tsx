import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loans")({
  component: AdminLoans,
});

interface Loan {
  id: string;
  user_id: string;
  loan_type: string;
  amount: number;
  term_months: number;
  purpose: string;
  status: string;
  reference: string;
  approved_amount: number | null;
  interest_rate: number | null;
  created_at: string;
  annual_income: number | null;
  employment_status: string | null;
  employer: string | null;
  admin_notes: string | null;
}

function AdminLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editing, setEditing] = useState<Record<string, { amount: string; rate: string; notes: string }>>({});

  const load = async () => {
    let q = supabase.from("loan_applications").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setLoans((data ?? []) as Loan[]);
  };

  useEffect(() => { load(); }, [filter]);

  const setEdit = (id: string, patch: Partial<{ amount: string; rate: string; notes: string }>) => {
    setEditing((p) => ({ ...p, [id]: { amount: "", rate: "", notes: "", ...p[id], ...patch } }));
  };

  const decide = async (loan: Loan, decision: "approved" | "rejected") => {
    const e = editing[loan.id] ?? { amount: "", rate: "", notes: "" };
    const update: Record<string, unknown> = { status: decision, admin_notes: e.notes || null };
    if (decision === "approved") {
      update.approved_amount = Number(e.amount) || loan.amount;
      update.interest_rate = Number(e.rate) || 7.99;
    }
    const { error } = await supabase.from("loan_applications").update(update).eq("id", loan.id);
    if (error) return toast.error(error.message);

    if (decision === "approved") {
      // credit funds + log transaction
      const amt = Number(update.approved_amount);
      const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", loan.user_id).maybeSingle();
      if (profile) {
        await supabase.from("profiles").update({ balance: Number(profile.balance) + amt }).eq("user_id", loan.user_id);
        await supabase.from("transactions").insert({
          user_id: loan.user_id, amount: amt, type: "loan_disbursement",
          description: `Loan disbursement · ${loan.loan_type} (${loan.reference})`,
        });
      }
    }
    toast.success(`Loan ${decision}`);
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2"><HandCoins className="h-6 w-6 text-indigo" />Loan applications</h2>
          <p className="text-sm text-navy-light mt-1">Review, approve and disburse member loan requests.</p>
        </div>
        <div className="flex gap-1 bg-white border border-border rounded-lg p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter === f ? "bg-indigo text-white" : "text-navy-light hover:text-navy-deep"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center text-navy-light">No {filter === "all" ? "" : filter} loan applications.</div>
        ) : loans.map((l) => {
          const e = editing[l.id] ?? { amount: "", rate: "", notes: "" };
          return (
            <div key={l.id} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-navy-deep">{l.loan_type}</span>
                    <span className="text-xs font-mono text-navy-light">#{l.reference}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="text-sm text-navy-light mt-1">
                    Requested ${Number(l.amount).toLocaleString()} · {l.term_months} months · Income ${Number(l.annual_income ?? 0).toLocaleString()} · {l.employment_status} {l.employer ? `at ${l.employer}` : ""}
                  </div>
                  <div className="text-xs text-navy mt-2 max-w-2xl"><strong>Purpose:</strong> {l.purpose}</div>
                </div>
                <div className="text-xs text-navy-light text-right">
                  <div>Submitted</div>
                  <div className="font-medium text-navy">{new Date(l.created_at).toLocaleString()}</div>
                </div>
              </div>

              {l.status === "pending" && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="number" step="0.01" placeholder={`Approved $ (default ${l.amount})`} value={e.amount} onChange={(ev) => setEdit(l.id, { amount: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                  <input type="number" step="0.01" placeholder="Interest rate % (default 7.99)" value={e.rate} onChange={(ev) => setEdit(l.id, { rate: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                  <input placeholder="Admin note (optional)" value={e.notes} onChange={(ev) => setEdit(l.id, { notes: ev.target.value })} className="h-9 px-3 rounded-md border border-border text-sm" />
                </div>
              )}

              {l.status === "pending" && (
                <div className="mt-3 flex gap-2 justify-end">
                  <button onClick={() => decide(l, "rejected")} className="px-4 h-9 rounded-md border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 inline-flex items-center gap-1.5"><XCircle className="h-4 w-4" />Reject</button>
                  <button onClick={() => decide(l, "approved")} className="px-4 h-9 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Approve & disburse</button>
                </div>
              )}
              {l.status !== "pending" && (l.approved_amount || l.admin_notes) && (
                <div className="mt-3 text-xs text-navy-light">
                  {l.approved_amount && <>Approved: <span className="font-semibold text-emerald-700">${Number(l.approved_amount).toLocaleString()}</span> @ {l.interest_rate}% · </>}
                  {l.admin_notes && <>Note: {l.admin_notes}</>}
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
