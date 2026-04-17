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

export const STATS = [
  { value: 50000, suffix: "+", label: "Members" },
  { value: 2.5, prefix: "$", suffix: "B+", label: "Assets", decimals: 1 },
  { value: BRAND.routing, label: "Routing #", isText: true },
  { value: 24, suffix: "/7", label: "Support" },
] as const;

export const RATES = [
  { title: "High-Yield Savings", rate: "3.75%", unit: "APY", badge: "Featured", featured: true },
  { title: "18-Month Certificate", rate: "3.65%", unit: "APY", badge: "Savings" },
  { title: "Rewards Credit Card", rate: "4.00%", unit: "APR", badge: "Credit" },
  { title: "Personal Loans", rate: "5.49%", unit: "APR", badge: "Loans" },
] as const;
