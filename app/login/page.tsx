"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/config'; // zentrale Konstante importieren

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [passwort, setPasswort] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      console.log("API_BASE_URL:", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passwort }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem("username", username);
        router.push('/home');
      } else {
        setError(result.message || "Login fehlgeschlagen");
      }
    } catch (error) {
      console.error("Fehler beim Login: ", error);
      setError("Server nicht erreichbar");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="avatar-container">
          <img src="/logo.png" alt="App-Logo" className="avatar" />
          <h1><strong>Login</strong></h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ textAlign: 'center' }}
          />

          {/* Passwortfeld mit + / - Umschalter */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="passwort"
              placeholder="Passwort"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              required
              style={{
                textAlign: "center",
                width: "100%",
                paddingRight: "2.5rem"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#333",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }}
              aria-label="Toggle Passwort Sichtbarkeit"
            >
              {showPassword ? "–" : "+"}
            </button>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button type="submit"><strong>Login</strong></button>
        </form>

        <div className="signup-hint">
          <p>
            Noch kein Konto? <a href="/signup"><strong>Sign up</strong></a>
          </p>
        </div>
      </div>
    </div>
  );
}
