  "use client";
  import React, { useMemo, useState } from "react";
  import { useRouter, useParams } from "next/navigation";
  import PageHeader from "../../components/PageHeader";

  type Proposal = {
    id: number;
    date: string;
    home: string;
    away: string;
    suggestion: string;
  };

  const COLORS = {
    orange: "#f59e0b",
    red: "#ef4444",
    headerBg: "#e2e8f0",
    rowBorder: "#e5e7eb",
  };

  export default function ProposalsPage() {
    const router = useRouter();
    const { gameId } = useParams<{ gameId: string }>();

    // Dummy Vorschläge
    const initialData: Proposal[] = useMemo(
      () => [
        { id: 1, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Rebound für Bedran" },
        { id: 2, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Dreipunktewurf-Versuch für Alex" },
        { id: 3, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Erfolgreicher Dreipunktwurf für Alex" },
        { id: 4, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Assist für Emmanuel" },
        { id: 5, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Steal von Lara" },
        { id: 6, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Block von Sofia" },
        { id: 7, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Layup getroffen von Jonas" },
        { id: 8, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Freiwurf getroffen von Mia" },
        { id: 9, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Offensivfoul von Felix" },
        { id: 10, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Turnover von Noah" },
        { id: 11, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Defensiv-Rebound von Emma" },
        { id: 12, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Zweipunktewurf getroffen von Ben" },
        { id: 13, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Assist für Lea" },
        { id: 14, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Dreipunktewurf-Versuch für Paul" },
        { id: 15, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Erfolgreicher Dreipunktwurf für Nina" },
        { id: 16, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "And-One von Luca (Korberfolg + Foul)" },
        { id: 17, date: "22.04.2025", home: "Blazing Titans", away: "Firefang", suggestion: "Auszeit von Coach Anna" },
      ],
      []
    );

    const [rows] = useState<Proposal[]>(initialData);

    const lift: React.CSSProperties = {
      transition: "transform .15s ease, box-shadow .15s ease",
      boxShadow: "0 1px 2px rgba(0,0,0,.15)",
    };

    const onHover = (el: HTMLButtonElement, up = true) => {
      el.style.transform = up ? "translateY(-2px)" : "translateY(0)";
      el.style.boxShadow = up ? "0 10px 20px rgba(0,0,0,.12)" : "0 1px 2px rgba(0,0,0,.15)";
    };

    return (
      <div className="game-overview-container" style={{ paddingBottom: 32 }}>
        <PageHeader
          title="Spiel Ereignisse"
          subtitle="Alle vorgeschlagenen Aktionen – bearbeiten oder löschen"
        />

        {/* gleiche Struktur wie vorher, nur Button rechts ergänzt */}
        <div className="header-tabellen-container flex gap-4 mb-6" style={{ alignItems: "center" }}>
          {/* Links: Zurück & Home */}
          <button
            className="team-stats-button"
            onMouseEnter={(e) => onHover(e.currentTarget)}
            onMouseLeave={(e) => onHover(e.currentTarget, false)}
            onClick={() => router.back()}
          >
            Zurück
          </button>

          <button
            className="home-page-button"
            onMouseEnter={(e) => onHover(e.currentTarget)}
            onMouseLeave={(e) => onHover(e.currentTarget, false)}
            onClick={() => router.push("/home")}
          >
            Home
          </button>

          {/* Rechts daneben: Statistik hinzufügen */}
          <div style={{ marginLeft: "auto" }}>
            <button
              style={{
                ...btnBase,
                ...lift,
                background: "#2563eb",
                padding: "10px 18px",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => onHover(e.currentTarget)}
              onMouseLeave={(e) => onHover(e.currentTarget, false)}
              onClick={() => router.push(`/proposal/${gameId}/statistics/new`)}
            >
              ➕ Statistik hinzufügen
            </button>
          </div>
        </div>

        <div
          style={{
            overflowX: "auto",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <table
            className="game-table"
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 0 }}
          >
            <thead style={{ background: COLORS.headerBg }}>
              <tr>
                <th style={thCentered}>Date</th>
                <th style={thCentered}>Matchup</th>
                <th style={thCentered}>Statistik</th>
                <th style={thCentered}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.rowBorder}` }}>
                  <td style={tdCentered}>{r.date}</td>
                  <td style={tdCentered}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 60px 1fr",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ textAlign: "right" }}>{r.home}</span>
                      <strong style={{ textAlign: "center", letterSpacing: 1 }}>VS.</strong>
                      <span style={{ textAlign: "left" }}>{r.away}</span>
                    </div>
                  </td>
                  <td style={tdCentered}>{r.suggestion}</td>
                  <td style={tdCentered}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Edit */}
                      <button
                        style={{ ...btnBase, ...lift, background: COLORS.orange }}
                        onMouseEnter={(e) => onHover(e.currentTarget)}
                        onMouseLeave={(e) => onHover(e.currentTarget, false)}
                        onClick={() => router.push(`/proposal/${gameId}/edit/${r.id}`)}
                      >
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        style={{ ...btnBase, ...lift, background: COLORS.red }}
                        onMouseEnter={(e) => onHover(e.currentTarget)}
                        onMouseLeave={(e) => onHover(e.currentTarget, false)}
                        onClick={() => router.push(`/proposal/${gameId}/reject/${r.id}`)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const thCentered: React.CSSProperties = {
    textAlign: "center",
    padding: "14px 16px",
    fontWeight: 700,
    color: "#1f2937",
    fontSize: 14,
    whiteSpace: "nowrap",
  };

  const tdCentered: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 14,
    color: "#111827",
    verticalAlign: "middle",
    textAlign: "center",
  };

  const btnBase: React.CSSProperties = {
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  };
