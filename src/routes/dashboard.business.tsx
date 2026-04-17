import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Building2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/business")({
  component: BusinessDash,
});

const schema = z.object({
  business_name: z.string().min(2).max(120),
  ein: z.string().max(20).optional().or(z.literal("")),
  industry: z.string().min(2),
  monthly_revenue: z.coerce.number().min(0),
  employees: z.coerce.number().int().min(1),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(40).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
});
type FormVals = z.infer<typeof schema>;

interface BusinessProfile extends FormVals {
  account_number: string;
  business_balance: number;
  is_verified: boolean;
}

function BusinessDash() {
  const { user } = useAuth();
  const [biz, setBiz] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema) as never,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { setBiz(data as BusinessProfile | null); setLoading(false); });
  }, [user]);

  const onSubmit = async (raw: z.input<typeof schema>) => {
    if (!user) return;
    const vals = schema.parse(raw) as FormVals;
    const { data, error } = await supabase.from("business_profiles").insert({
      user_id: user.id,
      business_name: vals.business_name,
      ein: vals.ein || null,
      industry: vals.industry,
      monthly_revenue: vals.monthly_revenue,
      employees: vals.employees,
      address: vals.address || null,
      city: vals.city || null,
      state: vals.state || null,
      zip: vals.zip || null,
    }).select().single();
    if (!error && data) {
      setBiz(data as BusinessProfile);
      setDone(true);
    }
  };

  if (loading) return <div className="p-8 text-navy-light">Loading…</div>;

  if (biz) {
    return (
      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-indigo text-white"><Building2 className="h-6 w-6" /></span>
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-deep">{biz.business_name}</h1>
            <p className="text-body text-sm">{biz.industry} · {biz.employees} employees</p>
          </div>
          {done && <span className="ml-auto text-xs bg-success/10 text-success px-3 py-1 rounded-full font-semibold">Created</span>}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 gradient-navy text-white rounded-2xl p-7 relative overflow-hidden shadow-elevated">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
            <div className="text-label text-white/60">Business Account</div>
            <div className="font-mono text-xs mt-1 text-white/70">•••• {biz.account_number?.slice(-4)}</div>
            <div className="font-display text-5xl font-bold mt-4">USD {Number(biz.business_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-white/70 mt-2">Operating balance</div>
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="text-label text-navy-light">Monthly revenue</div>
              <div className="font-display text-2xl font-bold text-navy-deep mt-2">${Number(biz.monthly_revenue).toLocaleString()}</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="text-label text-navy-light">Status</div>
              <div className="mt-2 text-sm font-semibold text-navy-deep">{biz.is_verified ? "Verified" : "Under review"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 lg:p-7">
          <h2 className="font-display text-xl font-bold text-navy-deep mb-4">Business services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {["Payroll", "Merchant services", "Wire transfers", "Vendor payments", "Cash management", "Treasury", "Multi-user access", "API & integrations"].map((s) => (
              <button key={s} className="text-left bg-ivory hover:bg-ivory-dark border border-border rounded-lg p-4 text-sm font-medium text-navy-deep transition">
                <Briefcase className="h-4 w-4 text-indigo mb-2" />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-indigo/10 text-indigo"><Briefcase className="h-6 w-6" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-deep">Open a business account</h1>
          <p className="text-body text-sm">Tell us about your business — takes about 2 minutes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-border rounded-2xl p-6 lg:p-8 mt-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Legal business name" error={errors.business_name?.message}>
            <input {...register("business_name")} className={inputCls} />
          </Field>
          <Field label="EIN (optional)" error={errors.ein?.message}>
            <input {...register("ein")} placeholder="XX-XXXXXXX" className={inputCls} />
          </Field>
          <Field label="Industry" error={errors.industry?.message}>
            <select {...register("industry")} className={inputCls}>
              <option value="">Select…</option>
              {["Technology", "Retail", "Professional services", "Manufacturing", "Healthcare", "Hospitality", "Construction", "Real estate", "Other"].map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Employees" error={errors.employees?.message}>
            <input type="number" min={1} {...register("employees")} className={inputCls} />
          </Field>
          <Field label="Average monthly revenue (USD)" error={errors.monthly_revenue?.message}>
            <input type="number" min={0} step="0.01" {...register("monthly_revenue")} className={inputCls} />
          </Field>
          <Field label="Street address" error={errors.address?.message}>
            <input {...register("address")} className={inputCls} />
          </Field>
          <Field label="City" error={errors.city?.message}>
            <input {...register("city")} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State" error={errors.state?.message}>
              <input {...register("state")} className={inputCls} />
            </Field>
            <Field label="ZIP" error={errors.zip?.message}>
              <input {...register("zip")} className={inputCls} />
            </Field>
          </div>
        </div>
        <button disabled={isSubmitting} className="w-full bg-indigo hover:bg-navy disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-indigo/20">
          {isSubmitting ? "Creating…" : "Create business account"}
        </button>
        <p className="text-xs text-navy-light flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> No setup fees · No minimum balance · Approved instantly</p>
      </form>
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
