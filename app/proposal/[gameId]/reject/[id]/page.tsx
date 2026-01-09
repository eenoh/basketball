"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "../../../../components/PageHeader";

export default function RejectSuggestionPage() {
  const router = useRouter();
  const { gameId, id } = useParams<{ gameId: string; id: string }>();

  // Hover/Lift wie auf den anderen Buttons
  const onHover = (el: HTMLButtonElement, up = true) => {
    el.style.transform = up ? "translateY(-2px)" : "translateY(0)";
    el.style.boxShadow = up
      ? "0 10px 20px rgba(0,0,0,.12)"
      : "0 1px 2px rgba(0,0,0,.15)";
  };

  const doDelete = async () => {
    // TODO: hier später echten DELETE/PUT-Call auf dein Backend machen
    // await fetch(`/api/event-suggestions/${id}`, { method: "DELETE" })
    alert(`Vorschlag #${id} gelöscht (Demo)`);
    router.push(`/proposal/${gameId}`);
  };

  return (
    <div className="game-overview-container" style={{ paddingBottom: 32 }}>
      <PageHeader
        title="Vorschlag ablehnen"
        subtitle="Bitte bestätige das dauerhafte Entfernen des Vorschlags"
      />

      {/* Top-Buttons (wie gewohnt) */}
      <div className="header-tabellen-container flex gap-4 mb-6">
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
      </div>

      {/* Card mit leichten roten Akzenten */}
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #fee2e2",        // zarter Rotton
          boxShadow:
            "0 10px 25px rgba(2,8,23,0.06), inset 0 0 0 3px rgba(239,68,68,0.06)",
        }}
      >
        {/* Kopfzeile mit Icon + Titel */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background:
              "linear-gradient(180deg, #fff5f5 0%, #ffffff 60%)",
          }}
        >
          <div
            aria-hidden
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: 10,
              background: "#fee2e2",
              color: "#b91c1c",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              boxShadow: "inset 0 0 0 1px #fecaca",
            }}
          >
            !
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              Bist du sicher, dass du diesen Vorschlag löschen möchtest?
            </div>
            <div style={{ color: "#991b1b", fontSize: 14, marginTop: 2 }}>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </div>
          </div>
        </div>

        {/* Vorschlags-Vorschau (Beispiel – hier könntest du echte Daten rendern) */}
        <div style={{ padding: "18px 22px", display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
            <div style={label}>Vorschlag-ID</div>
            <div style={value}>#{String(id)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
            <div style={label}>Spiel</div>
            <div style={value}>Game #{String(gameId)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
            <div style={label}>Beschreibung</div>
            <div style={value}>
              Beispiel: „Dreipunktwurf-Versuch für Alex“ {/* Platzhalter */}
            </div>
          </div>
        </div>

        {/* Aktionen */}
        <div
          style={{
            padding: "16px 22px 22px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push(`/proposal/${gameId}`)}
            onMouseEnter={(e) => onHover(e.currentTarget)}
            onMouseLeave={(e) => onHover(e.currentTarget, false)}
            style={{
              ...btnBase,
              background: "#e5e7eb",
              color: "#111827",
            }}
          >
            Abbrechen
          </button>

          <button
            onClick={doDelete}
            onMouseEnter={(e) => onHover(e.currentTarget)}
            onMouseLeave={(e) => onHover(e.currentTarget, false)}
            style={{
              ...btnBase,
              background: "#ef4444", // rot
            }}
          >
            Vorschlag endgültig löschen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */
const label: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

const value: React.CSSProperties = {
  fontSize: 16,
  color: "#111827",
  fontWeight: 600,
};

const btnBase: React.CSSProperties = {
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  transition: "transform .15s ease, box-shadow .15s ease, background .15s ease",
  boxShadow: "0 1px 2px rgba(0,0,0,.15)",
};
