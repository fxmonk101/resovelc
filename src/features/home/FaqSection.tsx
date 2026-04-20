import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is my money FDIC insured?",
    a: "Yes. All deposits are insured by the FDIC up to $250,000 per depositor, per ownership category. Your funds are protected even in the unlikely event of a bank failure.",
  },
  {
    q: "How long does it take to open an account?",
    a: "Most members complete the signup process in under 5 minutes. Once you verify your email, you can fund your account, request a debit card, and start using online and mobile banking immediately.",
  },
  {
    q: "Are there any monthly fees or minimum balance requirements?",
    a: "Our standard checking and savings accounts have no monthly maintenance fees and no minimum balance requirements. We also reimburse out-of-network ATM fees up to $15 per month.",
  },
  {
    q: "How do I transfer money between accounts or to other people?",
    a: "From your dashboard you can send ACH transfers, domestic and international wires, and instant peer-to-peer payments. Most internal transfers are free; outgoing wires have transparent flat fees.",
  },
  {
    q: "What credit card options do you offer?",
    a: "We offer cashback, travel rewards, and low-APR cards with no annual fees on most products. Apply from your dashboard and get an instant decision in most cases.",
  },
  {
    q: "How do loans and grant applications work?",
    a: "Submit an application from your dashboard with the requested amount and purpose. Our team reviews each application carefully — typically within 1–3 business days — and you'll receive an email the moment a decision is made.",
  },
  {
    q: "Is online and mobile banking secure?",
    a: "Yes. We use 256-bit AES encryption, multi-factor authentication, real-time fraud monitoring, and biometric login on supported devices. Our security program is independently audited (SOC 2 Type II).",
  },
  {
    q: "How can I get help if I have a problem?",
    a: "Our member support team is available 24/7 by phone, secure message, and email. You can reach us anytime at 1-800-555-0142 or from the Contact page.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left p-5 hover:bg-muted/40 transition"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground pr-6">{q}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="bg-muted py-24">
      <div className="container-page max-w-4xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-label text-terra">Frequently asked</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Answers, before you ask
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about banking with us. Can't find what you're looking for? Our team is one tap away.
          </p>
        </div>
        <div className="mt-12 space-y-3">
          {FAQS.map((f) => (
            <Item key={f.q} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
