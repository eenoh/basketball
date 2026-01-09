"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "../../../../components/PageHeader";

type TeamInfo = { id: number; name: string; logo_path?: string | null };
type RosterEntry = {
  player_id: number;
  username: string;
  jersey_number: number;
  position: number;
  is_starting: 0 | 1;
  full_name?: string; // ⬅️ neu
};
type GameRosterDetailed = {
  home: { team_name: string; logo_path?: string | null; starters: RosterEntry[]; bench: RosterEntry[] };
  away: { team_name: string; logo_path?: string | null; starters: RosterEntry[]; bench: RosterEntry[] };
};

const API_BASE = "http://localhost:8081";

export default function EditSuggestionPage() {
  const router = useRouter();
  const { gameId, id } = useParams<{ gameId: string; id: string }>();

  // Nur editierbare Felder (keine Auto-/Default-Felder)
  const defaults = useMemo(
    () => ({
      action_type: "Dreipunktwurf-Versuch",
      quarter: 2 as number | null,
      mmss: "07:23",
      event_time_seconds: 7 * 60 + 23,
      home_team_id: null as number | null,
      away_team_id: null as number | null,
      player_id: null as number | null,
      suggestion_text: "Dreipunktwurf-Versuch für Alex",
      detail_json: "",
      corrected_text: ""
    }),
    []
  );
  const [form, setForm] = useState(defaults);

  const [teams, setTeams] = useState<{ home?: TeamInfo; away?: TeamInfo }>({});
  const [players, setPlayers] = useState<RosterEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // 1) Spiel-Roster laden
        const res = await fetch(`${API_BASE}/game-roster-detailed/${gameId}`);
        const data: GameRosterDetailed = await res.json();

        // 2) Teams auflösen (IDs)
        const teamsRes = await fetch(`${API_BASE}/teams`);
        const allTeams: TeamInfo[] = await teamsRes.json();

        const home = allTeams.find(t => t.name === data.home.team_name);
        const away = allTeams.find(t => t.name === data.away.team_name);
        setTeams({ home, away });

        // 3) Spielerliste zusammenführen
        const allPlayers = [
          ...data.home.starters, ...data.home.bench,
          ...data.away.starters, ...data.away.bench
        ];

        // 4) Vollnamen über /player-names auflösen
        const usernames = Array.from(new Set(allPlayers.map(p => p.username))); // unique
        if (usernames.length > 0) {
          const namesRes = await fetch(
            `${API_BASE}/player-names?usernames=${encodeURIComponent(usernames.join(","))}`
          );
          const nameMap: Record<string, string> = await namesRes.json();

          // full_name zuordnen
          allPlayers.forEach(p => {
            p.full_name = nameMap[p.username] ?? p.username;
          });
        }

        setPlayers(allPlayers);

        // 5) Defaults sinnvoll vorbelegen
        setForm(prev => ({
          ...prev,
          home_team_id: prev.home_team_id ?? home?.id ?? null,
          away_team_id: prev.away_team_id ?? away?.id ?? null,
          player_id: prev.player_id ?? (allPlayers[0]?.player_id ?? null)
        }));
      } catch (_) {
        // Fallbacks belassen
      }
    })();
  }, [gameId]);

  // helpers
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const parseMmssToSeconds = (mmss: string) => {
    const m = /^\s*(\d{1,2}):([0-5]\d)\s*$/.exec(mmss);
    if (!m) return null;
    const minutes = parseInt(m[1], 10);
    const seconds = parseInt(m[2], 10);
    return minutes * 60 + seconds;
  };

  useEffect(() => {
    const secs = parseMmssToSeconds(form.mmss);
    setForm(p => ({ ...p, event_time_seconds: (secs ?? null) as any }));
  }, [form.mmss]);

  const onHover = (el: HTMLButtonElement, up = true) => {
    el.style.transform = up ? "translateY(-2px)" : "translateY(0)";
    el.style.boxShadow = up ? "0 10px 20px rgba(0,0,0,.12)" : "0 1px 2px rgba(0,0,0,.15)";
  };

  const save = async () => {
    if (!form.action_type) {
      alert("Bitte einen Aktionstyp auswählen.");
      return;
    }
    const payload = {
      game_id: Number(gameId),
      action_type: form.action_type,
      quarter: form.quarter ?? null,
      event_time_seconds: form.event_time_seconds ?? null,
      home_team_id: form.home_team_id ?? null,
      away_team_id: form.away_team_id ?? null,
      player_id: form.player_id ?? null,
      suggestion_text: form.suggestion_text || null,
      detail_json: form.detail_json || null,
      corrected_text: form.corrected_text || null
    };

    try {
      // TODO: echten PUT-Endpoint verwenden (Demo unten)
      // const res = await fetch(`${API_BASE}/event-suggestions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      // if (!res.ok) throw new Error(await res.text());
      console.log("PUT payload", payload);
      alert(`Vorschlag #${id} gespeichert (Demo)`);
      router.push(`/proposal/${gameId}`);
    } catch (e: any) {
      alert("Speichern fehlgeschlagen: " + (e?.message ?? e));
    }
  };

  return (
    <div className="game-overview-container" style={{ paddingBottom: 24 }}>
      <PageHeader title="Vorschlag korrigieren" subtitle={`Vorschlag #${id} bearbeiten`} />

      <div className="header-tabellen-container flex gap-4 mb-6">
        <button className="team-stats-button"
          onMouseEnter={(e)=>onHover(e.currentTarget)} onMouseLeave={(e)=>onHover(e.currentTarget,false)}
          onClick={()=>router.back()}>
          Zurück
        </button>
        <button className="home-page-button"
          onMouseEnter={(e)=>onHover(e.currentTarget)} onMouseLeave={(e)=>onHover(e.currentTarget,false)}
          onClick={()=>router.push("/home")}>
          Home
        </button>
      </div>

      <div style={{
        maxWidth: 900, margin: "0 auto", background:"#fff", borderRadius:12,
        border:"1px solid #e5e7eb", boxShadow:"0 10px 25px rgba(0,0,0,0.08)", padding:24
      }}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          {/* action_type */}
          <div>
            <label style={lbl}>Aktionstyp *</label>
            <select value={form.action_type} onChange={e=>set("action_type", e.target.value)} style={input}>
              <option>Dreipunktwurf-Versuch</option>
              <option>Dreipunktwurf-Erfolgreich</option>
              <option>Zweipunktwurf-Versuch</option>
              <option>Zweipunktwurf-Erfolgreich</option>
              <option>Freiwurf-Versuch</option>
              <option>Freiwurf-Erfolgreich</option>
              <option>Assist</option>
              <option>Rebound</option>
              <option>Steal</option>
              <option>Block</option>
              <option>Foul</option>
              <option>Turnover</option>
              <option>Auszeit</option>
            </select>
          </div>

          {/* quarter */}
          <div>
            <label style={lbl}>Viertel</label>
            <input type="number" min={1} max={5} value={form.quarter ?? ""} onChange={e=>set("quarter", e.target.value === "" ? null : Number(e.target.value))} style={input}/>
          </div>

          {/* event_time_seconds via mm:ss */}
          <div>
            <label style={lbl}>Restzeit (mm:ss)</label>
            <input value={form.mmss} onChange={e=>set("mmss", e.target.value)} style={input}/>
            <div style={{fontSize:12, color:"#64748b", marginTop:4}}>
              Intern: {form.event_time_seconds ?? "—"} Sekunden
            </div>
          </div>

          {/* player (mit Vor- & Nachname) */}
          <div>
            <label style={lbl}>Spieler</label>
            <select
              value={form.player_id ?? ""}
              onChange={e=>set("player_id", e.target.value === "" ? null : Number(e.target.value))}
              style={input}
            >
              <option value="">— keiner —</option>
              {players.map(p => (
                <option key={p.player_id} value={p.player_id}>
                  #{p.jersey_number} {p.full_name ?? p.username}
                </option>
              ))}
            </select>
          </div>

          {/* home_team_id */}
          <div>
            <label style={lbl}>Heimteam</label>
            <select
              value={form.home_team_id ?? ""}
              onChange={e=>set("home_team_id", e.target.value === "" ? null : Number(e.target.value))}
              style={input}
            >
              <option value="">— kein Heimteam —</option>
              {teams.home && <option value={teams.home.id}>{teams.home.name}</option>}
            </select>
          </div>

          {/* away_team_id */}
          <div>
            <label style={lbl}>Auswärtsteam</label>
            <select
              value={form.away_team_id ?? ""}
              onChange={e=>set("away_team_id", e.target.value === "" ? null : Number(e.target.value))}
              style={input}
            >
              <option value="">— kein Auswärtsteam —</option>
              {teams.away && <option value={teams.away.id}>{teams.away.name}</option>}
            </select>
          </div>

          {/* suggestion_text */}
          <div style={{ gridColumn:"1 / -1" }}>
            <label style={lbl}>Kurzbeschreibung</label>
            <input value={form.suggestion_text} onChange={e=>set("suggestion_text", e.target.value)} style={input}/>
          </div>


          <button
            onClick={save}
            onMouseEnter={(e)=>onHover(e.currentTarget)} onMouseLeave={(e)=>onHover(e.currentTarget,false)}
            style={{background:"#22c55e", color:"#fff", padding:"10px 16px", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer"}}
          >
            Speichern
          </button>
          <button
            onClick={()=>router.push(`/proposal/${gameId}`)}
            onMouseEnter={(e)=>onHover(e.currentTarget)} onMouseLeave={(e)=>onHover(e.currentTarget,false)}
            style={{background:"#9ca3af", color:"#fff", padding:"10px 16px", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer"}}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display:"block", fontWeight:700, marginBottom:6, color:"#334155" };
const input: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #e5e7eb",
  outline:"none"
};
