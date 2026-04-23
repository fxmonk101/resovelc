import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Clock, MapPinned, CheckCircle2, MessageSquare } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { contactSchema, type ContactInput } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Resolve Case" },
      { name: "description", content: "Get in touch with our support team. We're here 24/7." },
      { property: "og:title", content: "Contact Resolve Case" },
      { property: "og:description", content: "Reach out by form, phone, or email. We respond fast." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { subject: "General" },
  });

  const messageLen = watch("message")?.length ?? 0;

  const onSubmit = async (data: ContactInput) => {
    setError(null);
    const { error: e } = await supabase.from("contact_messages").insert({
      full_name: data.fullName,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
    if (e) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setDone(true);
    reset();
  };

  return (
    <PageShell>
      <section className="bg-slate-deep text-white py-20">
        <div className="container-page">
          <h1 className="font-display text-5xl md:text-6xl font-bold">Get in touch</h1>
          <p className="mt-4 text-white/70 max-w-xl">We typically respond within a few hours.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${BRAND.phone.replace(/[^0-9+]/g, "")}`}
              className="inline-flex items-center gap-2 bg-white text-slate-deep font-semibold px-5 py-2.5 rounded-lg hover:bg-white/90 transition"
            >
              <Phone className="h-4 w-4" /> Call {BRAND.phone}
            </a>
            <a
              href={`sms:${BRAND.phone.replace(/[^0-9+]/g, "")}?&body=${encodeURIComponent("Hi Resolva Credix, I need help with ")}`}
              className="inline-flex items-center gap-2 bg-terra hover:bg-terra-dark text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              <MessageSquare className="h-4 w-4" /> Text us
            </a>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 bg-white rounded-2xl p-8 shadow-card border border-border">
            {done ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
                <h3 className="font-display text-2xl font-bold mt-4 text-slate-deep">Message sent</h3>
                <p className="text-body mt-2">We'll get back to you shortly.</p>
                <button onClick={() => setDone(false)} className="mt-6 text-terra font-semibold hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <h2 className="font-display text-2xl font-bold text-slate-deep">Send us a message</h2>

                <div>
                  <label htmlFor="fullName" className="text-label text-slate-mid">Full name</label>
                  <input id="fullName" {...register("fullName")} className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition" />
                  {errors.fullName && <p role="alert" className="text-xs text-error mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="email" className="text-label text-slate-mid">Email</label>
                    <input id="email" type="email" {...register("email")} className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition" />
                    {errors.email && <p role="alert" className="text-xs text-error mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="subject" className="text-label text-slate-mid">Subject</label>
                    <select id="subject" {...register("subject")} className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition">
                      <option>General</option>
                      <option>Account</option>
                      <option>Support</option>
                      <option>Complaint</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="text-label text-slate-mid">Message</label>
                  <textarea id="message" rows={6} {...register("message")} className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition resize-none" />
                  <div className="flex justify-between mt-1">
                    {errors.message ? <p role="alert" className="text-xs text-error">{errors.message.message}</p> : <span />}
                    <span className="text-xs text-slate-light">{messageLen}/2000</span>
                  </div>
                </div>

                {error && <p role="alert" className="text-sm text-error">{error}</p>}

                <button disabled={isSubmitting} className="bg-terra hover:bg-terra-dark disabled:opacity-60 text-white font-semibold px-7 py-3 rounded-lg transition">
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: Mail, label: "Email", value: BRAND.email },
              { icon: Phone, label: "Phone", value: BRAND.phone, mono: true },
              { icon: Clock, label: "Hours", value: BRAND.hours },
              { icon: MapPin, label: "Address", value: BRAND.address },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-2xl p-5 border border-border flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-terra/10 text-terra">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-label text-slate-light">{c.label}</div>
                  <div className={`mt-1 text-slate-deep ${c.mono ? "font-mono" : ""}`}>{c.value}</div>
                </div>
              </div>
            ))}
            <div className="bg-slate-deep rounded-2xl p-8 text-center text-white/80">
              <MapPinned className="h-10 w-10 text-terra mx-auto" />
              <p className="mt-3 text-sm">Interactive map coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
