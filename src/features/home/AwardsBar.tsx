import { Award, Star, TrendingUp, ShieldCheck } from "lucide-react";

const AWARDS = [
  { icon: Award, title: "Forbes 2019", desc: "Best Banks in America" },
  { icon: Star, title: "J.D. Power", desc: "#1 in Customer Satisfaction" },
  { icon: TrendingUp, title: "Bankrate", desc: "Best High-Yield Savings" },
  { icon: ShieldCheck, title: "BBB", desc: "A+ Accredited Business" },
];

export function AwardsBar() {
  return (
    <section className="bg-card border-y border-border py-10">
      <div className="container-page">
        <p className="text-center text-label text-muted-foreground mb-6">Recognized by industry leaders</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {AWARDS.map((a) => (
            <div key={a.title} className="flex items-center gap-3 justify-center text-center md:text-left">
              <a.icon className="h-8 w-8 text-terra shrink-0" />
              <div>
                <div className="font-display font-bold text-foreground text-sm">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
