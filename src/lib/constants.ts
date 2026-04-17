export const BRAND = {
  name: "Resolve Case",
  tagline: "Banking that puts you in control.",
  email: "support@resolvecase.demo",
  phone: "1-800-555-0142",
  address: "123 Banking Street, Financial District, NY 10001",
  hours: "Mon–Fri 9AM–5PM · Sat 9AM–1PM",
  routing: "251480576",
} as const;

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/grants", label: "Grants" },
  { to: "/contact", label: "Contact" },
] as const;

export const SERVICE_LINKS = [
  { to: "/personal", label: "Personal Banking", desc: "Checking, savings, and money market accounts." },
  { to: "/business", label: "Business Banking", desc: "Cash flow, payroll, and growth tools." },
  { to: "/credit-cards", label: "Credit Cards", desc: "Rewards cards with transparent rates." },
  { to: "/loans", label: "Loans & Credit", desc: "Personal, auto, and home loans." },
  { to: "/grants", label: "Grants & Aids", desc: "Funding programs for members." },
] as const;

export const STATS = [
  { value: 50000, suffix: "+", label: "Members" },
  { value: 2.5, prefix: "$", suffix: "B+", label: "Assets", decimals: 1 },
  { value: BRAND.routing, label: "Routing #", isText: true },
  { value: 24, suffix: "/7", label: "Support" },
] as const;

export interface Rate {
  title: string;
  rate: string;
  unit: string;
  badge: string;
  featured?: boolean;
}
export const RATES: Rate[] = [
  { title: "High-Yield Savings", rate: "3.75%", unit: "APY", badge: "Featured", featured: true },
  { title: "18-Month Certificate", rate: "3.65%", unit: "APY", badge: "Savings" },
  { title: "Rewards Credit Card", rate: "4.00%", unit: "APR", badge: "Credit" },
  { title: "Personal Loans", rate: "5.49%", unit: "APR", badge: "Loans" },
];
