import { Link } from "@tanstack/react-router";
import { Shield, Twitter, Linkedin, Facebook } from "lucide-react";
import { BRAND } from "@/lib/constants";

const COLS = [
  {
    title: "Quick Links",
    links: [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/grants", label: "Grants" },
    ],
  },
  {
    title: "Services",
    links: [
      { to: "/personal", label: "Personal Banking" },
      { to: "/business", label: "Business Banking" },
      { to: "/credit-cards", label: "Credit Cards" },
      { to: "/loans", label: "Loans & Credit" },
    ],
  },
  {
    title: "Members",
    links: [
      { to: "/login", label: "Sign In" },
      { to: "/register", label: "Open Account" },
      { to: "/contact", label: "Help Center" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/", label: "Privacy" },
      { to: "/", label: "Terms" },
      { to: "/", label: "Disclosures" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-slate-deep text-white/80 mt-24">
      <svg viewBox="0 0 1440 60" className="block w-full -mt-px text-slate-deep" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,32 C360,72 1080,-8 1440,32 L1440,60 L0,60 Z" />
      </svg>
      <div className="container-page py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-terra">
              <Shield className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl font-bold">{BRAND.name}</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed max-w-xs text-white/60">
            {BRAND.tagline} A modern banking experience built around recovery, growth, and control.
          </p>
          <div className="flex gap-3 mt-6">
            {[Twitter, Linkedin, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 hover:bg-terra transition" aria-label="social">
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
                  <Link to={l.to} className="text-white/60 hover:text-terra transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {BRAND.name} · Demonstration site · Not a real financial institution.</p>
          <p className="font-mono">Routing # {BRAND.routing}</p>
        </div>
      </div>
    </footer>
  );
}
