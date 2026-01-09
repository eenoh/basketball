"use client";
import { useEffect, useMemo, useState } from "react";

// Fallback-Pfade, falls im Backend kein Logo hinterlegt ist
const FALLBACK_LOGOS = {
  "Shadow Hawks":   "/team-logos/shadow-hawks.png",
  "Blazing Titans": "/team-logos/blazing-titans.png",
  "Vienna Flames":  "/team-logos/vienna-flames.png",
  Shadowclaw:       "/team-logos/shadowclaw.png",
};
const API_BASE = "http://localhost:8081";

export default function ScoreboardPage() {
  const [data] = useState({
    timeLeft: "02:33",
    quarter: 4,
    homeTeam: "Vienna Flames",
    awayTeam: "Shadowclaw",
    homeScore: 74,
    awayScore: 82,
    possession: "Shadowclaw",
    homeFouls: 2,
    awayFouls: 1,
    homeTimeouts: 1,
    awayTimeouts: 3,
  });

  const [timestamp, setTimestamp] = useState("");
  const [logos, setLogos] = useState({
    home: FALLBACK_LOGOS[data.homeTeam] ?? "/team-logos/default.png",
    away: FALLBACK_LOGOS[data.awayTeam] ?? "/team-logos/default.png",
  });

  // Uhrzeit für "Letzte Aktualisierung"
  useEffect(() => {
    setTimestamp(new Date().toLocaleTimeString());
  }, []);

  // Logos korrekt aus dem Backend auflösen (per /teams → logo_path)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/teams`);
        const list = await res.json();

        const home = list.find((t) => t.name === data.homeTeam);
        const away = list.find((t) => t.name === data.awayTeam);

        setLogos({
          home:
            home?.logo_path
              ? `${API_BASE}${home.logo_path}`
              : FALLBACK_LOGOS[data.homeTeam] ?? "/team-logos/default.png",
          away:
            away?.logo_path
              ? `${API_BASE}${away.logo_path}`
              : FALLBACK_LOGOS[data.awayTeam] ?? "/team-logos/default.png",
        });
      } catch (_) {
        // Fallbacks bleiben aktiv
      }
    })();
  }, [data.homeTeam, data.awayTeam]);

  const homeHasBall = data.possession === data.homeTeam;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Zeit + Viertel darunter */}
        <div style={styles.clockWrap}>
          <div style={styles.clock}>{data.timeLeft}</div>
          <div style={styles.quarterBelow}>Viertel: {data.quarter}</div>
        </div>

        {/* Teams + Scores */}
        <div style={styles.centerRow}>
          {/* Home */}
          <div style={{ ...styles.teamCol, ...(homeHasBall ? styles.possGlow : {}) }}>
            <div style={styles.logoWrap}>
              <img src={logos.home} alt={`${data.homeTeam} Logo`} style={styles.logo} />
            </div>
            <div style={styles.teamName}>{data.homeTeam}</div>
            <div style={styles.score}>{data.homeScore}</div>
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Fouls</div>
                <div style={styles.metaValue}>{data.homeFouls}</div>
              </div>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Timeouts</div>
                <div style={styles.metaValue}>{data.homeTimeouts}</div>
              </div>
            </div>
          </div>

          {/* Middle */}
          <div style={styles.vsCol}>
            <div style={styles.vsText}>VS.</div>
            <div
              style={{
                ...styles.possBadge,
                background: homeHasBall ? "#d1fae5" : "#fee2e2",
                color: homeHasBall ? "#065f46" : "#7f1d1d",
              }}
              title="Ballbesitz"
            >
              <span style={{ fontSize: 16, marginRight: 6 }}>🏀</span>
              Ballbesitz: <strong style={{ marginLeft: 6 }}>{data.possession}</strong>
            </div>
          </div>

          {/* Away */}
          <div style={{ ...styles.teamCol, ...(!homeHasBall ? styles.possGlow : {}) }}>
            <div style={styles.logoWrap}>
              <img src={logos.away} alt={`${data.awayTeam} Logo`} style={styles.logo} />
            </div>
            <div style={styles.teamName}>{data.awayTeam}</div>
            <div style={styles.score}>{data.awayScore}</div>
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Timeouts</div>
                <div style={styles.metaValue}>{data.awayTimeouts}</div>
              </div>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Fouls</div>
                <div style={styles.metaValue}>{data.awayFouls}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          Letzte Aktualisierung:&nbsp;<span>{timestamp}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px 20px",
    background:
      "radial-gradient(1200px 600px at 10% -10%, #e6f0ff 0%, transparent 60%), radial-gradient(1200px 600px at 110% 110%, #ffe6f0 0%, transparent 60%), #f1f5f9",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 20,
    padding: "28px 28px 22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
    border: "1px solid #e5e7eb",
  },
  clockWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 14,
  },
  clock: {
    fontSize: 56,
    lineHeight: 1,
    letterSpacing: 1,
    fontWeight: 800,
    color: "#0f172a",
  },
  quarterBelow: {
    marginTop: 6,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: 700,
    fontSize: 14,
  },
  centerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 220px 1fr",
    gap: 18,
    alignItems: "center",
    padding: "6px 0 2px",
  },
  teamCol: {
    borderRadius: 16,
    padding: "18px 16px",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 14px rgba(2,8,23,0.05)",
    textAlign: "center",
  },
  possGlow: {
    boxShadow: "0 0 0 3px #e2e8f0 inset, 0 12px 22px rgba(2,8,23,0.07)",
  },
  logoWrap: {
    width: 96,
    height: 96,
    margin: "0 auto 10px",
    borderRadius: "50%",
    border: "2px solid #0f172a",
    overflow: "hidden",
    background: "#fff",
  },
  logo: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  teamName: { fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.15 },
  score: { fontSize: 58, fontWeight: 800, color: "#0f172a", marginBottom: 8 },
  metaRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 },
  metaItem: { background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 8px" },
  metaLabel: { fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 2 },
  metaValue: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  vsCol: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  vsText: { fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#334155" },
  possBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px dashed rgba(2,6,23,0.25)",
    fontWeight: 700,
    fontSize: 14,
  },
  footer: { textAlign: "center", marginTop: 18, fontSize: 13, color: "#64748b" },
};
