"use client";
//TODO implementiere input felder für referees und score table

import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

export default function NewGamePage() {
  const router = useRouter();

  // ✅ Login-Check
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
    }
  }, [router]);

  const [date, setDate] = useState("");
  const [tipOff, setTipOff] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeSuggestions, setHomeSuggestions] = useState<string[]>([]);
  const [awaySuggestions, setAwaySuggestions] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setVideoFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".webm"] },
    multiple: false,
  });

  const fetchTeamSuggestions = async (
    input: string,
    setter: (val: string[]) => void
  ) => {
    if (!input) {
      setter([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8081/teamnames?q=${input}`);
      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error("Fehler beim Laden der Teamnamen:", err);
    }
  };

  useEffect(() => {
    fetchTeamSuggestions(homeTeam, setHomeSuggestions);
  }, [homeTeam]);

  useEffect(() => {
    fetchTeamSuggestions(awayTeam, setAwaySuggestions);
  }, [awayTeam]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("date", date);
    formData.append("tip_off", tipOff);
    formData.append("home_team", homeTeam);
    formData.append("away_team", awayTeam);
    if (videoFile) {
      formData.append("video", videoFile);
    }

    try {
      const res = await fetch("http://localhost:8081/games", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Spiel erfolgreich angelegt!");
        router.push("/game-overview");
      } else {
        const error = await res.json();
        alert(error.message || "Fehler beim Anlegen des Spiels");
      }
    } catch (err) {
      console.error("Fehler:", err);
      alert("Verbindungsfehler");
    }
  };

  return (
    <div className="create-player-container">
      <div className="create-player-card">
        <div className="avatar-container">
          <img src="/logo.png" alt="Video Placeholder" className="avatar" />
          <h2><strong>Neues Spiel</strong></h2>
        </div>

        <label className="form-label">Game Video</label>
        <div {...getRootProps({ className: "dropzone" })}>
          <input id="logoFileInput" {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the file here ...</p>
          ) : (
            <p>
              Drag & Drop file here
              <br />
              <br />
              <strong>or</strong>
              <br />
              <br />
              <button
                type="button"
                onClick={() =>
                  document.getElementById("logoFileInput")?.click()
                }
              >
                Browse Files
              </button>
            </p>
          )}
        </div>

        {videoFile && (
          <p className="selected-info">
            ✅ Video ausgewählt: <strong>{videoFile.name}</strong>
          </p>
        )}

        <form
          className="create-player-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="form-group">
            <label className="form-label">Datum</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tip-Off (Uhrzeit)</label>
            <input
              type="time"
              className="form-input"
              value={tipOff}
              onChange={(e) => setTipOff(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">Home Team</label>
            <input
              type="text"
              className="form-input"
              placeholder="z. B. Vienna Flames"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              autoComplete="off"
              required
            />
            {homeSuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {homeSuggestions.map((team, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setHomeTeam(team);
                      setHomeSuggestions([]);
                    }}
                  >
                    {team}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">Away Team</label>
            <input
              type="text"
              className="form-input"
              placeholder="z. B. Graz Giants"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              autoComplete="off"
              required
            />
            {awaySuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {awaySuggestions.map((team, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setAwayTeam(team);
                      setAwaySuggestions([]);
                    }}
                  >
                    {team}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="button-group">
            <button type="button" onClick={() => router.back()}>
              Back
            </button>
            <button type="button" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
