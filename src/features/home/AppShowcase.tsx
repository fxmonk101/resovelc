import { motion } from "framer-motion";
import { Smartphone, Fingerprint, Bell, BarChart3, Send, ShieldCheck } from "lucide-react";
import skyline from "@/assets/banking-skyline.jpg";

const FEATURES = [
  { icon: Fingerprint, title: "Biometric login", desc: "Face ID & Touch ID secured access in under a second." },
  { icon: Bell, title: "Real-time alerts", desc: "Instant notifications for every transaction on your account." },
  { icon: Send, title: "Zelle® transfers", desc: "Send money in minutes to anyone with a U.S. bank account." },
  { icon: BarChart3, title: "Spending insights", desc: "AI-powered budgeting that learns from your habits." },
  { icon: ShieldCheck, title: "Card lock", desc: "Freeze and unfreeze your debit or credit card instantly." },
  { icon: Smartphone, title: "Mobile check deposit", desc: "Deposit checks from your phone — funds in 1 business day." },
];

export function AppShowcase() {
  return (
    <section className="relative py-24 overflow-hidden bg-slate-deep text-white">
      <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${skyline})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-deep via-slate-deep/95 to-slate-deep" />
      <div className="container-page relative">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-label text-terra-light">Mobile banking</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
            Your bank, in your pocket
          </h2>
          <p className="mt-4 text-white/70">
            Rated 4.9 on the App Store. Manage every dollar, anywhere — with bank-grade security baked in.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-terra/20 text-terra-light">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-bold mt-4">{f.title}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-white/60 text-sm">
          <div className="flex items-center gap-2"><span className="text-2xl">★★★★★</span> <span>4.9 · iOS App Store</span></div>
          <span className="hidden sm:inline opacity-30">•</span>
          <div className="flex items-center gap-2"><span className="text-2xl">★★★★★</span> <span>4.8 · Google Play</span></div>
          <span className="hidden sm:inline opacity-30">•</span>
          <div>2.4M+ downloads</div>
        </div>
      </div>
    </section>
  );
}
