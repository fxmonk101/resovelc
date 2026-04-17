import { motion } from "framer-motion";
import { Wallet, CreditCard, DollarSign, Briefcase, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

const SERVICES = [
  { icon: Wallet, title: "Personal Banking", desc: "Checking, savings, and money market accounts with no monthly fees." },
  { icon: CreditCard, title: "Credit Cards", desc: "Rewards cards with industry-leading rates and full transparency." },
  { icon: DollarSign, title: "Loans", desc: "Personal, auto, and home loans with flexible terms." },
  { icon: Briefcase, title: "Business Banking", desc: "Tools to manage cash flow, payroll, and growth." },
  { icon: TrendingUp, title: "Investments", desc: "Build wealth with diversified investment products." },
  { icon: ShieldCheck, title: "Fund Recovery", desc: "Reclaim lost or disputed funds with our specialist team." },
];

export function ServicesGrid() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-label text-terra">What we offer</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-slate-deep max-w-xl">
              Everything you need under one roof
            </h2>
          </div>
          <p className="text-body max-w-md">
            Six product lines, one membership. Built to support you whether you're starting out, scaling up, or recovering.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group bg-white rounded-2xl p-7 shadow-card hover:shadow-hover transition-all border border-border"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-terra/10 text-terra group-hover:bg-terra group-hover:text-white transition">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold mt-5 text-slate-deep">{s.title}</h3>
              <p className="text-sm text-body mt-2 leading-relaxed">{s.desc}</p>
              <a href="#" className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-terra group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
