"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScoreSheetPage() {
  const router = useRouter();

  // ✅ Login-Check
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="score-sheet-container">
      {/* Header-Bereich */}
      <header className="score-sheet-header">
        <div className="score-sheet-header-item">
          <strong>Gym:</strong> Siebenerschule
        </div>
        <div className="score-sheet-header-item">
          <strong>Date:</strong> 18.02.2025
        </div>
        <div className="score-sheet-header-item">
          <strong>Tip Off:</strong> 20:00
        </div>
      </header>

      <h1 className="score-sheet-title">Score Sheet</h1>

      {/* Teams-Bereich */}
      <div className="teams-section">
        {/* Home Team */}
        <div className="team-block home-team">
          <h2>Home Team: Thunder Raptors</h2>

          <div className="time-fouls-row">
            <div className="timeouts">
              <p><strong>Time Outs:</strong></p>
              <div className="box-row">
                {[...Array(5)].map((_, i) => <div className="box" key={i} />)}
              </div>
            </div>
            <div className="teamfouls">
              <p><strong>Teamfouls:</strong></p>
              <div className="box-row">
                {[...Array(5)].map((_, i) => <div className="box" key={i} />)}
              </div>
            </div>
          </div>

          <table className="player-table">
            <thead>
              <tr><th>Players</th></tr>
            </thead>
            <tbody>
              <tr><td>Jaylan Foster</td></tr>
              <tr><td>Sam Johnson</td></tr>
              <tr><td>...</td></tr>
            </tbody>
          </table>
        </div>

        {/* Away Team */}
        <div className="team-block away-team">
          <h2>Away Team: Iron Titans</h2>

          <div className="time-fouls-row">
            <div className="timeouts">
              <p><strong>Time Outs:</strong></p>
              <div className="box-row">
                {[...Array(5)].map((_, i) => <div className="box" key={i} />)}
              </div>
            </div>
            <div className="teamfouls">
              <p><strong>Teamfouls:</strong></p>
              <div className="box-row">
                {[...Array(5)].map((_, i) => <div className="box" key={i} />)}
              </div>
            </div>
          </div>

          <table className="player-table">
            <thead>
              <tr><th>Players</th></tr>
            </thead>
            <tbody>
              <tr><td>Damien Woods</td></tr>
              <tr><td>Andre Moore</td></tr>
              <tr><td>...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Score-Tabelle */}
      <div className="score-section">
        <h2>Score</h2>
        <table className="score-table">
          <thead>
            <tr>
              <th colSpan={10}>1. Halftime</th>
              <th colSpan={10}>2. Halftime</th>
              <th colSpan={10}>Overtime</th>
            </tr>
            <tr>
              <th colSpan={2}>Home</th>
              <th className="m-col" rowSpan={2}>M</th>
              <th colSpan={2}>Away</th>

              <th colSpan={2}>Home</th>
              <th className="m-col" rowSpan={2}>M</th>
              <th colSpan={2}>Away</th>

              <th colSpan={2}>Home</th>
              <th className="m-col" rowSpan={2}>M</th>
              <th colSpan={2}>Away</th>

              <th colSpan={2}>Home</th>
              <th className="m-col" rowSpan={2}>M</th>
              <th colSpan={2}>Away</th>

              <th colSpan={2}>Home</th>
              <th className="m-col" rowSpan={2}>M</th>
              <th colSpan={2}>Away</th>
            </tr>
            <tr>{/* Leerzeile für korrekte rowspan Darstellung */}</tr>
          </thead>
          <tbody>
            <tr>
              {/* Beispielzeile */}
              <td>10</td><td>2</td><td className="m-col">X</td><td>5</td><td>1</td>
              <td>10</td><td>2</td><td className="m-col">X</td><td>5</td><td>1</td>
              <td>10</td><td>2</td><td className="m-col">X</td><td>5</td><td>1</td>
              <td>10</td><td>2</td><td className="m-col">X</td><td>5</td><td>1</td>
              <td>10</td><td>2</td><td className="m-col">X</td><td>5</td><td>1</td>
            </tr>
            <tr>
              {/* Dummy-Zeile */}
              {Array.from({ length: 25 }).map((_, i) => (
                <td key={i}>...</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Quarter Points */}
      <div className="score-section">
        <h2>Quarter Points</h2>
        <table className="score-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Home</th>
              <th>Away</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1st Quarter</td><td>20</td><td>10</td></tr>
            <tr><td>2nd Quarter</td><td>13</td><td>20</td></tr>
            <tr><td>3rd Quarter</td><td>19</td><td>17</td></tr>
            <tr><td>4th Quarter</td><td>10</td><td>17</td></tr>
            <tr><td>Overtime</td><td>-</td><td>-</td></tr>
            <tr className="final-score">
              <td><strong>Total</strong></td>
              <td><strong>62</strong></td>
              <td><strong>64</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="score-sheet-footer">
        <h3>Match Officials</h3>
        <ul>
          <li><strong>Lead Referee:</strong> John Novak</li>
          <li><strong>Trail Referee:</strong> Ryan Caldwell</li>
          <li><strong>Score Keeper:</strong> Kevin Carter</li>
        </ul>

        <button
          className="back-btn"
          style={{
            display: "block",
            margin: "0 auto",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => window.history.back()}
        >
          Back
        </button>
      </div>
    </div>
  );
}
