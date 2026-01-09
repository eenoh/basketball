"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DefineRosterPage() {
  const { gameId } = useParams();
  const router = useRouter();

  const [players, setPlayers] = useState([]);
  const [starters, setStarters] = useState({ PG: "", SG: "", SF: "", PF: "", C: "" });
  const [bench, setBench] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [playerNames, setPlayerNames] = useState({});

  const positions = [
    { code: "PG", label: "Point Guard" },
    { code: "SG", label: "Shooting Guard" },
    { code: "SF", label: "Small Forward" },
    { code: "PF", label: "Power Forward" },
    { code: "C", label: "Center" },
  ];

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }

    const fetchTeamAndPlayers = async () => {
      try {
        const teamsRes = await fetch("http://localhost:8081/teams");
        const teams = await teamsRes.json();
        const team = teams.find(
          (t) => t.head_coach === username || t.assistant_coach === username
        );
        if (!team) return;

        setTeamId(team.id);
        setTeamInfo(team);

        const playersRes = await fetch(`http://localhost:8081/players?team_id=${team.id}`);
        const playersData = await playersRes.json();
        setPlayers(playersData);

        const usernames = playersData.map((p) => p.username).join(",");
        const nameRes = await fetch(`http://localhost:8081/player-names?usernames=${usernames}`);
        const names = await nameRes.json();
        setPlayerNames(names);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      }
    };

    fetchTeamAndPlayers();
  }, [router]);

  const alreadyPicked = Object.values(starters).filter(Boolean);
  const availablePlayers = (exclude = []) =>
    players.filter((p) => !exclude.includes(p.id.toString()));

  const handleStarterChange = (position: string, playerId: string) => {
    setStarters({ ...starters, [position]: playerId });
  };

  const handleAddBenchPlayer = () => {
    if (
      selectedPlayer &&
      !Object.values(starters).includes(selectedPlayer) &&
      !bench.includes(selectedPlayer)
    ) {
      setBench([...bench, selectedPlayer]);
      setSelectedPlayer("");
    }
  };

  const handleSaveRoster = async () => {
    const starting_five = Object.values(starters).map(Number).filter(Boolean);
    const benchIds = bench.map(Number);

    if (starting_five.length < 5) {
      alert("Bitte alle fünf Starter-Positionen besetzen!");
      return;
    }

    const res = await fetch("http://localhost:8081/game-roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: gameId,
        starting_five,
        bench: benchIds,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("Roster erfolgreich gespeichert!");
      router.push("/game-overview");
    } else {
      alert(result.error || "Fehler beim Speichern.");
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="avatar-container">
          <img
            src={teamInfo?.logo_path ? `http://localhost:8081${teamInfo.logo_path}` : "/logo.png"}
            alt="Team Logo"
            className="avatar"
          />
          <h2 style={{ marginTop: "1rem", fontWeight: "bold", color: "black" }}>
            <strong>{teamInfo?.name ? `${teamInfo.name} - Roster` : "Lade Team..."}</strong>
          </h2>
        </div>

        <form className="form-content" onSubmit={(e) => e.preventDefault()}>
          <h3 className="section-title">Starting Five</h3>

          {positions.map(({ code, label }) => {
            const selected = starters[code];
            const filtered = availablePlayers([...alreadyPicked.filter(id => id !== selected)]);
            const playerOptions = [...filtered];

            const selectedPlayerObj = players.find((p) => p.id.toString() === selected);
            if (selectedPlayerObj && !playerOptions.some(p => p.id === selectedPlayerObj.id)) {
              playerOptions.unshift(selectedPlayerObj);
            }

            return (
              <div className="form-group" key={code}>
                <label>{code}</label>
                <p className="position-subheading">{label}</p>
                <select
                  value={starters[code]}
                  onChange={(e) => handleStarterChange(code, e.target.value)}
                  required
                >
                  <option value="">-- Spieler wählen --</option>
                  {playerOptions.map((player) => (
                    <option key={player.id} value={player.id}>
                      {playerNames[player.username] || player.username}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <h3 className="section-title">Bench</h3>

          <div className="form-group">
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
            >
              <option value="">-- Spieler zur Bank hinzufügen --</option>
              {availablePlayers([...alreadyPicked, ...bench]).map((player) => (
                <option key={player.id} value={player.id}>
                  {playerNames[player.username] || player.username}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddBenchPlayer} className="btn-secondary">
              Add Bench Player
            </button>
          </div>

          {bench.length > 0 && (
            <ul className="bench-list">
              {bench.map((id) => {
                const p = players.find((pl) => pl.id.toString() === id);
                return (
                  <li key={id}>
                    {playerNames[p.username] || p.username}
                  </li>
                );
              })}
            </ul>
          )}

          <button
            className="btn-primary w-full"  
            onClick={handleSaveRoster}
            type="submit"
          >
            Roster speichern ✅
          </button>
        </form>
      </div>
    </div>
  );
}
