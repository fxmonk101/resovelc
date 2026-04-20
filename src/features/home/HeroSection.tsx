import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp, ShieldCheck, Lock } from "lucide-react";
import hero1 from "@/assets/hero-banking-1.jpg";
import hero2 from "@/assets/hero-banking-2.jpg";
import hero3 from "@/assets/hero-banking-3.jpg";
import hero4 from "@/assets/hero-banking-4.jpg";
import hero5 from "@/assets/hero-banking-5.jpg";

const SLIDES = [
  { img: hero1, kicker: "Personal Banking", caption: "Premium service. Real people." },
  { img: hero2, kicker: "Mobile First", caption: "Bank anywhere, in seconds." },
  { img: hero3, kicker: "Home Loans", caption: "Mortgages built around your life." },
  { img: hero4, kicker: "Business Banking", caption: "Fuel your business growth." },
  { img: hero5, kicker: "Wealth Planning", caption: "Retire on your own terms." },
];

export function HeroSection() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const words = "Banking built for trust, growth, and clarity.".split(" ");
  const slide = SLIDES[idx];
  return (
    <section className="relative bg-slate-deep text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-dots opacity-60" />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-terra/20 blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-amber-sand/10 blur-[100px]" />
      <div className="container-page relative grid lg:grid-cols-2 gap-12 py-24 lg:py-32 items-center min-h-[calc(100vh-4rem)]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-label text-terra-light bg-terra/10 border border-terra/30 rounded-full px-4 py-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            FDIC Insured · Member FDIC
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
            Open an account in minutes. Earn high-yield interest, finance your home,
            and manage every dollar with bank-grade tools designed for real life.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/register" className="inline-flex items-center gap-2 bg-terra hover:bg-terra-dark px-7 py-3.5 rounded-lg font-semibold transition shadow-elevated">
              Open an Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center px-7 py-3.5 rounded-lg border border-white/30 hover:bg-white/10 font-semibold transition">
              Learn more
            </Link>
          </motion.div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> 256-bit AES encryption</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Equal Housing Lender</span>
            <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> $0 monthly fees</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="relative hidden lg:block"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated ring-1 ring-white/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.img})` }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-label text-terra-light">{slide.kicker}</div>
              <div className="font-display text-2xl font-bold mt-1">{slide.caption}</div>
              <div className="mt-4 flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-terra" : "w-4 bg-white/40"}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute -left-6 bottom-12 bg-card text-card-foreground rounded-2xl p-5 shadow-elevated w-60 border border-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-label text-muted-foreground">Members</span>
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
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute -right-4 top-12 bg-card text-card-foreground rounded-2xl p-4 shadow-elevated border border-border"
          >
            <div className="text-label text-muted-foreground">APY</div>
            <div className="font-display text-2xl font-bold text-terra">3.75%</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
