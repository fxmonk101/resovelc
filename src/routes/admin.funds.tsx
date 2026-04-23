import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, CreditCard as CardIcon, Search, Equal, ShieldCheck, ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/funds")({
  component: AdminFunds,
});

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_number: string;
  balance: number;
}
interface Card { id: string; card_type: string; card_number: string; credit_limit: number; available_credit: number; current_balance: number; status: string; }
interface Txn { id: string; amount: number; type: string; description: string; reference: string; created_at: string; }

function AdminFunds() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [mode, setMode] = useState<"credit" | "debit" | "set">("credit");
  const [target, setTarget] = useState<string>("balance"); // "balance" or card id
  const [submitting, setSubmitting] = useState(false);

  const [roleStatus, setRoleStatus] = useState<"checking" | "ok" | "denied" | "error">("checking");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadUsers = async () => {
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) return toast.error(error.message);
    setUsers((data ?? []) as User[]);
  };

  const verifyAdmin = async () => {
    setRoleStatus("checking");
    setRoleError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        setRoleStatus("denied");
        return;
      }
      setCurrentUserId(userData.user.id);
      const { data: isAdmin, error: rpcErr } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (rpcErr) {
        setRoleError(rpcErr.message);
        setRoleStatus("error");
        return;
      }
      if (isAdmin === true) {
        setRoleStatus("ok");
        await loadUsers();
      } else {
        setRoleStatus("denied");
      }
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : "Unknown error");
      setRoleStatus("error");
    }
  };

  useEffect(() => { verifyAdmin(); }, []);

  const select = async (u: User) => {
    setSelected(u);
    setTarget("balance");
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("credit_cards").select("*").eq("user_id", u.user_id),
      supabase.from("transactions").select("*").eq("user_id", u.user_id).order("created_at", { ascending: false }).limit(20),
    ]);
    setCards((c ?? []) as Card[]);
    setTxns((t ?? []) as Txn[]);
  };

  const refreshSelectedUser = async (current: User) => {
    const [{ data: profile, error: profileError }, { data: usersData, error: usersError }] = await Promise.all([
      supabase.from("profiles").select("balance").eq("user_id", current.user_id).maybeSingle(),
      supabase.rpc("admin_list_users"),
    ]);

    if (profileError) return toast.error(profileError.message);
    if (usersError) return toast.error(usersError.message);

    const list = (usersData ?? []) as User[];
    const refreshed = list.find((u) => u.user_id === current.user_id) ?? {
      ...current,
      balance: Number(profile?.balance ?? current.balance),
    };

    setUsers(list);
    await select(refreshed);
  };

  const submit = async (): Promise<boolean> => {
    if (!selected) return false;
    if (roleStatus !== "ok") {
      toast.error("Admin permissions are not verified. Please refresh or sign in again.");
      return false;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a positive amount");
      return false;
    }

    setSubmitting(true);
    try {
      // Re-verify session right before the RPC; expired sessions silently run as anon.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        console.error("Session check failed:", sessionError);
        toast.error("Your session expired. Please sign in again.");
        return false;
      }

      if (target === "balance") {
        if (mode === "set") {
          const { data, error } = await supabase.rpc("admin_set_balance", {
            _user_id: selected.user_id,
            _new_balance: amt,
            _description: desc || `Admin set balance to $${amt}`,
          });
          console.log("admin_set_balance result", { data, error });
          if (error) {
            console.error("RPC failed:", error);
            toast.error(`Transaction failed: ${error.message}`);
            return false;
          }
        } else {
          const { data, error } = await supabase.rpc("admin_adjust_balance", {
            _user_id: selected.user_id,
            _amount: amt,
            _description: desc || `Admin ${mode} to checking`,
            _direction: mode,
          });
          console.log("admin_adjust_balance result", { data, error });
          if (error) {
            console.error("RPC failed:", error);
            toast.error(`Transaction failed: ${error.message}`);
            return false;
          }
        }
      } else {
        if (mode === "set") {
          toast.error("Set-exact mode is only available for checking balances");
          return false;
        }
        const direction = mode;
        const signed = direction === "credit" ? amt : -amt;
        const card = cards.find((c) => c.id === target);
        if (!card) return false;
        const newBalance = Number(card.current_balance) + (direction === "credit" ? -amt : amt);
        const newAvail = Number(card.credit_limit) - newBalance;
        if (newBalance < 0 || newAvail < 0 || newBalance > Number(card.credit_limit)) {
          toast.error("Operation would exceed card limits");
          return false;
        }
        const { error } = await supabase.from("credit_cards").update({ current_balance: newBalance, available_credit: newAvail }).eq("id", card.id);
        if (error) {
          console.error("Card update failed:", error);
          toast.error(`Transaction failed: ${error.message}`);
          return false;
        }
        const { error: txnError } = await supabase.from("transactions").insert({
          user_id: selected.user_id, amount: signed, type: direction === "credit" ? "card_payment" : "card_charge",
          description: desc || `Admin ${direction === "credit" ? "loaded funds onto" : "charged"} ${card.card_type} ••••${card.card_number.slice(-4)}`,
        });
        if (txnError) {
          console.error("Transaction insert failed:", txnError);
          toast.error(`Transaction failed: ${txnError.message}`);
          return false;
        }
      }

      // Always re-fetch authoritative balance before showing success.
      await refreshSelectedUser(selected);
      toast.success("Transaction posted");
      setAmount("");
      setDesc("");
      return true;
    } catch (e) {
      console.error("submit() threw:", e);
      toast.error(e instanceof Error ? e.message : "Unexpected error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    const s = q.toLowerCase();
    return !s || u.email?.toLowerCase().includes(s) || u.first_name?.toLowerCase().includes(s) || u.last_name?.toLowerCase().includes(s) || u.account_number?.includes(s);
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-navy-deep flex items-center gap-2"><Wallet className="h-6 w-6 text-indigo" />Funds & transactions</h2>
        <p className="text-sm text-navy-light mt-1">Credit or debit any member's checking balance or credit card. Every action is logged.</p>
        <div className="mt-3">
          {roleStatus === "checking" && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-navy-light">
              <Loader2 className="h-3 w-3 animate-spin" /> Verifying admin permissions…
            </span>
          )}
          {roleStatus === "ok" && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3" /> Admin permissions verified
            </span>
          )}
          {roleStatus === "denied" && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
              <ShieldAlert className="h-3 w-3" /> You no longer have admin permissions. Please sign in again.
            </span>
          )}
          {roleStatus === "error" && (
            <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldAlert className="h-3 w-3" /> Couldn't verify permissions{roleError ? `: ${roleError}` : ""}
              <button onClick={verifyAdmin} className="underline font-medium">Retry</button>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Users list */}
        <div className="rounded-xl border border-border bg-white overflow-hidden flex flex-col max-h-[calc(100vh-12rem)]">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" className="w-full pl-9 pr-3 h-9 rounded-md border border-border bg-white text-sm text-navy-deep placeholder:text-navy-light/60 focus:outline-none focus:ring-2 focus:ring-indigo/30" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((u) => (
              <button key={u.user_id} onClick={() => select(u)} className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-ivory transition ${selected?.user_id === u.user_id ? "bg-indigo/5 border-l-2 border-l-indigo" : ""}`}>
                <div className="font-semibold text-navy-deep text-sm">{u.first_name} {u.last_name}</div>
                <div className="text-xs text-navy-light truncate">{u.email}</div>
                <div className="text-xs text-navy mt-0.5">${Number(u.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} · ••••{u.account_number?.slice(-4)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action panel */}
        <div className="space-y-5">
          {!selected ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center text-navy-light">Select a member to manage their funds.</div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-white p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs text-navy-light uppercase tracking-wider">Member</div>
                    <div className="font-display text-xl font-bold text-navy-deep">{selected.first_name} {selected.last_name}</div>
                    <div className="text-xs text-navy-light">{selected.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-navy-light uppercase tracking-wider">Checking balance</div>
                    <div className="font-display text-2xl font-bold text-emerald-700">${Number(selected.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-navy-deep">Target account</label>
                    <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-navy-deep">
                      <option value="balance">Checking · ••••{selected.account_number?.slice(-4)}</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>{c.card_type} ••••{c.card_number.slice(-4)} (limit ${c.credit_limit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-navy-deep">Action</label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <button onClick={() => setMode("credit")} className={`h-10 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1 ${mode === "credit" ? "bg-emerald-600 text-white" : "border border-border text-navy"}`}>
                        <ArrowDownLeft className="h-3.5 w-3.5" />Credit (+)
                      </button>
                      <button onClick={() => setMode("debit")} className={`h-10 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1 ${mode === "debit" ? "bg-destructive text-white" : "border border-border text-navy"}`}>
                        <ArrowUpRight className="h-3.5 w-3.5" />Debit (−)
                      </button>
                      <button onClick={() => setMode("set")} disabled={target !== "balance"} className={`h-10 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${mode === "set" ? "bg-indigo text-white" : "border border-border text-navy"}`} title={target !== "balance" ? "Only for checking balance" : "Replace balance with exact amount"}>
                        <Equal className="h-3.5 w-3.5" />Set exact
                      </button>
                    </div>
                    {mode === "set" && (
                      <p className="text-[11px] text-navy-light mt-1.5">Replaces the current balance with the exact amount entered below.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-navy-deep">Amount (USD)</label>
                    <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-navy-deep placeholder:text-navy-light/60" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-navy-deep">Description</label>
                    <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional memo" className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-navy-deep placeholder:text-navy-light/60" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      const amt = Number(amount);
                      if (!amt || amt <= 0) return toast.error("Enter a positive amount");
                      if (roleStatus !== "ok") return toast.error("Admin permissions required");
                      setConfirmOpen(true);
                    }}
                    disabled={submitting || roleStatus !== "ok"}
                    title={roleStatus !== "ok" ? "Admin permissions required" : undefined}
                    className="px-5 h-10 rounded-md bg-indigo text-white text-sm font-semibold hover:bg-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Posting…" : "Post transaction"}
                  </button>
                </div>
              </div>

              {cards.length > 0 && (
                <div className="rounded-xl border border-border bg-white p-5">
                  <h3 className="font-display text-base font-bold text-navy-deep flex items-center gap-2 mb-3"><CardIcon className="h-4 w-4" />Credit cards ({cards.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cards.map((c) => (
                      <div key={c.id} className="rounded-lg bg-gradient-to-br from-navy-deep to-indigo p-4 text-white">
                        <div className="text-xs uppercase tracking-wider opacity-80">{c.card_type}</div>
                        <div className="font-mono text-sm mt-2">•••• •••• •••• {c.card_number.slice(-4)}</div>
                        <div className="mt-3 flex justify-between text-xs">
                          <div><div className="opacity-70">Available</div><div className="font-semibold">${Number(c.available_credit).toLocaleString()}</div></div>
                          <div><div className="opacity-70">Balance</div><div className="font-semibold">${Number(c.current_balance).toLocaleString()}</div></div>
                          <div><div className="opacity-70">Limit</div><div className="font-semibold">${Number(c.credit_limit).toLocaleString()}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-white p-5">
                <h3 className="font-display text-base font-bold text-navy-deep mb-3">Recent transactions</h3>
                {txns.length === 0 ? (
                  <div className="text-sm text-navy-light text-center py-6">No transactions yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {txns.map((t) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-navy-deep truncate">{t.description}</div>
                          <div className="text-xs text-navy-light">{new Date(t.created_at).toLocaleString()} · #{t.reference}</div>
                        </div>
                        <div className={`text-sm font-semibold ${Number(t.amount) >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                          {Number(t.amount) >= 0 ? "+" : ""}${Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirm transaction
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm">
                <div>Please review the details below before posting. This action will be logged.</div>
                {selected && (
                  <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-navy-light">Member</span>
                      <span className="font-medium text-navy-deep text-right">
                        {selected.first_name} {selected.last_name}
                        <div className="text-xs text-navy-light font-normal">{selected.email}</div>
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-navy-light">Target</span>
                      <span className="font-medium text-navy-deep">
                        {target === "balance"
                          ? `Checking ••••${selected.account_number?.slice(-4)}`
                          : (() => {
                              const c = cards.find((x) => x.id === target);
                              return c ? `${c.card_type} ••••${c.card_number.slice(-4)}` : "Card";
                            })()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-navy-light">Action</span>
                      <span
                        className={`font-semibold ${
                          mode === "credit"
                            ? "text-emerald-700"
                            : mode === "debit"
                            ? "text-destructive"
                            : "text-indigo"
                        }`}
                      >
                        {mode === "credit" ? "Credit (+)" : mode === "debit" ? "Debit (−)" : "Set exact balance"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-navy-light">Amount</span>
                      <span className="font-bold text-navy-deep">
                        ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {desc && (
                      <div className="flex justify-between gap-3">
                        <span className="text-navy-light">Memo</span>
                        <span className="text-navy-deep text-right max-w-[60%] truncate">{desc}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={async (e) => {
                e.preventDefault();
                const ok = await submit();
                if (ok) setConfirmOpen(false);
              }}
            >
              {submitting ? "Posting…" : "Confirm & post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
