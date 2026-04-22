import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS, SERVICE_LINKS, BRAND } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-credix.png";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  // White header so the brand-color logo reads cleanly; subtle shadow on scroll
  const headerCls = cn(
    "fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-white text-navy-deep",
    scrolled ? "shadow-elevated border-b border-border" : "border-b border-border/60"
  );

  const linkCls = "text-sm font-medium text-navy-deep/75 hover:text-navy-deep transition-colors";

  return (
    <header className={headerCls}>
      {/* Top utility bar — patriotic red, the secondary brand color */}
      <div className="hidden md:block bg-brand-red text-white border-b border-brand-red-dark/40">
        <div className="container-page flex h-8 items-center justify-between text-[11px]">
          <div className="flex items-center gap-4">
            <span className="text-white/95">{BRAND.fdic} · Trusted since {BRAND.founded}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${BRAND.phone}`} className="hover:text-white text-white/95">{BRAND.phone}</a>
            <span className="text-white/40">|</span>
            <span className="text-white/95">{BRAND.hours}</span>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-navy-deep" aria-label="Resolva Credix home">
          <img src={logo} alt="Resolva Credix" className="h-10 lg:h-11 w-auto object-contain" />
          <span className="sr-only">{BRAND.name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          <Link to="/" className={linkCls} activeProps={{ className: "text-white" }} activeOptions={{ exact: true }}>Home</Link>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className={`flex items-center gap-1 ${linkCls}`}>
              Services <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[440px]">
                <div className="bg-card border border-border rounded-xl shadow-elevated p-3 grid gap-1">
                  {SERVICE_LINKS.map((s) => (
                    <Link key={s.to} to={s.to} className="block rounded-lg p-3 hover:bg-muted transition group">
                      <div className="font-semibold text-sm text-foreground group-hover:text-indigo transition">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/about" className={linkCls} activeProps={{ className: "text-white" }}>About</Link>
          <Link to="/grants" className={linkCls} activeProps={{ className: "text-white" }}>Grants</Link>
          <Link to="/contact" className={linkCls} activeProps={{ className: "text-white" }}>Contact</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-medium text-navy-deep hover:text-indigo px-4 py-2 rounded-lg border border-border hover:bg-ivory transition">
            Sign in
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-brand-red hover:bg-brand-red-dark text-white px-5 py-2 rounded-lg transition shadow-lg shadow-brand-red/30">
            Open Account
          </Link>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button className="text-navy-deep p-2" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container-page py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-navy-deep/90 py-2.5 px-2 rounded hover:bg-ivory text-sm">
                {link.label}
              </Link>
            ))}
            <div className="text-label text-navy-light px-2 pt-3 pb-1">Services</div>
            {SERVICE_LINKS.map((s) => (
              <Link key={s.to} to={s.to} className="text-navy-deep/80 py-2.5 px-2 rounded hover:bg-ivory text-sm">
                {s.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border mt-2">
              <Link to="/login" className="text-center py-2.5 rounded-lg border border-border text-navy-deep text-sm">Sign in</Link>
              <Link to="/register" className="text-center py-2.5 rounded-lg bg-brand-red text-white font-semibold text-sm">Open</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
