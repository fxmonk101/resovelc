import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { HeroSection } from "@/features/home/HeroSection";
import { StatsBar } from "@/features/home/StatsBar";
import { RatesSection } from "@/features/home/RatesSection";
import { ServicesGrid } from "@/features/home/ServicesGrid";
import { PromoBanner } from "@/features/home/PromoBanner";
import { TestimonialsSection } from "@/features/home/TestimonialsSection";
import { TrustSection } from "@/features/home/TrustSection";
import { FaqSection } from "@/features/home/FaqSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resolve Case — Banking built for recovery and growth" },
      { name: "description", content: "Open a high-yield account, recover lost funds, and manage your money with modern banking tools." },
      { property: "og:title", content: "Resolve Case — Modern Digital Banking" },
      { property: "og:description", content: "High-yield savings, fund recovery, business banking, and grants — all in one membership." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <StatsBar />
      <TrustSection />
      <RatesSection />
      <ServicesGrid />
      <PromoBanner />
      <TestimonialsSection />
      <FaqSection />
    </PageShell>
  );
}
