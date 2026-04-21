import { Link } from "@tanstack/react-router";
import { Check, ShieldCheck } from "lucide-react";

const PERKS = [
  "Open with no minimum deposit",
  "FDIC insured up to $250,000 per depositor",
  "$0 monthly maintenance fees",
  "24/7 fraud monitoring & zero-liability protection",
];

export function PromoBanner() {
  return (
    <section className="bg-muted py-24">
      <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
        <div
          className="aspect-[5/4] rounded-3xl bg-cover bg-center shadow-elevated"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1200&q=80')",
            clipPath: "polygon(0 0, 100% 8%, 100% 100%, 0 92%)",
          }}
        />
        <div>
          <span className="inline-flex items-center gap-2 bg-brand-red/10 text-brand-red border border-brand-red/30 font-semibold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> Member FDIC
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-5 text-foreground">
            Banking you can trust — for every season of life
          </h2>
          <p className="mt-4 text-muted-foreground">
            From your first paycheck to your retirement plan, Resolva Bank protects what you've earned. Your deposits are FDIC insured, your data is encrypted, and your accounts are monitored 24/7.
          </p>
          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-red/10 text-brand-red mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-foreground">{p}</span>
              </li>
            ))}
          </ul>
          <Link to="/register" className="inline-flex mt-8 bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-7 py-3.5 rounded-lg transition">
            Open an Account
          </Link>
          <p className="text-xs text-muted-foreground mt-4">All deposits insured up to $250,000 per depositor by the Federal Deposit Insurance Corporation.</p>
        </div>
      </div>
    </section>
  );
}
