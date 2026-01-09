"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditPlayerPage() {
  const router = useRouter();
  const { teamId, playerId } = useParams();

  const [username, setUsername] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [position, setPosition] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [experience, setExperience] = useState("");
  const [teamInfo, setTeamInfo] = useState(null);
  const [playerTeamId, setPlayerTeamId] = useState("");

  const positionOptions = [
    { value: "1", label: "Point Guard" },
    { value: "2", label: "Shooting Guard" },
    { value: "3", label: "Small Forward" },
    { value: "4", label: "Power Forward" },
    { value: "5", label: "Center" },
  ];

  const getPositionValue = (label) => {
    const found = positionOptions.find((opt) => opt.label === label);
    return found?.value || "";
  };

  const getPositionLabel = (value) => {
    const found = positionOptions.find((opt) => opt.value === value);
    return found?.label || "";
  };

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }

    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`http://localhost:8081/team-info/${teamId}`);
        const data = await res.json();
        setTeamInfo(data);
      } catch (err) {
        console.error("Fehler beim Laden der Teamdaten:", err);
      }
    };

    const fetchPlayer = async () => {
      try {
        const res = await fetch(`http://localhost:8081/player/${playerId}`);
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) {
          throw new Error("Antwort ist keine gültige JSON");
        }

        const data = await res.json();
        setUsername(data.username);
        setJerseyNumber(data.jersey_number.toString());
        setPosition(getPositionValue(data.position));
        setHeight(data.height.toString());
        setWeight(data.weight.toString());
        setExperience(data.experience_years.toString());
        setPlayerTeamId(data.team_id?.toString());
      } catch (err) {
        console.error("Fehler beim Laden des Spielers:", err);
        alert("❌ Spieler konnte nicht geladen werden");
      }
    };

    if (teamId && playerId) {
      fetchTeamInfo();
      fetchPlayer();
    }
  }, [teamId, playerId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (playerTeamId !== teamId) {
      alert("❌ Fehler: Spieler gehört nicht zu diesem Team!");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8081/player/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          jersey_number: parseInt(jerseyNumber),
          position: getPositionLabel(position),
          height: parseInt(height),
          weight: parseInt(weight),
          experience_years: parseInt(experience),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Aktualisieren");

      alert("✅ Spieler aktualisiert!");
      router.push(`/team-overview/${teamId}`);
    } catch (err) {
      console.error("Fehler:", err);
      alert("❌ Fehler beim Speichern");
    }
  };

  return (
    <div className="create-player-container">
      <div className="create-player-card">
        <div className="avatar-container" style={{ textAlign: "center" }}>
          <img
            src={teamInfo?.logo_url || "/logo.png"}
            alt="Team Logo"
            className="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              marginBottom: "1rem",
            }}
          />
          <h2><strong>Edit Player</strong></h2>
        </div>

        <form onSubmit={handleSubmit} className="create-player-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              readOnly
              required
              className="form-input"
              style={{ backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="jerseyNumber" className="form-label">Jersey Number</label>
            <input
              type="text"
              id="jerseyNumber"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="position" className="form-label">Position</label>
            <select
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              className="form-input"
            >
              <option value="">-- Select Position --</option>
              {positionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="height" className="form-label">Height (cm)</label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight" className="form-label">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="experience" className="form-label">Experience (years)</label>
            <input
              type="number"
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="button-group" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <button type="button" onClick={() => router.back()}>Back</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
