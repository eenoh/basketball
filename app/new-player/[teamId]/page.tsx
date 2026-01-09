"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewPlayerPage() {
  const router = useRouter();
  const { teamId } = useParams();

  const [username, setUsername] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [position, setPosition] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [experience, setExperience] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [teamInfo, setTeamInfo] = useState<any>(null);

  // ✅ Login-Check
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/login");
    }
  }, [router]);

  const mapPosition = (value: string) => {
    const positions: Record<string, string> = {
      "1": "Point Guard",
      "2": "Shooting Guard",
      "3": "Small Forward",
      "4": "Power Forward",
      "5": "Center",
    };
    return positions[value] || "";
  };

  const checkJerseyNumber = async (teamId: string, jerseyNumber: string) => {
    try {
      const res = await fetch(
        `http://localhost:8081/check-jersey?team_id=${teamId}&jersey_number=${jerseyNumber}`
      );
      const data = await res.json();
      return data.taken;
    } catch (err) {
      console.error("Fehler beim Jersey-Check:", err);
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const isTaken = await checkJerseyNumber(teamId as string, jerseyNumber);
    if (isTaken) {
      alert("❌ Diese Trikotnummer ist in diesem Team bereits vergeben!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8081/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          jersey_number: parseInt(jerseyNumber),
          position: mapPosition(position),
          height: parseInt(height),
          weight: parseInt(weight),
          experience_years: parseInt(experience),
          team_id: parseInt(teamId as string),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`❌ Fehler: ${data.error || "Speichern fehlgeschlagen."}`);
        return;
      }

      alert("✅ Spieler erfolgreich hinzugefügt!");
      router.push(`/team-overview/${teamId}`);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      alert("❌ Fehler beim Speichern.");
    }
  };

  useEffect(() => {
    if (!username) return setUsernameSuggestions([]);
    const fetchUsernames = async () => {
      try {
        const res = await fetch(`http://localhost:8081/usernames?q=${username}`);
        const data = await res.json();
        setUsernameSuggestions(data);
      } catch (err) {
        console.error("Fehler beim Abrufen der Usernames:", err);
      }
    };
    fetchUsernames();
  }, [username]);

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`http://localhost:8081/team-info/${teamId}`);
        const data = await res.json();
        setTeamInfo(data);
      } catch (err) {
        console.error("Fehler beim Laden der Teamdaten:", err);
      }
    };

    if (teamId) {
      fetchTeamInfo();
    }
  }, [teamId]);

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
          <h2><strong>New Player</strong></h2>
        </div>

        <form onSubmit={handleSubmit} className="create-player-form">
          <div className="form-group" style={{ position: "relative" }}>
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              autoComplete="off"
            />
            {usernameSuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {usernameSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setUsername(suggestion);
                      setUsernameSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
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
              <option value="1">Point Guard</option>
              <option value="2">Shooting Guard</option>
              <option value="3">Small Forward</option>
              <option value="4">Power Forward</option>
              <option value="5">Center</option>
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
            <button type="button" onClick={() => router.back()}>
              <strong>Back</strong>
            </button>
            <button type="submit">
              <strong>Submit</strong>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
