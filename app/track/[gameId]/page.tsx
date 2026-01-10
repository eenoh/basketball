"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PlayerRow = {
  player_id?: number;
  id?: number;
  username: string;
  jersey_number?: number | null;
  is_starting?: boolean | null;

  game_roster_id?: number;

  mp?: string | null;
  fg?: number | null;
  fga?: number | null;
  three_p?: number | null;
  three_pa?: number | null;
  ft?: number | null;
  fta?: number | null;
  orb?: number | null;
  drb?: number | null;
  trb?: number | null;
  ast?: number | null;
  blk?: number | null;
  stl?: number | null;
  tov?: number | null;
  pf?: number | null;
  pst?: number | null;
};

type RosterSide = {
  team_name: string;
  logo_path?: string;
  starters: PlayerRow[];
  bench: PlayerRow[];
};

type RosterDetailedResponse = {
  home: RosterSide;
  away: RosterSide;
};

type StatKey =
  | "mp"
  | "fg"
  | "fga"
  | "three_p"
  | "three_pa"
  | "ft"
  | "fta"
  | "orb"
  | "drb"
  | "trb"
  | "ast"
  | "blk"
  | "stl"
  | "tov"
  | "pf"
  | "pst";

type StatState = {
  mp: string;
  fg: number;
  fga: number;
  three_p: number;
  three_pa: number;
  ft: number;
  fta: number;
  orb: number;
  drb: number;
  trb: number;
  ast: number;
  blk: number;
  stl: number;
  tov: number;
  pf: number;
  pst: number;
};

const BACKEND = "http://localhost:8081";
const SAVE_BULK_ENDPOINT = `${BACKEND}/player-stats/bulk-upsert`;

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
function safeInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function normalizeMp(mp: string) {
  const trimmed = (mp || "").trim();
  if (!trimmed) return "00:00:00";

  // "MM:SS" -> "00:MM:SS"
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [mm, ss] = trimmed.split(":");
    return `00:${String(mm).padStart(2, "0")}:${ss}`;
  }

  // "HH:MM:SS"
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    const [hh, mm, ss] = trimmed.split(":");
    return `${String(hh).padStart(2, "0")}:${mm}:${ss}`;
  }

  // "MM" -> "00:MM:00"
  if (/^\d{1,3}$/.test(trimmed)) return `00:${String(trimmed).padStart(2, "0")}:00`;

  return "00:00:00";
}

function getPlayerId(p: PlayerRow): number | null {
  const id = p.player_id ?? p.id;
  return typeof id === "number" ? id : null;
}

/** --- MP helpers (UX) --- **/
function mpToSeconds(mp: string) {
  const s = normalizeMp(mp);
  const parts = s.split(":").map((x) => safeInt(x));
  const [hh, mm, ss] = parts.length === 3 ? parts : [0, 0, 0];
  return hh * 3600 + mm * 60 + ss;
}
function secondsToMp(totalSeconds: number) {
  const clamped = Math.max(0, Math.min(totalSeconds, 8 * 3600)); // max 8h (sicher)
  const hh = Math.floor(clamped / 3600);
  const rest = clamped % 3600;
  const mm = Math.floor(rest / 60);
  const ss = rest % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function prettyMp(mp: string) {
  const s = normalizeMp(mp);
  const [hh, mm, ss] = s.split(":");
  if (hh === "00") return `${mm}:${ss}`; // MM:SS
  return `${hh}:${mm}:${ss}`; // HH:MM:SS fallback
}

export default function TrackPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [home, setHome] = useState<RosterSide | null>(null);
  const [away, setAway] = useState<RosterSide | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);

  const [statsByPlayer, setStatsByPlayer] = useState<Record<number, StatState>>({});
  const statsRef = useRef<Record<number, StatState>>({});
  useEffect(() => {
    statsRef.current = statsByPlayer;
  }, [statsByPlayer]);

  const [dirtyPlayers, setDirtyPlayers] = useState<Set<number>>(new Set());
  const dirtyRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    dirtyRef.current = dirtyPlayers;
  }, [dirtyPlayers]);

  const [savingCount, setSavingCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const saveTimers = useRef<Record<number, any>>({});

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BACKEND}/game-roster-detailed/${gameId}`);
        if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
        const data: RosterDetailedResponse = await res.json();

        const allPlayers = [
          ...data.home.starters,
          ...data.home.bench,
          ...data.away.starters,
          ...data.away.bench,
        ];

        const usernames = allPlayers.map((p) => p.username).join(",");
        const nameRes = await fetch(`${BACKEND}/player-names?usernames=${encodeURIComponent(usernames)}`);
        const names = await nameRes.json();
        setNameMap(names || {});

        setHome(data.home);
        setAway(data.away);

        const next: Record<number, StatState> = {};
        for (const p of allPlayers) {
          const pid = getPlayerId(p);
          if (!pid) continue;

          const orb = safeInt(p.orb ?? 0);
          const drb = safeInt(p.drb ?? 0);

          next[pid] = {
            mp: normalizeMp(String(p.mp ?? "00:00")),
            fg: clampNonNegative(safeInt(p.fg ?? 0)),
            fga: clampNonNegative(safeInt(p.fga ?? 0)),
            three_p: clampNonNegative(safeInt(p.three_p ?? 0)),
            three_pa: clampNonNegative(safeInt(p.three_pa ?? 0)),
            ft: clampNonNegative(safeInt(p.ft ?? 0)),
            fta: clampNonNegative(safeInt(p.fta ?? 0)),
            orb: clampNonNegative(orb),
            drb: clampNonNegative(drb),
            trb: clampNonNegative(safeInt(p.trb ?? (orb + drb))),
            ast: clampNonNegative(safeInt(p.ast ?? 0)),
            blk: clampNonNegative(safeInt(p.blk ?? 0)),
            stl: clampNonNegative(safeInt(p.stl ?? 0)),
            tov: clampNonNegative(safeInt(p.tov ?? 0)),
            pf: clampNonNegative(safeInt(p.pf ?? 0)),
            pst: clampNonNegative(safeInt(p.pst ?? 0)),
          };
        }

        setStatsByPlayer(next);
        setDirtyPlayers(new Set());

        const first = data.home.starters?.[0];
        const firstId = first ? getPlayerId(first) : null;
        if (firstId) setSelectedPlayerId(firstId);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, router]);

  const formatName = (username: string) => {
    const full = nameMap[username];
    if (!full) return username;
    const [vorname, ...rest] = full.split(" ");
    const nachname = rest.join(" ");
    return `${nachname} ${vorname?.[0] ?? ""}.`;
  };

  const allPlayers = useMemo(() => {
    const list: { side: "home" | "away"; role: "starter" | "bench"; p: PlayerRow }[] = [];
    if (home) {
      home.starters.forEach((p) => list.push({ side: "home", role: "starter", p }));
      home.bench.forEach((p) => list.push({ side: "home", role: "bench", p }));
    }
    if (away) {
      away.starters.forEach((p) => list.push({ side: "away", role: "starter", p }));
      away.bench.forEach((p) => list.push({ side: "away", role: "bench", p }));
    }
    return list;
  }, [home, away]);

  const playerIndex = useMemo(() => {
    const m = new Map<number, PlayerRow>();
    for (const item of allPlayers) {
      const pid = getPlayerId(item.p);
      if (pid) m.set(pid, item.p);
    }
    return m;
  }, [allPlayers]);

  const calcPoints = (s: StatState) => {
    const twoMade = Math.max(0, s.fg - s.three_p);
    return twoMade * 2 + s.three_p * 3 + s.ft;
  };

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPlayers;

    return allPlayers.filter(({ p }) => {
      const pid = getPlayerId(p);
      const s = pid ? statsByPlayer[pid] : null;
      const name = formatName(p.username).toLowerCase();
      const user = p.username.toLowerCase();
      const jersey = String(p.jersey_number ?? "");
      const pts = s ? String(calcPoints(s)) : "";
      return name.includes(q) || user.includes(q) || jersey.includes(q) || pts.includes(q);
    });
  }, [allPlayers, query, statsByPlayer]);

  const buildUpdatePayload = (pid: number) => {
    const s = statsRef.current[pid];
    const meta = playerIndex.get(pid);
    if (!s || !meta) return null;

    return {
      game_id: Number(gameId),
      player_id: pid,
      mp: normalizeMp(s.mp),
      fg: s.fg,
      fga: s.fga,
      three_p: s.three_p,
      three_pa: s.three_pa,
      ft: s.ft,
      fta: s.fta,
      orb: s.orb,
      drb: s.drb,
      trb: s.trb,
      ast: s.ast,
      blk: s.blk,
      stl: s.stl,
      tov: s.tov,
      pf: s.pf,
      pst: s.pst,
      game_roster_id: meta.game_roster_id ?? null,
    };
  };

  const saveOne = async (pid: number) => {
    const one = buildUpdatePayload(pid);
    if (!one) return;

    setSavingCount((c) => c + 1);
    setError(null);

    try {
      const res = await fetch(SAVE_BULK_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [one] }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Save failed (${res.status}): ${t}`);
      }

      setDirtyPlayers((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
      setLastSavedAt(new Date().toLocaleTimeString("de-DE"));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Fehler beim Speichern");
    } finally {
      setSavingCount((c) => Math.max(0, c - 1));
    }
  };

  const markDirtyAndAutoSave = (pid: number) => {
    setDirtyPlayers((prev) => {
      const next = new Set(prev);
      next.add(pid);
      return next;
    });

    if (saveTimers.current[pid]) clearTimeout(saveTimers.current[pid]);
    saveTimers.current[pid] = setTimeout(() => {
      saveOne(pid);
    }, 250);
  };

  // ✅ MP quick adjust by seconds
  const bumpMpSeconds = (pid: number, deltaSeconds: number) => {
    setStatsByPlayer((prev) => {
      const cur = prev[pid];
      if (!cur) return prev;
      const next = { ...prev };
      const curSec = mpToSeconds(cur.mp);
      const updated = secondsToMp(curSec + deltaSeconds);
      next[pid] = { ...cur, mp: updated };
      return next;
    });
    markDirtyAndAutoSave(pid);
  };

  const updateStat = (pid: number, key: StatKey, value: any) => {
    setStatsByPlayer((prev) => {
      const current = prev[pid];
      if (!current) return prev;

      const next = { ...prev };
      const row = { ...current };

      if (key === "mp") row.mp = normalizeMp(String(value));
      else (row as any)[key] = clampNonNegative(safeInt(value));

      if (key === "orb" || key === "drb") row.trb = clampNonNegative(row.orb + row.drb);

      if (key === "fg" && row.fg > row.fga) row.fga = row.fg;
      if (key === "fga" && row.fga < row.fg) row.fg = row.fga;

      if (key === "three_p" && row.three_p > row.three_pa) row.three_pa = row.three_p;
      if (key === "three_pa" && row.three_pa < row.three_p) row.three_p = row.three_pa;

      if (key === "ft" && row.ft > row.fta) row.fta = row.ft;
      if (key === "fta" && row.fta < row.ft) row.ft = row.fta;

      next[pid] = row;
      return next;
    });

    markDirtyAndAutoSave(pid);
  };

  const bump = (pid: number, key: StatKey, delta: number) => {
    setStatsByPlayer((prev) => {
      const cur = prev[pid];
      if (!cur) return prev;

      const next = { ...prev };
      const row = { ...cur };

      // MP wird NICHT hier gebumpt (wir haben bumpMpSeconds)
      if (key === "mp") {
        next[pid] = row;
        return next;
      }

      (row as any)[key] = clampNonNegative(safeInt((row as any)[key]) + delta);

      if (key === "fg" && row.fg > row.fga) row.fga = row.fg;
      if (key === "three_p" && row.three_p > row.three_pa) row.three_pa = row.three_p;
      if (key === "ft" && row.ft > row.fta) row.fta = row.ft;

      if (key === "orb" || key === "drb") row.trb = clampNonNegative(row.orb + row.drb);

      next[pid] = row;
      return next;
    });

    markDirtyAndAutoSave(pid);
  };

  const saveAll = async () => {
    const dirty = Array.from(dirtyRef.current);
    if (dirty.length === 0) return;

    setSavingCount((c) => c + 1);
    setError(null);

    try {
      const updates = dirty.map((pid) => buildUpdatePayload(pid)).filter(Boolean);

      const res = await fetch(SAVE_BULK_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Save failed (${res.status}): ${t}`);
      }

      setDirtyPlayers(new Set());
      setLastSavedAt(new Date().toLocaleTimeString("de-DE"));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Fehler beim Speichern");
    } finally {
      setSavingCount((c) => Math.max(0, c - 1));
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedPlayerId) return;

      const tag = (e.target as any)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const pid = selectedPlayerId;
      const k = e.key.toLowerCase();

      if (k === "a") return bump(pid, "ast", 1);
      if (k === "r") return bump(pid, "trb", 1);
      if (k === "o") return bump(pid, "orb", 1);
      if (k === "d") return bump(pid, "drb", 1);
      if (k === "t") return bump(pid, "tov", 1);
      if (k === "f") return bump(pid, "pf", 1);
      if (k === "b") return bump(pid, "blk", 1);
      if (k === "s") return bump(pid, "stl", 1);

      if (k === "1") return bump(pid, "fga", 1);
      if (k === "2") return bump(pid, "fg", 1);
      if (k === "3") return bump(pid, "three_pa", 1);
      if (k === "4") return bump(pid, "three_p", 1);
      if (k === "5") return bump(pid, "fta", 1);
      if (k === "6") return bump(pid, "ft", 1);

      // ✅ MP shortcuts
      if (k === "[") return bumpMpSeconds(pid, -15);
      if (k === "]") return bumpMpSeconds(pid, +15);

      if ((e.ctrlKey || e.metaKey) && k === "s") {
        e.preventDefault();
        saveAll().catch(console.error);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedPlayerId]);

  const selectedPlayer = selectedPlayerId ? playerIndex.get(selectedPlayerId) : null;
  const selectedStats = selectedPlayerId ? statsByPlayer[selectedPlayerId] : null;

  const headerTeam = (side: RosterSide | null, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {side?.logo_path ? (
        <img
          src={`${BACKEND}${side.logo_path}`}
          alt={`${label} Logo`}
          style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid black", objectFit: "cover" }}
        />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e5e7eb" }} />
      )}
      <div>
        <div style={{ fontWeight: 900, color: "#111827" }}>{side?.team_name ?? label}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      </div>
    </div>
  );

  const saving = savingCount > 0;

  return (
    <div style={{ backgroundColor: "#3f4a54", minHeight: "100vh", paddingTop: "1.5rem", paddingBottom: "2rem" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1rem" }}>
        <div
          style={{
            background: "#3f4a54",
            borderRadius: 10,
            padding: "1.6rem",
            color: "white",
            textAlign: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: "2px solid black",
              objectFit: "cover",
              marginBottom: 10,
              background: "white",
            }}
          />
          <h1 style={{ margin: 0, lineHeight: 1.1, fontSize: "1.6rem", fontWeight: 900 }}>Track Stats</h1>
          <p style={{ margin: "6px 0 0 0", opacity: 0.9 }}>Spiel #{gameId}</p>
        </div>

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            marginTop: 14,
            background: "#3f4a54",
            borderRadius: 10,
            padding: "12px 12px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.back()} style={btnDark}>
                Zurück
              </button>
              <button onClick={() => router.push(`/box-score/${gameId}`)} style={btnOutlineLight}>
                Box Score ansehen
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Spieler suchen (Name, #, Punkte)..."
                style={searchInpLight}
              />

              <span style={{ color: "white", fontSize: 12, opacity: 0.9 }}>
                {saving ? "speichert..." : dirtyPlayers.size === 0 ? "alles gespeichert" : `${dirtyPlayers.size} offen`}
                {lastSavedAt ? ` · ${lastSavedAt}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            background: "white",
            borderRadius: 10,
            padding: "1rem",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          {error && (
            <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: "#fee2e2", color: "#7f1d1d", fontWeight: 700 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#111827" }}>Lade Daten...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
              <div style={{ borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  {headerTeam(home, "Home")}
                  {headerTeam(away, "Away")}
                </div>

                <div style={{ padding: "0 12px 12px 12px" }}>
                  <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #cbd5e1" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#e2e8f0" }}>
                          <th style={th}>Spieler</th>
                          <th style={th}>MP</th>
                          <th style={th}>FG</th>
                          <th style={th}>FGA</th>
                          <th style={th}>3P</th>
                          <th style={th}>3PA</th>
                          <th style={th}>FT</th>
                          <th style={th}>FTA</th>
                          <th style={th}>REB</th>
                          <th style={th}>AST</th>
                          <th style={th}>STL</th>
                          <th style={th}>BLK</th>
                          <th style={th}>TOV</th>
                          <th style={th}>PF</th>
                          <th style={th}>PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.map(({ side, role, p }) => {
                          const pid = getPlayerId(p);
                          if (!pid) return null;
                          const s = statsByPlayer[pid];
                          if (!s) return null;

                          const points = calcPoints(s);
                          const isDirty = dirtyPlayers.has(pid);
                          const isSelected = selectedPlayerId === pid;

                          return (
                            <tr
                              key={`${side}-${role}-${pid}`}
                              onClick={() => setSelectedPlayerId(pid)}
                              style={{
                                borderBottom: "1px solid #cbd5e1",
                                cursor: "pointer",
                                background: isSelected ? "#f1f5f9" : "white",
                              }}
                            >
                              <td style={tdLeft}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <div
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 999,
                                      background: side === "home" ? "#2563eb" : "#f59e0b",
                                    }}
                                    title={side === "home" ? "Home" : "Away"}
                                  />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                      <span style={{ fontWeight: 900 }}>
                                        {p.jersey_number != null ? `#${p.jersey_number} ` : ""}
                                        {formatName(p.username)}
                                      </span>

                                      {role === "starter" && <span style={pillGray}>S</span>}
                                      {isDirty && <span style={pillWarn}>•</span>}
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{p.username}</div>
                                  </div>
                                </div>
                              </td>

                              {/* MP UX */}
                              <td style={td}>
                                <MiniTime
                                  value={s.mp}
                                  onMinus15={() => bumpMpSeconds(pid, -15)}
                                  onPlus15={() => bumpMpSeconds(pid, +15)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>

                              <td style={td}><MiniAdjust pid={pid} k="fg" v={s.fg} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="fga" v={s.fga} bump={bump} /></td>

                              <td style={td}><MiniAdjust pid={pid} k="three_p" v={s.three_p} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="three_pa" v={s.three_pa} bump={bump} /></td>

                              <td style={td}><MiniAdjust pid={pid} k="ft" v={s.ft} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="fta" v={s.fta} bump={bump} /></td>

                              <td style={td}><MiniAdjust pid={pid} k="trb" v={s.trb} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="ast" v={s.ast} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="stl" v={s.stl} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="blk" v={s.blk} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="tov" v={s.tov} bump={bump} /></td>
                              <td style={td}><MiniAdjust pid={pid} k="pf" v={s.pf} bump={bump} /></td>

                              <td style={td}><strong>{points}</strong></td>
                            </tr>
                          );
                        })}

                        {filteredPlayers.length === 0 && (
                          <tr>
                            <td colSpan={15} style={{ padding: 18, textAlign: "center", opacity: 0.7 }}>
                              Keine Spieler gefunden.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, color: "#111827" }}>
                    Shortcuts: <b>1</b>=FGA <b>2</b>=FG <b>3</b>=3PA <b>4</b>=3P <b>5</b>=FTA <b>6</b>=FT ·
                    <b>A</b>=AST <b>R</b>=REB <b>T</b>=TOV <b>F</b>=PF <b>S</b>=STL <b>B</b>=BLK ·
                    <b>[</b>=MP -15s <b>]</b>=MP +15s · <b>Ctrl+S</b>=Save
                  </div>
                </div>
              </div>

              <div style={{ position: "sticky", top: 120, alignSelf: "start" }}>
                <div style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>
                        {selectedPlayer ? formatName(selectedPlayer.username) : "Spieler auswählen"}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, color: "#111827" }}>
                        {selectedPlayer ? selectedPlayer.username : ""}
                      </div>
                    </div>
                  </div>

                  {selectedPlayer && selectedStats ? (
                    <>
                      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <StatCard label="PTS" value={calcPoints(selectedStats)} />
                        <StatCard label="FG" value={`${selectedStats.fg}/${selectedStats.fga}`} />
                        <StatCard label="3P" value={`${selectedStats.three_p}/${selectedStats.three_pa}`} />
                        <StatCard label="FT" value={`${selectedStats.ft}/${selectedStats.fta}`} />
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={panelTitle}>MP (einfach)</div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <button style={mpQuickBtn} onClick={() => bumpMpSeconds(selectedPlayerId!, -60)}>-1:00</button>
                          <button style={mpQuickBtn} onClick={() => bumpMpSeconds(selectedPlayerId!, +60)}>+1:00</button>
                          <button style={mpQuickBtn} onClick={() => bumpMpSeconds(selectedPlayerId!, -15)}>-0:15</button>
                          <button style={mpQuickBtn} onClick={() => bumpMpSeconds(selectedPlayerId!, +15)}>+0:15</button>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <button style={mpSmallBtn} onClick={() => updateStat(selectedPlayerId!, "mp", "00:00")}>0:00</button>
                          <button style={mpSmallBtn} onClick={() => bumpMpSeconds(selectedPlayerId!, +30)}>+0:30</button>
                          <div style={{ marginLeft: "auto", fontWeight: 900, color: "#111827", display: "flex", alignItems: "center" }}>
                            {prettyMp(selectedStats.mp)}
                          </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <input
                            value={prettyMp(selectedStats.mp)}
                            onChange={(e) => updateStat(selectedPlayerId!, "mp", e.target.value)}
                            style={mpInp}
                            placeholder="MM:SS"
                            inputMode="numeric"
                          />
                          <div style={{ fontSize: 12, opacity: 0.7, color: "#111827", marginTop: 6 }}>
                            Tipp: Nutze Buttons für Speed. Format: <b>MM:SS</b> (z.B. 12:34)
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={panelTitle}>Shooting</div>
                        <div style={grid2}>
                          <BigBtn onClick={() => bump(selectedPlayerId!, "fga", 1)} label="FGA +" sub="1" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "fg", 1)} label="FG +" sub="2" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "three_pa", 1)} label="3PA +" sub="3" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "three_p", 1)} label="3P +" sub="4" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "fta", 1)} label="FTA +" sub="5" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "ft", 1)} label="FT +" sub="6" />
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={panelTitle}>Other</div>
                        <div style={grid2}>
                          <BigBtn onClick={() => bump(selectedPlayerId!, "trb", 1)} label="REB +" sub="R" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "ast", 1)} label="AST +" sub="A" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "stl", 1)} label="STL +" sub="S" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "blk", 1)} label="BLK +" sub="B" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "tov", 1)} label="TOV +" sub="T" />
                          <BigBtn onClick={() => bump(selectedPlayerId!, "pf", 1)} label="PF +" sub="F" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8, color: "#111827" }}>
                      Klicke links auf einen Spieler.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.85, color: "white", textAlign: "center" }}>
          Hinweis: Speichern passiert automatisch nach kurzer Zeit. Minuten kannst du jetzt über MP-Buttons super schnell tracken.
        </div>
      </div>
    </div>
  );
}

/** MP mini component in table */
function MiniTime({
  value,
  onMinus15,
  onPlus15,
  onClick,
}: {
  value: string;
  onMinus15: () => void;
  onPlus15: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClick={onClick} style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
      <button onClick={onMinus15} style={miniBtn} title="-15s">-15</button>
      <div style={{ width: 52, textAlign: "center", fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
        {prettyMp(value)}
      </div>
      <button onClick={onPlus15} style={miniBtn} title="+15s">+15</button>
    </div>
  );
}

function MiniAdjust({
  pid,
  k,
  v,
  bump,
}: {
  pid: number;
  k: StatKey;
  v: number;
  bump: (pid: number, key: StatKey, delta: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          bump(pid, k, -1);
        }}
        style={miniBtn}
        disabled={v <= 0}
      >
        −
      </button>
      <div style={{ width: 22, textAlign: "center", fontWeight: 900, color: "#111827" }}>{v}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          bump(pid, k, 1);
        }}
        style={miniBtn}
      >
        +
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
      <div style={{ fontSize: 12, opacity: 0.75, color: "#111827" }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>{value}</div>
    </div>
  );
}

function BigBtn({ onClick, label, sub }: { onClick: () => void; label: string; sub?: string }) {
  return (
    <button onClick={onClick} style={bigBtn}>
      <div style={{ fontWeight: 900, color: "#111827" }}>{label}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.7, color: "#111827" }}>Key: {sub}</div>}
    </button>
  );
}

const th: React.CSSProperties = {
  padding: "10px 8px",
  fontSize: 12,
  borderBottom: "1px solid #cbd5e1",
  textAlign: "center",
  whiteSpace: "nowrap",
  color: "#111827",
  fontWeight: 900,
};

const td: React.CSSProperties = {
  padding: "8px 8px",
  fontSize: 13,
  textAlign: "center",
  whiteSpace: "nowrap",
  color: "#111827",
};

const tdLeft: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 13,
  textAlign: "left",
  whiteSpace: "nowrap",
  color: "#111827",
};

const miniBtn: React.CSSProperties = {
  height: 26,
  minWidth: 36,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
  fontWeight: 900,
  color: "#111827",
};

const searchInpLight: React.CSSProperties = {
  width: 280,
  maxWidth: "70vw",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(255,255,255,0.12)",
  color: "white",
  outline: "none",
};

const btnDark: React.CSSProperties = {
  padding: "0.55rem 1.2rem",
  borderRadius: 8,
  fontWeight: "bold",
  backgroundColor: "#1F2937",
  color: "white",
  cursor: "pointer",
  border: "none",
};

const btnOutlineLight: React.CSSProperties = {
  padding: "0.55rem 1.2rem",
  borderRadius: 8,
  fontWeight: "bold",
  backgroundColor: "transparent",
  color: "white",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.35)",
};

const pillGray: React.CSSProperties = {
  fontSize: 11,
  padding: "2px 7px",
  borderRadius: 999,
  background: "#e2e8f0",
  fontWeight: 900,
  color: "#111827",
};

const pillWarn: React.CSSProperties = {
  fontSize: 12,
  padding: "0 8px",
  borderRadius: 999,
  background: "#fde68a",
  fontWeight: 900,
  color: "#111827",
};

const panelTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 8,
  color: "#111827",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const bigBtn: React.CSSProperties = {
  padding: "12px 10px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  cursor: "pointer",
  textAlign: "left",
};

const mpInp: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  background: "white",
  color: "#111827",
  fontVariantNumeric: "tabular-nums",
};

const mpQuickBtn: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  cursor: "pointer",
  fontWeight: 900,
  color: "#111827",
  fontVariantNumeric: "tabular-nums",
};

const mpSmallBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
  fontWeight: 900,
  color: "#111827",
};
