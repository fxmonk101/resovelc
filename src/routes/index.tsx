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
import { AwardsBar } from "@/features/home/AwardsBar";
import { AppShowcase } from "@/features/home/AppShowcase";
import { SecurityShowcase } from "@/features/home/SecurityShowcase";
import { PressBar } from "@/features/home/PressBar";

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
      <AwardsBar />
      <StatsBar />
      <TrustSection />
      <RatesSection />
      <ServicesGrid />
      <SecurityShowcase />
      <AppShowcase />
      <PromoBanner />
      <PressBar />
      <TestimonialsSection />
      <FaqSection />
    </PageShell>
  );
}
