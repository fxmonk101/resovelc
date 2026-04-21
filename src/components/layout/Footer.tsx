import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Facebook, Lock, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/constants";
import shield from "@/assets/resolva-shield.png";

const COLS = [
  {
    title: "Personal",
    links: [
      { to: "/personal", label: "Checking & Savings" },
      { to: "/credit-cards", label: "Credit Cards" },
      { to: "/loans", label: "Loans & Mortgages" },
      { to: "/grants", label: "Grants & Aid" },
    ],
  },
  {
    title: "Business",
    links: [
      { to: "/business", label: "Business Banking" },
      { to: "/business", label: "Payroll & Cash Mgmt" },
      { to: "/loans", label: "SBA & Term Loans" },
      { to: "/credit-cards", label: "Business Cards" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/about", label: "Leadership" },
      { to: "/about", label: "Press" },
    ],
  },
  {
    title: "Members",
    links: [
      { to: "/login", label: "Sign In" },
      { to: "/register", label: "Open an Account" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/contact", label: "Help Center" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white/80 mt-24">
      <div className="container-page py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <img src={shield} alt="" className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold">{BRAND.name}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/50">Member FDIC · Est. {BRAND.founded}</span>
            </div>
          </Link>
          <p className="mt-4 text-sm leading-relaxed max-w-xs text-white/60">
            {BRAND.tagline} Founded in {BRAND.founded}. Member-owned. Trusted by 1.2M+ households and businesses across the United States.
          </p>
          <div className="mt-5 space-y-1.5 text-xs text-white/50">
            <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> 256-bit AES encryption</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> {BRAND.fdic}</div>
          </div>
          <div className="flex gap-2 mt-6">
            {[Twitter, Linkedin, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 hover:bg-indigo transition" aria-label="social">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-label text-white mb-4">{col.title}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-white/60 hover:text-indigo-light transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {BRAND.legalName} · Member FDIC · Equal Housing Lender</p>
          <div className="flex gap-4 font-mono">
            <span>Routing # {BRAND.routing}</span>
            <span>SWIFT {BRAND.swift}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
