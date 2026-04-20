import { motion } from "framer-motion";
import { ShieldCheck, Lock, Award, Users, Building2, CheckCircle2 } from "lucide-react";

const TRUST = [
  { icon: ShieldCheck, title: "FDIC Insured", desc: "Deposits insured up to $250,000 per depositor through FDIC." },
  { icon: Lock, title: "256-bit Encryption", desc: "Bank-grade AES encryption protects every transaction end-to-end." },
  { icon: Award, title: "A+ BBB Rating", desc: "Accredited by the Better Business Bureau with an A+ rating." },
  { icon: Users, title: "1.2M+ Members", desc: "Trusted by over a million households and businesses across the country." },
  { icon: Building2, title: "Equal Housing Lender", desc: "We comply with the Fair Housing Act and Equal Credit Opportunity Act." },
  { icon: CheckCircle2, title: "SOC 2 Type II", desc: "Independently audited security, availability, and confidentiality controls." },
];

export function TrustSection() {
  return (
    <section className="bg-background py-24 border-b border-border">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-label text-terra">Why members trust us</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Security and stability you can bank on
          </h2>
          <p className="mt-4 text-muted-foreground">
            We hold ourselves to the highest standards in the industry — so your money, data, and peace of mind are always protected.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {TRUST.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-card hover:-translate-y-0.5 transition-all"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo/10 text-indigo">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-bold mt-4 text-foreground">{t.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
