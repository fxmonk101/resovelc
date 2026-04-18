import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/admin/admins")({
  component: AdminAdmins,
});

interface AdminRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

function AdminAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) return toast.error(error.message);
    setAdmins(((data ?? []) as Array<AdminRow & { is_admin: boolean }>).filter((u) => u.is_admin));
  };
  useEffect(() => { load(); }, []);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("admin_find_user_by_email", { _email: email.trim() });
      if (error) throw error;
      const target = (data ?? [])[0] as { user_id: string } | undefined;
      if (!target?.user_id) {
        toast.error("No user found with that email. They must register first.");
        return;
      }
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: target.user_id, role: "admin" });
      if (insErr && !insErr.message.includes("duplicate")) throw insErr;
      toast.success("Admin role granted");
      setEmail("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grant admin");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (userId: string) => {
    if (userId === user?.id) return toast.error("You cannot revoke your own admin access");
    if (!confirm("Revoke admin access for this user?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    if (error) return toast.error(error.message);
    toast.success("Admin role revoked");
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-gold-600" />Administrators</h2>
        <p className="text-sm text-navy-light mt-1">Grant or revoke administrator access. Users must have an existing account.</p>
      </div>

      <form onSubmit={grant} className="rounded-xl border border-border bg-white p-5">
        <h3 className="font-display text-base font-bold text-navy-deep flex items-center gap-2 mb-3"><UserPlus className="h-4 w-4" />Grant admin access</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 min-w-64 h-10 px-3 rounded-md border border-border text-sm"
            required
          />
          <button type="submit" disabled={busy} className="h-10 px-5 rounded-md bg-indigo text-white text-sm font-semibold hover:bg-indigo/90 disabled:opacity-50">
            {busy ? "Granting…" : "Grant admin"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-ivory-dark/30">
          <h3 className="font-semibold text-navy-deep">Active administrators ({admins.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {admins.length === 0 ? (
            <div className="p-8 text-center text-navy-light text-sm">No administrators.</div>
          ) : admins.map((a) => (
            <div key={a.user_id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-navy-deep">{a.first_name} {a.last_name} {a.user_id === user?.id && <span className="text-xs text-navy-light">(you)</span>}</div>
                <div className="text-xs text-navy-light">{a.email}</div>
              </div>
              <button
                onClick={() => revoke(a.user_id)}
                disabled={a.user_id === user?.id}
                className="text-xs font-medium text-destructive hover:underline disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
