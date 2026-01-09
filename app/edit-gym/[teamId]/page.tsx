"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditGymPage() {
  const router = useRouter();
  const { teamId } = useParams();

  const [gym, setGym] = useState({
    name: "",
    address: "",
    postal_code: "",
    capacity: 0,
  });
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }

    const fetchGym = async () => {
      try {
        const res = await fetch(`http://localhost:8081/gym/${teamId}`);
        if (!res.ok) throw new Error("Halle nicht gefunden");
        const data = await res.json();
        setGym(data);
      } catch (err) {
        console.error("Fehler beim Laden der Halle:", err);
        alert("Fehler beim Laden der Halle");
        router.push(`/team-overview/${teamId}`);
      }
    };

    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`http://localhost:8081/team-info/${teamId}`);
        const data = await res.json();
        setTeamInfo(data);
      } catch (err) {
        console.error("Fehler beim Laden des Team-Logos:", err);
      }
    };

    if (teamId) {
      fetchGym();
      fetchTeamInfo();
      setLoading(false);
    }
  }, [teamId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGym((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8081/gym/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gym),
      });

      if (!res.ok) throw new Error("Fehler beim Speichern der Halle");
      alert("✅ Halle aktualisiert!");
      router.push(`/team-overview/${teamId}`);
    } catch (err) {
      console.error(err);
      alert("❌ Fehler beim Speichern");
    }
  };

  if (loading) return <p className="text-center mt-10">Lade Halle...</p>;

  return (
    <div className="create-player-container">
      <div className="create-player-card">
        <div className="avatar-container" style={{ textAlign: "center" }}>
          <img
            src={teamInfo?.logo_url || "/gym.png"}
            alt="Hallenlogo"
            className="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              marginBottom: "1rem",
              objectFit: "cover",
              backgroundColor: "#eee",
              border: "2px solid black",
            }}
          />
          <h2><strong>Edit Gym</strong></h2>
        </div>

        <form onSubmit={handleSubmit} className="create-player-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={gym.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">Adresse</label>
            <input
              type="text"
              id="address"
              name="address"
              value={gym.address}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="postal_code" className="form-label">Postleitzahl</label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={gym.postal_code}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="capacity" className="form-label">Kapazität</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={gym.capacity}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="button-group">
            <button type="button" onClick={() => router.back()}>Back</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
