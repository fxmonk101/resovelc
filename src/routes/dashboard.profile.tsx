import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, Globe, ShieldCheck, Camera, Loader2 } from "lucide-react";
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
}

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

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

      <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display text-lg font-bold text-navy-deep">Account information</h2>
        <Row icon={User} label="Full name" value={`${profile.first_name} ${profile.middle_name ?? ""} ${profile.last_name}`.trim()} />
        <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
        <Row icon={Phone} label="Phone" value={profile.phone ?? "—"} />
        <Row icon={Globe} label="Country" value={profile.country ?? "—"} />
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display text-lg font-bold text-navy-deep">Banking</h2>
        <Row label="Account type" value={profile.account_type} />
        <Row label="Account number" value={profile.account_number} mono />
        <Row label="Currency" value={profile.currency} />
      </div>
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
