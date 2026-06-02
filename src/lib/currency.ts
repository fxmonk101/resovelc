export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  CHF: "CHF ",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  ZAR: "R",
  NGN: "₦",
};

export function currencySymbol(code?: string | null): string {
  if (!code) return "$";
  return SYMBOLS[code.toUpperCase()] ?? `${code} `;
}

export function formatMoney(amount: number, code?: string | null, opts?: Intl.NumberFormatOptions): string {
  const n = Number(amount || 0);
  const sym = currencySymbol(code);
  return `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts })}`;
}