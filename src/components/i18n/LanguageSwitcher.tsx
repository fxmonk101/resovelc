import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

/**
 * Lightweight language switcher backed by Google Translate's website widget.
 *
 * Why this approach:
 *  - Translates the entire app (landing, dashboard, admin) with zero string extraction
 *  - Auto-detects the visitor's preferred language from `navigator.language`
 *  - Supports 100+ languages out of the box
 *  - Persists the chosen language in a cookie so navigation keeps the translation
 *
 * The widget script is loaded once per page; this component just renders a
 * branded button + menu and toggles Google Translate's underlying cookie.
 */

const LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "zh-CN", label: "中文 (简体)" },
  { code: "zh-TW", label: "中文 (繁體)" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "pl", label: "Polski" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "sw", label: "Kiswahili" },
];

const COOKIE_NAME = "googtrans";
const PREF_KEY = "rc_lang_pref";

function setGoogTransCookie(target: string) {
  // Format expected by Google Translate: "/auto/<target>"
  const value = target === "en" ? "" : `/auto/${target}`;
  const domain = typeof window !== "undefined" ? window.location.hostname : "";
  // Set on both domain and root domain so it survives subdomain navigation
  document.cookie = `${COOKIE_NAME}=${value}; path=/`;
  if (domain) {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; domain=${domain}`;
    const root = domain.split(".").slice(-2).join(".");
    if (root && root !== domain) {
      document.cookie = `${COOKIE_NAME}=${value}; path=/; domain=.${root}`;
    }
  }
}

function getCurrentLang(): string {
  if (typeof document === "undefined") return "en";
  const saved = localStorage.getItem(PREF_KEY);
  if (saved) return saved;
  const m = document.cookie.match(/googtrans=\/auto\/([\w-]+)/);
  return m?.[1] ?? "en";
}

function detectBrowserLang(): string {
  if (typeof navigator === "undefined") return "en";
  const nav = navigator.language || (navigator.languages && navigator.languages[0]) || "en";
  // Match exact code first (e.g. zh-CN), then language prefix
  const exact = LANGS.find((l) => l.code.toLowerCase() === nav.toLowerCase());
  if (exact) return exact.code;
  const prefix = nav.split("-")[0].toLowerCase();
  const fuzzy = LANGS.find((l) => l.code.split("-")[0].toLowerCase() === prefix);
  return fuzzy?.code ?? "en";
}

let scriptLoaded = false;
function loadGoogleTranslate() {
  if (scriptLoaded || typeof window === "undefined") return;
  scriptLoaded = true;

  // Initializer the Google script will call back into.
  (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit = () => {
    const w = window as unknown as {
      google?: { translate?: { TranslateElement?: new (opts: object, id: string) => void } };
    };
    if (!w.google?.translate?.TranslateElement) return;
    new w.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: LANGS.map((l) => l.code).join(","),
        autoDisplay: false,
        layout: 0,
      },
      "google_translate_element",
    );
  };

  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.body.appendChild(s);
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  // Auto-detect on first visit and load the Google widget.
  useEffect(() => {
    loadGoogleTranslate();
    const saved = localStorage.getItem(PREF_KEY);
    if (!saved) {
      const detected = detectBrowserLang();
      if (detected !== "en") {
        setGoogTransCookie(detected);
        localStorage.setItem(PREF_KEY, detected);
      }
      setCurrent(detected);
    } else {
      setCurrent(saved);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (code: string) => {
    // Persist for future navigations (cookie covers SSR + Google's own re-init,
    // localStorage covers our React-side display state).
    setGoogTransCookie(code);
    localStorage.setItem(PREF_KEY, code);
    setCurrent(code);
    setOpen(false);

    // Drive Google Translate's hidden <select> directly so the page is
    // re-translated in place — no reload required.
    const apply = (attempt = 0) => {
      const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (select) {
        select.value = code === "en" ? "" : code;
        select.dispatchEvent(new Event("change"));
        return;
      }
      // Widget may not be mounted yet on first interaction; retry briefly.
      if (attempt < 20) setTimeout(() => apply(attempt + 1), 150);
    };

    if (code === "en") {
      // "English" means "show original" — clear the cookie and reset the widget.
      const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (select) {
        select.value = "";
        select.dispatchEvent(new Event("change"));
      }
      // Google sometimes leaves residual translated nodes; nudge it by
      // also dispatching a second change on the next tick.
      setTimeout(() => {
        const s = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
        if (s) { s.value = ""; s.dispatchEvent(new Event("change")); }
      }, 50);
    } else {
      apply();
    }
  };

  const label = LANGS.find((l) => l.code === current)?.label ?? "English";

  return (
    <>
      {/* Hidden mount point Google Translate writes its widget into. We hide it
          because we render our own UI but still need the script active. */}
      <div id="google_translate_element" style={{ display: "none" }} />
      <style>{`
        /* Hide the Google translate banner that sometimes pushes the page down. */
        body { top: 0 !important; }
        .goog-te-banner-frame, .skiptranslate iframe { display: none !important; }
        .goog-tooltip, .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
      `}</style>

      <div ref={ref} className="relative notranslate" translate="no">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={
            compact
              ? "inline-flex items-center gap-1 text-xs font-medium text-navy-deep/80 hover:text-navy-deep px-2 py-1 rounded-md hover:bg-ivory transition"
              : "inline-flex items-center gap-1.5 text-sm font-medium text-navy-deep/80 hover:text-navy-deep px-2.5 py-1.5 rounded-md hover:bg-ivory transition"
          }
          aria-label="Change language"
        >
          <Globe className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 max-h-80 overflow-y-auto rounded-lg border border-border bg-white shadow-elevated z-[60] py-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => choose(l.code)}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-ivory transition ${
                  l.code === current ? "text-indigo font-semibold bg-ivory/60" : "text-navy-deep"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}