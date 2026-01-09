"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type Props = {
  teamId: string;
};

export default function TeamHeader({ teamId }: Props) {
  const [teamInfo, setTeamInfo] = useState<any>(null);

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`http://localhost:8081/team-info/${teamId}`);
        const data = await res.json();
        setTeamInfo(data);
      } catch (err) {
        console.error("Fehler beim Laden der Teamdaten:", err);
      }
    };

    if (teamId) {
      fetchTeamInfo();
    }
  }, [teamId]);

  return (
    <div className="teams-header">
      <div className="teams-header-inner">
        <Image
          src={teamInfo?.logo_url ? encodeURI(teamInfo.logo_url) : "/logo.png"}
          alt="Team Logo"
          width={100}
          height={100}
          className="teams-header-logo"
        />
        <h1 className="teams-header-title">Roster</h1>
        <p className="teams-header-subtitle">
          <span className="font-semibold">Head Coach:</span> {teamInfo?.head_coach_fullname || "Lade..."} &nbsp;|&nbsp;
          <span className="font-semibold">Ass. Coach:</span> {teamInfo?.assistant_coach_fullname || "Lade..."} &nbsp;|&nbsp;
          <span className="font-semibold">Team:</span> {teamInfo?.team_name || "Unbekannt"}
        </p>
      </div>
    </div>
  );
}
