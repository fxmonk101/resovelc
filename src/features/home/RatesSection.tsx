import { motion } from "framer-motion";
import { RATES } from "@/lib/constants";

export function RatesSection() {
  return (
    <section className="bg-muted py-24">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-label text-terra">Member care rates</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Rates that actually work for you
          </h2>
          <p className="mt-4 text-muted-foreground">
            Competitive returns on savings, fair rates on credit. No hidden fees.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {RATES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all border border-border"
            >
              <span
                className={`text-label rounded-full px-3 py-1 ${
                  r.featured ? "bg-amber-sand/40 text-charcoal" : "bg-muted text-muted-foreground"
                }`}
              >
                {r.badge}
              </span>
              <h3 className="font-display text-xl font-bold mt-5 text-foreground">{r.title}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-terra">{r.rate}</span>
                <span className="text-label text-muted-foreground">{r.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Rate effective today. Subject to change.</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
