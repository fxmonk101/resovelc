import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ProductPage } from "@/components/layout/ProductPage";
import { Home, Car, GraduationCap, DollarSign, Calculator, Clock } from "lucide-react";

export const Route = createFileRoute("/loans")({
  head: () => ({
    meta: [
      { title: "Loans & Credit — Resolve Case" },
      { name: "description", content: "Personal, auto, home, and student loans with competitive rates and flexible terms." },
      { property: "og:title", content: "Loans & Credit — Resolve Case" },
      { property: "og:description", content: "Borrow with confidence. Transparent rates, no hidden fees." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80" },
    ],
  }),
  component: () => (
    <PageShell>
      <ProductPage
        eyebrow="Loans & Credit"
        title="Borrow with"
        highlight="confidence."
        description="Personal loans, auto financing, mortgages, and student refinancing — all with transparent rates and no prepayment penalties."
        heroImage="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
        stats={[
          { label: "APR from", value: "5.49%" },
          { label: "Decision in", value: "2 min" },
          { label: "Up to", value: "$100K" },
        ]}
        features={[
          { icon: DollarSign, title: "Personal Loans", desc: "$1,000–$100,000 with fixed rates from 5.49% APR." },
          { icon: Car, title: "Auto Loans", desc: "New, used, and refinance — rates from 4.99% APR." },
          { icon: Home, title: "Home Loans", desc: "Mortgages, HELOCs, and refinancing under one roof." },
          { icon: GraduationCap, title: "Student Refi", desc: "Lower your monthly payments by consolidating loans." },
          { icon: Calculator, title: "Rate Calculator", desc: "See your real rate without affecting your credit score." },
          { icon: Clock, title: "Fast Funding", desc: "Funds deposited as soon as the next business day." },
        ]}
        bullets={[
          "Check your rate with no credit impact",
          "No origination or prepayment fees",
          "Flexible terms from 12 to 84 months",
          "Co-signer options available",
        ]}
        ctaTitle="Smart borrowing starts here."
        ctaDesc="Check your rate in 2 minutes and see how much you could save."
      />
    </PageShell>
  ),
});
