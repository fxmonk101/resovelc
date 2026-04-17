import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ProductPage } from "@/components/layout/ProductPage";
import { Briefcase, Users, FileText, TrendingUp, CreditCard, Building2 } from "lucide-react";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business Banking — Resolve Case" },
      { name: "description", content: "Business checking, payroll, merchant services, and lines of credit for growing companies." },
      { property: "og:title", content: "Business Banking — Resolve Case" },
      { property: "og:description", content: "Banking tools designed for businesses of every size." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=1200&q=80" },
    ],
  }),
  component: () => (
    <PageShell>
      <ProductPage
        eyebrow="Business Banking"
        title="Banking that scales"
        highlight="with you."
        description="From freelancers to enterprises — manage cash flow, run payroll, and access capital from one platform."
        heroImage="https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=1200&q=80"
        stats={[
          { label: "Businesses", value: "12K+" },
          { label: "Avg. funding", value: "$85K" },
          { label: "Approval", value: "48hr" },
        ]}
        features={[
          { icon: Briefcase, title: "Business Checking", desc: "No fees, unlimited transactions, free wires." },
          { icon: Users, title: "Payroll & HR", desc: "Run payroll in minutes with automated tax filing." },
          { icon: FileText, title: "Invoicing", desc: "Send invoices, accept payments, and reconcile automatically." },
          { icon: CreditCard, title: "Corporate Cards", desc: "Virtual and physical cards with spending controls." },
          { icon: Building2, title: "Merchant Services", desc: "Accept card payments online and in person." },
          { icon: TrendingUp, title: "Lines of Credit", desc: "Flexible credit lines from $5K to $5M." },
        ]}
        bullets={[
          "Same-day ACH transfers included",
          "Multi-user access with custom permissions",
          "QuickBooks and Xero integrations",
          "Dedicated business banker on call",
        ]}
        ctaTitle="Built for the way you work."
        ctaDesc="Whether you're a sole proprietor or a 500-person team, we have a plan that fits."
      />
    </PageShell>
  ),
});
