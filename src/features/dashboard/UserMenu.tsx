import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Settings, ShieldCheck, User as UserIcon, Camera, Loader2 } from "lucide-react";
import { signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  email: string;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  onAvatarUpdated: (url: string) => void;
}

export function UserMenu({ userId, email, fullName, initials, avatarUrl, isAdmin, onAvatarUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max file size: 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
      if (updErr) throw updErr;
      onAvatarUpdated(publicUrl);
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 hover:bg-ivory rounded-full pr-2 pl-1 py-1 transition" aria-label="User menu" aria-expanded={open}>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo text-white text-sm font-semibold overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
        </span>
        <ChevronDown className={`h-4 w-4 text-navy-light transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-border rounded-xl shadow-elevated overflow-hidden z-50">
          <div className="p-4 border-b border-border bg-ivory/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo text-white font-semibold overflow-hidden">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                </span>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-indigo text-white border-2 border-white hover:bg-indigo-dark transition disabled:opacity-60"
                  aria-label="Upload photo"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-navy-deep truncate">{fullName}</div>
                <div className="text-xs text-navy-light truncate">{email}</div>
              </div>
            </div>
          </div>
          <div className="py-1">
            <Link to="/dashboard/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-deep hover:bg-ivory transition">
              <UserIcon className="h-4 w-4 text-navy-light" /> Profile
            </Link>
            <Link to="/dashboard/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-deep hover:bg-ivory transition">
              <Settings className="h-4 w-4 text-navy-light" /> Account settings
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold-500 hover:bg-ivory transition font-semibold">
                <ShieldCheck className="h-4 w-4" /> Admin Console
              </Link>
            )}
          </div>
          <div className="border-t border-border py-1">
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}