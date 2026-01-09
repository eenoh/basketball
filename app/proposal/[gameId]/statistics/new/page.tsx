"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "../../../../components/PageHeader";
import { API_BASE_URL } from "../../../../../lib/config";

type PlayerOption = {
  id: number;
  username: string;
  jersey_number: number;
};

export const STAT_OPTIONS = [
  // Würfe
  { value: "fg", label: "Field Goal Make (2P)" },
  { value: "fga", label: "Field Goal Attempt (2P)" },

  // Dreier
  { value: "three_p", label: "3P Make" },
  { value: "three_pa", label: "3P Attempt" },

  // Freiwürfe
  { value: "ft", label: "Free Throw Make" },
  { value: "fta", label: "Free Throw Attempt" },

  // Rebounds
  { value: "orb", label: "Offensiver Rebound" },
  { value: "drb", label: "Defensiver Rebound" },
  { value: "trb", label: "Gesamter Rebound" },

  // Playmaking
  { value: "ast", label: "Assist" },

  // Defense
  { value: "blk", label: "Block" },
  { value: "stl", label: "Steal" }, // ⚠️ Steals sind NICHT in player_stats – willst du sie hinzufügen?

  // Ballverluste
  { value: "tov", label: "Turnover" },

  // Fouls
  { value: "pf", label: "Personal Foul" },

  // Punkte (falls du explizit zählen willst)
  { value: "pst", label: "Punkte" },

  // Plus/Minus
  { value: "plus_minus", label: "Plus/Minus" },
];


export default function NewPlayerStatsPage() {
  const router = useRouter();
  const { gameId } = useParams<{ gameId: string }>();

  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [selectedStat, setSelectedStat] = useState<string>("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Spieler für dieses Spiel laden
  useEffect(() => {
    if (!gameId) return;

    const loadPlayers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/games/${gameId}/players`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          console.error("Fehler beim Laden der Spieler:", data);
          setError(data.message || "Spieler konnten nicht geladen werden.");
          return;
        }

        setPlayers(data.players || []);
      } catch (err) {
        console.error("Fehler beim Laden der Spieler:", err);
        setError("Server nicht erreichbar (Spieler).");
      }
    };

    loadPlayers();
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!gameId) {
      setError("Game ID fehlt.");
      return;
    }
    if (!selectedPlayerId) {
      setError("Bitte einen Spieler auswählen.");
      return;
    }
    if (!selectedStat) {
      setError("Bitte eine Statistik auswählen.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/games/${gameId}/players/${selectedPlayerId}/stats-event`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: selectedStat }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Fehler beim Speichern der Statistik.");
        return;
      }

      setSuccess("Statistik wurde gespeichert / inkrementiert.");
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      setError("Server nicht erreichbar.");
    }
  };

  return (
    <div className="game-overview-container" style={{ paddingBottom: 32 }}>
      <PageHeader
        title="Spielerstatistik hinzufügen"
        subtitle="Für dieses Spiel eine Statistik-Aktion einem Spieler zuordnen"
      />

      <div className="header-tabellen-container flex gap-4 mb-6">
        <button className="team-stats-button" onClick={() => router.back()}>
          Zurück
        </button>
        <button className="home-page-button" onClick={() => router.push("/home")}>
          Home
        </button>
      </div>

      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Spieler-Dropdown */}
          <div>
            <label style={labelStyle}>Spieler</label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Bitte Spieler wählen...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jersey_number} – {p.username}
                </option>
              ))}
            </select>
          </div>

          {/* Statistik-Dropdown */}
          <div>
            <label style={labelStyle}>Statistik</label>
            <select
              value={selectedStat}
              onChange={(e) => setSelectedStat(e.target.value)}
              style={inputStyle}
            >
              <option value="">Bitte Statistik wählen...</option>
              {STAT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: "green", marginTop: 8 }}>{success}</p>}

          <button
            type="submit"
            className="home-page-button"
            style={{ marginTop: 12, alignSelf: "flex-start" }}
          >
            Statistik hinzufügen
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  padding: "6px 10px",
};

const inputStyleDisabled: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: "#f3f4f6",
};
