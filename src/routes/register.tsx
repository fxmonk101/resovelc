import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Shield } from "lucide-react";
import { z } from "zod";
import { registerStep1, registerStep2, registerStep3, registerStep4 } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Open an account — Resolve Case" },
      { name: "description", content: "Open a Resolve Case account in minutes." },
    ],
  }),
  component: RegisterPage,
});

const STEPS = ["Personal", "Contact", "Account", "Security"] as const;
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "South Africa", "Nigeria", "India", "Mexico"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "BRL", "ZAR", "NGN"];
const ACCOUNT_TYPES = ["Checking Account", "Savings Account", "Fixed Deposit", "Current Account", "Business Account", "Investment Account"];

type FormData = Partial<
  z.infer<typeof registerStep1> & z.infer<typeof registerStep2> &
  z.infer<typeof registerStep3> & { password: string; confirmPassword: string; termsAccepted: boolean }
>;

function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const submit = async (final: FormData) => {
    setSubmitError(null);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: final.email!,
      password: final.password!,
      options: {
        emailRedirectTo: redirectUrl,
        data: { first_name: final.firstName, last_name: final.lastName },
      },
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    if (signUpData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: signUpData.user.id,
        first_name: final.firstName!,
        last_name: final.lastName!,
        middle_name: final.middleName || null,
        username: final.username!,
        phone: final.phone || null,
        country: final.country || null,
        currency: final.currency || "USD",
        account_type: final.accountType || "Checking Account",
      });
      if (profileError) {
        setSubmitError("Account created but profile failed: " + profileError.message);
        return;
      }
    }
    // If session is returned, user is auto-confirmed → go to dashboard.
    // Otherwise show "check your email" state.
    if (signUpData.session) {
      navigate({ to: "/dashboard" });
    } else {
      setConfirmEmail(final.email!);
    }
  };

  if (confirmEmail) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center px-4">
        <div className="bg-white rounded-2xl shadow-card border border-border p-10 max-w-md text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-indigo/10 grid place-items-center text-indigo mb-5">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-deep">Check your email</h1>
          <p className="mt-3 text-body text-sm">
            We sent a verification link to <strong className="text-navy-deep">{confirmEmail}</strong>. Click the link to activate your account, then sign in.
          </p>
          <Link to="/login" className="mt-6 inline-flex w-full justify-center bg-indigo hover:bg-navy text-white font-semibold py-3 rounded-lg transition">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-slate-deep mb-8">
          <Shield className="h-5 w-5 text-terra" />
          <span className="font-display text-xl font-bold">{BRAND.name}</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8 lg:p-10">
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold transition ${i <= step ? "bg-terra text-white" : "bg-ivory-dark text-slate-light"}`}>
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-label mt-2 hidden sm:block ${i <= step ? "text-terra" : "text-slate-light"}`}>{s}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-ivory-dark rounded-full overflow-hidden">
              <motion.div className="h-full bg-terra" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <Step1 data={data} onNext={(d) => { setData({ ...data, ...d }); setStep(1); }} />}
              {step === 1 && <Step2 data={data} onNext={(d) => { setData({ ...data, ...d }); setStep(2); }} onBack={() => setStep(0)} />}
              {step === 2 && <Step3 data={data} onNext={(d) => { setData({ ...data, ...d }); setStep(3); }} onBack={() => setStep(1)} />}
              {step === 3 && <Step4 data={data} onSubmit={(d) => submit({ ...data, ...d })} onBack={() => setStep(2)} error={submitError} />}
            </motion.div>
          </AnimatePresence>

          <p className="text-sm text-center text-body mt-8">
            Already a member? <Link to="/login" className="text-terra font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children, id }: { label: string; error?: string; children: React.ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-label text-slate-mid">{label}</label>
      <div className="mt-2">{children}</div>
      {error && <p role="alert" className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition";

function NavBtns({ onBack, label = "Continue", disabled }: { onBack?: () => void; label?: string; disabled?: boolean }) {
  return (
    <div className="flex gap-3 pt-4">
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 px-5 py-3 rounded-lg border border-border text-slate-deep hover:bg-ivory-dark transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <button type="submit" disabled={disabled} className="flex-1 inline-flex items-center justify-center gap-2 bg-terra hover:bg-terra-dark disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition">
        {label} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Step1({ data, onNext }: { data: FormData; onNext: (d: z.infer<typeof registerStep1>) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof registerStep1>>({
    resolver: zodResolver(registerStep1),
    defaultValues: data as z.infer<typeof registerStep1>,
  });
  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-deep">Tell us about you</h2>
        <p className="text-sm text-body mt-1">We'll use this to set up your profile.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" id="firstName" error={errors.firstName?.message}>
          <input id="firstName" {...register("firstName")} className={inputCls} />
        </Field>
        <Field label="Last name" id="lastName" error={errors.lastName?.message}>
          <input id="lastName" {...register("lastName")} className={inputCls} />
        </Field>
      </div>
      <Field label="Middle name (optional)" id="middleName" error={errors.middleName?.message}>
        <input id="middleName" {...register("middleName")} className={inputCls} />
      </Field>
      <Field label="Username" id="username" error={errors.username?.message}>
        <input id="username" {...register("username")} className={inputCls} placeholder="e.g. ada_lovelace" />
      </Field>
      <NavBtns />
    </form>
  );
}

function Step2({ data, onNext, onBack }: { data: FormData; onNext: (d: z.infer<typeof registerStep2>) => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof registerStep2>>({
    resolver: zodResolver(registerStep2),
    defaultValues: data as z.infer<typeof registerStep2>,
  });
  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-deep">How can we reach you?</h2>
        <p className="text-sm text-body mt-1">We use this for security and account alerts.</p>
      </div>
      <Field label="Email" id="email" error={errors.email?.message}>
        <input id="email" type="email" {...register("email")} className={inputCls} />
      </Field>
      <Field label="Phone (international format)" id="phone" error={errors.phone?.message}>
        <input id="phone" {...register("phone")} className={inputCls} placeholder="+14155551234" />
      </Field>
      <Field label="Country" id="country" error={errors.country?.message}>
        <select id="country" {...register("country")} className={inputCls}>
          <option value="">Select…</option>
          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <NavBtns onBack={onBack} />
    </form>
  );
}

function Step3({ data, onNext, onBack }: { data: FormData; onNext: (d: z.infer<typeof registerStep3>) => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof registerStep3>>({
    resolver: zodResolver(registerStep3),
    defaultValues: { currency: data.currency || "USD", accountType: (data.accountType as z.infer<typeof registerStep3>["accountType"]) || "Checking Account" },
  });
  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-deep">Set up your account</h2>
        <p className="text-sm text-body mt-1">Pick your preferred currency and account type.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Currency" id="currency" error={errors.currency?.message}>
          <select id="currency" {...register("currency")} className={inputCls}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Account type" id="accountType" error={errors.accountType?.message}>
          <select id="accountType" {...register("accountType")} className={inputCls}>
            {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <NavBtns onBack={onBack} />
    </form>
  );
}

function Step4({ data, onSubmit, onBack, error }: { data: FormData; onSubmit: (d: z.infer<typeof registerStep4>) => void; onBack: () => void; error: string | null }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerStep4>>({
    resolver: zodResolver(registerStep4),
    defaultValues: data as Partial<z.infer<typeof registerStep4>>,
  });
  const pw = watch("password") || "";
  const score = passwordStrength(pw);
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = ["bg-error", "bg-error", "bg-warning", "bg-amber-sand", "bg-success"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-deep">Secure your account</h2>
        <p className="text-sm text-body mt-1">Choose a strong password.</p>
      </div>
      <Field label="Password" id="password" error={errors.password?.message}>
        <input id="password" type="password" {...register("password")} className={inputCls} />
        {pw && (
          <div className="mt-2">
            <div className="h-1.5 bg-ivory-dark rounded-full overflow-hidden flex gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex-1 ${i <= score ? colors[score] : "bg-ivory-dark"}`} />
              ))}
            </div>
            <p className="text-xs text-slate-light mt-1">{labels[score]}</p>
          </div>
        )}
      </Field>
      <Field label="Confirm password" id="confirmPassword" error={errors.confirmPassword?.message}>
        <input id="confirmPassword" type="password" {...register("confirmPassword")} className={inputCls} />
      </Field>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" {...register("termsAccepted")} className="mt-1 h-4 w-4 accent-[oklch(0.68_0.14_35)]" />
        <span className="text-sm text-body">
          I agree to the <a href="#" className="text-terra hover:underline">Terms</a> and <a href="#" className="text-terra hover:underline">Privacy Policy</a>.
        </span>
      </label>
      {errors.termsAccepted && <p role="alert" className="text-xs text-error">{errors.termsAccepted.message}</p>}
      {error && <p role="alert" className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      <NavBtns onBack={onBack} label={isSubmitting ? "Creating account..." : "Create account"} disabled={isSubmitting} />
    </form>
  );
}
