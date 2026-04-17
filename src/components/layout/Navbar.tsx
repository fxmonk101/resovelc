import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Shield, X } from "lucide-react";
import { NAV_LINKS, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

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
          <span className="font-display text-xl font-bold tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-white/80 hover:text-white transition-colors relative"
              activeProps={{ className: "text-white" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
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

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-slate-deep border-t border-white/10 animate-in slide-in-from-top">
          <div className="container-page py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-white/90 py-3 px-2 rounded hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 mt-2">
              <Link to="/login" className="text-center py-2.5 rounded-lg border border-white/20 text-white">
                Login
              </Link>
              <Link to="/register" className="text-center py-2.5 rounded-lg bg-terra text-white font-semibold">
                Open
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
