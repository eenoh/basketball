"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BACKEND = "http://localhost:8081";

export default function BoxScorePage() {
  const params = useParams<{ gameId: string | string[] }>();
  const gameId = Array.isArray(params?.gameId) ? params.gameId[0] : params?.gameId;

  const router = useRouter();

  const [homeTeam, setHomeTeam] = useState<any>(null);
  const [awayTeam, setAwayTeam] = useState<any>(null);
  const [homeRoster, setHomeRoster] = useState<{ starters: any[]; bench: any[] }>({ starters: [], bench: [] });
  const [awayRoster, setAwayRoster] = useState<{ starters: any[]; bench: any[] }>({ starters: [], bench: [] });
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }
    if (!gameId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND}/game-roster-detailed/${encodeURIComponent(gameId)}`);
        if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
        const data = await res.json();

        const allPlayers = [
          ...(data?.home?.starters ?? []),
          ...(data?.home?.bench ?? []),
          ...(data?.away?.starters ?? []),
          ...(data?.away?.bench ?? []),
        ];

        const usernames = allPlayers.map((p: any) => p?.username).filter(Boolean).join(",");
        if (usernames) {
          const nameRes = await fetch(`${BACKEND}/player-names?usernames=${encodeURIComponent(usernames)}`);
          if (nameRes.ok) {
            const names = await nameRes.json();
            setNameMap(names || {});
          }
        }

        setHomeTeam({ name: data.home.team_name, logo_path: data.home.logo_path });
        setAwayTeam({ name: data.away.team_name, logo_path: data.away.logo_path });

        setHomeRoster({ starters: data.home.starters || [], bench: data.home.bench || [] });
        setAwayRoster({ starters: data.away.starters || [], bench: data.away.bench || [] });
      } catch (err) {
        console.error("Fehler beim Laden der Daten:", err);
      }
    };

    fetchData();
  }, [gameId, router]);

  const formatName = (username: string) => {
    const full = nameMap[username];
    if (!full) return username;
    const [vorname, ...rest] = full.split(" ");
    const nachname = rest.join(" ");
    return `${nachname} ${vorname?.[0] ?? ""}.`;
  };

  const n0 = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const pct = (made: any, att: any) => {
    const m = n0(made);
    const a = n0(att);
    if (!a) return 0;
    return Math.round((m / a) * 1000) / 10;
  };

  const calcPoints = (p: any) => {
    const fg = n0(p.fg);
    const threeP = n0(p.three_p);
    const ft = n0(p.ft);
    const twoMade = Math.max(0, fg - threeP);
    return twoMade * 2 + threeP * 3 + ft;
  };

  const sumTeamPoints = (roster: { starters: any[]; bench: any[] }) => {
    const all = [...(roster?.starters ?? []), ...(roster?.bench ?? [])];
    return all.reduce((acc, p) => acc + calcPoints(p), 0);
  };

  const homePoints = useMemo(() => sumTeamPoints(homeRoster), [homeRoster]);
  const awayPoints = useMemo(() => sumTeamPoints(awayRoster), [awayRoster]);

  // ✅ kompakte Tabellen-Styles
  const th: React.CSSProperties = {
    padding: "6px 6px",
    fontSize: 12,
    fontWeight: 900,
    textAlign: "center",
    borderBottom: "1px solid #cbd5e1",
    background: "#e5e7eb",
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    padding: "6px 6px",
    fontSize: 12,
    textAlign: "center",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };

  const tdPlayer: React.CSSProperties = {
    ...td,
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const tdMp: React.CSSProperties = {
    ...td,
    fontVariantNumeric: "tabular-nums",
  };

  const renderTable = (players: any[]) => (
    // du kannst overflowX auch entfernen, aber lass es als Fallback drin
    <div className="boxscore-table-wrapper" style={{ overflowX: "hidden" }}>
      <table
        className="boxscore-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed", // ✅ wichtig: Spaltenbreiten werden erzwungen
        }}
      >
        {/* ✅ Spaltenbreiten: 100% insgesamt */}
        <colgroup>
          {/* Spieler */}
          <col style={{ width: "18%" }} />
          {/* MP */}
          <col style={{ width: "8%" }} />
          {/* 18 Stat-Spalten + PTS = 19 Spalten à ~3.9% => 74% */}
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
          <col style={{ width: "3.9%" }} />
        </colgroup>

        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left" }}>Spieler</th>
            <th style={th}>MP</th>
            <th style={th}>FGM</th>
            <th style={th}>FGA</th>
            <th style={th}>FG%</th>
            <th style={th}>3PM</th>
            <th style={th}>3PA</th>
            <th style={th}>3P%</th>
            <th style={th}>FTM</th>
            <th style={th}>FTA</th>
            <th style={th}>FT%</th>
            <th style={th}>ORB</th>
            <th style={th}>DRB</th>
            <th style={th}>REB</th>
            <th style={th}>AST</th>
            <th style={th}>BLK</th>
            <th style={th}>STL</th>
            <th style={th}>TOV</th>
            <th style={th}>PF</th>
            <th style={th}>PST</th>
            <th style={th}>PTS</th>
          </tr>
        </thead>

        <tbody>
          {players.map((p: any) => {
            const fg = n0(p.fg);
            const fga = n0(p.fga);

            const tp = n0(p.three_p);
            const tpa = n0(p.three_pa);

            const ft = n0(p.ft);
            const fta = n0(p.fta);

            const orb = n0(p.orb);
            const drb = n0(p.drb);

            const trb = Number.isFinite(Number(p.trb)) ? n0(p.trb) : orb + drb;
            const pts = calcPoints(p);

            const key = String(p.game_roster_id ?? `${p.username}-${p.jersey_number ?? "x"}`);

            return (
              <tr key={key}>
                <td style={tdPlayer} title={formatName(p.username)}>
                  {formatName(p.username)}
                </td>
                <td style={tdMp}>{p.mp || "-"}</td>

                <td style={td}>{fg}</td>
                <td style={td}>{fga}</td>
                <td style={td}>{pct(fg, fga)}%</td>

                <td style={td}>{tp}</td>
                <td style={td}>{tpa}</td>
                <td style={td}>{pct(tp, tpa)}%</td>

                <td style={td}>{ft}</td>
                <td style={td}>{fta}</td>
                <td style={td}>{pct(ft, fta)}%</td>

                <td style={td}>{orb}</td>
                <td style={td}>{drb}</td>
                <td style={td}>{trb}</td>

                <td style={td}>{n0(p.ast)}</td>
                <td style={td}>{n0(p.blk)}</td>
                <td style={td}>{n0(p.stl)}</td>
                <td style={td}>{n0(p.tov)}</td>
                <td style={td}>{n0(p.pf)}</td>

                <td style={td}>{n0(p.pst)}</td>
                <td style={{ ...td, fontWeight: 900 }}>{pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderBoxscore = (team: any, roster: { starters: any[]; bench: any[] }, teamPts: number) => (
    <div className="team-boxscore" style={{ marginBottom: "3rem" }}>
      <div
        className="team-header"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        {team?.logo_path ? (
          <img
            src={`${BACKEND}${team.logo_path}`}
            alt={`${team.name} Logo`}
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "100%",
              border: "2px solid black",
              objectFit: "cover",
              marginBottom: "0.5rem",
            }}
          />
        ) : null}

        <h2 style={{ fontWeight: "bold", fontSize: "1.2rem", color: "black", margin: 0 }}>{team?.name}</h2>
        <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: "#111827" }}>Punkte: {teamPts}</div>
      </div>

      <div className="boxscore-section">
        <h3 style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: "bold", color: "black" }}>Starters</h3>
        {renderTable(roster.starters)}
      </div>

      <div className="boxscore-section" style={{ marginTop: "2rem" }}>
        <h3 style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: "bold", color: "black" }}>Bench</h3>
        {renderTable(roster.bench)}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#3f4a54", minHeight: "100vh", paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div
        className="boxscore-page"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2rem 1rem",
          backgroundColor: "#fff",
          borderRadius: "0.5rem",
        }}
      >
        <div
          className="boxscore-header"
          style={{
            background: "#3f4a54",
            padding: "2rem",
            borderRadius: "0.5rem",
            color: "white",
            textAlign: "center",
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: "100px",
              height: "100px",
              marginBottom: "0.5rem",
              borderRadius: "100%",
              border: "2px solid black",
            }}
          />
          <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>Box Score</h1>

          <div style={{ marginTop: 10, fontWeight: 900, fontSize: 18 }}>
            {homeTeam?.name ?? "Home"} {homePoints} : {awayPoints} {awayTeam?.name ?? "Away"}
          </div>
        </div>

        <div className="boxscore-teams" style={{ marginTop: "2rem" }}>
          {homeTeam ? renderBoxscore(homeTeam, homeRoster, homePoints) : null}
          {awayTeam ? renderBoxscore(awayTeam, awayRoster, awayPoints) : null}
        </div>

        <div className="boxscore-footer" style={{ marginTop: "2rem", textAlign: "center" }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.25rem",
              fontWeight: "bold",
              backgroundColor: "#1F2937",
              color: "white",
              cursor: "pointer",
              border: "none",
            }}
          >
            Zurück
          </button>
        </div>
      </div>
    </div>
  );
}
