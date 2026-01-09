"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BoxScorePage() {
  const { gameId } = useParams();
  const router = useRouter();

  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [homeRoster, setHomeRoster] = useState({ starters: [], bench: [] });
  const [awayRoster, setAwayRoster] = useState({ starters: [], bench: [] });
  const [nameMap, setNameMap] = useState({});



  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8081/game-roster-detailed/${gameId}`);
        const data = await res.json();

        const allPlayers = [
          ...data.home.starters,
          ...data.home.bench,
          ...data.away.starters,
          ...data.away.bench,
        ];

        const usernames = allPlayers.map((p) => p.username).join(",");
        const nameRes = await fetch(`http://localhost:8081/player-names?usernames=${usernames}`);
        const names = await nameRes.json();
        setNameMap(names);

        setHomeTeam({ name: data.home.team_name, logo_path: data.home.logo_path });
        setAwayTeam({ name: data.away.team_name, logo_path: data.away.logo_path });

        setHomeRoster({ starters: data.home.starters, bench: data.home.bench });
        setAwayRoster({ starters: data.away.starters, bench: data.away.bench });
      } catch (err) {
        console.error("Fehler beim Laden der Daten:", err);
      }
    };

    fetchData();
  }, [gameId, router]);

  const formatName = (username) => {
    const full = nameMap[username];
    if (!full) return username;
    const [vorname, ...rest] = full.split(" ");
    const nachname = rest.join(" ");
    return `${nachname} ${vorname[0]}.`;
  };

  const renderTable = (players) => (
      <div className="boxscore-table-wrapper">
    <table className="boxscore-table">
      <thead>
        <tr>
          <th>Spieler</th>
          <th>MP</th>
          <th>FGM</th>
          <th>FGA</th>
          <th>FG%</th>
          <th>3PM</th>
          <th>3PA</th>
          <th>3P%</th>
          <th>FTM</th>
          <th>FTA</th>
          <th>FT%</th>
          <th>ORB</th>
          <th>DRB</th>
          <th>REB</th>
          <th>AST</th>
          <th>BLK</th>
          <th>STL</th>
          <th>TOV</th>
          <th>PF</th>
          <th>PST</th>
          <th>+/-</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p, idx) => (
          <tr key={idx}>
            <td>{formatName(p.username)}</td>
            <td>{p.mp || "-"}</td>
            <td>{p.fg || 0}</td>
            <td>{p.fga || 0}</td>
            <td>{p.fg_percent || 0}%</td>
            <td>{p.three_p || 0}</td>
            <td>{p.three_pa || 0}</td>
            <td>{p.three_p_percent || 0}%</td>
            <td>{p.ft || 0}</td>
            <td>{p.fta || 0}</td>
            <td>{p.ft_percent || 0}%</td>
            <td>{p.orb || 0}</td>
            <td>{p.drb || 0}</td>
            <td>{p.trb || 0}</td>
            <td>{p.ast || 0}</td>
            <td>{p.blk || 0}</td>
            <td>{p.stl || 0}</td>
            <td>{p.tov || 0}</td>
            <td>{p.pf || 0}</td>
            <td>{p.pst || 0}</td>
            <td>{p.plus_minus || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>

  );

  const renderBoxscore = (team, roster) => (
    <div className="team-boxscore" style={{ marginBottom: "3rem" }}>
      {/* Team Info */}
      <div
        className="team-header"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem"
        }}
      >
        {team?.logo_path && (
          <img
            src={`http://localhost:8081${team.logo_path}`}
            alt={`${team.name} Logo`}
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "100%",
              border: "2px solid black",
              objectFit: "cover",
              marginBottom: "0.5rem"
            }}
          />
        )}
        <h2 style={{ fontWeight: "bold", fontSize: "1.2rem", color: "black", margin: 0 }}>
          {team?.name}
        </h2>
      </div>

      {/* Starters */}
      <div className="boxscore-section">
        <h3
          style={{
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "black"
          }}
        >
          Starters
        </h3>
        {renderTable(roster.starters)}
      </div>

      {/* Bench */}
      <div className="boxscore-section" style={{ marginTop: "2rem" }}>
        <h3
          style={{
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "black"
          }}
        >
          Bench
        </h3>
        {renderTable(roster.bench)}
      </div>
    </div>
  );

  return (
<div
    style={{
      backgroundColor: "#3f4a54",
      minHeight: "100vh",
      paddingTop: "2rem",
      paddingBottom: "2rem"
    }}
  >
    <div
      className="boxscore-page"
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "2rem 1rem",
        backgroundColor: "#fff",
        borderRadius: "0.5rem"
      }}
    >      <div
        className="boxscore-header"
        style={{
          background: "#3f4a54",
          padding: "2rem",
          borderRadius: "0.5rem",
          color: "white",
          textAlign: "center"
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
            border: "2px solid black"
          }}
        />
        <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>Box Score</h1>
      </div>

      <div className="boxscore-teams" style={{ marginTop: "2rem" }}>
        {homeTeam && renderBoxscore(homeTeam, homeRoster)}
        {awayTeam && renderBoxscore(awayTeam, awayRoster)}
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
            border: "none"
          }}
        >
          Zurück
        </button>
      </div>
    </div>
    </div>
  );
}
