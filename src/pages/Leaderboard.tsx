import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Info } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Panel, EmptyState, StatTile } from "@/components/edura/tiles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Period = "all" | "month" | "week";

interface Row {
  rank: number;
  user_id: string;
  display_name: string;
  avg_score: number;
  tests: number;
  is_me: boolean;
}

interface MyRank {
  rank: number;
  total: number;
  avg_score: number;
  tests: number;
  qualified: boolean;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "month", label: "This month" },
  { value: "week", label: "This week" },
];

const medalClass = (rank: number) => {
  if (rank === 1) return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (rank === 2) return "bg-slate-400/15 text-slate-500 border-slate-400/30";
  if (rank === 3) return "bg-orange-600/15 text-orange-700 border-orange-600/30";
  return "bg-muted text-muted-foreground border-transparent";
};

const Leaderboard = () => {
  const [period, setPeriod] = useState<Period>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [boardRes, meRes] = await Promise.all([
        supabase.rpc("get_leaderboard" as never, { p_period: period, p_limit: 50 } as never),
        supabase.rpc("get_my_leaderboard_rank" as never, { p_period: period } as never),
      ]);
      if (!active) return;
      setRows(((boardRes.data as unknown as Row[]) || []).map((r) => ({ ...r, rank: Number(r.rank) })));
      const mine = (meRes.data as unknown as MyRank[])?.[0] ?? null;
      setMe(mine ? { ...mine, rank: Number(mine.rank), total: Number(mine.total) } : null);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [period]);

  const myRowVisible = useMemo(() => rows.some((r) => r.is_me), [rows]);

  const toNext = useMemo(() => {
    if (!me?.qualified) return null;
    const ahead = rows.find((r) => r.rank === me.rank - 1);
    if (!ahead) return null;
    return Math.max(0, Number((ahead.avg_score - me.avg_score).toFixed(1)));
  }, [me, rows]);

  return (
    <AppShell side="cbt" title="Leaderboard" subtitle="How you rank against students nationwide">
      <div className="space-y-4">
        {/* Your standing */}
        <Panel title="Your standing">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  label="Rank"
                  value={me?.qualified ? `#${me.rank.toLocaleString()}` : "—"}
                  hint={me?.total ? `of ${me.total.toLocaleString()} ranked` : "Not ranked yet"}
                />
                <StatTile label="Average" value={`${me?.avg_score ?? 0}%`} hint="Across graded tests" />
                <StatTile label="Tests" value={me?.tests ?? 0} hint="In this period" />
                <StatTile
                  label="To next rank"
                  value={toNext !== null ? `${toNext}%` : me?.qualified ? "Top spot" : "—"}
                  hint={toNext !== null ? "Points to climb" : "Keep practising"}
                />
              </div>
              {!me?.qualified && (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Complete one graded test in this period to enter the ranking.
                </p>
              )}
            </>
          )}
        </Panel>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                period === p.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted/50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Top performers */}
        <Panel title="Top performers">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState>No ranked students yet. Take your first tests to enter the ranking.</EmptyState>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.user_id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3",
                    row.is_me && "border-primary bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                      medalClass(row.rank)
                    )}
                  >
                    {row.rank <= 3 ? <Medal className="h-4 w-4" /> : row.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {row.is_me ? "You" : row.display_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{row.tests} tests</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{row.avg_score}%</p>
                </div>
              ))}

              {/* Pin the user's own row when outside the visible top */}
              {me?.qualified && !myRowVisible && (
                <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary/5 px-3.5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-bold">
                    {me.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">You</p>
                    <p className="text-[11px] text-muted-foreground">{me.tests} tests</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{me.avg_score}%</p>
                </div>
              )}
            </div>
          )}
          <p className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
            <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Ranked by average score across graded tests. Only a first name and last initial are shown.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
};

export default Leaderboard;
