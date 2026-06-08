import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Loader2, Send, Globe2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/transfers")({
  head: () => ({ meta: [{ title: "Pending transfers — Admin" }] }),
  component: AdminTransfers,
});

type DomesticRow = {
  id: string; user_id: string; reference: string; recipient_name: string;
  bank_name: string; routing_number: string; account_number: string;
  account_type: string; amount: number; memo: string | null; status: string;
  created_at: string; user_email?: string; user_name?: string;
};

type IntlRow = {
  id: string; user_id: string; reference: string; recipient_name: string;
  recipient_bank: string; swift_bic: string; iban_or_account: string;
  recipient_country: string; recipient_address: string | null; currency: string;
  amount: number; fee: number; purpose: string | null; status: string;
  created_at: string; user_email?: string; user_name?: string;
};

function AdminTransfers() {
  const [domestic, setDomestic] = useState<DomesticRow[]>([]);
  const [intl, setIntl] = useState<IntlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"domestic" | "international">("domestic");
  const [editDom, setEditDom] = useState<DomesticRow | null>(null);
  const [editIntl, setEditIntl] = useState<IntlRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: dom }, { data: ints }, { data: users }] = await Promise.all([
      supabase.from("domestic_transfers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("international_transfers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_users"),
    ]);
    const map = new Map<string, { email: string; name: string }>();
    for (const u of (users ?? []) as Array<{ user_id: string; email: string; first_name: string; last_name: string }>) {
      map.set(u.user_id, { email: u.email, name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() });
    }
    setDomestic(((dom ?? []) as DomesticRow[]).map((r) => ({ ...r, user_email: map.get(r.user_id)?.email, user_name: map.get(r.user_id)?.name })));
    setIntl(((ints ?? []) as IntlRow[]).map((r) => ({ ...r, user_email: map.get(r.user_id)?.email, user_name: map.get(r.user_id)?.name })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filterFn = (s: string) => (vals: (string | null | undefined)[]) =>
    !s || vals.filter(Boolean).some((v) => String(v).toLowerCase().includes(s.toLowerCase()));

  const domFiltered = useMemo(
    () => domestic.filter((r) => filterFn(q)([r.recipient_name, r.bank_name, r.account_number, r.reference, r.user_email, r.user_name])),
    [domestic, q]
  );
  const intlFiltered = useMemo(
    () => intl.filter((r) => filterFn(q)([r.recipient_name, r.recipient_bank, r.iban_or_account, r.swift_bic, r.reference, r.user_email, r.user_name])),
    [intl, q]
  );

  const saveDomestic = async () => {
    if (!editDom) return;
    if (!/^[0-9]{9}$/.test(editDom.routing_number)) return toast.error("Routing number must be 9 digits");
    if (!/^[0-9]{5,20}$/.test(editDom.account_number)) return toast.error("Account number must be 5–20 digits");
    if (!["checking", "savings"].includes(editDom.account_type)) return toast.error("Account type must be checking or savings");
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_pending_transfer_edits", {
      _kind: "domestic",
      _id: editDom.id,
      _edits: {
        recipient_name: editDom.recipient_name,
        bank_name: editDom.bank_name,
        routing_number: editDom.routing_number,
        account_number: editDom.account_number,
        account_type: editDom.account_type,
        memo: editDom.memo,
      },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved. Applies to client when you mark transfer completed/failed.");
    setEditDom(null);
    load();
  };

  const saveIntl = async () => {
    if (!editIntl) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_pending_transfer_edits", {
      _kind: "international",
      _id: editIntl.id,
      _edits: {
        recipient_name: editIntl.recipient_name,
        recipient_bank: editIntl.recipient_bank,
        swift_bic: editIntl.swift_bic,
        iban_or_account: editIntl.iban_or_account,
        recipient_country: editIntl.recipient_country,
        recipient_address: editIntl.recipient_address,
        purpose: editIntl.purpose,
      },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved. Applies to client when you mark transfer completed/failed.");
    setEditIntl(null);
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-deep">Pending transfers</h2>
          <p className="text-sm text-navy-light mt-1">Edit the recipient account before approving.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipient, bank, account, user…"
            className="pl-9 pr-3 h-10 w-80 rounded-md border border-border bg-white text-sm" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button onClick={() => setTab("domestic")} className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 border-b-2 ${tab === "domestic" ? "border-indigo text-navy-deep" : "border-transparent text-navy-light"}`}>
          <Send className="h-4 w-4" /> Domestic ({domestic.length})
        </button>
        <button onClick={() => setTab("international")} className={`px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 border-b-2 ${tab === "international" ? "border-indigo text-navy-deep" : "border-transparent text-navy-light"}`}>
          <Globe2 className="h-4 w-4" /> International ({intl.length})
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-navy-light flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : tab === "domestic" ? (
        <div className="rounded-xl border border-border bg-white divide-y divide-border">
          {domFiltered.length === 0 ? (
            <div className="p-10 text-center text-navy-light">No pending domestic transfers.</div>
          ) : domFiltered.map((t) => (
            <div key={t.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy-deep">{t.recipient_name} · {t.bank_name}</div>
                <div className="text-xs text-navy-light mt-0.5 font-mono">RT {t.routing_number} · AC {t.account_number} · {t.account_type}</div>
                <div className="text-xs text-navy-light mt-0.5">From {t.user_name || t.user_email} · #{t.reference} · {new Date(t.created_at).toLocaleString()}</div>
              </div>
              <div className="text-base font-bold text-navy-deep shrink-0">${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <button onClick={() => setEditDom(t)} className="h-9 px-3 rounded-md bg-indigo text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-indigo/90">
                <Pencil className="h-3.5 w-3.5" /> Edit recipient
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white divide-y divide-border">
          {intlFiltered.length === 0 ? (
            <div className="p-10 text-center text-navy-light">No pending international transfers.</div>
          ) : intlFiltered.map((t) => (
            <div key={t.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy-deep">{t.recipient_name} · {t.recipient_bank} ({t.recipient_country})</div>
                <div className="text-xs text-navy-light mt-0.5 font-mono">SWIFT {t.swift_bic} · {t.iban_or_account}</div>
                <div className="text-xs text-navy-light mt-0.5">From {t.user_name || t.user_email} · #{t.reference} · {new Date(t.created_at).toLocaleString()}</div>
              </div>
              <div className="text-base font-bold text-navy-deep shrink-0">{t.currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <button onClick={() => setEditIntl(t)} className="h-9 px-3 rounded-md bg-indigo text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-indigo/90">
                <Pencil className="h-3.5 w-3.5" /> Edit recipient
              </button>
            </div>
          ))}
        </div>
      )}

      {editDom && (
        <Modal onClose={() => !saving && setEditDom(null)} title={`Edit domestic transfer · #${editDom.reference}`}>
          <Field label="Recipient name" value={editDom.recipient_name} onChange={(v) => setEditDom({ ...editDom, recipient_name: v })} />
          <Field label="Bank name" value={editDom.bank_name} onChange={(v) => setEditDom({ ...editDom, bank_name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Routing number (9 digits)" value={editDom.routing_number} onChange={(v) => setEditDom({ ...editDom, routing_number: v })} />
            <Field label="Account number" value={editDom.account_number} onChange={(v) => setEditDom({ ...editDom, account_number: v })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-deep uppercase mb-1">Account type</label>
            <select value={editDom.account_type} onChange={(e) => setEditDom({ ...editDom, account_type: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm">
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <Field label="Memo" value={editDom.memo ?? ""} onChange={(v) => setEditDom({ ...editDom, memo: v })} />
          <ModalActions onCancel={() => setEditDom(null)} onSave={saveDomestic} saving={saving} />
        </Modal>
      )}

      {editIntl && (
        <Modal onClose={() => !saving && setEditIntl(null)} title={`Edit international transfer · #${editIntl.reference}`}>
          <Field label="Recipient name" value={editIntl.recipient_name} onChange={(v) => setEditIntl({ ...editIntl, recipient_name: v })} />
          <Field label="Recipient bank" value={editIntl.recipient_bank} onChange={(v) => setEditIntl({ ...editIntl, recipient_bank: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="SWIFT / BIC" value={editIntl.swift_bic} onChange={(v) => setEditIntl({ ...editIntl, swift_bic: v })} />
            <Field label="IBAN / account" value={editIntl.iban_or_account} onChange={(v) => setEditIntl({ ...editIntl, iban_or_account: v })} />
          </div>
          <Field label="Country" value={editIntl.recipient_country} onChange={(v) => setEditIntl({ ...editIntl, recipient_country: v })} />
          <Field label="Recipient address" value={editIntl.recipient_address ?? ""} onChange={(v) => setEditIntl({ ...editIntl, recipient_address: v })} />
          <Field label="Purpose" value={editIntl.purpose ?? ""} onChange={(v) => setEditIntl({ ...editIntl, purpose: v })} />
          <ModalActions onCancel={() => setEditIntl(null)} onSave={saveIntl} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-deep">{title}</h3>
          <button onClick={onClose} className="text-navy-light hover:text-navy-deep"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy-deep uppercase mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm" />
    </div>
  );
}

function ModalActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onCancel} disabled={saving} className="h-10 px-4 rounded-md border border-border text-sm font-semibold text-navy-deep">Cancel</button>
      <button onClick={onSave} disabled={saving} className="h-10 px-4 rounded-md bg-indigo text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
      </button>
    </div>
  );
}