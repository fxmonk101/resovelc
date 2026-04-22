import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Briefcase, CreditCard, Gift, HandCoins, LayoutDashboard, Globe2,
  LogOut, Settings as SettingsIcon, ShieldCheck, User as UserIcon, Wallet, Menu,
} from "lucide-react";
import { useAuth, signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";
import { UserMenu } from "@/features/dashboard/UserMenu";
import { NotificationBell } from "@/features/dashboard/NotificationBell";
import logo from "@/assets/logo-credix.png";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Resolva Credix" }] }),
  component: DashboardLayout,
});

const NAV: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/personal", label: "Personal Banking", icon: Wallet },
  { to: "/dashboard/business", label: "Business Banking", icon: Briefcase },
  { to: "/dashboard/cards", label: "Credit Cards", icon: CreditCard },
  { to: "/dashboard/loans", label: "Loans", icon: HandCoins },
  { to: "/dashboard/grants", label: "Grants", icon: Gift },
  { to: "/dashboard/international", label: "International Wire", icon: Globe2 },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; avatar_url: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("first_name,last_name,avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-navy-light">Loading…</div>;

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Member";

  return (
    <div className="min-h-screen flex bg-ivory">
      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky inset-y-0 left-0 z-40 w-64 bg-navy-deep text-white flex flex-col transition-transform lg:top-0 lg:h-screen`}>
        <Link to="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <img src={logo} alt={BRAND.name} className="h-9 w-auto object-contain brightness-0 invert" />
          <span className="sr-only">{BRAND.name}</span>
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
          {isAdmin && (
            <Link to="/admin" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-gold-500/15 text-gold-400 hover:bg-gold-500/25 transition font-semibold">
              <ShieldCheck className="h-4 w-4" /> Admin Console
            </Link>
          )}
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
            <NotificationBell userId={user.id} />
            <UserMenu
              userId={user.id}
              email={user.email ?? ""}
              fullName={fullName}
              initials={initials}
              avatarUrl={profile?.avatar_url ?? null}
              isAdmin={isAdmin}
              onAvatarUpdated={(url) => setProfile((p) => p ? { ...p, avatar_url: url } : p)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
