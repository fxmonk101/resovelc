import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";

export function HeroSection() {
  const words = "Banking built for recovery, growth, and clarity.".split(" ");
  return (
    <section className="relative bg-slate-deep text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-dots opacity-60" />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-terra/20 blur-[120px]" />
      <div className="container-page relative grid lg:grid-cols-2 gap-12 py-24 lg:py-32 items-center min-h-[calc(100vh-4rem)]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-label text-terra-light bg-terra/10 border border-terra/30 rounded-full px-4 py-1.5"
          >
            FDIC-style demo · Insured up to nothing real
          </motion.span>
          <h1 className="mt-6 font-display text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="inline-block mr-3"
              >
                {w === "clarity." ? <span className="text-terra">{w}</span> : w}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed"
          >
            Open an account in minutes. Earn high-yield interest, recover lost funds,
            and manage your money with tools designed for real life.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/register" className="inline-flex items-center gap-2 bg-terra hover:bg-terra-dark px-7 py-3.5 rounded-lg font-semibold transition">
              Open an Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center px-7 py-3.5 rounded-lg border border-white/30 hover:bg-white/10 font-semibold transition">
              Learn more
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative hidden lg:block"
        >
          <div
            className="aspect-[4/5] rounded-3xl bg-cover bg-center shadow-elevated"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=900&q=80')",
              clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0% 100%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute -left-6 bottom-12 bg-white text-charcoal rounded-2xl p-5 shadow-elevated w-60"
          >
            <div className="flex items-center justify-between">
              <span className="text-label text-slate-light">Members</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="font-display text-3xl font-bold mt-2">50,247</div>
            <div className="text-xs text-success mt-1">+12.4% this quarter</div>
            <svg viewBox="0 0 100 30" className="mt-3 w-full h-8">
              <polyline
                points="0,25 15,20 30,22 45,15 60,18 75,8 90,10 100,3"
                fill="none"
                stroke="oklch(0.68 0.14 35)"
                strokeWidth="2"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
