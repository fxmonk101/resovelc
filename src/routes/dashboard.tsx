import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell, Briefcase, CreditCard, Gift, HandCoins, LayoutDashboard,
  Landmark, LogOut, Settings as SettingsIcon, ShieldCheck, User as UserIcon, Wallet, Menu,
} from "lucide-react";
import { useAuth, signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Resolve Case" }] }),
  component: DashboardLayout,
});

const NAV: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/personal", label: "Personal Banking", icon: Wallet },
  { to: "/dashboard/business", label: "Business Banking", icon: Briefcase },
  { to: "/dashboard/cards", label: "Credit Cards", icon: CreditCard },
  { to: "/dashboard/loans", label: "Loans", icon: HandCoins },
  { to: "/dashboard/grants", label: "Grants", icon: Gift },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("first_name,last_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-navy-light">Loading…</div>;

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen flex bg-ivory">
      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky inset-y-0 left-0 z-40 w-64 bg-navy-deep text-white flex flex-col transition-transform lg:top-0 lg:h-screen`}>
        <Link to="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo"><Landmark className="h-5 w-5" /></span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold">{BRAND.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/50">Member</span>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV.map((it) => (
            <Link
              key={it.to}
              to={it.to as string}
              activeOptions={{ exact: !!it.exact }}
              activeProps={{ className: "bg-indigo text-white shadow-lg shadow-indigo/30" }}
              inactiveProps={{ className: "text-white/70 hover:bg-white/5 hover:text-white" }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/dashboard/profile" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <SettingsIcon className="h-4 w-4" /> Settings
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
              <h1 className="font-display text-lg font-bold text-navy-deep">
                Welcome, {profile?.first_name ?? "there"}
              </h1>
              <p className="text-xs text-navy-light hidden sm:block">Manage your money — securely.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-ivory-dark text-navy-deep relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-indigo" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo text-white text-sm font-semibold">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
