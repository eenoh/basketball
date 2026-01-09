"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const [vorname, setVorname] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchVorname = async () => {
      const storedUsername = localStorage.getItem("username");
      if (!storedUsername) {
        router.push("/login");
        return;
      }
      setUsername(storedUsername);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vorname?username=${storedUsername}`
        );
        const data = await res.json();
        setVorname(data.vorname || storedUsername);
      } catch (err) {
        console.error("Fehler beim Laden des Vornamens:", err);
        setVorname(storedUsername);
      }
    };

    fetchVorname();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    router.push("/login");
  };

  const navigationItems = [
    { label: "Spiel Übersicht", path: "/game-overview" },
    ...(username === "eenoh" ? [{ label: "Neues Spiel", path: "/new-game" }] : []),
    ...(username === "eenoh" ? [{ label: "Neues Team", path: "/new-team" }] : []),
    { label: "Teams", path: "/teams" },
    { label: "Spieler", path: "/players" },
    ...(username === "eenoh" ? [{ label: "Signup Übersicht", path: "/signup-overview" }] : []),
  ];

  return (
    <>
      {sidebarOpen && (
        <aside
          style={{
            width: "250px",
            backgroundColor: "#1e293b",
            color: "white",
            padding: "2rem 1rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            transition: "width 0.3s ease",
            minHeight: "100vh",
          }}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              right: "-16px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              color: "white",
              borderRadius: "0 4px 4px 0",
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
            aria-label="Sidebar schließen"
          >
            «
          </button>

          <div>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  width: "60px",
                  borderRadius: "50%",
                  margin: "0 auto",
                  border: "2px solid black",
                }}
              />
              <h2 style={{ marginTop: "1rem", fontSize: "1.2rem", fontWeight: "bold" }}>
                AI Referee
              </h2>
            </div>

            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  textAlign: "left",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  borderRadius: "0.25rem",
                  fontWeight: "500",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#334155")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ paddingTop: "2rem" }}>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "white",
                textAlign: "left",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                borderRadius: "0.25rem",
                fontWeight: "500",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#334155")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              🔓 Logout
            </button>
          </div>
        </aside>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            color: "white",
            borderRadius: "0 4px 4px 0",
            padding: "0.25rem 0.5rem",
            cursor: "pointer",
            fontSize: "1.2rem",
            zIndex: 10,
          }}
          aria-label="Sidebar öffnen"
        >
          »
        </button>
      )}
    </>
  );
}
