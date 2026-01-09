"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import type { SketchPickerProps, ColorResult } from "react-color";

// ✅ Typ für SketchPicker an dynamic übergeben
const SketchPicker = dynamic<SketchPickerProps>(
  () => import("react-color").then((mod) => mod.SketchPicker),
  { ssr: false }
);

export default function NewTeamPage() {
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [headCoach, setHeadCoach] = useState("");
  const [assistantCoach, setAssistantCoach] = useState("");
  const [teamColor, setTeamColor] = useState("#3498DB");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState("");

  const [headSuggestions, setHeadSuggestions] = useState<string[]>([]);
  const [assistantSuggestions, setAssistantSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
    }
  }, [router]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setLogoFile(file);
      setPreviewSrc(URL.createObjectURL(file));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif"] },
    multiple: false,
  });

  const handleSelectFile = () => {
    document.getElementById("logoFileInput")?.click();
  };

  const fetchSuggestions = async (query: string, setter: (v: string[]) => void) => {
    if (!query) return setter([]);
    try {
      const res = await fetch(`http://localhost:8081/usernames?q=${query}`);
      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error("Fehler beim Abrufen der Vorschläge:", err);
    }
  };

  useEffect(() => {
    fetchSuggestions(headCoach, setHeadSuggestions);
  }, [headCoach]);

  useEffect(() => {
    fetchSuggestions(assistantCoach, setAssistantSuggestions);
  }, [assistantCoach]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("teamName", teamName);
    formData.append("headCoach", headCoach);
    formData.append("assistantCoach", assistantCoach);
    formData.append("teamColor", teamColor);

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      const res = await fetch("http://localhost:8081/teams", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/new-gym?teamId=${data.id}`);
      } else {
        alert(data.error || "❌ Fehler beim Speichern");
      }
    } catch (err) {
      console.error("Fehler:", err);
      alert("Verbindungsfehler");
    }
  };

  const handleExit = () => {
    router.back();
  };

  return (
    <div className="new-team-container">
      {/* Logo */}
      <div className="logo-container">
        <img
          src={previewSrc || "/logo.png"}
          alt="Team Logo"
          className="team-logo"
        />
      </div>

      <h2><strong>Team Logo</strong></h2>

      <div {...getRootProps({ className: "dropzone" })}>
        <input id="logoFileInput" {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>
            Drag & Drop file here
            <br /><br /><strong>or</strong><br /><br />
            <button type="button" onClick={handleSelectFile}>Browse Files</button>
          </p>
        )}
      </div>

      {logoFile && (
        <p className="selected-info">
          ✅ Logo ausgewählt: <strong>{logoFile.name}</strong>
        </p>
      )}

      {/* Team Name */}
      <div className="team-name-container">
        <label htmlFor="teamName">Team Name</label>
        <input
          id="teamName"
          type="text"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>

      {/* Head Coach */}
      <div className="team-name-container" style={{ position: "relative" }}>
        <label htmlFor="headCoach">Head Coach</label>
        <input
          id="headCoach"
          type="text"
          placeholder="Head Coach (Username)"
          value={headCoach}
          onChange={(e) => setHeadCoach(e.target.value)}
          autoComplete="off"
        />
        {headSuggestions.length > 0 && (
          <ul className="autocomplete-list">
            {headSuggestions.map((s, idx) => (
              <li
                key={idx}
                onClick={() => {
                  setHeadCoach(s);
                  setHeadSuggestions([]);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assistant Coach */}
      <div className="team-name-container" style={{ position: "relative" }}>
        <label htmlFor="assistantCoach">Assistant Coach</label>
        <input
          id="assistantCoach"
          type="text"
          placeholder="Assistant Coach (Username)"
          value={assistantCoach}
          onChange={(e) => setAssistantCoach(e.target.value)}
          autoComplete="off"
        />
        {assistantSuggestions.length > 0 && (
          <ul className="autocomplete-list">
            {assistantSuggestions.map((s, idx) => (
              <li
                key={idx}
                onClick={() => {
                  setAssistantCoach(s);
                  setAssistantSuggestions([]);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Team Color */}
      <div className="team-color-container">
        <h2><strong>Team Colour</strong></h2>
        <div className="picker-wrapper">
          <SketchPicker
            color={teamColor}
            onChangeComplete={(color: ColorResult) => setTeamColor(color.hex)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="button-group">
        <button type="button" onClick={handleExit}>Exit</button>
        <button type="button" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}
  