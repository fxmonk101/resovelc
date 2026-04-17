import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/grants")({
  component: GrantsDash,
});

const schema = z.object({
  program: z.string().min(2),
  amount_requested: z.coerce.number().min(100).max(50000),
  purpose: z.string().min(20).max(800),
  household_size: z.coerce.number().int().min(1),
  household_income: z.coerce.number().min(0),
  hardship_description: z.string().min(20).max(1000),
});
type FormVals = z.infer<typeof schema>;

interface Grant {
  id: string;
  program: string;
  amount_requested: number;
  status: string;
  reference: string;
  approved_amount: number | null;
  created_at: string;
}

const statusBadge = (s: string) => {
  if (s === "approved" || s === "funded") return { cls: "bg-success/10 text-success", Icon: CheckCircle2 };
  if (s === "rejected") return { cls: "bg-error/10 text-error", Icon: XCircle };
  return { cls: "bg-warning/10 text-warning", Icon: Clock };
};

const PROGRAMS = ["Hardship Relief", "Small Business Recovery", "Education Grant", "Housing Assistance", "Medical Aid", "Veterans Support"];

function GrantsDash() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { program: PROGRAMS[0], household_size: 1 },
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("grant_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setGrants((data as Grant[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const onSubmit = async (vals: FormVals) => {
    if (!user) return;
    const { error } = await supabase.from("grant_applications").insert({
      user_id: user.id,
      program: vals.program,
      amount_requested: vals.amount_requested,
      purpose: vals.purpose,
      household_size: vals.household_size,
      household_income: vals.household_income,
      hardship_description: vals.hardship_description,
    });
    if (!error) { reset(); setShowForm(false); load(); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-deep">Grants & Aid</h1>
          <p className="text-body mt-1 text-sm">Apply for hardship, education, and small-business grants.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="bg-indigo hover:bg-navy text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-lg shadow-indigo/20">
          {showForm ? "Cancel" : "+ Apply for grant"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-5">
          <h2 className="font-display text-xl font-bold text-navy-deep">Grant application</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Grant program" error={errors.program?.message}>
              <select {...register("program")} className={inputCls}>{PROGRAMS.map((p) => <option key={p}>{p}</option>)}</select>
            </Field>
            <Field label="Amount requested (USD)" error={errors.amount_requested?.message}>
              <input type="number" min={100} step="50" {...register("amount_requested")} className={inputCls} />
            </Field>
            <Field label="Household size" error={errors.household_size?.message}>
              <input type="number" min={1} {...register("household_size")} className={inputCls} />
            </Field>
            <Field label="Annual household income (USD)" error={errors.household_income?.message}>
              <input type="number" min={0} step="100" {...register("household_income")} className={inputCls} />
            </Field>
          </div>
          <Field label="What will you use the grant for?" error={errors.purpose?.message}>
            <textarea rows={3} {...register("purpose")} className={inputCls} />
          </Field>
          <Field label="Describe your hardship or need" error={errors.hardship_description?.message}>
            <textarea rows={4} {...register("hardship_description")} className={inputCls} />
          </Field>
          <button disabled={isSubmitting} className="w-full bg-indigo hover:bg-navy disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition">
            {isSubmitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {grants.length === 0 ? (
          <div className="p-12 text-center text-navy-light">
            <Gift className="h-10 w-10 mx-auto opacity-40" />
            <p className="mt-3 text-sm">No grant applications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grants.map((g) => {
              const sb = statusBadge(g.status);
              return (
                <div key={g.id} className="p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-navy-deep">{g.program}</div>
                      <span className={`text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${sb.cls}`}>
                        <sb.Icon className="h-3 w-3" /> {g.status}
                      </span>
                    </div>
                    <div className="text-xs text-navy-light mt-1 font-mono">{g.reference}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-navy-deep">${Number(g.amount_requested).toLocaleString()}</div>
                    {g.approved_amount && <div className="text-xs text-success">Approved: ${Number(g.approved_amount).toLocaleString()}</div>}
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
