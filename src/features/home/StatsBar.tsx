import { useCountUp } from "@/hooks/useCountUp";

type StatProps = {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
};

function Stat({ target, prefix = "", suffix = "", label, decimals = 0 }: StatProps) {
  const { ref, value } = useCountUp(target, 1600, decimals);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div className="text-center">
      <div ref={ref} className="font-display text-4xl md:text-5xl font-bold text-foreground">
        {prefix}
        {formatted}
        {suffix}
      </div>
      <div className="text-label text-muted-foreground mt-2">{label}</div>
    </div>
  );
}

export function StatsBar() {
  return (
    <section className="bg-background py-16 border-y border-border">
      <div className="container-page grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-4 md:divide-x md:divide-border">
        <Stat target={50247} suffix="+" label="Members" />
        <Stat target={2.5} prefix="$" suffix="B+" decimals={1} label="Assets" />
        <div className="text-center">
          <div className="font-mono text-3xl md:text-4xl font-medium text-foreground">251480576</div>
          <div className="text-label text-muted-foreground mt-2">Routing #</div>
        </div>
        <Stat target={24} suffix="/7" label="Support" />
      </div>
    </section>
  );
}
