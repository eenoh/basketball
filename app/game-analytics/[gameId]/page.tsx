"use client";

import PageHeader from "../../components/PageHeader";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const BACKEND = "http://localhost:8081";

type TeamAgg = {
  team_id: number;
  team_name: string;

  team_color?: string;
  team_logo_url?: string | null;

  points: number;
  fg: number;
  fga: number;
  fg_pct: number;
  three_p: number;
  three_pa: number;
  three_p_pct: number;
  ft: number;
  fta: number;
  ft_pct: number;
  orb: number;
  drb: number;
  trb: number;
  ast: number;
  blk: number;
  stl: number;
  tov: number;
  pf: number;
};

type PlayerAgg = {
  player_id: number;
  username: string;
  jersey_number: number | null;
  team_id: number;
  team_name: string;

  points: number;
  fg: number;
  fga: number;
  fg_pct: number;
  three_p: number;
  three_pa: number;
  three_p_pct: number;
  ft: number;
  fta: number;
  ft_pct: number;
  orb: number;
  drb: number;
  trb: number;
  ast: number;
  blk: number;
  stl: number;
  tov: number;
  pf: number;
};

type AnalyticsResponse = {
  game_id: number;
  home_team: string;
  away_team: string;
  teams: Record<string, TeamAgg>;
  byPlayer: PlayerAgg[];
};

function sumSafe(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.0%";
  return `${n.toFixed(1)}%`;
}

export default function GameAnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ gameId: string | string[] }>();
  const gameId = Array.isArray(params?.gameId) ? params.gameId[0] : params?.gameId;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!gameId) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(`${BACKEND}/game-analytics/${encodeURIComponent(gameId)}`, {
          signal: controller.signal,
        });

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        if (!res.ok) {
          const body = isJson ? JSON.stringify(await res.json()) : await res.text();
          throw new Error(`Statistiken konnten nicht geladen werden (${res.status}): ${body}`);
        }

        if (!isJson) {
          const txt = await res.text();
          throw new Error(`Es wurde JSON erwartet, aber HTML/Text erhalten: ${txt.slice(0, 250)}...`);
        }

        const json: AnalyticsResponse = await res.json();
        setData(json);

        const usernames = (json.byPlayer || [])
          .map((p) => p.username)
          .filter(Boolean)
          .join(",");

        if (usernames) {
          const nRes = await fetch(`${BACKEND}/player-names?usernames=${encodeURIComponent(usernames)}`, {
            signal: controller.signal,
          });
          if (nRes.ok) {
            const nJson = await nRes.json();
            setNameMap(nJson || {});
          }
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setErr(e?.message ?? "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [gameId]);

  const formatName = (username: string) => {
    const full = nameMap[username];
    if (!full) return username;
    const [vorname, ...rest] = full.split(" ");
    const nachname = rest.join(" ");
    return `${nachname} ${vorname?.[0] ?? ""}.`;
  };

  const homeTeamName = data?.home_team;
  const awayTeamName = data?.away_team;

  const homeAgg = homeTeamName ? data?.teams?.[homeTeamName] : undefined;
  const awayAgg = awayTeamName ? data?.teams?.[awayTeamName] : undefined;

  const homeColor = homeAgg?.team_color || "#1e88e5";
  const awayColor = awayAgg?.team_color || "#e53935";

  const homePlayers = useMemo(() => {
    if (!data || !homeTeamName) return [];
    return [...data.byPlayer].filter((p) => p.team_name === homeTeamName).sort((a, b) => b.points - a.points);
  }, [data, homeTeamName]);

  const awayPlayers = useMemo(() => {
    if (!data || !awayTeamName) return [];
    return [...data.byPlayer].filter((p) => p.team_name === awayTeamName).sort((a, b) => b.points - a.points);
  }, [data, awayTeamName]);

  // --- Charts mit Farben ---
  const teamTotalsData = useMemo(() => {
    const labels = [homeTeamName ?? "Heim", awayTeamName ?? "Gast"];
    return {
      labels,
      datasets: [
        {
          label: "Punkte",
          data: [sumSafe(homeAgg?.points), sumSafe(awayAgg?.points)],
          backgroundColor: [homeColor, awayColor],
        },
        {
          label: "Rebounds",
          data: [sumSafe(homeAgg?.trb), sumSafe(awayAgg?.trb)],
          backgroundColor: [homeColor, awayColor],
        },
        {
          label: "Assists",
          data: [sumSafe(homeAgg?.ast), sumSafe(awayAgg?.ast)],
          backgroundColor: [homeColor, awayColor],
        },
        {
          label: "Turnovers",
          data: [sumSafe(homeAgg?.tov), sumSafe(awayAgg?.tov)],
          backgroundColor: [homeColor, awayColor],
        },
        {
          label: "Fouls",
          data: [sumSafe(homeAgg?.pf), sumSafe(awayAgg?.pf)],
          backgroundColor: [homeColor, awayColor],
        },
      ],
    };
  }, [homeAgg, awayAgg, homeTeamName, awayTeamName, homeColor, awayColor]);

  const teamTotalsOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Team-Übersicht" },
      legend: { position: "top" },
      tooltip: { enabled: true },
    },
    scales: { y: { beginAtZero: true } },
  };

  const shootingPctData = useMemo(() => {
    const labels = ["FG%", "3P%", "FT%"];
    return {
      labels,
      datasets: [
        {
          label: homeTeamName ?? "Heim",
          data: [sumSafe(homeAgg?.fg_pct), sumSafe(homeAgg?.three_p_pct), sumSafe(homeAgg?.ft_pct)],
          backgroundColor: homeColor,
        },
        {
          label: awayTeamName ?? "Gast",
          data: [sumSafe(awayAgg?.fg_pct), sumSafe(awayAgg?.three_p_pct), sumSafe(awayAgg?.ft_pct)],
          backgroundColor: awayColor,
        },
      ],
    };
  }, [homeAgg, awayAgg, homeTeamName, awayTeamName, homeColor, awayColor]);

  const shootingPctOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Wurfquoten" },
      legend: { position: "top" },
    },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  const foulsChart = useMemo(() => {
    const topHome = [...homePlayers].sort((a, b) => b.pf - a.pf).slice(0, 8);
    const topAway = [...awayPlayers].sort((a, b) => b.pf - a.pf).slice(0, 8);

    const label = (p: PlayerAgg) =>
      `${p.jersey_number != null ? `#${p.jersey_number} ` : ""}${formatName(p.username)}`;

    return {
      home: {
        labels: topHome.map(label),
        datasets: [{ label: "Fouls", data: topHome.map((p) => p.pf), backgroundColor: homeColor }],
      },
      away: {
        labels: topAway.map(label),
        datasets: [{ label: "Fouls", data: topAway.map((p) => p.pf), backgroundColor: awayColor }],
      },
    };
  }, [homePlayers, awayPlayers, nameMap, homeColor, awayColor]);

  const foulsOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: { title: { display: true, text: "Fouls pro Spieler (Top 8)" } },
    scales: { y: { beginAtZero: true } },
  };

  // Pie: Segmentfarben (damit nicht grau/weiß)
  const piePalette = [
    "#1976d2", "#ef5350", "#ffb300", "#43a047", "#8e24aa",
    "#00897b", "#f4511e", "#3949ab", "#6d4c41", "#00acc1", "#c0ca33"
  ];

  const buildPie = (players: PlayerAgg[], baseColor: string) => {
    const sorted = [...players].sort((a, b) => b.points - a.points);
    const top = sorted.slice(0, 10);
    const rest = sorted.slice(10);

    const labels = top.map(
      (p) => `${p.jersey_number != null ? `#${p.jersey_number} ` : ""}${formatName(p.username)}`
    );
    const values = top.map((p) => p.points);

    const restPts = rest.reduce((acc, p) => acc + p.points, 0);
    if (restPts > 0) {
      labels.push("Rest");
      values.push(restPts);
    }

    const colors = labels.map((_, i) => piePalette[i % piePalette.length]);
    // erstes Segment leicht teamnah
    if (colors.length > 0) colors[0] = baseColor;

    return { labels, datasets: [{ data: values, backgroundColor: colors }] };
  };

  const homePie = useMemo(() => buildPie(homePlayers, homeColor), [homePlayers, nameMap, homeColor]);
  const awayPie = useMemo(() => buildPie(awayPlayers, awayColor), [awayPlayers, nameMap, awayColor]);

  const pieOptions: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Punkte-Verteilung" },
      legend: { position: "right" },
    },
  };

  // --- Tabellen ---
  const TeamTable = ({ team, title }: { team?: TeamAgg; title: string }) => {
    if (!team) return null;
    return (
      <div style={{ border: `2px solid ${team.team_color || "#333"}`, borderRadius: 12, padding: 12, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {team.team_logo_url && (
            <img
              src={team.team_logo_url}
              alt="logo"
              style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #000" }}
            />
          )}
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
            <div style={{ opacity: 0.8 }}>{team.team_name}</div>
          </div>
        </div>

        <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Punkte", team.points],
              ["FG", `${team.fg}/${team.fga} (${pct(team.fg_pct)})`],
              ["3P", `${team.three_p}/${team.three_pa} (${pct(team.three_p_pct)})`],
              ["FT", `${team.ft}/${team.fta} (${pct(team.ft_pct)})`],
              ["ORB / DRB / REB", `${team.orb} / ${team.drb} / ${team.trb}`],
              ["AST / STL / BLK", `${team.ast} / ${team.stl} / ${team.blk}`],
              ["TOV / PF", `${team.tov} / ${team.pf}`],
            ].map(([k, v]) => (
              <tr key={String(k)} style={{ borderTop: "1px solid #ddd" }}>
                <td style={{ padding: "8px 6px", fontWeight: 700 }}>{k}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 800 }}>{v as any}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const PlayersTable = ({ title, players, color }: { title: string; players: PlayerAgg[]; color: string }) => (
    <div style={{ border: `2px solid ${color}`, borderRadius: 12, padding: 12, marginTop: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>{title}</div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: color, color: "white" }}>
              {["Spieler", "PTS", "FG", "3P", "FT", "REB", "AST", "STL", "BLK", "TOV", "PF"].map((h) => (
                <th key={h} style={{ padding: 8, textAlign: "center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.player_id} style={{ borderTop: "1px solid #ddd" }}>
                <td style={{ padding: 8, fontWeight: 800 }}>
                  {p.jersey_number != null ? `#${p.jersey_number} ` : ""}{formatName(p.username)}
                </td>
                <td style={{ padding: 8, textAlign: "center", fontWeight: 900 }}>{p.points}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.fg}/{p.fga} ({pct(p.fg_pct)})</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.three_p}/{p.three_pa} ({pct(p.three_p_pct)})</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.ft}/{p.fta} ({pct(p.ft_pct)})</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.trb}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.ast}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.stl}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.blk}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.tov}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{p.pf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="analytics-container" style={{ paddingBottom: 30 }}>
      <PageHeader title="Spielstatistiken" subtitle="Detaillierte Analyse pro Spiel" />

      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>Lade Statistiken…</div>
      ) : err ? (
        <div style={{ textAlign: "center", padding: 24, color: "crimson", fontWeight: 800 }}>
          {err}
        </div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: 24 }}>Keine Daten vorhanden.</div>
      ) : (
        <>
          {/* Matchup Header */}
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              background: "#f6f7f9",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {homeAgg?.team_logo_url && (
                <img src={homeAgg.team_logo_url} alt="home" style={{ width: 56, height: 56, borderRadius: "50%" }} />
              )}
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: homeColor }}>{data.home_team}</div>
                <div style={{ opacity: 0.8 }}>Home</div>
              </div>
            </div>

            <div style={{ fontWeight: 900, fontSize: 18 }}>VS.</div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: awayColor }}>{data.away_team}</div>
                <div style={{ opacity: 0.8 }}>Away</div>
              </div>
              {awayAgg?.team_logo_url && (
                <img src={awayAgg.team_logo_url} alt="away" style={{ width: 56, height: 56, borderRadius: "50%" }} />
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="charts-row" style={{ marginTop: 16 }}>
            <div className="chart-card">
              <Bar data={teamTotalsData} options={teamTotalsOptions} />
            </div>
            <div className="chart-card">
              <Bar data={shootingPctData} options={shootingPctOptions} />
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <Bar data={foulsChart.home} options={foulsOptions} />
            </div>
            <div className="chart-card">
              <Bar data={foulsChart.away} options={foulsOptions} />
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h2 style={{ textAlign: "center", color: homeColor }}>{data.home_team} Punkte</h2>
              <Pie data={homePie} options={pieOptions} />
            </div>
            <div className="chart-card">
              <h2 style={{ textAlign: "center", color: awayColor }}>{data.away_team} Punkte</h2>
              <Pie data={awayPie} options={pieOptions} />
            </div>
          </div>

          {/* Zahlen / Tabellen */}
          <TeamTable team={homeAgg} title="Team-Stats" />
          <TeamTable team={awayAgg} title="Team-Stats" />

          <PlayersTable title={`${data.home_team} – Spieler`} players={homePlayers} color={homeColor} />
          <PlayersTable title={`${data.away_team} – Spieler`} players={awayPlayers} color={awayColor} />

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button onClick={() => router.back()} className="back-btn">
              Zurück
            </button>
          </div>
        </>
      )}
    </div>
  );
}
