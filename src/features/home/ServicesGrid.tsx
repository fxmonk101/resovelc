import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wallet, CreditCard, DollarSign, Briefcase, Coins, ShieldCheck, ArrowRight } from "lucide-react";

const SERVICES = [
  { icon: Wallet, title: "Personal Banking", desc: "Checking, savings, and money market accounts with no monthly fees.", to: "/personal" },
  { icon: CreditCard, title: "Credit Cards", desc: "Rewards cards with industry-leading rates and full transparency.", to: "/credit-cards" },
  { icon: DollarSign, title: "Loans & Credit", desc: "Personal, auto, and home loans with flexible terms.", to: "/loans" },
  { icon: Briefcase, title: "Business Banking", desc: "Tools to manage cash flow, payroll, and growth.", to: "/business" },
  { icon: Coins, title: "Grants & Aids", desc: "Funding programs to support members at every stage.", to: "/grants" },
  { icon: ShieldCheck, title: "Fund Recovery", desc: "Reclaim lost or disputed funds with our specialist team.", to: "/contact" },
] as const;

export function ServicesGrid() {
  return (
    <section className="py-24 bg-background">
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-label text-terra">What we offer</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground max-w-xl">
              Everything you need under one roof
            </h2>
          </div>
          <p className="text-muted-foreground max-w-md">
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
              className="group bg-card rounded-2xl p-7 shadow-card hover:shadow-hover transition-all border border-border"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-terra/10 text-terra group-hover:bg-terra group-hover:text-white transition">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold mt-5 text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              <Link to={s.to} className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-terra group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
