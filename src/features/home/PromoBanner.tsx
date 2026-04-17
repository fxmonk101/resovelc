import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const PERKS = [
  "Open with no minimum deposit",
  "Direct deposit within 60 days",
  "Bonus credited after 90 days",
];

export function PromoBanner() {
  return (
    <section className="bg-muted py-24">
      <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
        <div
          className="aspect-[5/4] rounded-3xl bg-cover bg-center shadow-elevated"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80')",
            clipPath: "polygon(0 0, 100% 8%, 100% 100%, 0 92%)",
          }}
        />
        <div>
          <span className="inline-block bg-terra text-white font-display text-2xl font-bold px-5 py-2 rounded-lg shadow-hover">
            $200 BONUS*
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-5 text-foreground">
            Earn $200 when you open an account
          </h2>
          <p className="mt-4 text-muted-foreground">
            Make banking work harder for you. Open a new checking account and meet a few simple requirements.
          </p>
          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-terra/10 text-terra mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-foreground">{p}</span>
              </li>
            ))}
          </ul>
          <Link to="/register" className="inline-flex mt-8 bg-terra hover:bg-terra-dark text-white font-semibold px-7 py-3.5 rounded-lg transition">
            Claim Your Bonus
          </Link>
          <p className="text-xs text-muted-foreground mt-4">*Demo offer. Terms apply. Not a real promotion.</p>
        </div>
      </div>
    </section>
  );
}
