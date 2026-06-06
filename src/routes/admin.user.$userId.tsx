import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, Phone, MapPin, ShieldCheck, Wallet, Pencil, CheckCircle2, XCircle, Ban, DollarSign, Send, Landmark, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/user/$userId")({
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

type AdminBank = {
  id?: string;
  user_id: string;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  routing_number: string | null;
  account_type: string | null;
  swift_bic: string | null;
  iban: string | null;
  bank_address: string | null;
  bank_country: string | null;
  notes: string | null;
};

function UserDetail() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
  const [editingTx, setEditingTx] = useState<Tx | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<Tx | null>(null);
  const [decisionTx, setDecisionTx] = useState<{ tx: Tx; decision: "completed" | "failed" | "cancelled" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState<AdminBank | null>(null);
  const [editingBank, setEditingBank] = useState(false);

  const load = async () => {
      setLoading(true);
      const [{ data: prof }, { data: users }, { data: tx }, { data: bk }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.rpc("admin_list_users"),
        supabase.from("transactions").select("id,type,amount,description,reference,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
        supabase.from("admin_user_bank_details").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      if (prof) setProfile(prof as Profile);
      const u = ((users ?? []) as Array<{ user_id: string; email: string }>).find((x) => x.user_id === userId);
      if (u) setEmail(u.email);
      setTxs((tx ?? []) as Tx[]);
      setBank((bk as AdminBank) ?? null);
      setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const toggleVerified = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ is_verified: !profile.is_verified }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    setProfile({ ...profile, is_verified: !profile.is_verified });
    toast.success("Verification status updated");
  };

  const submitTxDecision = async (note: string) => {
    if (!decisionTx) return;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }
      const resp = await fetch("/api/admin/update-transaction-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          transactionId: decisionTx.tx.id,
          newStatus: decisionTx.decision,
          adminNotes: note.trim() || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data.error || "Update failed"); return; }
      toast.success(`Transaction marked ${decisionTx.decision}`);
      setDecisionTx(null);
      await load();
    } finally { setBusy(false); }
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
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleVerified} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold ${profile.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {profile.is_verified ? "Verified — click to unverify" : "Unverified — click to verify"}
            </button>
            <button onClick={() => setEditingProfile(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-indigo text-white hover:bg-indigo/90">
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </button>
            <button onClick={() => setEditingBalance(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
              <DollarSign className="h-3.5 w-3.5" /> Adjust balance
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
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const credit = Number(t.amount) >= 0;
                  const pending = t.status === "pending";
                  const isTransfer = t.type === "domestic_transfer" || t.type === "international_transfer";
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setEditingTx(t)} title="Edit" className="p-1.5 rounded hover:bg-ivory text-navy-deep">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {pending && isTransfer && (
                            <button onClick={() => setEditingRecipient(t)} title="Edit recipient" className="p-1.5 rounded hover:bg-indigo/10 text-indigo">
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {pending && (
                            <>
                              <button onClick={() => setDecisionTx({ tx: t, decision: "completed" })} title="Complete" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setDecisionTx({ tx: t, decision: "failed" })} title="Fail" className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setDecisionTx({ tx: t, decision: "cancelled" })} title="Cancel" className="p-1.5 rounded hover:bg-amber-50 text-amber-700">
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display text-lg font-bold text-navy-deep inline-flex items-center gap-2">
              <Landmark className="h-5 w-5 text-indigo" /> Bank details
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-amber-100 text-amber-700">
                <Lock className="h-3 w-3" /> Admin only
              </span>
            </h3>
            <p className="text-xs text-navy-light mt-0.5">Visible to admins only — not shown to the user.</p>
          </div>
          <button onClick={() => setEditingBank(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-indigo text-white hover:bg-indigo/90">
            <Pencil className="h-3.5 w-3.5" /> {bank ? "Edit bank details" : "Add bank details"}
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Info icon={Landmark} label="Bank name" value={bank?.bank_name || "—"} />
          <Info icon={Wallet} label="Account holder" value={bank?.account_holder || "—"} />
          <Info icon={Wallet} label="Account number" value={bank?.account_number || "—"} />
          <Info icon={Wallet} label="Routing number" value={bank?.routing_number || "—"} />
          <Info icon={Wallet} label="Account type" value={bank?.account_type || "—"} />
          <Info icon={Wallet} label="SWIFT / BIC" value={bank?.swift_bic || "—"} />
          <Info icon={Wallet} label="IBAN" value={bank?.iban || "—"} />
          <Info icon={MapPin} label="Bank country" value={bank?.bank_country || "—"} />
          <Info icon={MapPin} label="Bank address" value={bank?.bank_address || "—"} />
          <Info icon={Pencil} label="Internal notes" value={bank?.notes || "—"} />
        </div>
      </div>

      {editingProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditingProfile(false)}
          onSaved={(p) => { setProfile(p); setEditingProfile(false); }}
        />
      )}
      {editingBalance && (
        <EditBalanceModal
          userId={userId}
          currentBalance={Number(profile.balance)}
          onClose={() => setEditingBalance(false)}
          onSaved={(newBal) => { setProfile({ ...profile, balance: newBal }); setEditingBalance(false); load(); }}
        />
      )}
      {editingTx && (
        <EditTxModal
          tx={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={() => { setEditingTx(null); load(); }}
        />
      )}
      {editingRecipient && (
        <EditRecipientModal
          tx={editingRecipient}
          userId={userId}
          onClose={() => setEditingRecipient(null)}
          onSaved={() => { setEditingRecipient(null); load(); }}
        />
      )}
      {decisionTx && (
        <DecisionModal
          decision={decisionTx.decision}
          tx={decisionTx.tx}
          busy={busy}
          onCancel={() => setDecisionTx(null)}
          onSubmit={submitTxDecision}
        />
      )}
      {editingBank && (
        <EditBankModal
          userId={userId}
          bank={bank}
          onClose={() => setEditingBank(false)}
          onSaved={(b) => { setBank(b); setEditingBank(false); }}
        />
      )}
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

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-navy-light font-semibold">{label}</span>
      <input {...props} className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-navy-deep focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
    </label>
  );
}

function EditProfileModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: (p: Profile) => void }) {
  const [form, setForm] = useState({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    username: profile.username ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    account_type: profile.account_type ?? "",
    account_number: profile.account_number ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("profiles").update(form).eq("user_id", profile.user_id).select("*").maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onSaved(data as Profile);
  };

  return (
    <Modal onClose={() => !busy && onClose()}>
      <h3 className="font-display text-lg font-bold text-navy-deep mb-4">Edit profile</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <Field label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <Field label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <Field label="Account type" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })} />
        <div className="col-span-2">
          <Field label="Account number" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
        <button onClick={save} disabled={busy} className="h-10 px-4 rounded-md bg-indigo text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </div>
    </Modal>
  );
}

function EditBalanceModal({ userId, currentBalance, onClose, onSaved }: { userId: string; currentBalance: number; onClose: () => void; onSaved: (newBal: number) => void }) {
  const [mode, setMode] = useState<"set" | "credit" | "debit">("set");
  const [amount, setAmount] = useState<string>(String(currentBalance));
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const amt = Number(amount);
    if (!isFinite(amt) || amt < 0) return toast.error("Enter a valid amount");
    setBusy(true);
    try {
      if (mode === "set") {
        const { data, error } = await supabase.rpc("admin_set_balance", { _user_id: userId, _new_balance: amt, _description: desc || "Admin balance set" });
        if (error) throw error;
        onSaved(Number((data as { new_balance: number }).new_balance));
      } else {
        const { data, error } = await supabase.rpc("admin_adjust_balance", { _user_id: userId, _amount: amt, _description: desc || `Admin ${mode}`, _direction: mode });
        if (error) throw error;
        const d = data as { new_balance?: number };
        onSaved(Number(d.new_balance ?? currentBalance));
      }
      toast.success("Balance updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally { setBusy(false); }
  };

  return (
    <Modal onClose={() => !busy && onClose()}>
      <h3 className="font-display text-lg font-bold text-navy-deep mb-4">Adjust balance</h3>
      <div className="flex gap-2 mb-3">
        {(["set", "credit", "debit"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 h-9 rounded-md text-xs font-semibold capitalize ${mode === m ? "bg-indigo text-white" : "bg-ivory text-navy-deep border border-border"}`}>{m}</button>
        ))}
      </div>
      <Field label={mode === "set" ? "New balance ($)" : "Amount ($)"} type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <div className="mt-3">
        <Field label="Description (shown to user)" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <p className="text-xs text-navy-light mt-2">Current balance: ${currentBalance.toFixed(2)}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
        <button onClick={save} disabled={busy} className="h-10 px-4 rounded-md bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Apply
        </button>
      </div>
    </Modal>
  );
}

function EditTxModal({ tx, onClose, onSaved }: { tx: Tx; onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState(tx.description);
  const [amount, setAmount] = useState(String(tx.amount));
  const [status, setStatus] = useState(tx.status);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const amt = Number(amount);
    if (!isFinite(amt)) return toast.error("Invalid amount");
    setBusy(true);
    const { error } = await supabase.from("transactions").update({ description, amount: amt, status }).eq("id", tx.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Transaction updated");
    onSaved();
  };

  return (
    <Modal onClose={() => !busy && onClose()}>
      <h3 className="font-display text-lg font-bold text-navy-deep mb-1">Edit transaction</h3>
      <p className="text-xs text-navy-light mb-4">#{tx.reference || tx.id.slice(0, 8)}</p>
      <div className="space-y-3">
        <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Field label="Amount (negative = debit)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-navy-light font-semibold">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-navy-deep">
            <option value="pending">pending</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
      </div>
      <p className="text-[11px] text-navy-light mt-3">Direct edit — does not refund/charge the user balance or send notifications. Use the status action buttons for that.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
        <button onClick={save} disabled={busy} className="h-10 px-4 rounded-md bg-indigo text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </div>
    </Modal>
  );
}

function DecisionModal({ decision, tx, busy, onCancel, onSubmit }: { decision: "completed" | "failed" | "cancelled"; tx: Tx; busy: boolean; onCancel: () => void; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState("");
  const color = decision === "completed" ? "bg-emerald-600 hover:bg-emerald-700" : decision === "failed" ? "bg-destructive hover:bg-destructive/90" : "bg-amber-600 hover:bg-amber-700";
  return (
    <Modal onClose={() => !busy && onCancel()}>
      <h3 className="font-display text-lg font-bold text-navy-deep">Mark as <span className="capitalize">{decision}</span></h3>
      <p className="text-sm text-navy-light mt-1">{tx.description}</p>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={500} placeholder="Reason / note sent to the user" className="mt-3 w-full px-3 py-2 rounded-md border border-border bg-white text-sm text-navy-deep focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
      {decision !== "completed" && Number(tx.amount) < 0 && (
        <p className="text-[11px] text-navy-light mt-1">User will be refunded ${Math.abs(Number(tx.amount)).toFixed(2)}.</p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
        <button onClick={() => onSubmit(note)} disabled={busy} className={`h-10 px-4 rounded-md text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 ${color}`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm & notify
        </button>
      </div>
    </Modal>
  );
}

type DomesticTransfer = {
  id: string; recipient_name: string; bank_name: string;
  routing_number: string; account_number: string; account_type: string;
  memo: string | null; reference: string;
};

type IntlTransfer = {
  id: string; recipient_name: string; recipient_bank: string;
  swift_bic: string; iban_or_account: string; recipient_country: string;
  recipient_address: string | null; purpose: string | null; reference: string;
};

function EditRecipientModal({ tx, userId, onClose, onSaved }: { tx: Tx; userId: string; onClose: () => void; onSaved: () => void }) {
  const isDomestic = tx.type === "domestic_transfer";
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dom, setDom] = useState<DomesticTransfer | null>(null);
  const [intl, setIntl] = useState<IntlTransfer | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const table = isDomestic ? "domestic_transfers" : "international_transfers";
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      const rows = (data ?? []) as Array<{ reference: string }>;
      const match = rows.find((r) => tx.description?.includes(r.reference)) ?? rows[0];
      if (!match) { toast.error("Matching transfer record not found"); onClose(); return; }
      if (isDomestic) setDom(match as unknown as DomesticTransfer);
      else setIntl(match as unknown as IntlTransfer);
    })();
  }, [tx.id, isDomestic, userId, onClose, tx.description]);

  const saveDom = async () => {
    if (!dom) return;
    if (!/^[0-9]{9}$/.test(dom.routing_number)) return toast.error("Routing number must be 9 digits");
    if (!/^[0-9]{5,20}$/.test(dom.account_number)) return toast.error("Account number must be 5–20 digits");
    if (!["checking", "savings"].includes(dom.account_type)) return toast.error("Account type must be checking or savings");
    setBusy(true);
    const { error } = await supabase.from("domestic_transfers").update({
      recipient_name: dom.recipient_name,
      bank_name: dom.bank_name,
      routing_number: dom.routing_number,
      account_number: dom.account_number,
      account_type: dom.account_type,
      memo: dom.memo,
    }).eq("id", dom.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Recipient updated");
    onSaved();
  };

  const saveIntl = async () => {
    if (!intl) return;
    setBusy(true);
    const { error } = await supabase.from("international_transfers").update({
      recipient_name: intl.recipient_name,
      recipient_bank: intl.recipient_bank,
      swift_bic: intl.swift_bic,
      iban_or_account: intl.iban_or_account,
      recipient_country: intl.recipient_country,
      recipient_address: intl.recipient_address,
      purpose: intl.purpose,
    }).eq("id", intl.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Recipient updated");
    onSaved();
  };

  return (
    <Modal onClose={() => !busy && onClose()}>
      <h3 className="font-display text-lg font-bold text-navy-deep mb-1">Edit recipient</h3>
      <p className="text-xs text-navy-light mb-4">{isDomestic ? "Domestic transfer" : "International wire"} · {tx.description}</p>
      {loading ? (
        <div className="py-10 text-center text-navy-light flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading transfer…</div>
      ) : isDomestic && dom ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <Field label="Recipient name" value={dom.recipient_name} onChange={(e) => setDom({ ...dom, recipient_name: e.target.value })} />
          <Field label="Bank name" value={dom.bank_name} onChange={(e) => setDom({ ...dom, bank_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Routing number" value={dom.routing_number} onChange={(e) => setDom({ ...dom, routing_number: e.target.value })} />
            <Field label="Account number" value={dom.account_number} onChange={(e) => setDom({ ...dom, account_number: e.target.value })} />
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-navy-light font-semibold">Account type</span>
            <select value={dom.account_type} onChange={(e) => setDom({ ...dom, account_type: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-navy-deep">
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </label>
          <Field label="Memo" value={dom.memo ?? ""} onChange={(e) => setDom({ ...dom, memo: e.target.value })} />
        </div>
      ) : intl ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <Field label="Recipient name" value={intl.recipient_name} onChange={(e) => setIntl({ ...intl, recipient_name: e.target.value })} />
          <Field label="Recipient bank" value={intl.recipient_bank} onChange={(e) => setIntl({ ...intl, recipient_bank: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="SWIFT / BIC" value={intl.swift_bic} onChange={(e) => setIntl({ ...intl, swift_bic: e.target.value })} />
            <Field label="IBAN / account" value={intl.iban_or_account} onChange={(e) => setIntl({ ...intl, iban_or_account: e.target.value })} />
          </div>
          <Field label="Country" value={intl.recipient_country} onChange={(e) => setIntl({ ...intl, recipient_country: e.target.value })} />
          <Field label="Recipient address" value={intl.recipient_address ?? ""} onChange={(e) => setIntl({ ...intl, recipient_address: e.target.value })} />
          <Field label="Purpose" value={intl.purpose ?? ""} onChange={(e) => setIntl({ ...intl, purpose: e.target.value })} />
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
        <button onClick={isDomestic ? saveDom : saveIntl} disabled={busy || loading} className="h-10 px-4 rounded-md bg-indigo text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save recipient
        </button>
      </div>
    </Modal>
  );
}

function EditBankModal({ userId, bank, onClose, onSaved }: { userId: string; bank: AdminBank | null; onClose: () => void; onSaved: (b: AdminBank) => void }) {
  const [form, setForm] = useState<AdminBank>({
    user_id: userId,
    bank_name: bank?.bank_name ?? "",
    account_holder: bank?.account_holder ?? "",
    account_number: bank?.account_number ?? "",
    routing_number: bank?.routing_number ?? "",
    account_type: bank?.account_type ?? "",
    swift_bic: bank?.swift_bic ?? "",
    iban: bank?.iban ?? "",
    bank_address: bank?.bank_address ?? "",
    bank_country: bank?.bank_country ?? "",
    notes: bank?.notes ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const payload = { ...form, user_id: userId };
    const { data, error } = await supabase
      .from("admin_user_bank_details")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bank details saved (admin only)");
    onSaved(data as AdminBank);
  };

  const set = (k: keyof AdminBank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Modal onClose={() => !busy && onClose()}>
      <h3 className="font-display text-lg font-bold text-navy-deep mb-1 inline-flex items-center gap-2">
        <Lock className="h-4 w-4 text-amber-700" /> Bank details — admin only
      </h3>
      <p className="text-xs text-navy-light mb-3">These fields are stored privately and never shown to the user.</p>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <Field label="Bank name" value={form.bank_name ?? ""} onChange={set("bank_name")} />
        <Field label="Account holder" value={form.account_holder ?? ""} onChange={set("account_holder")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account number" value={form.account_number ?? ""} onChange={set("account_number")} />
          <Field label="Routing number" value={form.routing_number ?? ""} onChange={set("routing_number")} />
        </div>
        <Field label="Account type (checking / savings)" value={form.account_type ?? ""} onChange={set("account_type")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="SWIFT / BIC" value={form.swift_bic ?? ""} onChange={set("swift_bic")} />
          <Field label="IBAN" value={form.iban ?? ""} onChange={set("iban")} />
        </div>
        <Field label="Bank country" value={form.bank_country ?? ""} onChange={set("bank_country")} />
        <Field label="Bank address" value={form.bank_address ?? ""} onChange={set("bank_address")} />
        <Field label="Internal notes" value={form.notes ?? ""} onChange={set("notes")} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
        <button onClick={save} disabled={busy} className="h-10 px-4 rounded-md bg-indigo text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </div>
    </Modal>
  );
}