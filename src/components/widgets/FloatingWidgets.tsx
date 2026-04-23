import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, X, Mail, Phone, Send } from "lucide-react";
import { BRAND } from "@/lib/constants";

export function FloatingWidgets() {
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Support request from ${name || "website visitor"}`);
    const body = encodeURIComponent(msg + (name ? `\n\n— ${name}` : ""));
    window.location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-24 left-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-navy-deep text-white shadow-lg hover:bg-navy transition"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Chat launcher */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-indigo text-white shadow-xl hover:bg-indigo-dark transition"
      >
        {chatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-24 left-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl bg-white border border-border shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-indigo to-navy-deep p-4 text-white">
            <div className="font-display text-base font-bold">Resolva Credix Support</div>
            <div className="text-xs opacity-90 mt-0.5">We typically reply within a few hours · {BRAND.hours.split("·")[0].trim()}</div>
          </div>
          <div className="p-4 space-y-3">
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-ivory transition">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo/10 text-indigo"><Mail className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="text-xs text-navy-light">Email us</div>
                <div className="text-sm font-semibold text-navy-deep truncate">{BRAND.email}</div>
              </div>
            </a>
            <a href={`tel:${BRAND.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-ivory transition">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo/10 text-indigo"><Phone className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="text-xs text-navy-light">Call us</div>
                <div className="text-sm font-semibold text-navy-deep">{BRAND.phone}</div>
              </div>
            </a>
            <form onSubmit={sendEmail} className="space-y-2 pt-2 border-t border-border">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full h-9 px-3 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo/30" />
              <textarea required value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="How can we help?" className="w-full px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo/30 resize-none" />
              <button type="submit" className="w-full h-9 rounded-md bg-indigo text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-indigo-dark transition">
                <Send className="h-3.5 w-3.5" /> Send message
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}