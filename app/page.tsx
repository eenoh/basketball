
export const metadata = {
  title: "Home Page",
  description: "Dies ist die öffentliche Home Page unserer AI-Referee App!",
};


import React from "react";
import Link from "next/link";

export default function HomePage() {
  // Array of objects representing each actor's benefits
  const actorBenefits = [
    {
      title: "Coaches",
      text: "Erhalte detaillierte Leistungsdaten deiner Spieler, um Trainingspläne individuell anzupassen. Analysiere gegnerische Strategien und erhalte Empfehlungen für taktische Verbesserungen.",
      image: "/coach_explained.svg", // Replace with your actual file.svg
    },
    {
      title: "Spieler",
      text: "Verfolge deine Fortschritte, vergleiche dich mit Teamkollegen und arbeite gezielt an deinen Schwächen. Erhalte Feedback zu Wurfauswahl, Ballkontrolle und Fitness.",
      image: "/player_focus.svg",
    },
    {
      title: "Referees",
      text: "Analysiere deine Entscheidungen, erkenne Muster bei Fouls und verbessere deine Regelkenntnisse. Optimiere dein Stellungsspiel und erhalte Tipps für mehr Sicherheit auf dem Feld.",
      image: "/ref_focus.svg",
    },
    {
      title: "Score Table",
      text: "Erfasse und verwalte Spielstände in Echtzeit, protokolliere Fouls und Time-outs fehlerfrei und stelle sicher, dass alle Daten korrekt im System erfasst werden. So behältst du stets den Überblick.",
      image: "/score_table_overview.svg",
    },
  ];

  return (
    <div className="home-page">
      {/* Gray Container */}
      <div className="home-container">
        {/* HEADER-BEREICH */}
        <div className="home-header">
          <img src="/logo.png" alt="App Logo" className="home-logo" />
          <h1>Willkommen bei unserer Basketball App</h1>
          <p>
            Entdecke die neuesten Statistiken, Trainingseinblicke und Analyse-Tools.
          </p>
          <div className="home-buttons">
            <Link href="/login">
              <button className="login-btn">Login</button>
            </Link>
            <Link href="/signup">
              <button className="signup-btn">Registrieren</button>
            </Link>
          </div>
        </div>

        {/* FEATURES-BEREICH */}
        <div className="features-section">
          <h2 className="featuresTitle">Unsere Features</h2>
          <p className="featuresText">
            Unsere App bietet spezielle Funktionen für Coaches, Spieler, Referees und Score Table-Mitarbeiter. Verfolge deine Statistiken, verbessere dein Training und analysiere Spiele in Echtzeit.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <img src="/coach.png" alt="Feature für Coaches" className="featureIcon" />
              <h3>Coaches</h3>
              <p>Optimiere deine Trainingspläne und analysiere die Spielstrategie.</p>
            </div>
            <div className="feature-card">
              <img src="/point_guard.png" alt="Feature für Spieler" className="featureIcon" />
              <h3>Spieler</h3>
              <p>Verfolge deine persönlichen Leistungen und verbessere deine Skills.</p>
            </div>
            <div className="feature-card">
              <img src="/referee.png" alt="Feature für Referees" className="featureIcon" />
              <h3>Referees</h3>
              <p>Analysiere deine Entscheidungen und verbessere deine Schiedsrichterfähigkeiten.</p>
            </div>
            <div className="feature-card">
              <img src="/scores_table.png" alt="Feature für Score Table" className="featureIcon" />
              <h3>Score Table</h3>
              <p>Erfasse und verwalte Spielstände in Echtzeit.</p>
            </div>
          </div>
        </div>

        {/* DETAILED EXPLANATION */}
         <div className="detailed-explanation">
      <h2>Wie hilft dir unsere App?</h2>
      <div className="actor-row">
        {/* Linke Spalte: Zentrierter Text für Coaches */}
        <div className="actor-text">
          <p>
            Unsere App bietet Coaches umfangreiche Vorteile, indem sie detaillierte Leistungsdaten
            der Spieler sammelt und visualisiert. Du kannst Trainingspläne individuell anpassen und
            deine taktischen Strategien optimieren. Die App ermöglicht es dir außerdem, vergangene
            Spiele zu analysieren, Stärken und Schwächen zu erkennen und gezielte Verbesserungsmaßnahmen
            abzuleiten – so hast du stets alle wichtigen Informationen im Blick.
          </p>
        </div>
        {/* Rechte Spalte: Bild-Platzhalter, der sich skaliert */}
        <div className="actor-image">
          <img src="/huddle.png" alt="Coach Illustration" />
        </div>
      </div>
     </div>

     <div className="actor-row reverse">
  {/* Linke Spalte: Bild-Platzhalter mit Kreisform */}
  <div className="actor-image">
    <img src="/improve.png" alt="Spieler Illustration" className="circle-image" />
  </div>
  {/* Rechte Spalte: Zentrierter Text für Spieler */}
  <div className="actor-text">
    <p>
      Mit unserer App kannst du deine Fortschritte verfolgen, dich mit Teamkollegen vergleichen und gezielt an deinen Schwächen arbeiten.
      Erhalte Feedback zu deiner Wurfauswahl, Stats und Overall Performance, um deine Leistung auf dem Spielfeld kontinuierlich zu verbessern.
    </p>
  </div>
</div>

<div className="detailed-explanation">
      <div className="actor-row">
        {/* Linke Spalte: Zentrierter Text für Coaches */}
        <div className="actor-text">
          <p>
            Als Schiedsrichter hast du die Möglichkeit, deine Entscheidungen zu analysieren und deine Regelkenntnisse
            zu vertiefen. Unsere App hilft dir dabei, Muster in deinen Calls zu erkennen, kritische Spielsituationen
            nachzuvollziehen und dein Stellungsspiel auf dem Feld zu verbessern. Optimiere deine Entscheidungsfindung
            und steigere deine Sicherheit bei jedem Pfiff.
          </p>
        </div>
        {/* Rechte Spalte: Bild-Platzhalter, der sich skaliert */}
        <div className="actor-image">
          <img src="/ref.png" alt="Referee" />
        </div>
      </div>
     </div>

     <div className="actor-row reverse">
  {/* Linke Spalte: Bild-Platzhalter mit Kreisform */}
  <div className="actor-image">
    <img src="/stat.png" alt="ScoreTable" className="circle-image" />
  </div>
  {/* Rechte Spalte: Zentrierter Text für Spieler */}
  <div className="actor-text">
    <p>
      Behalte den Überblick über das Spielgeschehen! Mit unserer App kannst du Spielstände in Echtzeit erfassen, Fouls
      und Time-outs fehlerfrei protokollieren und sicherstellen, dass alle relevanten Daten korrekt im System gespeichert
      werden. Arbeite effizienter mit Schiedsrichtern und Teams zusammen, um einen reibungslosen Ablauf während des Spiels
       zu gewährleisten.
    </p>
  </div>
</div>




        {/* FOOTER-BEREICH */}
        <div className="home-footer">
          <p>
            Mehr erfahren? Nach der Anmeldung erhältst du umfangreiche Funktionen, detaillierte Statistiken und interaktive Analysen.
            <Link href="/login" className="start-link"><strong>Jetzt starten!</strong></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
