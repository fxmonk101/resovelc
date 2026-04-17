import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, Menu, Landmark, X } from "lucide-react";
import { NAV_LINKS, SERVICE_LINKS, BRAND } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

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

  // Always-solid navy bar so it reads well on every background
  const headerCls = cn(
    "fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-navy-deep text-white",
    scrolled ? "shadow-elevated border-b border-white/10" : "border-b border-white/5"
  );

  const linkCls = "text-sm font-medium text-white/80 hover:text-white transition-colors";

  return (
    <header className={headerCls}>
      {/* Top utility bar */}
      <div className="hidden md:block bg-black/20 border-b border-white/5">
        <div className="container-page flex h-8 items-center justify-between text-[11px] text-white/60">
          <div className="flex items-center gap-4">
            <span>{BRAND.fdic} · Member-owned since {BRAND.founded}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${BRAND.phone}`} className="hover:text-white">{BRAND.phone}</a>
            <span className="text-white/30">|</span>
            <span>{BRAND.hours}</span>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo">
            <Landmark className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight">{BRAND.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/50">Financial</span>
          </div>
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
          <Link to="/login" className="text-sm font-medium text-white/90 hover:text-white px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition">
            Sign in
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-indigo hover:bg-indigo-light text-white px-5 py-2 rounded-lg transition shadow-lg shadow-indigo/20">
            Open Account
          </Link>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button className="text-white p-2" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-navy-deep border-t border-white/10 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container-page py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-white/90 py-2.5 px-2 rounded hover:bg-white/5 text-sm">
                {link.label}
              </Link>
            ))}
            <div className="text-label text-white/40 px-2 pt-3 pb-1">Services</div>
            {SERVICE_LINKS.map((s) => (
              <Link key={s.to} to={s.to} className="text-white/80 py-2.5 px-2 rounded hover:bg-white/5 text-sm">
                {s.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 mt-2">
              <Link to="/login" className="text-center py-2.5 rounded-lg border border-white/20 text-white text-sm">Sign in</Link>
              <Link to="/register" className="text-center py-2.5 rounded-lg bg-indigo text-white font-semibold text-sm">Open</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
