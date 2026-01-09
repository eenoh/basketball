"use client";

import React, { useState } from "react";
import axios from 'axios';
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const formData = {
      vorname: firstName,
      nachname: lastName,
      geburtsdatum: birthday,
      email,
      username,
      passwort: password,
    };

    try {
      const res = await axios.post("http://localhost:8081/signup", formData);
      console.log("Form data submitted:", res.data);
      localStorage.setItem("username", username);
      router.push("/home");
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError("Dieser Username ist bereits vergeben.");
      } else {
        setError("Registrierung fehlgeschlagen. Bitte versuche es später erneut.");
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="avatar-container">
          <img src="/logo.png" alt="App-Logo" className="avatar" />
          <h1><strong>Sign Up</strong></h1>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder="Vorname"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={{ textAlign: "center" }}
          />
          <input
            type="text"
            placeholder="Nachname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={{ textAlign: "center" }}
          />
          <input
            type={birthday ? "date" : "text"}
            placeholder="Geburtsdatum"
            value={birthday}
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => !e.target.value && (e.target.type = "text")}
            onChange={(e) => setBirthday(e.target.value)}
            required
            style={{ textAlign: "center" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ textAlign: "center" }}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ textAlign: "center" }}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit">
            <strong>Sign Up</strong>
          </button>
        </form>

        <div className="login-hint">
          <p>
            Ich habe bereits ein Konto! <a href="/login"><strong>Log in</strong></a>
          </p>
        </div>
      </div>
    </div>
  );
}
