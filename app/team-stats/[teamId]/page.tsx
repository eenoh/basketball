"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TeamHeader from "../../components/TeamHeader";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function TeamStatsPage() {
  const { teamId } = useParams();
  const router = useRouter();

  const [username, setUsername] = useState<string | null>(null);
  const [positionStats, setPositionStats] = useState<Record<string, number>>({});
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const positionOrder = [
    "Point Guard",
    "Shooting Guard",
    "Small Forward",
    "Power Forward",
    "Center",
  ];

  // ✅ Login-Check bei Aufruf
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUsername(storedUser);
    }
  }, [router]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`http://localhost:8081/players?team_id=${teamId}`);
        const data = await res.json();

        const counts: Record<string, number> = {};
        for (const player of data) {
          const position = player.position || "Unbekannt";
          counts[position] = (counts[position] || 0) + 1;
        }
        setPositionStats(counts);

        const dummyStats = data.map((player: any, i: number) => ({
          name: player.username,
          mp: `${30 - i}:${10 + i}`,
          fg: 7 - i,
          fga: 15 - i,
          fg_pct: (45 - i).toFixed(2),
          tp: 2 - (i % 2),
          tpa: 5 - (i % 2),
          tp_pct: (40 - i).toFixed(2),
          ft: 3 + i,
          fta: 4 + i,
          ft_pct: (75 - i * 3).toFixed(2),
          orb: 1 + (i % 2),
          drb: 3 + (i % 2),
          trb: 4 + (i % 2),
          ast: 2 + (i % 3),
          blk: i % 2,
          tov: 1 + (i % 2),
          pf: 1 + (i % 2),
          pst: 19 - i * 2,
          plus_minus: `+${5 - i}`,
        }));

        setPlayerStats(dummyStats);
      } catch (error) {
        console.error("Fehler beim Laden der Spieler:", error);
      }
    };

    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`http://localhost:8081/team-info/${teamId}`);
        const data = await res.json();
        setTeamInfo(data);
      } catch (error) {
        console.error("Fehler beim Laden der Teamdaten:", error);
      }
    };

    if (teamId) {
      fetchPlayers();
      fetchTeamInfo();
    }
  }, [teamId]);

  const chartData = {
    labels: positionOrder,
    datasets: [
      {
        label: "Anzahl Spieler",
        data: positionOrder.map((pos) => positionStats[pos] || 0),
        backgroundColor: teamInfo?.color_hex || "#3B82F6",
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  const sortedPlayers = [...playerStats].sort((a, b) => {
    if (!sortColumn) return 0;
    const dir = sortDirection === "asc" ? 1 : -1;
    return a[sortColumn] > b[sortColumn] ? dir : -dir;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-6 py-10">
      <TeamHeader teamId={teamId as string} />

      {/* Diagramm im stylischen Box-Container */}
      <div className="w-full max-w-5xl mt-10">
        <Bar data={chartData} options={chartOptions} height={300} />
      </div>

      <div className="w-full max-w-5xl mt-10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px] border border-gray-300 bg-white shadow-md rounded-md text-center">
            <thead className="bg-blue-100 text-gray-700">
              <tr>
                {[
                  "Player", "MP", "FG", "FGA", "FG%", "3P", "3PA", "3P%", "FT", "FTA",
                  "FT%", "ORB", "DRB", "TRB", "AST", "BLK", "TOV", "PF", "PST", "+/-"
                ].map((label) => (
                  <th
                    key={label}
                    onClick={() => handleSort(label.toLowerCase())}
                    className="px-1 py-1 whitespace-nowrap cursor-pointer"
                  >
                    {label}
                  </th>
                ))}
                <th className="px-1 py-1 whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p, i) => (
                <tr key={i} className="border-t border-gray-200 text-gray-700">
                  <td className="px-1 py-1">{p.name}</td>
                  <td className="px-1 py-1">{p.mp}</td>
                  <td className="px-1 py-1">{p.fg}</td>
                  <td className="px-1 py-1">{p.fga}</td>
                  <td className="px-1 py-1">{p.fg_pct}%</td>
                  <td className="px-1 py-1">{p.tp}</td>
                  <td className="px-1 py-1">{p.tpa}</td>
                  <td className="px-1 py-1">{p.tp_pct}%</td>
                  <td className="px-1 py-1">{p.ft}</td>
                  <td className="px-1 py-1">{p.fta}</td>
                  <td className="px-1 py-1">{p.ft_pct}%</td>
                  <td className="px-1 py-1">{p.orb}</td>
                  <td className="px-1 py-1">{p.drb}</td>
                  <td className="px-1 py-1">{p.trb}</td>
                  <td className="px-1 py-1">{p.ast}</td>
                  <td className="px-1 py-1">{p.blk}</td>
                  <td className="px-1 py-1">{p.tov}</td>
                  <td className="px-1 py-1">{p.pf}</td>
                  <td className="px-1 py-1">{p.pst}</td>
                  <td className="px-1 py-1">{p.plus_minus}</td>
                  <td className="px-1 py-1">
                    <button className="text-blue-600 hover:underline">Spiele</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
