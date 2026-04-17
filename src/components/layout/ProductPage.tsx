import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface ProductPageProps {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  heroImage: string;
  features: Feature[];
  bullets: string[];
  ctaTitle: string;
  ctaDesc: string;
  stats?: { label: string; value: string }[];
}

export function ProductPage(p: ProductPageProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-slate-deep text-white overflow-hidden pt-12">
        <div className="absolute inset-0 bg-grid-dots opacity-50" />
        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-terra/20 blur-[120px]" />
        <div className="container-page relative grid lg:grid-cols-2 gap-12 py-20 lg:py-24 items-center">
          <div>
            <span className="text-label text-terra-light bg-terra/10 border border-terra/30 rounded-full px-4 py-1.5">
              {p.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-5xl lg:text-6xl font-bold leading-[1.05]">
              {p.title} <span className="text-terra">{p.highlight}</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 max-w-xl leading-relaxed">{p.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 bg-terra hover:bg-terra-dark px-6 py-3 rounded-lg font-semibold transition">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="inline-flex items-center px-6 py-3 rounded-lg border border-white/30 hover:bg-white/10 font-semibold transition">
                Talk to us
              </Link>
            </div>
            {p.stats && (
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                {p.stats.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-2xl font-bold text-terra">{s.value}</div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div
              className="aspect-[4/5] rounded-3xl bg-cover bg-center shadow-elevated ring-1 ring-white/10"
              style={{ backgroundImage: `url(${p.heroImage})` }}
            />
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 bg-background">
        <div className="container-page">
          <div className="max-w-2xl mb-12">
            <span className="text-label text-terra">Why choose us</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
              Built around what matters
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {p.features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group bg-card rounded-2xl p-7 shadow-card hover:shadow-hover transition-all border border-border"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-terra/10 text-terra group-hover:bg-terra group-hover:text-white transition">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold mt-5 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bullets + CTA */}
      <section className="py-24 bg-muted">
        <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              {p.ctaTitle}
            </h2>
            <p className="mt-4 text-muted-foreground">{p.ctaDesc}</p>
            <ul className="mt-8 space-y-4">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-terra/10 text-terra mt-0.5 shrink-0">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="inline-flex items-center gap-2 mt-8 bg-terra hover:bg-terra-dark text-white font-semibold px-7 py-3.5 rounded-lg transition">
              Open your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div
            className="aspect-[5/4] rounded-3xl bg-cover bg-center shadow-elevated"
            style={{ backgroundImage: `url(${p.heroImage})` }}
          />
        </div>
      </section>
    </>
  );
}
