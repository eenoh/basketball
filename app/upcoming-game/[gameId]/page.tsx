"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "../../components/PageHeader";

export default function UpcomingGamePage() {
  const { gameId } = useParams();
  const router = useRouter();

  const [game, setGame] = useState<any>(null);
  const [homeTeam, setHomeTeam] = useState<any>(null);
  const [awayTeam, setAwayTeam] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");

  // Daten laden
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const res = await fetch("http://localhost:8081/games");
        const games = await res.json();
        const thisGame = games.find((g: any) => g.id === Number(gameId));
        if (!thisGame) return;

        setGame(thisGame);

        const teamRes = await fetch("http://localhost:8081/teams");
        const allTeams = await teamRes.json();

        setHomeTeam(allTeams.find((t: any) => t.name === thisGame.home_team));
        setAwayTeam(allTeams.find((t: any) => t.name === thisGame.away_team));
      } catch (err) {
        console.error("Fehler beim Laden der Spieldaten:", err);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  // Countdown aktualisieren
    useEffect(() => {
      const interval = setInterval(() => {
        if (!game || !game.date || !game.tip_off) return;

        // Datum korrekt parsen
        const dateObj = new Date(game.date); // z. B. "2025-04-21T22:00:00.000Z"

        if (isNaN(dateObj.getTime())) {
          console.error("❌ Ungültiges Datum:", game.date);
          return;
        }

        const [hourStr, minuteStr] = game.tip_off.split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour) || isNaN(minute)) {
          console.error("❌ Ungültiges Zeitformat:", game.tip_off);
          return;
        }

        // Kombiniere das Datum mit Uhrzeit (in lokaler Zeit)
        const gameTime = new Date(
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
          hour,
          minute,
          0
        );

        const now = new Date();
        const diff = gameTime.getTime() - now.getTime();

        if (diff <= 0) {
          setCountdown("Das Spiel läuft oder ist vorbei!");
          clearInterval(interval);
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }, [game]);



  // Ladezustand
  if (!game || !homeTeam || !awayTeam) {
    return <p className="text-center mt-10">Lade Spieldetails...</p>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-6 py-10 text-center">
      <PageHeader
        title="Bevorstehendes Spiel"
        subtitle="Informationen zum kommenden Matchup"
      />

      {/* Matchup Anzeige */}
      <div className="team-matchup-container">
        <div className="team-block">
          <img
            src={`http://localhost:8081${homeTeam.logo_path}`}
            alt={homeTeam.name}
            className="team-logo-large"
          />
          <h2 className="mt-3 text-xl font-semibold">{homeTeam.name}</h2>
        </div>

        <div className="vs-text">VS</div>

        <div className="team-block">
          <img
            src={`http://localhost:8081${awayTeam.logo_path}`}
            alt={awayTeam.name}
            className="team-logo-large"
          />
          <h2 className="mt-3 text-xl font-semibold">{awayTeam.name}</h2>
        </div>
      </div>

      {/* Spielinfos */}
      <div className="game-info-text">
        <p>
          <strong>📅 Datum:</strong>{" "}
          {new Date(game.date).toLocaleDateString("de-DE")}
        </p>
        <p>
          <strong>🕗 Tip-Off:</strong> {game.tip_off?.slice(0, 5)} Uhr
        </p>
        <p>
          <strong>📍 Ort:</strong> {game.gym_name || "Noch nicht zugewiesen"}
        </p>
      </div>

      {/* Countdown */}
      <div className="countdown-box">⏳ {countdown}</div>

      {/* Button */}
      <button
        onClick={() => router.push("/game-overview")}
        className="team-stats-button"
      >
        Spielübersicht
      </button>
    </div>
  );
}
