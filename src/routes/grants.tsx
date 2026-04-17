import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GraduationCap, Home, Briefcase, Heart, Sprout, Users, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/grants")({
  head: () => ({
    meta: [
      { title: "Grants & Programs — Resolve Case" },
      { name: "description", content: "Explore our grant programs for education, housing, business, and community." },
      { property: "og:title", content: "Grant Programs — Resolve Case" },
      { property: "og:description", content: "Six grant programs supporting members at every stage of life." },
    ],
  }),
  component: GrantsPage,
});

const GRANTS = [
  { icon: GraduationCap, title: "Education Grant", max: "$10,000", features: ["Tuition support", "Books & materials", "Renewable yearly"] },
  { icon: Home, title: "First-Home Grant", max: "$25,000", features: ["Down payment help", "Closing costs", "First-time buyers"] },
  { icon: Briefcase, title: "Small Business", max: "$50,000", features: ["Startup capital", "Equipment financing", "Mentorship included"] },
  { icon: Heart, title: "Medical Hardship", max: "$15,000", features: ["Emergency medical", "No repayment", "Fast turnaround"] },
  { icon: Sprout, title: "Sustainability", max: "$8,000", features: ["Solar & efficiency", "EV charger installs", "Energy upgrades"] },
  { icon: Users, title: "Community Impact", max: "$20,000", features: ["Local nonprofits", "Youth programs", "Annual cycle"] },
];

const STEPS = ["Choose", "Apply", "Review", "Funded"];

function GrantsPage() {
  return (
    <PageShell>
      <section className="bg-slate-deep text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dots opacity-50" />
        <div className="container-page relative text-center">
          <span className="text-label text-terra-light">Grants & programs</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-3 max-w-3xl mx-auto">
            Funding for the moments that matter most.
          </h1>
          <p className="mt-5 text-white/70 max-w-2xl mx-auto">
            Six programs designed to support members through every stage of life.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GRANTS.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-7 border border-border hover:border-terra hover:shadow-hover transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-terra/10 text-terra">
                  <g.icon className="h-6 w-6" />
                </div>
                <span className="text-label bg-amber-sand/40 text-charcoal px-3 py-1 rounded-full">Up to {g.max}</span>
              </div>
              <h3 className="font-display text-xl font-bold mt-5 text-slate-deep">{g.title}</h3>
              <ul className="mt-4 space-y-1.5 text-sm text-body">
                {g.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><span className="text-terra mt-1">•</span> {f}</li>
                ))}
              </ul>
              <button className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-terra hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-ivory-dark py-24">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-label text-terra">How to apply</span>
            <h2 className="font-display text-4xl font-bold mt-3 text-slate-deep">Four simple steps</h2>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {STEPS.map((s, i) => (
              <div key={s} className="relative bg-white rounded-2xl p-6 text-center shadow-card border border-border">
                <div className="font-display text-3xl font-bold text-terra">{i + 1}</div>
                <div className="mt-2 font-semibold text-slate-deep">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <div className="bg-slate-deep rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-dots opacity-40" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl font-bold">Ready to apply?</h2>
              <p className="mt-4 text-white/70 max-w-md mx-auto">Become a member to access all six grant programs.</p>
              <Link to="/register" className="inline-flex mt-8 bg-terra hover:bg-terra-dark px-7 py-3.5 rounded-lg font-semibold transition">
                Start your application
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
