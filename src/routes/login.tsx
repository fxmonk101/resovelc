import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Zap, Globe, Smartphone } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";
import logo from "@/assets/logo-credix.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Resolva Credix" },
      { name: "description", content: "Sign in to your Resolva Credix account." },
    ],
  }),
  component: LoginPage,
});

const FEATURES = [
  { icon: ShieldCheck, label: "Bank-grade 256-bit encryption" },
  { icon: Zap, label: "Real-time transfers & alerts" },
  { icon: Globe, label: "Worldwide ATM access" },
  { icon: Smartphone, label: "Award-winning mobile app" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setAuthError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[45%_1fr] bg-ivory">
      <div className="bg-navy-deep text-white p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dots opacity-50" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo/20 blur-[120px]" />

        <Link to="/" className="relative flex items-center">
          <img src={logo} alt={BRAND.name} className="h-10 w-auto brightness-0 invert" />
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
            Welcome back to your money.
          </h2>
          <p className="mt-4 text-white/70 max-w-sm">Sign in to manage accounts, transfers, loans, grants, and credit cards — all in one place.</p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-white/85">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-indigo-light">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 max-w-xs">
          <div className="text-label text-white/60">FDIC Insured</div>
          <div className="font-display text-xl font-bold mt-1">Your deposits are protected</div>
          <div className="text-xs text-white/60 mt-1">Up to $250,000 per depositor</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <img src={logo} alt={BRAND.name} className="h-8 w-auto object-contain" />
          </Link>

          <h1 className="font-display text-4xl font-bold text-navy-deep">Welcome back</h1>
          <p className="mt-2 text-body">Sign in to your account.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="text-label text-navy">Email</label>
              <input id="email" type="email" {...register("email")} className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo transition" />
              {errors.email && <p role="alert" className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-label text-navy">Password</label>
                <Link to="/" className="text-xs text-indigo hover:underline">Forgot?</Link>
              </div>
              <div className="relative mt-2">
                <input id="password" type={show ? "text" : "password"} {...register("password")} className="w-full rounded-lg border border-border bg-white px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo transition" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-3 grid place-items-center text-navy-light hover:text-navy-deep" aria-label="Toggle password">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p role="alert" className="text-xs text-error mt-1">{errors.password.message}</p>}
            </div>

            {authError && <p role="alert" className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">{authError}</p>}

            <button disabled={isSubmitting} className="w-full bg-indigo hover:bg-navy disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-indigo/20">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-sm text-center text-body">
              No account? <Link to="/register" className="text-indigo font-semibold hover:underline">Open one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
