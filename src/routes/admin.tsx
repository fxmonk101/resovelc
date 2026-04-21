import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Users, HandCoins, Gift, CreditCard, Wallet, LogOut, Menu, UserCog,
} from "lucide-react";
import { useAuth, signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";
import shield from "@/assets/resolva-shield.png";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Resolva Bank" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: ShieldCheck, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/loans", label: "Loan Applications", icon: HandCoins },
  { to: "/admin/grants", label: "Grant Applications", icon: Gift },
  { to: "/admin/cards", label: "Card Applications", icon: CreditCard },
  { to: "/admin/funds", label: "Funds & Transactions", icon: Wallet },
  { to: "/admin/admins", label: "Administrators", icon: UserCog },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  if (loading || !user || isAdmin === null) {
    return <div className="min-h-screen grid place-items-center text-navy-light">Loading admin console…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-ivory px-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldCheck className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="font-display text-2xl font-bold text-navy-deep">Access denied</h1>
          <p className="text-navy-light">You don't have administrator privileges. If this is a mistake, contact your system administrator.</p>
          <Link to="/dashboard" className="inline-block px-4 py-2 rounded-md bg-indigo text-white text-sm">Go to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-ivory">
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky inset-y-0 left-0 z-40 w-64 bg-navy-deep text-white flex flex-col transition-transform lg:top-0 lg:h-screen`}>
        <Link to="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <img src={shield} alt="" className="h-9 w-9 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold">{BRAND.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-brand-red-light">Admin Console</span>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: !!it.exact }}
              activeProps={{ className: "bg-gold-500 text-navy-deep shadow-lg shadow-gold-500/30" }}
              inactiveProps={{ className: "text-white/70 hover:bg-white/5 hover:text-white" }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium"
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <Wallet className="h-4 w-4" /> Member view
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-navy" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-navy-deep">Administrator Console</h1>
              <p className="text-xs text-navy-light hidden sm:block">Privileged access · all actions are logged</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-600" />
            <span className="text-xs font-semibold text-gold-700">ADMIN</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
