"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function PlayerStatsPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:8081/player/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Laden");
        return res.json();
      })
      .then((data) => setPlayer(data))
      .catch((err) => {
        console.error(err);
        setError("Spielerdaten konnten nicht geladen werden.");
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-6">

      {/* Header mit Logo und Titel */}
      <div className="analytics-header">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="analytics-logo" />
        <h1 className="analytics-title">Spielerdaten    </h1>
        <p className="analytics-subtitle">Spielerstatistiken für ID {id}</p>
      </div>

      {/* Inhalt */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!player && !error && <p className="text-center text-slate-500">Lade Daten...</p>}

        {player && (
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-slate-700 text-sm sm:text-base">
            <p className="font-semibold">Name:</p>
            <p>{player.name}</p>

            <p className="font-semibold">Position:</p>
            <p>{player.position}</p>

            <p className="font-semibold">Nummer:</p>
            <p>{player.number}</p>

            <p className="font-semibold">Geburtstag:</p>
            <p>{player.birthdate}</p>

            <p className="font-semibold">Größe:</p>
            <p>{player.height}</p>

            <p className="font-semibold">Gewicht:</p>
            <p>{player.weight}</p>

            <p className="font-semibold">Erfahrung:</p>
            <p>{player.experience} Jahre</p>
          </div>
        )}
      </div>
    </div>
  );
}