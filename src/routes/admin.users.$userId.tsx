import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, Phone, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users/$userId")({
  head: () => ({ meta: [{ title: "User details — Admin" }] }),
  component: UserDetail,
});

type Profile = {
  user_id: string; first_name: string; last_name: string; username: string;
  phone: string | null; country: string | null; account_type: string | null;
  account_number: string; balance: number; is_verified: boolean;
  created_at: string; avatar_url: string | null;
};

type Tx = {
  id: string; type: string; amount: number; description: string;
  reference: string; status: string; created_at: string;
};

function UserDetail() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: users }, { data: tx }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.rpc("admin_list_users"),
        supabase.from("transactions").select("id,type,amount,description,reference,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      ]);
      if (prof) setProfile(prof as Profile);
      const u = ((users ?? []) as Array<{ user_id: string; email: string }>).find((x) => x.user_id === userId);
      if (u) setEmail(u.email);
      setTxs((tx ?? []) as Tx[]);
      setLoading(false);
    })();
  }, [userId]);

  const toggleVerified = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ is_verified: !profile.is_verified }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    setProfile({ ...profile, is_verified: !profile.is_verified });
    toast.success("Verification status updated");
  };

  if (loading) {
    return <div className="p-10 text-center text-navy-light flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }
  if (!profile) {
    return <div className="p-10 text-center text-navy-light">User not found.</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-indigo hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to members
      </Link>

      <div className="rounded-xl border border-border bg-white p-6 flex flex-col lg:flex-row gap-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            : <div className="h-20 w-20 rounded-full bg-indigo/10 grid place-items-center text-indigo font-bold text-2xl">{profile.first_name?.[0]}{profile.last_name?.[0]}</div>}
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-deep">{profile.first_name} {profile.last_name}</h2>
            <p className="text-sm text-navy-light">@{profile.username}</p>
            <p className="text-xs text-navy-light mt-1">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Info icon={Mail} label="Email" value={email || "—"} />
          <Info icon={Phone} label="Phone" value={profile.phone || "—"} />
          <Info icon={MapPin} label="Country" value={profile.country || "—"} />
          <Info icon={Wallet} label="Account" value={`${profile.account_type ?? "Account"} · ${profile.account_number}`} />
          <Info icon={Wallet} label="Balance" value={`$${Number(profile.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
          <div>
            <button onClick={toggleVerified} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold ${profile.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {profile.is_verified ? "Verified — click to unverify" : "Unverified — click to verify"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-bold text-navy-deep">Transactions</h3>
          <p className="text-xs text-navy-light mt-0.5">{txs.length} most recent</p>
        </div>
        {txs.length === 0 ? (
          <div className="p-10 text-center text-navy-light">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ivory-dark/40 text-navy-deep">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Description</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Reference</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const credit = Number(t.amount) >= 0;
                  return (
                    <tr key={t.id} className="border-t border-border hover:bg-ivory/40">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-navy-light">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-navy-deep">{t.description}</td>
                      <td className="px-4 py-3 text-xs text-navy-light">{t.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-xs font-mono text-navy-light">{t.reference || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded ${
                          t.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          t.status === "pending" ? "bg-amber-100 text-amber-700" :
                          "bg-destructive/15 text-destructive"
                        }`}>{t.status}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${credit ? "text-emerald-700" : "text-destructive"}`}>
                        {credit ? "+" : "−"}${Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-navy-light mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-navy-light font-semibold">{label}</div>
        <div className="text-navy-deep truncate">{value}</div>
      </div>
    </div>
  );
}