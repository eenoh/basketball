"use client";

import React, { useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function VideoPage() {
  const lastTimeRef = useRef(0);
  const params = useParams();
  const router = useRouter();
  const gameId = params?.gameId;

  const [videoPath, setVideoPath] = useState("");

  // ✅ Login-Check
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`http://localhost:8081/game-video/${gameId}`);
        const data = await res.json();
        if (data?.video_path) {
          setVideoPath(`http://localhost:8081${data.video_path}`);
        } else {
          console.error("Kein Video gefunden für diese Game ID:", data);
        }
      } catch (err) {
        console.error("Fehler beim Laden des Videos:", err);
      }
    };

    if (gameId) {
      fetchVideo();
    }
  }, [gameId]);

  const handleOpenNewTab = (path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const handleBack = () => {
    const confirmLeave = window.confirm("Möchtest du die Seite wirklich verlassen?");
    if (confirmLeave) {
      window.location.href = "/game-overview";
    }
  };

  return (
    <div
      className="video-page-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div className="video-page-header" style={{ marginBottom: "1rem" }}>
        <img src="/logo.png" alt="Logo" className="video-page-avatar" />
      </div>

      <div className="video-frame" style={{ marginBottom: "2rem" }}>
        {videoPath ? (
          <video
            width="720"
            controls
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onSeeking={(e) => {
              const video = e.currentTarget;
              if (Math.abs(video.currentTime - lastTimeRef.current) > 0.01) {
                video.currentTime = lastTimeRef.current;
              }
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              if (!video.seeking) {
                lastTimeRef.current = video.currentTime;
              }
            }}
            style={{
              borderRadius: "1rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <source src={videoPath} type="video/mp4" />
            Dein Browser unterstützt das Video-Tag nicht.
          </video>
        ) : (
          <p>🎥 Lade Video ...</p>
        )}
      </div>

      <div
        className="video-button-group"
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => handleOpenNewTab(`/score-sheet/${gameId}`)}
          className="score-sheet-btn"
        >
          Score Sheet
        </button>
        <button
          onClick={() => handleOpenNewTab(`/box-score/${gameId}`)}
          className="boxscore-btn"
        >
          Box Score
        </button>
        <button
          onClick={() => handleOpenNewTab(`/game-analytics/${gameId}`)}
          className="analytics-btn"
        >
          Game Analytics
        </button>
        <button onClick={handleBack} className="back-btn-rounded">
          Spielübersicht
        </button>
      </div>
    </div>
  );
}
