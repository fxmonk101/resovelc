export const BRAND = {
  name: "Resolva Credix",
  legalName: "Resolva Credix, N.A.",
  tagline: "Banking built for trust, growth, and recovery.",
  email: "support@resolvacredix.com",
  phone: "1-800-CREDIX",
  address: "200 Park Avenue, Suite 4500, New York, NY 10166",
  hours: "Mon–Fri 7AM–10PM ET · Sat–Sun 8AM–8PM ET",
  routing: "251480576",
  fdic: "FDIC Insured · Member FDIC",
  swift: "RCDXUS33",
  founded: "2009",
} as const;

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/grants", label: "Grants" },
  { to: "/contact", label: "Contact" },
] as const;

export const SERVICE_LINKS = [
  { to: "/personal", label: "Personal Banking", desc: "Checking, savings, money market & CDs." },
  { to: "/business", label: "Business Banking", desc: "Cash management, payroll & merchant services." },
  { to: "/credit-cards", label: "Credit Cards", desc: "Rewards, cashback & low-APR cards." },
  { to: "/loans", label: "Loans & Credit", desc: "Personal, auto, mortgage & SBA loans." },
  { to: "/grants", label: "Grants & Aids", desc: "Hardship, education & small-business grants." },
] as const;

export const STATS = [
  { value: 1200000, suffix: "+", label: "Members" },
  { value: 48.5, prefix: "$", suffix: "B", label: "Assets under management", decimals: 1 },
  { value: BRAND.routing, label: "Routing #", isText: true },
  { value: 24, suffix: "/7", label: "Member support" },
] as const;

export interface Rate {
  title: string;
  rate: string;
  unit: string;
  badge: string;
  featured?: boolean;
}
export const RATES: Rate[] = [
  { title: "High-Yield Savings", rate: "4.50%", unit: "APY", badge: "Featured", featured: true },
  { title: "12-Month CD", rate: "5.10%", unit: "APY", badge: "Savings" },
  { title: "Platinum Rewards Card", rate: "17.49%", unit: "APR", badge: "Credit" },
  { title: "Personal Loans (from)", rate: "6.99%", unit: "APR", badge: "Loans" },
];
