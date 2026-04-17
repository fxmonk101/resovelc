import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, Menu, Shield, X } from "lucide-react";
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

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-slate-deep/90 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-terra">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">{BRAND.name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            activeProps={{ className: "text-white" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors">
              Services <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[420px]">
                <div className="bg-card border border-border rounded-xl shadow-elevated p-3 grid gap-1">
                  {SERVICE_LINKS.map((s) => (
                    <Link
                      key={s.to}
                      to={s.to}
                      className="block rounded-lg p-3 hover:bg-muted transition group"
                    >
                      <div className="font-semibold text-sm text-foreground group-hover:text-terra transition">
                        {s.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/about" className="text-sm font-medium text-white/80 hover:text-white transition-colors" activeProps={{ className: "text-white" }}>
            About
          </Link>
          <Link to="/contact" className="text-sm font-medium text-white/80 hover:text-white transition-colors" activeProps={{ className: "text-white" }}>
            Contact
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm font-medium text-white/90 hover:text-white px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-terra hover:bg-terra-dark text-white px-5 py-2 rounded-lg transition"
          >
            Open Account
          </Link>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="text-white p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-slate-deep border-t border-white/10 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
              <Link to="/login" className="text-center py-2.5 rounded-lg border border-white/20 text-white text-sm">
                Login
              </Link>
              <Link to="/register" className="text-center py-2.5 rounded-lg bg-terra text-white font-semibold text-sm">
                Open
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
