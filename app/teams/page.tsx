"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PageHeader from "../components/PageHeader";


interface Team {
  id: number;
  name: string;
  head_coach: string;
  assistant_coach: string;
  logo_path: string | null;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [coachNames, setCoachNames] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("http://localhost:8081/teams");
        const data = await res.json();
        setTeams(data);

        const usernames = [
          ...new Set(data.flatMap((team: Team) => [team.head_coach, team.assistant_coach]))
        ].join(",");

        const namesRes = await fetch(`http://localhost:8081/player-names?usernames=${usernames}`);
        const namesData = await namesRes.json();
        setCoachNames(namesData);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      }
    };

    fetchTeams();
  }, []);

return (
  <div className="min-h-screen bg-slate-100 flex flex-col items-center px-6 py-10">
    {/* Header */}
    <PageHeader title="Alle Teams" subtitle="Übersicht der AI-Referee Teams" />

    {/* Buttons */}
    <div className="header-tabellen-container w-full mt-6 mb-2 flex justify-start gap-4">
      <button className="team-stats-button" onClick={() => router.back()}>
        Zurück
      </button>
      <button className="home-page-button" onClick={() => router.push("/home")}>
        Home
      </button>
    </div>

    {/* Tabelle in voller Breite */}
    <div className="overflow-x-auto w-full mt-4">
      <table className="w-full bg-white shadow-md rounded-md border border-gray-300">
        <thead className="bg-blue-100 text-sm text-gray-700">
          <tr>
            <th className="px-4 py-3 text-left">Logo</th>
            <th className="px-4 py-3 text-left">Teamname</th>
            <th className="px-4 py-3 text-left">Head Coach</th>
            <th className="px-4 py-3 text-left">Assistant Coach</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr
              key={team.id}
              className="border-t border-gray-200 text-sm hover:bg-slate-50 cursor-pointer"
              onDoubleClick={() => router.push(`/team-overview/${team.id}`)}
            >
              <td className="px-4 py-3">
                <img
                  src={team.logo_path ? `http://localhost:8081${team.logo_path}` : "/logo.png"}
                  alt={team.name}
                  className="team-logo-small"
                />
              </td>
              <td className="px-4 py-3 font-semibold text-blue-800">{team.name}</td>
              <td className="px-4 py-3">{coachNames[team.head_coach] || team.head_coach}</td>
              <td className="px-4 py-3">{coachNames[team.assistant_coach] || team.assistant_coach}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
}