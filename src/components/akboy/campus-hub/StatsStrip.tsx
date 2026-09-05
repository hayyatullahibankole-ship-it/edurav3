interface Stat {
  value: string;
  label: string;
}

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-y border-akboy-line bg-akboy-mist">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-px overflow-hidden px-5 py-6 sm:px-8 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-2 py-3 text-center md:border-l md:border-akboy-line md:first:border-l-0">
            <p className="font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-semibold leading-none text-akboy-forest">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-akboy-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
