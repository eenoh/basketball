"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../components/PageHeader";

export default function GameOverviewPage() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [existingRosters, setExistingRosters] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUsername(storedUser);
    }
  }, [router]);

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const res = await fetch("http://localhost:8081/games");
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await res.text();
          console.error("Keine JSON-Antwort:", text);
          return;
        }
        const data = await res.json();
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fehler beim Laden der Spiele:", error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const res = await fetch("http://localhost:8081/teams");
        const data = await res.json();
        const team = data.find(
          (t: any) => t.head_coach === username || t.assistant_coach === username
        );
        if (team) setUserTeam(team);
      } catch (err) {
        console.error("Fehler beim Laden des Benutzer-Teams:", err);
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!userTeam || games.length === 0) return;
    (async () => {
      const rosterMap: { [key: number]: boolean } = {};
      await Promise.all(
        games.map(async (game: any) => {
          const teamName =
            game.home_team === userTeam.name || game.away_team === userTeam.name
              ? userTeam.name
              : null;
          if (teamName) {
            try {
              const res = await fetch(
                `http://localhost:8081/roster-exists/${game.id}/${teamName}`
              );
              const data = await res.json();
              rosterMap[game.id] = data.exists;
            } catch (err) {
              console.error(`Fehler bei Roster-Check für Spiel ${game.id}:`, err);
              rosterMap[game.id] = false;
            }
          }
        })
      );
      setExistingRosters(rosterMap);
    })();
  }, [games, userTeam]);

  const isFutureGame = (game: any) => {
    const dateOnly = game.date.split("T")[0];
    const time = game.tip_off?.slice(0, 5) || "00:00";
    const combined = `${dateOnly}T${time}:00`;
    const gameDateTime = new Date(combined);
    return gameDateTime > new Date();
  };

  const handleWatch = (game: any) => {
    if (isFutureGame(game)) router.push(`/upcoming-game/${game.id}`);
    else router.push(`/video/${game.id}`);
  };

  const handleBoxScore = (game: any) => router.push(`/box-score/${game.id}`);
  const handleAnalytics = (game: any) => router.push(`/game-analytics/${game.id}`);
  const handleNewGame = () => router.push("/new-game");
  const handleDefineRoster = (gameId: number) => router.push(`/define-roster/${gameId}`);

  // ⬇️ Neu: Handler zum Öffnen der Vorschlags-Seite
  const handleProposals = (gameId: number) => router.push(`/proposal/${gameId}`);

  return (
    <div className="game-overview-container">
      <PageHeader title="Spiel Übersicht" subtitle="Alle offiziellen Spiele" />

      <div className="header-tabellen-container flex gap-4 mb-6">
        {username === "eenoh" && (
          <button onClick={handleNewGame} className="add-player-button">
            + Neues Spiel
          </button>
        )}
        <button className="team-stats-button" onClick={() => router.back()}>
          Zurück
        </button>
        <button className="home-page-button" onClick={() => router.push("/home")}>
          Home
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>Lade Spiele...</p>
      ) : (
        <table className="game-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Matchup</th>
              <th>Score</th>
              <th>Gym</th>
              <th>Tip Off</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.length > 0 ? (
              games.map((game: any) => {
                const future = isFutureGame(game);
                return (
                  <tr key={game.id}>
                    <td>{new Date(game.date).toLocaleDateString("de-DE")}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <span style={{ flex: 1 }}>{game.home_team}</span>
                        <strong style={{ width: "80px" }}>VS.</strong>
                        <span style={{ flex: 1 }}>{game.away_team}</span>
                      </div>
                    </td>
                    <td>
                      {game.score ? (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{ flex: 1 }}>{game.score.split(" - ")[0]}</span>
                          <strong style={{ width: "15px" }}>-</strong>
                          <span style={{ flex: 1 }}>{game.score.split(" - ")[1]}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{game.gym_name || "-"}</td>
                    <td>{game.tip_off?.slice(0, 5) || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => handleWatch(game)} className="watch-btn">
                          Ansehen
                        </button>

                        {/* ⬇️ Nur voor Admin/eenoh sichtbar */}
                        {username === "eenoh" && (
                          <button
                            onClick={() => handleProposals(game.id)}
                            className="proposal-btn"
                            title={`Vorschläge für Spiel #${game.id}`}
                          >
                            Vorschläge
                          </button>
                        )}

                        {!future && (
                          <>
                            <button onClick={() => handleBoxScore(game)} className="boxscore-btn">
                              Box Score
                            </button>
                            <button onClick={() => handleAnalytics(game)} className="analytics-btn">
                              Spielstatistiken
                            </button>
                            {userTeam &&
                              (game.home_team === userTeam.name || game.away_team === userTeam.name) &&
                              !existingRosters[game.id] && (
                                <button onClick={() => handleDefineRoster(game.id)} className="roster-btn">
                                  Roster definieren
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  Keine Spiele vorhanden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
