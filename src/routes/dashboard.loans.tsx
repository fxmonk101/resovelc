import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandCoins, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/loans")({
  component: LoansDash,
});

const schema = z.object({
  loan_type: z.string().min(2),
  amount: z.coerce.number().min(500).max(500000),
  term_months: z.coerce.number().int().min(6).max(360),
  purpose: z.string().min(10).max(500),
  annual_income: z.coerce.number().min(0),
  employment_status: z.string().min(2),
  employer: z.string().max(120).optional().or(z.literal("")),
});
type FormVals = z.infer<typeof schema>;

interface Loan {
  id: string;
  loan_type: string;
  amount: number;
  term_months: number;
  status: string;
  reference: string;
  approved_amount: number | null;
  interest_rate: number | null;
  created_at: string;
}

const statusBadge = (s: string) => {
  if (s === "approved" || s === "funded") return { cls: "bg-success/10 text-success", Icon: CheckCircle2 };
  if (s === "rejected") return { cls: "bg-error/10 text-error", Icon: XCircle };
  return { cls: "bg-warning/10 text-warning", Icon: Clock };
};

function LoansDash() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema) as never,
    defaultValues: { loan_type: "Personal Loan", term_months: 36 },
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("loan_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setLoans((data as Loan[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const onSubmit = async (raw: z.input<typeof schema>) => {
    if (!user) return;
    const vals = schema.parse(raw) as FormVals;
    const { error } = await supabase.from("loan_applications").insert({
      user_id: user.id,
      loan_type: vals.loan_type,
      amount: vals.amount,
      term_months: vals.term_months,
      purpose: vals.purpose,
      annual_income: vals.annual_income,
      employment_status: vals.employment_status,
      employer: vals.employer || null,
    });
    if (!error) { reset(); setShowForm(false); load(); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-deep">Loans & Credit</h1>
          <p className="text-body mt-1 text-sm">Apply for personal, auto, mortgage, or business loans.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="bg-indigo hover:bg-navy text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-lg shadow-indigo/20">
          {showForm ? "Cancel" : "+ New application"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-5">
          <h2 className="font-display text-xl font-bold text-navy-deep">Loan application</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Loan type" error={errors.loan_type?.message}>
              <select {...register("loan_type")} className={inputCls}>
                {["Personal Loan", "Auto Loan", "Mortgage", "Home Equity", "Business Loan", "SBA Loan", "Student Loan"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Amount (USD)" error={errors.amount?.message}>
              <input type="number" min={500} step="100" {...register("amount")} className={inputCls} />
            </Field>
            <Field label="Term (months)" error={errors.term_months?.message}>
              <input type="number" min={6} max={360} {...register("term_months")} className={inputCls} />
            </Field>
            <Field label="Annual income (USD)" error={errors.annual_income?.message}>
              <input type="number" min={0} step="100" {...register("annual_income")} className={inputCls} />
            </Field>
            <Field label="Employment status" error={errors.employment_status?.message}>
              <select {...register("employment_status")} className={inputCls}>
                {["Employed", "Self-employed", "Retired", "Student", "Unemployed"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Employer (optional)" error={errors.employer?.message}>
              <input {...register("employer")} className={inputCls} />
            </Field>
          </div>
          <Field label="Purpose of loan" error={errors.purpose?.message}>
            <textarea rows={3} {...register("purpose")} className={inputCls} placeholder="Briefly describe what you'll use the loan for…" />
          </Field>
          <button disabled={isSubmitting} className="w-full bg-indigo hover:bg-navy disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition">
            {isSubmitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {loans.length === 0 ? (
          <div className="p-12 text-center text-navy-light">
            <HandCoins className="h-10 w-10 mx-auto opacity-40" />
            <p className="mt-3 text-sm">No loan applications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {loans.map((l) => {
              const sb = statusBadge(l.status);
              return (
                <div key={l.id} className="p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-navy-deep">{l.loan_type}</div>
                      <span className={`text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${sb.cls}`}>
                        <sb.Icon className="h-3 w-3" /> {l.status}
                      </span>
                    </div>
                    <div className="text-xs text-navy-light mt-1 font-mono">{l.reference} · {l.term_months}mo</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-navy-deep">${Number(l.amount).toLocaleString()}</div>
                    {l.interest_rate && <div className="text-xs text-navy-light">{l.interest_rate}% APR</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo transition";
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-label text-navy">{label}</label>
      <div className="mt-2">{children}</div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
