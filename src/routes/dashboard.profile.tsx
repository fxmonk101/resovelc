import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mail, ShieldCheck, Camera, Loader2, Save, Pencil, X, Lock, Bell, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

interface Profile {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  username: string;
  phone: string | null;
  country: string | null;
  currency: string;
  account_type: string;
  account_number: string;
  is_verified: boolean;
  avatar_url: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notification_preferences: { transactions?: boolean; account?: boolean; kyc?: boolean } | null;
}

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data as Profile | null);
  };

  useEffect(() => { refresh(); }, [user]);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      if (updErr) throw updErr;
      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!profile) return <div className="p-8 text-navy-light">Loading…</div>;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-indigo text-white text-xl font-semibold overflow-hidden">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              : <>{profile.first_name[0]}{profile.last_name[0]}</>}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-indigo text-white border-2 border-white hover:bg-indigo-dark transition disabled:opacity-60"
            aria-label="Change profile picture"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-deep">{profile.first_name} {profile.last_name}</h1>
          <p className="text-body text-sm">@{profile.username}</p>
        </div>
        {profile.is_verified ? (
          <span className="ml-auto text-xs bg-success/10 text-success px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        ) : (
          <span className="ml-auto text-xs bg-warning/10 text-warning px-3 py-1.5 rounded-full font-semibold">Pending verification</span>
        )}
      </div>

      <PersonalInfoCard profile={profile} userEmail={user?.email ?? ""} userId={user!.id} onSaved={refresh} />

      <AddressCard profile={profile} userId={user!.id} onSaved={refresh} />

      <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display text-lg font-bold text-navy-deep">Banking</h2>
        <Row label="Account type" value={profile.account_type} />
        <Row label="Account number" value={profile.account_number} mono />
        <Row label="Currency" value={profile.currency} />
      </div>

      <NotificationPrefsCard profile={profile} userId={user!.id} onSaved={refresh} />

      <PasswordChangeCard />
    </div>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-navy-light" />}
      <div className="text-sm text-navy-light w-32">{label}</div>
      <div className={`text-sm font-semibold text-navy-deep ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 disabled:bg-ivory disabled:text-navy-light";

function PersonalInfoCard({ profile, userEmail, userId, onSaved }: { profile: Profile; userEmail: string; userId: string; onSaved: () => void }) {
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    first_name: profile.first_name,
    middle_name: profile.middle_name ?? "",
    last_name: profile.last_name,
    phone: profile.phone ?? "",
    country: profile.country ?? "",
  });

  const cancel = () => {
    setForm({
      first_name: profile.first_name,
      middle_name: profile.middle_name ?? "",
      last_name: profile.last_name,
      phone: profile.phone ?? "",
      country: profile.country ?? "",
    });
    setEdit(false);
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      first_name: form.first_name.trim().slice(0, 80),
      middle_name: form.middle_name.trim().slice(0, 80) || null,
      last_name: form.last_name.trim().slice(0, 80),
      phone: form.phone.trim().slice(0, 30) || null,
      country: form.country.trim().slice(0, 80) || null,
    }).eq("user_id", userId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    setEdit(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy-deep">Personal information</h2>
        {!edit ? (
          <button onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 text-sm text-indigo font-semibold hover:underline">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : (
          <button onClick={cancel} className="inline-flex items-center gap-1.5 text-sm text-navy-light hover:text-navy-deep">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} disabled={!edit} maxLength={80} />
        <FormField label="Middle name" value={form.middle_name} onChange={(v) => setForm({ ...form, middle_name: v })} disabled={!edit} maxLength={80} />
        <FormField label="Last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} disabled={!edit} maxLength={80} />
        <FormField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} disabled={!edit} maxLength={30} placeholder="+1 555 555 1234" />
        <FormField label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} disabled={!edit} maxLength={80} />
        <div>
          <label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Email</label>
          <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-navy-deep px-3.5 py-2.5 rounded-lg bg-ivory border border-border">
            <Mail className="h-4 w-4 text-navy-light" /> {userEmail}
          </div>
        </div>
      </div>
      {edit && (
        <button onClick={save} disabled={busy} className="bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 px-5 rounded-lg transition flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      )}
    </div>
  );
}

function AddressCard({ profile, userId, onSaved }: { profile: Profile; userId: string; onSaved: () => void }) {
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    address_line: profile.address_line ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    zip: profile.zip ?? "",
  });

  const cancel = () => {
    setForm({
      address_line: profile.address_line ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      zip: profile.zip ?? "",
    });
    setEdit(false);
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      address_line: form.address_line.trim().slice(0, 200) || null,
      city: form.city.trim().slice(0, 80) || null,
      state: form.state.trim().slice(0, 40) || null,
      zip: form.zip.trim().slice(0, 20) || null,
    }).eq("user_id", userId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Address updated");
    setEdit(false);
    onSaved();
  };

  const hasAddress = profile.address_line || profile.city;

  return (
    <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy-deep flex items-center gap-2">
          <MapPin className="h-4 w-4 text-indigo" /> Mailing address
        </h2>
        {!edit ? (
          <button onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 text-sm text-indigo font-semibold hover:underline">
            <Pencil className="h-3.5 w-3.5" /> {hasAddress ? "Edit" : "Add address"}
          </button>
        ) : (
          <button onClick={cancel} className="inline-flex items-center gap-1.5 text-sm text-navy-light hover:text-navy-deep">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Street address" value={form.address_line} onChange={(v) => setForm({ ...form, address_line: v })} disabled={!edit} maxLength={200} />
        </div>
        <FormField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} disabled={!edit} maxLength={80} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} disabled={!edit} maxLength={40} />
          <FormField label="ZIP" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} disabled={!edit} maxLength={20} />
        </div>
      </div>
      {edit && (
        <button onClick={save} disabled={busy} className="bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 px-5 rounded-lg transition flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save address
        </button>
      )}
    </div>
  );
}

function NotificationPrefsCard({ profile, userId, onSaved }: { profile: Profile; userId: string; onSaved: () => void }) {
  const initial = profile.notification_preferences ?? { transactions: true, account: true, kyc: true };
  const [prefs, setPrefs] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async (key: "transactions" | "account" | "kyc") => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ notification_preferences: next }).eq("user_id", userId);
    setBusy(false);
    if (error) { toast.error(error.message); setPrefs(prefs); return; }
    onSaved();
  };

  const items: { key: "transactions" | "account" | "kyc"; label: string; desc: string }[] = [
    { key: "transactions", label: "Transaction alerts", desc: "Deposits, transfers, card charges" },
    { key: "account", label: "Account updates", desc: "Balance changes, statements, security" },
    { key: "kyc", label: "Verification updates", desc: "KYC status and document requests" },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
      <h2 className="font-display text-lg font-bold text-navy-deep flex items-center gap-2">
        <Bell className="h-4 w-4 text-indigo" /> Notification preferences
      </h2>
      <div className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-semibold text-navy-deep">{it.label}</div>
              <div className="text-xs text-navy-light">{it.desc}</div>
            </div>
            <button
              onClick={() => toggle(it.key)}
              disabled={busy}
              role="switch"
              aria-checked={!!prefs[it.key]}
              className={`relative h-6 w-11 rounded-full transition ${prefs[it.key] ? "bg-indigo" : "bg-border"} disabled:opacity-60`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[it.key] ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordChangeCard() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (pw !== confirm) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    setPw(""); setConfirm("");
  };

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
      <h2 className="font-display text-lg font-bold text-navy-deep flex items-center gap-2">
        <Lock className="h-4 w-4 text-indigo" /> Change password
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">New password</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} className={`${inputCls} mt-1.5`} autoComplete="new-password" />
        </div>
        <div>
          <label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} className={`${inputCls} mt-1.5`} autoComplete="new-password" />
        </div>
      </div>
      <button type="submit" disabled={busy || !pw || !confirm} className="bg-indigo hover:bg-indigo-dark text-white font-semibold py-2.5 px-5 rounded-lg transition flex items-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Update password
      </button>
    </form>
  );
}

function FormField({ label, value, onChange, disabled, maxLength, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; maxLength?: number; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-navy-deep uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`${inputCls} mt-1.5`}
      />
    </div>
  );
}
