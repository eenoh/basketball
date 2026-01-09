"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function NewGymPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [teamInfo, setTeamInfo] = useState(null);

  // ✅ Login-Check
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
    }
  }, [router]);

  // Teamdaten holen (z.B. Logo)
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`http://localhost:8081/team-info/${teamId}`);
        if (!res.ok) throw new Error("Team nicht gefunden");
        const data = await res.json();
        setTeamInfo(data);
      } catch (err) {
        console.error("Fehler beim Laden des Teams:", err);
      }
    };

    if (teamId) fetchTeam();
  }, [teamId]);

  const handleSubmit = async () => {
    const gym = {
      name,
      address,
      postal_code: postalCode,
      capacity,
      home_team_id: Number(teamId),
    };

    try {
      const res = await fetch("http://localhost:8081/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gym),
      });

      if (res.ok) {
        alert("✅ Halle erfolgreich erstellt!");
        router.push(`/team-overview/${teamId}`);
      } else {
        const error = await res.json();
        alert(error.message || "Fehler beim Anlegen der Halle");
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
          <img
            src={teamInfo?.logo_url || "/logo.png"}
            alt="Team Logo"
            className="avatar"
          />
          <h2><strong>Neue Halle</strong></h2>
        </div>

        <form className="create-player-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="z.B. Stadthalle Wien"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input
              type="text"
              className="form-input"
              placeholder="z.B. Vogelweiderstraße 72"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Postleitzahl</label>
            <input
              type="text"
              className="form-input"
              placeholder="z.B. 1150"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kapazität</label>
            <input
              type="number"
              className="form-input"
              placeholder="z.B. 3000"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
            />
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
