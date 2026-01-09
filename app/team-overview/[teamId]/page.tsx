"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaTrash, FaEdit } from "react-icons/fa";
import TeamHeader from "../../components/TeamHeader";

export default function TeamOverviewPage() {
  const router = useRouter();
  const { teamId } = useParams();

  const [players, setPlayers] = useState<any[]>([]);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [userIsCoach, setUserIsCoach] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // ✅ Login-Check bei Seitenaufruf
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUsername(storedUser);
    }
  }, [router]);

  const toFeetInches = (cm: number) => {
    const inchesTotal = cm / 2.54;
    const feet = Math.floor(inchesTotal / 12);
    const inches = Math.round(inchesTotal % 12);
    return `${feet}'${inches}`;
  };

  const toPounds = (kg: number) => {
    return `${Math.round(kg * 2.20462)} lbs`;
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`http://localhost:8081/players?team_id=${teamId}`);
        const data = await res.json();
        setPlayers(data);

        const usernames = data.map((p: any) => p.username).join(",");
        if (usernames) {
          const nameRes = await fetch(`http://localhost:8081/player-names?usernames=${usernames}`);
          const nameData = await nameRes.json();
          setPlayerNames(nameData);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Spieler:", err);
      }
    };

    if (teamId) {
      fetchPlayers();
    }
  }, [teamId]);

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!username || !teamId) return;
      try {
        const res = await fetch("http://localhost:8081/teams");
        const teams = await res.json();
        const thisTeam = teams.find((t: any) => t.id.toString() === teamId);
        if (thisTeam) {
          const isCoach = thisTeam.head_coach === username || thisTeam.assistant_coach === username;
          setUserIsCoach(isCoach);
        }
      } catch (err) {
        console.error("Fehler beim Prüfen der Coach-Rolle:", err);
      }
    };

    fetchUserTeam();
  }, [username, teamId]);

  const handleEdit = (id: number) => {
    router.push(`/edit-player/${teamId}/${id}`);
  };

  const handleDelete = async (id: number, playerName: string) => {
    const confirmDelete = window.confirm(`Willst du wirklich ${playerName} aus dem Roster cutten?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:8081/player/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Löschen");

      alert("✅ Spieler gelöscht!");
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      alert("❌ Fehler beim Löschen");
    }
  };

  const handleViewStats = (id: number) => {
    router.push(`/player/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-6 py-10">
      <TeamHeader teamId={teamId as string} />

      <div className="header-tabellen-container w-full max-w-6xl mt-6 mb-2 flex justify-start gap-4">
        {userIsCoach && (
          <>
            <button
              className="add-player-button"
              onClick={() => router.push(`/new-player/${teamId}`)}
            >
              + Add Player
            </button>

            <button
              className="edit-gym-button"
              onClick={() => router.push(`/edit-gym/${teamId}`)}
            >
              Edit Gym
            </button>
          </>
        )}

        <button
          className="team-stats-button"
          onClick={() => router.push(`/team-stats/${teamId}`)}
        >
            Team Stats
        </button>
        <button className="back-button" onClick={() => router.back()}>
          Zurück
        </button>
        <button
          className="home-page-button"
          onClick={() => router.push("/home")}
        >
          Home
        </button>
      </div>

      <div className="overflow-x-auto w-full max-w-6xl mt-10">
        <table className="w-full table-auto border border-gray-300 bg-white shadow-md rounded-md">
          <thead className="bg-blue-100 text-left text-sm font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-2">Player</th>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Position</th>
              <th className="px-4 py-2">Height</th>
              <th className="px-4 py-2">Weight</th>
              <th className="px-4 py-2">Experience</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-t border-gray-200 text-sm">
                <td className="px-4 py-2">
                  {playerNames[player.username] || player.username}
                </td>
                <td className="px-4 py-2">{player.jersey_number}</td>
                <td className="px-4 py-2">{player.position}</td>
                <td className="px-4 py-2">
                  {player.height} cm / {toFeetInches(player.height)}
                </td>
                <td className="px-4 py-2">
                  {player.weight} kg / {toPounds(player.weight)}
                </td>
                <td className="px-4 py-2">{player.experience_years}</td>
                <td className="px-4 py-2">
                  <div className="action-buttons flex gap-2">
                    {userIsCoach && (
                      <>
                        <FaEdit
                          className="edit-icon cursor-pointer"
                          onClick={() => handleEdit(player.id)}
                        />
                        <FaTrash
                          className="delete-icon cursor-pointer"
                          onClick={() => handleDelete(player.id, playerNames[player.username] || player.username)}
                        />
                      </>
                    )}
                    <button className="stats-btn" onClick={() => handleViewStats(player.id)} title="View Stats">
                      📊
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
