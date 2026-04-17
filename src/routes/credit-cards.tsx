import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ProductPage } from "@/components/layout/ProductPage";
import { CreditCard, Plane, Gift, Lock, Smartphone, Percent } from "lucide-react";

export const Route = createFileRoute("/credit-cards")({
  head: () => ({
    meta: [
      { title: "Credit Cards — Resolve Case" },
      { name: "description", content: "Rewards credit cards with cash back, travel perks, and no annual fee options." },
      { property: "og:title", content: "Credit Cards — Resolve Case" },
      { property: "og:description", content: "Cards designed for the way you actually spend." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80" },
    ],
  }),
  component: () => (
    <PageShell>
      <ProductPage
        eyebrow="Credit Cards"
        title="Cards that pay"
        highlight="you back."
        description="Earn rewards on every swipe, with industry-leading APRs and zero hidden fees. Pick the card that matches how you actually spend."
        heroImage="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
        stats={[
          { label: "APR from", value: "4.00%" },
          { label: "Cash back", value: "5%" },
          { label: "Annual fee", value: "$0" },
        ]}
        features={[
          { icon: Percent, title: "5% Cash Back", desc: "On rotating quarterly categories — groceries, gas, dining." },
          { icon: Plane, title: "Travel Rewards", desc: "3x points on travel, no foreign transaction fees." },
          { icon: Gift, title: "Sign-up Bonus", desc: "Earn $200 after spending $500 in 90 days." },
          { icon: Lock, title: "Fraud Protection", desc: "Real-time alerts and zero liability on unauthorized charges." },
          { icon: Smartphone, title: "Tap to Pay", desc: "Add to Apple Pay, Google Pay, and Samsung Pay instantly." },
          { icon: CreditCard, title: "Build Credit", desc: "Free credit score monitoring and credit-building tools." },
        ]}
        bullets={[
          "0% intro APR for 15 months",
          "No annual fee on most cards",
          "Instant virtual card upon approval",
          "Redeem rewards as cash, travel, or gift cards",
        ]}
        ctaTitle="Find your perfect card."
        ctaDesc="Take our 60-second match quiz to see which card gives you the most value."
      />
    </PageShell>
  ),
});
