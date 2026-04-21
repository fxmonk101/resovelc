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
    <section className="relative bg-slate-deep text-white overflow-hidden min-h-[88vh]">
      {/* Full-width rotating background slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.img})` }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/95 via-navy-deep/80 to-navy-deep/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-dots opacity-30" />

      <div className="container-page relative py-24 lg:py-36 min-h-[88vh] flex items-center">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-label text-white bg-brand-red border border-brand-red rounded-full px-4 py-1.5"
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
                {w === "clarity." ? <span className="text-brand-red-light">{w}</span> : w}
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
            <Link to="/register" className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark px-7 py-3.5 rounded-lg font-semibold transition shadow-elevated">
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

          {/* Slide caption + dots */}
          <div className="mt-12 flex items-center gap-6">
            <div>
              <div className="text-label text-brand-red-light">{slide.kicker}</div>
              <div className="font-display text-xl font-bold mt-1">{slide.caption}</div>
            </div>
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-10 bg-brand-red" : "w-5 bg-white/30 hover:bg-white/50"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
