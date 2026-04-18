import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface Row {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  account_number: string;
  balance: number;
  is_verified: boolean;
  created_at: string;
  is_admin: boolean;
  loan_count: number;
  grant_count: number;
  card_count: number;
}

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleVerified = async (userId: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_verified: !current }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success(`Account ${!current ? "verified" : "unverified"}`);
    load();
  };

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.email?.toLowerCase().includes(s) || r.first_name?.toLowerCase().includes(s) || r.last_name?.toLowerCase().includes(s) || r.account_number?.includes(s);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-deep">Members</h2>
          <p className="text-sm text-navy-light mt-1">{rows.length} accounts in the system.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, account #"
            className="pl-9 pr-3 h-10 w-72 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo/30"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-dark/40 text-navy-deep">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Member</th>
                <th className="text-left px-4 py-3 font-semibold">Account</th>
                <th className="text-right px-4 py-3 font-semibold">Balance</th>
                <th className="text-center px-4 py-3 font-semibold">Loans</th>
                <th className="text-center px-4 py-3 font-semibold">Grants</th>
                <th className="text-center px-4 py-3 font-semibold">Cards</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-navy-light">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-navy-light">No members found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.user_id} className="border-t border-border hover:bg-ivory/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-deep flex items-center gap-2">
                      {r.first_name} {r.last_name}
                      {r.is_admin && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-gold-500/15 text-gold-700 px-1.5 py-0.5 rounded"><ShieldCheck className="h-3 w-3" />Admin</span>}
                    </div>
                    <div className="text-xs text-navy-light">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-navy">••••{r.account_number?.slice(-4)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-navy-deep">${Number(r.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center">{r.loan_count}</td>
                  <td className="px-4 py-3 text-center">{r.grant_count}</td>
                  <td className="px-4 py-3 text-center">{r.card_count}</td>
                  <td className="px-4 py-3 text-center">
                    {r.is_verified
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><XCircle className="h-3.5 w-3.5" />Unverified</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleVerified(r.user_id, r.is_verified)}
                      className="text-xs font-medium text-indigo hover:underline"
                    >
                      {r.is_verified ? "Unverify" : "Verify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
