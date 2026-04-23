import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kyc")({
  head: () => ({ meta: [{ title: "KYC Submissions — Admin" }] }),
  component: AdminKyc,
});

interface Submission {
  id: string;
  user_id: string;
  full_legal_name: string;
  date_of_birth: string;
  ssn_last4: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  document_type: string;
  id_document_url: string | null;
  id_back_url: string | null;
  passport_info_url: string | null;
  selfie_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

function AdminKyc() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Submission[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-deep">KYC Submissions</h1>
          <p className="text-sm text-navy-light mt-1">{rows.length} total · {pending} pending review</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-navy-light"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-navy-light">
            <ShieldCheck className="h-10 w-10 mx-auto opacity-40" />
            <p className="mt-3 text-sm">No KYC submissions yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory border-b border-border">
              <tr className="text-left text-xs uppercase text-navy-light">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Legal name</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ivory">
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 font-semibold text-navy-deep">{r.full_legal_name}</td>
                  <td className="px-4 py-3 capitalize text-navy-light">{r.document_type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-navy-light">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1.5 text-indigo font-semibold hover:underline">
                      <Eye className="h-4 w-4" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <ReviewModal sub={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load(); }} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    pending: { label: "Pending", cls: "bg-warning/10 text-warning", Icon: Clock },
    approved: { label: "Approved", cls: "bg-success/10 text-success", Icon: CheckCircle2 },
    rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive", Icon: XCircle },
  };
  const m = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      <m.Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

function ReviewModal({ sub, onClose, onDone }: { sub: Submission; onClose: () => void; onDone: () => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(sub.admin_notes ?? "");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    const sign = async () => {
      const fields: { key: string; path: string | null }[] = [
        { key: "id_document_url", path: sub.id_document_url },
        { key: "id_back_url", path: sub.id_back_url },
        { key: "passport_info_url", path: sub.passport_info_url },
        { key: "selfie_url", path: sub.selfie_url },
      ];
      const result: Record<string, string> = {};
      await Promise.all(fields.map(async ({ key, path }) => {
        if (!path) return;
        const { data } = await supabase.storage.from("kyc").createSignedUrl(path, 600);
        if (data?.signedUrl) result[key] = data.signedUrl;
      }));
      setUrls(result);
    };
    sign();
  }, [sub]);

  const decide = async (status: "approved" | "rejected") => {
    setBusy(status === "approved" ? "approve" : "reject");
    const { error } = await supabase
      .from("kyc_submissions")
      .update({ status, admin_notes: notes || null })
      .eq("id", sub.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Submission ${status}`);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 backdrop-blur-sm p-4 overflow-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-3xl my-8 mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-deep">{sub.full_legal_name}</h2>
            <p className="text-sm text-navy-light mt-1">Submitted {new Date(sub.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-navy-light hover:text-navy-deep"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Date of birth" value={sub.date_of_birth} />
            <Field label="SSN (last 4)" value={`••• ${sub.ssn_last4}`} />
            <Field label="Document type" value={sub.document_type.replace(/_/g, " ")} />
            <Field label="Status" value={sub.status} />
            <Field label="Address" value={`${sub.address_line}, ${sub.city}, ${sub.state} ${sub.zip}`} full />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-navy-deep uppercase tracking-wide mb-2">Documents</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(urls).map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noreferrer" className="block border border-border rounded-lg overflow-hidden hover:border-indigo transition">
                  <img src={url} alt={key} className="w-full h-48 object-cover bg-ivory" />
                  <div className="px-3 py-2 text-xs font-semibold text-navy-deep capitalize">{key.replace(/_url$/, "").replace(/_/g, " ")}</div>
                </a>
              ))}
            </div>
            {Object.keys(urls).length === 0 && <p className="text-sm text-navy-light">Loading documents…</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Admin notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Optional reason if rejecting…"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => decide("approved")}
              disabled={busy !== null || sub.status === "approved"}
              className="flex-1 bg-success hover:opacity-90 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
            </button>
            <button
              onClick={() => decide("rejected")}
              disabled={busy !== null || sub.status === "rejected"}
              className="flex-1 bg-destructive hover:opacity-90 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[11px] uppercase tracking-wide text-navy-light">{label}</div>
      <div className="font-semibold text-navy-deep mt-0.5 capitalize">{value}</div>
    </div>
  );
}