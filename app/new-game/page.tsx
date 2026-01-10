"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

const BACKEND = "http://localhost:8081";

type TeamRow = {
  id: number;
  name: string;
  logo_path?: string | null;
  color_hex?: string | null;
  head_coach?: string | null;
  assistant_coach?: string | null;
};

export default function NewGamePage() {
  const router = useRouter();

  // ✅ Login-Check
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) router.push("/login");
  }, [router]);

  const [date, setDate] = useState("");
  const [tipOff, setTipOff] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeSuggestions, setHomeSuggestions] = useState<string[]>([]);
  const [awaySuggestions, setAwaySuggestions] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [teams, setTeams] = useState<TeamRow[] | null>(null);

  const homeAbortRef = useRef<AbortController | null>(null);
  const awayAbortRef = useRef<AbortController | null>(null);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setVideoFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".webm"] },
    multiple: false,
  });

  // ✅ Teams einmalig laden (für Kanonisierung/Validierung)
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch(`${BACKEND}/teams`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (Array.isArray(data)) setTeams(data as TeamRow[]);
      } catch {
        // ignore
      }
    };
    loadTeams();
  }, []);

  const fetchTeamSuggestions = async (
    input: string,
    setter: (val: string[]) => void,
    abortRef: React.MutableRefObject<AbortController | null>
  ) => {
    const q = input.trim();
    if (!q) {
      setter([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${BACKEND}/teamnames?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        setter([]);
        return;
      }
      const data = await res.json().catch(() => []);
      setter(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Fehler beim Laden der Teamnamen:", err);
        setter([]);
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTeamSuggestions(homeTeam, setHomeSuggestions, homeAbortRef);
    }, 120);
    return () => clearTimeout(t);
  }, [homeTeam]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTeamSuggestions(awayTeam, setAwaySuggestions, awayAbortRef);
    }, 120);
    return () => clearTimeout(t);
  }, [awayTeam]);

  const normalizeTimeHHMMSS = (v: string) => {
    const s = (v ?? "").trim();
    if (!s) return "";
    // input[type=time] liefert meistens "HH:MM"
    if (/^\d{1,2}:\d{2}$/.test(s)) return `${s}:00`;
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
    return s;
  };

  const ensureTeamsLoaded = async () => {
    if (teams) return teams;
    try {
      const res = await fetch(`${BACKEND}/teams`);
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        setTeams(data as TeamRow[]);
        return data as TeamRow[];
      }
      return null;
    } catch {
      return null;
    }
  };

  // ✅ Eingabe -> DB-Team (case-insensitive, trim)
  const resolveTeam = (list: TeamRow[], input: string) => {
    const needle = input.trim().toLowerCase();
    if (!needle) return null;
    return list.find((t) => String(t.name).trim().toLowerCase() === needle) || null;
  };

  // ✅ Gym muss für Home Team existieren, aber checke über teamId (stabiler als Name)
  const ensureHomeGymExistsByTeamId = async (teamId: number, teamName: string) => {
    try {
      const gymRes = await fetch(`${BACKEND}/gym/${encodeURIComponent(String(teamId))}`);
      if (gymRes.status === 404) {
        return {
          ok: false as const,
          message:
            `Für "${teamName}" ist keine Halle (Gym) hinterlegt. ` +
            `Bitte zuerst eine Halle für dieses Team anlegen, sonst kann das Spiel nicht gespeichert werden.`,
        };
      }
      if (!gymRes.ok) {
        const payload = await gymRes.json().catch(() => ({} as any));
        return {
          ok: false as const,
          message: payload?.error || `Gym-Check fehlgeschlagen (Status ${gymRes.status}).`,
        };
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "Gym-Check nicht möglich (Backend nicht erreichbar?)." };
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setServerError(null);

    const d = date.trim();
    const t = normalizeTimeHHMMSS(tipOff);
    const hInput = homeTeam.trim();
    const aInput = awayTeam.trim();

    if (!d || !t || !hInput || !aInput) {
      setServerError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }
    if (hInput.toLowerCase() === aInput.toLowerCase()) {
      setServerError("Home Team und Away Team dürfen nicht gleich sein.");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ WICHTIG: Kanonische Teamnamen aus DB verwenden
      const list = await ensureTeamsLoaded();
      if (!list) {
        const msg = "Teams konnten nicht geladen werden (Backend?).";
        setServerError(msg);
        alert(msg);
        return;
      }

      const home = resolveTeam(list, hInput);
      if (!home) {
        const msg =
          `Home Team "${hInput}" existiert nicht exakt in der Datenbank. ` +
          `Bitte Team aus der Vorschlagsliste auswählen.`;
        setServerError(msg);
        alert(msg);
        return;
      }

      const away = resolveTeam(list, aInput);
      if (!away) {
        const msg =
          `Away Team "${aInput}" existiert nicht exakt in der Datenbank. ` +
          `Bitte Team aus der Vorschlagsliste auswählen.`;
        setServerError(msg);
        alert(msg);
        return;
      }

      // ✅ Optional: setze Inputs direkt auf DB-Name (damit UI konsistent ist)
      // (macht den Submit-Flow stabiler und verhindert Name-Mismatch im Backend)
      if (homeTeam !== home.name) setHomeTeam(home.name);
      if (awayTeam !== away.name) setAwayTeam(away.name);

      // ✅ Gym-Check über Team-ID
      const gymCheck = await ensureHomeGymExistsByTeamId(home.id, home.name);
      if (!gymCheck.ok) {
        setServerError(gymCheck.message);
        alert(gymCheck.message);
        return;
      }

      const formData = new FormData();
      formData.append("date", d);
      formData.append("tip_off", t); // HH:MM:SS
      // ✅ Sende kanonische Namen aus DB
      formData.append("home_team", home.name);
      formData.append("away_team", away.name);
      if (videoFile) formData.append("video", videoFile);

      const res = await fetch(`${BACKEND}/games`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await res.json().catch(() => null);
        alert("✅ Spiel erfolgreich angelegt!");
        router.push("/game-overview");
        return;
      }

      // ✅ Robust: 500 kann HTML/Text sein -> erst Text, dann versuchen JSON zu parsen
      const raw = await res.text().catch(() => "");
      let msg = `Fehler beim Anlegen des Spiels (Status ${res.status})`;
      try {
        const payload = raw ? JSON.parse(raw) : {};
        msg =
          payload?.error ||
          payload?.message ||
          payload?.details ||
          `Fehler beim Anlegen des Spiels (Status ${res.status})`;
      } catch {
        if (raw) msg = `${msg}: ${raw}`;
      }

      setServerError(msg);
      alert(msg);
    } catch (err) {
      console.error("Fehler:", err);
      const msg = "Verbindungsfehler (Backend nicht erreichbar?).";
      setServerError(msg);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-player-container">
      <div className="create-player-card">
        <div className="avatar-container">
          <img src="/logo.png" alt="Video Placeholder" className="avatar" />
          <h2>
            <strong>Neues Spiel</strong>
          </h2>
        </div>

        {serverError && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              background: "#fee2e2",
              color: "#7f1d1d",
              fontWeight: 700,
            }}
          >
            {serverError}
          </div>
        )}

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
                onClick={() => document.getElementById("logoFileInput")?.click()}
                disabled={submitting}
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

        <form className="create-player-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="form-label">Datum</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
              disabled={submitting}
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
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">Home Team</label>
            <input
              type="text"
              className="form-input"
              placeholder="z. B. Vienna Flames"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              autoComplete="off"
              required
              disabled={submitting}
            />
            {homeSuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {homeSuggestions.map((team, idx) => (
                  <li
                    key={`${team}-${idx}`}
                    onClick={() => {
                      // ✅ Wichtig: Klick setzt exakt den DB-Namen (aus /teamnames)
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
              placeholder="z. B. Graz Giants"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              autoComplete="off"
              required
              disabled={submitting}
            />
            {awaySuggestions.length > 0 && (
              <ul className="autocomplete-list">
                {awaySuggestions.map((team, idx) => (
                  <li
                    key={`${team}-${idx}`}
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
            <button type="button" onClick={() => router.back()} disabled={submitting}>
              Back
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
