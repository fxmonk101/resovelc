import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Amara Johnson", role: "Small Business Owner", quote: "The fund recovery team helped me reclaim a wire I thought was gone for good. Worth every minute.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200" },
  { name: "Daniel Park", role: "Software Engineer", quote: "Finally a bank where the savings rate isn't an insult. The app is clean, fast, and actually useful.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
  { name: "Lina Okafor", role: "Freelance Designer", quote: "Opened my account in five minutes. Customer support actually answers. I'm not going back.", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200" },
];

export function TestimonialsSection() {
  return (
    <section className="bg-slate-deep text-white py-24 relative overflow-hidden">
      <Quote className="absolute top-12 left-8 h-32 w-32 text-terra/10" strokeWidth={1} />
      <div className="container-page relative">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-label text-terra-light">Members speak</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
            Trusted by people like you
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-7">
              <div className="flex gap-0.5 text-amber-sand">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-white/85 leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" width={44} height={44} />
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-white/60">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
