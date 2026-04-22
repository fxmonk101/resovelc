import { useEffect, useState } from "react";
import { ShieldCheck, ChevronRight, X, Upload, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

interface Kyc {
  status: string;
  full_legal_name: string;
}

export function KycCard() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("kyc_submissions").select("status,full_legal_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { setKyc(data as Kyc | null); setLoaded(true); });
  }, [user]);

  if (!loaded) return null;

  const status = kyc?.status;
  const isApproved = status === "approved";
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  return (
    <>
      <div className={`rounded-2xl border p-5 ${
        isApproved ? "bg-success/5 border-success/30" :
        isPending ? "bg-warning/5 border-warning/30" :
        isRejected ? "bg-destructive/5 border-destructive/30" :
        "bg-indigo/5 border-indigo/30"
      }`}>
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-lg ${
            isApproved ? "bg-success/15 text-success" :
            isPending ? "bg-warning/15 text-warning" :
            isRejected ? "bg-destructive/15 text-destructive" :
            "bg-indigo/15 text-indigo"
          }`}>
            {isApproved ? <CheckCircle2 className="h-5 w-5" /> :
             isPending ? <Clock className="h-5 w-5" /> :
             isRejected ? <AlertCircle className="h-5 w-5" /> :
             <ShieldCheck className="h-5 w-5" />}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-navy-deep">
              {isApproved ? "Identity verified" :
               isPending ? "Verification under review" :
               isRejected ? "Verification needs attention" :
               "Verify your identity (KYC)"}
            </h3>
            <p className="text-sm text-navy-light mt-1">
              {isApproved ? "You have full access to all banking features." :
               isPending ? "We're reviewing your documents. Decisions usually take 1–2 business days." :
               isRejected ? "Please re-submit your verification with clearer documents." :
               "Federal regulations require us to verify your identity to unlock transfers, debit cards, and lending."}
            </p>
            {!isApproved && (
              <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo hover:text-indigo-dark">
                {isPending ? "View submission" : isRejected ? "Re-submit" : "Start verification"} <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {open && <KycModal onClose={() => setOpen(false)} onDone={(s) => setKyc(s)} />}
    </>
  );
}

function KycModal({ onClose, onDone }: { onClose: () => void; onDone: (k: Kyc) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({
    full_legal_name: "", date_of_birth: "", ssn_last4: "",
    address_line: "", city: "", state: "", zip: "",
  });
  const [docType, setDocType] = useState<"national_id" | "drivers_license" | "passport">("drivers_license");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [passportPage, setPassportPage] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const upload = async (file: File, kind: string) => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user!.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true); setErr(""); setOk("");
    try {
      if (!/^\d{4}$/.test(form.ssn_last4)) throw new Error("SSN last 4 must be 4 digits");
      if (docType === "passport") {
        if (!passportPage) throw new Error("Please upload your passport information page");
      } else {
        if (!idFront) throw new Error("Please upload the front of your ID");
        if (!idBack) throw new Error("Please upload the back of your ID");
      }
      if (!selfie) throw new Error("Please upload a selfie holding your ID");

      const id_document_url = idFront ? await upload(idFront, "id-front") : null;
      const id_back_url = idBack ? await upload(idBack, "id-back") : null;
      const passport_info_url = passportPage ? await upload(passportPage, "passport") : null;
      const selfie_url = await upload(selfie!, "selfie");
      const { error } = await supabase.from("kyc_submissions").upsert({
        user_id: user.id, ...form, document_type: docType,
        id_document_url, id_back_url, passport_info_url, selfie_url, status: "pending",
      }, { onConflict: "user_id" });
      if (error) throw error;
      setOk("Submitted. We'll review within 1–2 business days.");
      onDone({ status: "pending", full_legal_name: form.full_legal_name });
      setTimeout(onClose, 1600);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 overflow-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-deep">Identity verification (KYC)</h2>
            <p className="text-sm text-navy-light mt-1">Required by U.S. federal banking regulations. Information is encrypted.</p>
          </div>
          <button onClick={onClose} className="text-navy-light hover:text-navy-deep"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Full legal name</label><input required value={form.full_legal_name} onChange={(e) => setForm({ ...form, full_legal_name: e.target.value })} className={`${cls} mt-1.5`} maxLength={120} /></div>
            <div><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Date of birth</label><input required type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={`${cls} mt-1.5`} /></div>
            <div><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">SSN (last 4)</label><input required value={form.ssn_last4} onChange={(e) => setForm({ ...form, ssn_last4: e.target.value })} className={`${cls} mt-1.5`} maxLength={4} pattern="\d{4}" placeholder="••••" /></div>
            <div className="sm:col-span-2"><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Street address</label><input required value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} className={`${cls} mt-1.5`} maxLength={200} /></div>
            <div><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">City</label><input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`${cls} mt-1.5`} maxLength={80} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">State</label><input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={`${cls} mt-1.5`} maxLength={2} placeholder="NY" /></div>
              <div><label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">ZIP</label><input required value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={`${cls} mt-1.5`} maxLength={10} /></div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Document type</span>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {([
                { v: "national_id", label: "National ID" },
                { v: "drivers_license", label: "Driver's license" },
                { v: "passport", label: "Passport" },
              ] as const).map((opt) => (
                <button key={opt.v} type="button" onClick={() => setDocType(opt.v)}
                  className={`h-10 rounded-lg border text-xs font-semibold transition ${docType === opt.v ? "bg-indigo text-white border-indigo" : "border-border text-navy hover:border-indigo"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {docType === "passport" ? (
              <FileInput label="Passport information page" file={passportPage} onChange={setPassportPage} />
            ) : (
              <>
                <FileInput label={`${docType === "national_id" ? "National ID" : "Driver's license"} — front`} file={idFront} onChange={setIdFront} />
                <FileInput label={`${docType === "national_id" ? "National ID" : "Driver's license"} — back`} file={idBack} onChange={setIdBack} />
              </>
            )}
            <FileInput label="Selfie holding your document" file={selfie} onChange={setSelfie} />
          </div>

          {err && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{err}</div>}
          {ok && <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{ok}</div>}

          <button disabled={busy} className="w-full bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit for verification
          </button>
        </form>
      </div>
    </div>
  );
}

function FileInput({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy-deep uppercase tracking-wide">{label}</span>
      <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-indigo cursor-pointer transition">
        <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        <Upload className="h-5 w-5 mx-auto text-navy-light" />
        <div className="text-xs text-navy-deep mt-1.5 font-semibold truncate">{file?.name ?? "Click to upload"}</div>
        <div className="text-[10px] text-navy-light mt-0.5">JPG, PNG or PDF · max 10MB</div>
      </div>
    </label>
  );
}