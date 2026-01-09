"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Person {
  id: number;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  email: string;
  username: string;
  passwort: string;
  signup_date: string;
}

export default function SignUpOverview() {
  const router = useRouter();
  const [data, setData] = useState<Person[]>([]);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
    } else if (username !== "eenoh") {
      router.push("/home");
    }
  }, [router]);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:8081/persons")
        .then((res) => res.json())
        .then((data) => setData(data))
        .catch((err) => {
          console.error(err);
          setError("Fehler beim Laden der Daten");
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const timeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals = [
      { label: "Monate", seconds: 2592000 },
      { label: "Wochen", seconds: 604800 },
      { label: "Tage", seconds: 86400 },
      { label: "Stunden", seconds: 3600 },
      { label: "Minuten", seconds: 60 },
      { label: "Sekunden", seconds: 1 },
    ];
    const found = intervals.find((i) => seconds >= i.seconds);
    if (!found) return "gerade eben";
    const count = Math.floor(seconds / found.seconds);
    return `${count} ${found.label}`;
  };

  const currentYear = new Date().getFullYear();
  const monthlyData = Array(12).fill(0);
  const weeklyData = Array(52).fill(0);

  data.forEach((person) => {
    const date = new Date(person.signup_date);
    if (date.getFullYear() === currentYear) {
      monthlyData[date.getMonth()]++;
      const week = Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
      if (week >= 1 && week <= 52) {
        weeklyData[week - 1]++;
      }
    }
  });

  const cumulativeData = monthlyData.reduce((acc, val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, [] as number[]);

  const cumulativeWeekly = weeklyData.reduce((acc, val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, [] as number[]);

  const lineData = {
    labels: viewMode === "month"
      ? ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
      : Array.from({ length: 52 }, (_, i) => `KW ${i + 1}`),
    datasets: [
      {
        label: "Registrierungen",
        data: viewMode === "month" ? monthlyData : weeklyData,
        borderColor: "#3498db",
        tension: 0.3,
      },
      {
        label: "Gesamte Nutzerzahl",
        data: viewMode === "month" ? cumulativeData : cumulativeWeekly,
        borderColor: "#e74c3c",
        tension: 0.3,
      },
    ],
  };

  const hourlyData = Array(24).fill(0);
  data.forEach((person) => {
    const hour = new Date(person.signup_date).getHours();
    hourlyData[hour]++;
  });

  const barData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{ label: "Registrierungen pro Stunde", data: hourlyData, backgroundColor: "#2ecc71" }],
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-6 py-10">
      <div className="analytics-header cursor-pointer" onClick={() => router.push("/home")}>
        <Image src="/logo.png" alt="Logo" className="analytics-logo" width={100} height={100} />
        <h1 className="analytics-title">Admin – Registrierte Nutzer</h1>
        <p className="analytics-subtitle">Alle SignUps der AI-Referee Plattform</p>
      </div>

      <div className="w-full max-w-6xl flex justify-between gap-6 mt-10">
        <div className="w-1/2 bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <tbody>
              <tr className="bg-slate-100">
                <th className="py-3 px-5 font-semibold text-gray-600 w-1/2">Anzahl Nutzer</th>
                <td className="py-3 px-5 text-blue-600 font-bold text-base">{data.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="w-1/2 bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <tbody>
              <tr className="bg-slate-100">
                <th className="py-3 px-5 font-semibold text-gray-600 w-1/2">Letzte Registrierung</th>
                <td className="py-3 px-5 text-green-700 font-bold text-base">
                  {data.length > 0 ? timeSince(new Date(Math.max(...data.map((p) => new Date(p.signup_date).getTime())))) : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h3>Registrierungen ({viewMode === "month" ? "Monate" : "Wochen"})</h3>
          <Line data={lineData} />
        </div>
        <div className="chart-box">
          <h3>Registrierungen nach Uhrzeit</h3>
          <Bar data={barData} />
        </div>
      </div>

      <div className="diagramm-wechsel">
        <button
          onClick={() => setViewMode(viewMode === "month" ? "week" : "month")}
          className="diagramm-button"
        >
          {viewMode === "month" ? "Monatlich" : "Wöchentlich"}
        </button>
      </div>

      <div className="overflow-x-auto w-full max-w-6xl mt-10 mb-16">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="w-full table-auto border border-gray-300 bg-white shadow-md rounded-md">
            <thead className="bg-blue-100 text-left text-sm font-semibold text-gray-700 mb-10">
              <tr>
                <th className="px-4 py-2">Vorname</th>
                <th className="px-4 py-2">Nachname</th>
                <th className="px-4 py-2">Geburtsdatum</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">SignUp Datum</th>
                <th className="px-4 py-2">SignUp Uhrzeit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-gray-200 text-sm">
                  <td className="px-4 py-2">{p.vorname}</td>
                  <td className="px-4 py-2">{p.nachname}</td>
                  <td className="px-4 py-2">{formatDate(p.geburtsdatum)}</td>
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">{p.username}</td>
                  <td className="px-4 py-2">{formatDate(p.signup_date)}</td>
                  <td className="px-4 py-2">{formatTime(p.signup_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/home")}
          className="home-button"
        >
          Home
        </button>
      </div>
    </div>
  );
}
