import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Heart, Shield, Users } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Resolve Case" },
      { name: "description", content: "Learn about our mission, values, and the team building modern banking." },
      { property: "og:title", content: "About Resolve Case" },
      { property: "og:description", content: "Our mission is to make banking transparent, recoverable, and human." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Shield, title: "Trust First", desc: "Bank-grade security and transparent practices, always." },
  { icon: Heart, title: "Member-Owned", desc: "Profits return to members, not shareholders." },
  { icon: Target, title: "Goal-Oriented", desc: "Every product is built around real financial goals." },
  { icon: Users, title: "Community", desc: "We invest back into the communities we serve." },
];

const TIMELINE = [
  { year: "2018", title: "Founded", desc: "Started with 200 members and a simple mission." },
  { year: "2020", title: "10K Members", desc: "Crossed our first major milestone." },
  { year: "2022", title: "Recovery Program", desc: "Launched our fund recovery service." },
  { year: "2024", title: "50K+ Members", desc: "Now serving members across the country." },
];

function AboutPage() {
  return (
    <PageShell>
      <section className="bg-slate-deep text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dots opacity-50" />
        <div className="container-page relative">
          <span className="text-label text-terra-light">Our story</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-3 max-w-3xl">
            Banking the way it should have always been.
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl">
            We're a member-owned digital bank focused on real outcomes — not quarterly numbers.
          </p>
        </div>
        <svg viewBox="0 0 1440 60" className="absolute bottom-0 inset-x-0 text-ivory" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,40 C480,0 960,80 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <section className="py-24">
        <div className="container-page grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-label text-terra">Mission</span>
            <h2 className="font-display text-4xl font-bold mt-3 text-slate-deep">
              We exist to put financial power back in your hands.
            </h2>
            <p className="mt-5 text-body leading-relaxed">
              The traditional banking system was built for institutions, not people. We're rebuilding it
              from the ground up — transparent, accessible, and accountable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-hover transition border border-border"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-terra/10 text-terra">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold mt-4 text-slate-deep">{v.title}</h3>
                <p className="text-sm text-body mt-1">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ivory-dark py-24">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-label text-terra">Milestones</span>
            <h2 className="font-display text-4xl font-bold mt-3 text-slate-deep">Our journey</h2>
          </div>
          <div className="mt-16 relative max-w-3xl mx-auto">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border" />
            {TIMELINE.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`relative pl-12 md:pl-0 mb-10 md:grid md:grid-cols-2 md:gap-12 ${i % 2 === 0 ? "" : "md:[&>*:first-child]:order-2"}`}
              >
                <div className={i % 2 === 0 ? "md:text-right md:pr-8" : "md:pl-8"}>
                  <span className="inline-block bg-terra text-white font-mono text-sm px-3 py-1 rounded">{t.year}</span>
                  <h3 className="font-display text-xl font-bold mt-2 text-slate-deep">{t.title}</h3>
                  <p className="text-sm text-body mt-1">{t.desc}</p>
                </div>
                <div className="hidden md:block" />
                <span className="absolute left-4 md:left-1/2 top-2 -translate-x-1/2 h-3 w-3 rounded-full bg-terra ring-4 ring-ivory-dark" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
