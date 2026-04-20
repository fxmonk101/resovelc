import { motion } from "framer-motion";
import { Lock, Eye, AlertTriangle, RefreshCw } from "lucide-react";
import card from "@/assets/card-product.jpg";

const PROMISES = [
  { icon: Lock, title: "$0 Liability Guarantee", desc: "You're never responsible for unauthorized transactions on your accounts." },
  { icon: Eye, title: "24/7 Fraud Monitoring", desc: "AI-powered fraud detection watches every transaction, every second." },
  { icon: AlertTriangle, title: "Instant Alerts", desc: "Get notified the moment anything unusual happens on your accounts." },
  { icon: RefreshCw, title: "Identity Theft Recovery", desc: "Dedicated specialists help you recover quickly if anything happens." },
];

export function SecurityShowcase() {
  return (
    <section className="bg-background py-24">
      <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <img src={card} alt="Premium banking card" loading="lazy" className="rounded-3xl shadow-elevated w-full aspect-square object-cover" />
          <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-2xl p-5 shadow-elevated max-w-[220px]">
            <div className="flex items-center gap-2 text-success text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> ACTIVE PROTECTION
            </div>
            <div className="font-display text-2xl font-bold text-foreground mt-1">$0</div>
            <div className="text-xs text-muted-foreground">Liability for unauthorized charges</div>
          </div>
        </motion.div>
        <div>
          <span className="text-label text-terra">Security promise</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Your money is protected — period.
          </h2>
          <p className="mt-4 text-muted-foreground">
            We invest hundreds of millions every year in cybersecurity, fraud detection, and customer protection so you can bank with total peace of mind.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {PROMISES.map((p) => (
              <div key={p.title} className="flex gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo/10 text-indigo shrink-0">
                  <p.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-semibold text-foreground text-sm">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
