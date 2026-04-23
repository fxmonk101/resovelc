import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

interface Notif {
  id: string;
  title: string;
  body: string;
  category: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const removeNotif = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = items;
    setItems((cur) => cur.filter((n) => n.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) setItems(prev);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full hover:bg-ivory-dark text-navy-deep relative"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid place-items-center h-4 min-w-4 px-1 rounded-full bg-brand-red text-white text-[10px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-border rounded-xl shadow-elevated overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="font-display font-bold text-navy-deep">Notifications</div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-12 grid place-items-center text-navy-light"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-navy-light px-6">
                You're all caught up. Notifications about transactions, applications, and account activity will appear here.
              </div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`group relative border-b border-border/60 ${n.read ? "" : "bg-indigo/5"}`}>
                  <Link
                    to={(n.link as "/dashboard") ?? "/dashboard"}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className="block px-4 py-3 pr-10 hover:bg-ivory transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-block h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-brand-red"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-navy-deep text-sm">{n.title}</div>
                        <div className="text-xs text-navy-light mt-0.5 line-clamp-2">{n.body}</div>
                        <div className="text-[10px] text-navy-light mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-navy-light shrink-0 mt-1" />
                    </div>
                  </Link>
                  <button
                    onClick={(e) => removeNotif(e, n.id)}
                    className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-md text-navy-light hover:bg-destructive/10 hover:text-destructive transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-ivory/50 text-xs text-navy-light flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Real-time alerts powered by your account
            </div>
          )}
        </div>
      )}
    </div>
  );
}