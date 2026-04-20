import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ProductPage } from "@/components/layout/ProductPage";
import { Wallet, PiggyBank, Smartphone, ShieldCheck, Zap, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "Personal Banking — Resolve Case" },
      { name: "description", content: "Checking, savings, and money market accounts with no monthly fees and high-yield interest." },
      { property: "og:title", content: "Personal Banking — Resolve Case" },
      { property: "og:description", content: "Modern personal banking with no fees and high-yield savings." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200&q=80" },
    ],
  }),
  component: () => (
    <PageShell>
      <ProductPage
        eyebrow="Personal Banking"
        title="Everyday banking,"
        highlight="reimagined."
        description="Checking, savings, and money market accounts that work as hard as you do — no monthly fees, no minimum balance, no surprises."
        heroImage="https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200&q=80"
        stats={[
          { label: "APY", value: "3.75%" },
          { label: "ATMs", value: "55K+" },
          { label: "Fees", value: "$0" },
        ]}
        features={[
          { icon: Wallet, title: "Free Checking", desc: "No monthly fees, no minimums, unlimited transactions." },
          { icon: PiggyBank, title: "High-Yield Savings", desc: "Earn up to 3.75% APY on your savings balance." },
          { icon: Smartphone, title: "Mobile First", desc: "Deposit checks, send money, and pay bills from your phone." },
          { icon: ShieldCheck, title: "Bank-Grade Security", desc: "256-bit encryption, biometric login, and 24/7 fraud monitoring." },
          { icon: Zap, title: "Instant Transfers", desc: "Move money between accounts in real time." },
          { icon: BarChart3, title: "Smart Budgeting", desc: "Auto-categorized spending and goal tracking." },
        ]}
        bullets={[
          "Open in under 5 minutes",
          "55,000+ fee-free ATMs nationwide",
          "Early direct deposit, up to 2 days faster",
          "Free overdraft protection up to $200",
        ]}
        ctaTitle="Personal banking, finally personal."
        ctaDesc="Join 50,000+ members who switched to a bank that puts them first."
      />
    </PageShell>
  ),
});
