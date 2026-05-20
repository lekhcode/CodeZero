import { Alert } from "@mui/material";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SportsMartialArtsRoundedIcon from "@mui/icons-material/SportsMartialArtsRounded";
import { useQuery } from "@tanstack/react-query";
import { leaderboardService } from "@/services/leaderboard.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { LeaderboardEntry, LeaderboardResponse } from "@/types/api.types";
import { generateDefaultMonster } from "@/utils/monsterAvatar";
import { MonsterAvatar } from "./MonsterAvatar";
import "./leaderboard.css";

const MIN_USERS_FOR_PODIUM = 3;

function monsterUsername(entry: LeaderboardEntry): string {
  return entry.displayName || entry.avatarSeed || entry.userId;
}

function floatDelayForRank(rank: number): "lb-delay-0" | "lb-delay-1" | "lb-delay-2" | undefined {
  if (rank === 1) return "lb-delay-0";
  if (rank === 2) return "lb-delay-1";
  if (rank === 3) return "lb-delay-2";
  return undefined;
}

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const chipClass =
    entry.rank === 1 ? "lb-rank-chip--1" : entry.rank === 2 ? "lb-rank-chip--2" : "lb-rank-chip--3";
  const monsterSize = entry.rank === 1 ? 44 : 38;

  return (
    <>
      <span className={`lb-rank-chip ${chipClass}`}>
        {entry.rank === 1 && <span aria-hidden>👑</span>}
        #{entry.rank}
      </span>
      <div className={`lb-podium-card${entry.isCurrentUser ? " lb-podium-card--you" : ""}`}>
        <MonsterAvatar
          username={monsterUsername(entry)}
          size={monsterSize}
          floatDelayClass={floatDelayForRank(entry.rank)}
        />
        <p className="lb-podium-name" title={entry.displayName}>
          {entry.displayName}
        </p>
        {entry.isCurrentUser && <span className="lb-you-pill">YOU</span>}
        <p className="lb-podium-score">{entry.problemsSolved}</p>
        <p className="lb-podium-label">solved</p>
      </div>
    </>
  );
}

function Podium({ topThree }: { topThree: LeaderboardEntry[] }) {
  const byRank = new Map(topThree.map((e) => [e.rank, e]));
  const second = byRank.get(2);
  const first = byRank.get(1);
  const third = byRank.get(3);

  const slots: Array<{ entry: LeaderboardEntry; slotClass: string }> = [];
  if (second) slots.push({ entry: second, slotClass: "lb-podium-slot--second" });
  if (first) slots.push({ entry: first, slotClass: "lb-podium-slot--first" });
  if (third) slots.push({ entry: third, slotClass: "lb-podium-slot--third" });

  return (
    <div className="lb-podium">
      {slots.map(({ entry, slotClass }) => (
        <div key={entry.userId} className={`lb-podium-slot ${slotClass}`}>
          <PodiumCard entry={entry} />
        </div>
      ))}
        </div>
  );
}

function LeaderboardTable({ rows }: { rows: LeaderboardEntry[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Coder</th>
            <th>Solved</th>
            <th>AC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.userId} className={entry.isCurrentUser ? "lb-row--you" : undefined}>
              <td>
                <span
                  className={`lb-rank-num ${entry.rank <= 3 ? "lb-rank-num--top" : "lb-rank-num--rest"}`}
                >
                  {entry.rank}
                </span>
              </td>
              <td>
                <div className="lb-coder-cell">
                  <MonsterAvatar username={monsterUsername(entry)} size={24} />
                  <span
                    className={`lb-coder-name${entry.isCurrentUser ? " lb-coder-name--you" : ""}`}
                    title={entry.displayName}
                  >
                    {entry.displayName}
                    {entry.isCurrentUser && <span className="lb-you-pill lb-you-pill--inline">YOU</span>}
                  </span>
                </div>
              </td>
              <td>
                <span className="lb-stat">{entry.problemsSolved}</span>
              </td>
              <td>
                <span className="lb-stat lb-stat--muted">{entry.acceptedSubmissions}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
  );
}

function EmptyState() {
  return (
    <div className="lb-empty">
      <span
        className="lb-monster-host"
        style={{ width: 48, height: 48 }}
        dangerouslySetInnerHTML={{ __html: generateDefaultMonster(48) }}
      />
      <p>No coders yet. Solve a problem to join the ranks!</p>
        </div>
  );
}

function TableSkeleton() {
  return (
    <div className="lb-table-wrap">
      <div className="lb-skeleton-row" />
      <div className="lb-skeleton-row" />
      <div className="lb-skeleton-row" />
        </div>
  );
}

function rankFooterText(data: LeaderboardResponse): string {
  if (data.totalUsers === 1) return "Rank #1 · only participant";
  if (data.entries.some((e) => e.isCurrentUser)) {
    return `Your rank · #${data.currentUserRank} / ${data.totalUsers}`;
  }
  return `Your rank · #${data.currentUserRank} / ${data.totalUsers} (outside top ${data.entries.length})`;
}

export function DashboardLeaderboard() {
  const query = useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: leaderboardService.getLeaderboard,
    staleTime: 60_000,
  });

  const data = query.data;
  const entryCount = data?.entries.length ?? 0;
  const showPodium = entryCount >= MIN_USERS_FOR_PODIUM;
  const topThree = showPodium ? (data?.entries.filter((e) => e.rank <= 3) ?? []) : [];
  const tableRows = showPodium
    ? (data?.entries.filter((e) => e.rank > 3) ?? [])
    : (data?.entries ?? []);

  return (
    <aside className="lb-root">
      <header className="lb-header">
        <div className="lb-header-text">
          <h2>Leaderboard</h2>
          <p>By problems solved</p>
        </div>
        {data !== undefined && (
          <span className="lb-coders-pill">
            <ShieldRoundedIcon fontSize="inherit" />
            <SportsMartialArtsRoundedIcon fontSize="inherit" />
            {data.totalUsers} {data.totalUsers === 1 ? "coder" : "coders"}
          </span>
        )}
      </header>

      <div className="lb-scroll-wrap">
        <div className="lb-body app-scroll">
          {query.isLoading && <TableSkeleton />}

          {query.isError && (
            <Alert severity="warning" sx={{ borderRadius: "10px", mb: 1, fontSize: "0.75rem" }}>
              Could not load leaderboard.
            </Alert>
          )}

          {data !== undefined && !query.isLoading && (
            <>
              {data.totalUsers === 0 || data.entries.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {showPodium && topThree.length > 0 && <Podium topThree={topThree} />}
                  <LeaderboardTable rows={tableRows} />
                </>
              )}
            </>
          )}

          {data !== undefined && data.totalUsers > 0 && data.currentUserRank !== null && (
            <footer className="lb-footer">{rankFooterText(data)}</footer>
          )}
        </div>
        <div className="lb-scroll-fade" aria-hidden />
      </div>
    </aside>
  );
}