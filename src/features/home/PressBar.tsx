const PRESS = ["Forbes", "Bloomberg", "Wall Street Journal", "Reuters", "CNBC", "TechCrunch"];

export function PressBar() {
  return (
    <section className="bg-muted py-12 border-y border-border">
      <div className="container-page text-center">
        <p className="text-label text-muted-foreground mb-6">As featured in</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {PRESS.map((p) => (
            <span key={p} className="font-display text-xl md:text-2xl font-bold text-muted-foreground/60 hover:text-foreground transition">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
