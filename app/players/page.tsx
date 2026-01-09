// pages/players.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../components/PageHeader";

interface Player {
  id: number;
  username: string;
  height: number;
  weight: number;
  jersey_number: number;
  position: string;
  experience_years: number;
  team_id: number;
}

interface Team {
  id: number;
  name: string;
  logo_path: string;
}

type SortKey = keyof Player | "team_name" | "display_name";
type SortDirection = "asc" | "desc";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Record<number, Team>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("display_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playerRes = await fetch("http://localhost:8081/players");
        const playerData = await playerRes.json();
        setPlayers(playerData);

        const usernames = playerData.map((p) => p.username).join(",");
        if (usernames) {
          const nameRes = await fetch(`http://localhost:8081/player-names?usernames=${usernames}`);
          const nameData = await nameRes.json();
          setPlayerNames(nameData);
        }

        const teamRes = await fetch("http://localhost:8081/teams");
        const teamData = await teamRes.json();

        const teamMap: Record<number, Team> = {};
        teamData.forEach((team: Team) => {
          teamMap[team.id] = team;
        });

        setTeams(teamMap);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      }
    };

    fetchData();
  }, []);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const getValue = (player: Player): string | number => {
      if (sortKey === "team_name") return teams[player.team_id]?.name || "";
      if (sortKey === "display_name") return playerNames[player.username] || player.username;
      return player[sortKey];
    };

    const aVal = getValue(a);
    const bVal = getValue(b);

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    } else {
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-6 py-10">
      <PageHeader title="Alle Spieler" subtitle="Übersicht aller aktiven Spieler" />

      <div className="w-full max-w-6xl">
        <div className="header-tabellen-container max-w-6xl">
          <button className="team-stats-button" onClick={() => router.back()}>
            Zurück
          </button>
          <button className="home-page-button" onClick={() => router.push("/home")}>
          Home
          </button>
        </div>

          <div className="w-full max-w-6xl mx-auto overflow-x-auto mt-4 px-10">
          <table className="w-full bg-white border border-gray-300 shadow-md rounded-md">
            <thead className="bg-blue-100 text-sm text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("display_name")}>Spielername</th>
                <th className="px-4 py-3 text-center"></th>
                <th className="px-4 py-3 text-center cursor-pointer" onClick={() => handleSort("team_name")}>Team</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("jersey_number")}>#</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("position")}>Position</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("height")}>Größe</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("weight")}>Gewicht</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleSort("experience_years")}>Erfahrung</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => {
                const team = teams[player.team_id];
                const fullName = playerNames[player.username] || player.username;

                return (
                  <tr key={player.id} className="border-t border-gray-200 text-sm hover:bg-slate-50">
                    <td className="px-4 py-3">{fullName}</td>
                    <td className="px-4 py-3 text-center">
                      {team?.logo_path && (
                        <img
                          src={`http://localhost:8081${team.logo_path}`}
                          alt={`${team.name} Logo`}
                          className="team-logo-small"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-800">
                      {team?.name || "Unbekannt"}
                    </td>
                    <td className="px-4 py-3">{player.jersey_number}</td>
                    <td className="px-4 py-3">{player.position}</td>
                    <td className="px-4 py-3">{player.height} cm</td>
                    <td className="px-4 py-3">{player.weight} kg</td>
                    <td className="px-4 py-3">{player.experience_years}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
