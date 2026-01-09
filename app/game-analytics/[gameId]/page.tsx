 "use client";

import PageHeader from "../../components/PageHeader";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- Make sure this import is present!
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions, 
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

    /* =======================================================
       1) Score per Minute (Line) mit Interpolation
    ======================================================= */

    // Hilfsfunktion: lineare Interpolation
    function interpolateValue(x, x0, y0, x1, y1) {
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }

    // Beispiel-Minuten: 0..40
    const minutes = Array.from({ length: 41 }, (_, i) => i);

    // Fest definierte Zwischenwerte
    const thunderDataPoints = { 0: 0, 10: 20, 20: 33, 30: 52, 40: 62 };
    const ironDataPoints = { 0: 0, 10: 10, 20: 30, 30: 47, 40: 64 };

    // Kumulative Score-Daten (Interpolation)
    function generateScoreData(dataPoints) {
      return minutes.map((m) => {
        if (m <= 10) {
          return interpolateValue(m, 0, dataPoints[0], 10, dataPoints[10]);
        } else if (m <= 20) {
          return interpolateValue(m, 10, dataPoints[10], 20, dataPoints[20]);
        } else if (m <= 30) {
          return interpolateValue(m, 20, dataPoints[20], 30, dataPoints[30]);
        } else {
          return interpolateValue(m, 30, dataPoints[30], 40, dataPoints[40]);
        }
      });
    }

    const thunderRaptorsScore = generateScoreData(thunderDataPoints);
    const ironTitansScore = generateScoreData(ironDataPoints);

    // Liniendiagramm: Score per Minute
    const lineData = {
      labels: minutes,
      datasets: [
        {
          label: "Thunder Raptors",
          data: thunderRaptorsScore.map(Math.round),
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.2)",
          tension: 0.2,
        },
        {
          label: "Iron Titans",
          data: ironTitansScore.map(Math.round),
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231, 76, 60, 0.2)",
          tension: 0.2,
        },
      ],
    };

    const lineOptions: ChartOptions<"line"> = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Score per Minute (Cumulative)",
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Minute" },
          min: 0,
          max: 40,
          ticks: {
            stepSize: 10,
            callback: (value) => (value === 0 ? "" : value),
          },
        },
        y: {
          title: { display: true, text: "Score" },
          beginAtZero: true,
        },
      },
    };

    /* =======================================================
       2) Score per Quarter (Stacked Horizontal Bar)
    ======================================================= */
    const stackedData = {
      labels: ["Thunder Raptors", "Iron Titans"],
      datasets: [
        { label: "Q1", data: [20, 10], backgroundColor: "#3498db" },
        { label: "Q2", data: [13, 20], backgroundColor: "#e74c3c" },
        { label: "Q3", data: [19, 17], backgroundColor: "#f1c40f" },
        { label: "Q4", data: [10, 17], backgroundColor: "#2ecc71" },
      ],
    };

    const stackedOptions: ChartOptions<"bar"> = {
      indexAxis: "y",
      responsive: true,
      plugins: {
        title: { display: true, text: "Score per Quarter (Stacked)"},
        legend: { position: "top" },
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: "Points by Quarter" },
        },
        y: {
          stacked: true,
          title: { display: true, text: "Teams" },
        },
      },
    };

    /* =======================================================
       3) Shot Charts
    ======================================================= */
    const thunderShots = [
      { x: 0.25, y: 0.7, made: true },
      { x: 0.6, y: 0.45, made: false },
      { x: 0.4, y: 0.8, made: true },
    ];

    const ironShots = [
      { x: 0.8, y: 0.3, made: true },
      { x: 0.4, y: 0.9, made: false },
      { x: 0.5, y: 0.5, made: true },
    ];

    function ShotChart({ shots, teamName }) {
      return (
        <div className="shotchart-container">
          <h2>{teamName}</h2>
          <div className="court">
            {shots.map((shot, index) => (
              <div
                key={index}
                className={shot.made ? "shot made" : "shot missed"}
                style={{
                  left: `${shot.x * 100}%`,
                  top: `${shot.y * 100}%`,
                }}

              />
            ))}
          </div>
        </div>
      );
    }

    /* =======================================================
       4) Fouls per Player (Bar Charts)
    ======================================================= */
    const thunderPlayers = [
      "Jaylen Foster",
      "Andre Simmons",
      "Damian Holloway",
      "Xavier Evans",
      "Mason Johnson",
    ];
    const thunderFouls = [2, 3, 4, 1, 2];

    const ironPlayers = [
      "Logan Brooks",
      "Noah Steele",
      "Isaiah Woods",
      "Evan Carter",
      "Brandon Scott",
    ];
    const ironFouls = [1, 4, 2, 3, 2];

    const thunderFoulData = {
      labels: thunderPlayers,
      datasets: [
        {
          label: "Fouls",
          data: thunderFouls,
          backgroundColor: "#e74c3c",
        },
      ],
    };

    const ironFoulData = {
      labels: ironPlayers,
      datasets: [
        {
          label: "Fouls",
          data: ironFouls,
          backgroundColor: "#e74c3c",
        },
      ],
    };

    const foulOptions: ChartOptions<"bar"> = {
      responsive: true,
      plugins: {
        title: { display: true, text: "Fouls by Player" },
      },
      scales: {
        x: {
          title: { display: true, text: "Players" },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Fouls" },
        },
      },
    };

    /* =======================================================
       5) Points per Player (Pie Charts)
    ======================================================= */
    const thunderPlayersPie = [
      "Hunter Maddox",
      "Oscar Fernandez",
      "Brandon Daniels",
      "Tyler Novak",
      "Caleb Richardson",
      "Devin Mercer",
      "Mason Johnson",
      "Xavier Clark",
      "Damian Holloway",
      "Andre Simmons",
      "Jaylen Foster",
    ];
    const thunderPointsPie = [4, 7, 11, 8, 15, 6, 12, 9, 17, 20, 21];

    const ironPlayersPie = [
      "Hunter Maddox",
      "Oscar Fernandez",
      "Brandon Daniels",
      "Tyler Novak",
      "Caleb Richardson",
      "Devin Mercer",
      "Mason Johnson",
      "Xavier Clark",
      "Damian Holloway",
      "Andre Simmons",
      "Jaylen Foster",
    ];
    const ironPointsPie = [2, 6, 10, 7, 18, 5, 11, 9, 17, 19, 20];

    const thunderPieData = {
      labels: thunderPlayersPie,
      datasets: [
        {
          data: thunderPointsPie,
          backgroundColor: [
            "#001f3f",
            "#003366",
            "#004080",
            "#0055A5",
            "#0066CC",
            "#007FFF",
            "#3399FF",
            "#66B2FF",
            "#99CCFF",
            "#CCE5FF",
            "#AABEFF",
          ],
        },
      ],
    };

    const ironPieData = {
      labels: ironPlayersPie,
      datasets: [
        {
          data: ironPointsPie,
          backgroundColor: [
            "#001f3f",
            "#003366",
            "#004080",
            "#0055A5",
            "#0066CC",
            "#007FFF",
            "#3399FF",
            "#66B2FF",
            "#99CCFF",
            "#CCE5FF",
            "#AABEFF",
          ],
        },
      ],
    };

    const pieOptions: ChartOptions<"pie"> = {
      responsive: true,
      plugins: {
        title: { display: true, text: "Points" },
        legend: { position: "right" }, // jetzt gültig, weil als "right" Literal erkannt
      },
    };


    /* =======================================================
       6) Points Differential (Line)
    ======================================================= */
    // Differenz = thunderRaptorsScore[i] - ironTitansScore[i]
    const pointsDifferential = thunderRaptorsScore.map(
      (val, i) => val - ironTitansScore[i]
    );


    const differentialLineData = {
      labels: minutes,
      datasets: [
        {
          label: "Points Differential",
          data: pointsDifferential.map(Math.round),
          borderColor: "#7f8c8d",
          backgroundColor: "#d6dfde",
          tension: 0.2,
        },
      ],
    };

    const differentialLineOptions = {
      responsive: true,
      plugins: {
        title: { display: true, text: "Points Differential by Minute" },
      },
      scales: {
        x: {
          title: { display: true, text: "Minute" },
          min: 0,
          max: 40,
          ticks: {
            stepSize: 10,
            callback: (value) => (value === 0 ? "" : value),
          },
        },
        y: {
          title: { display: true, text: "Difference" },
          beginAtZero: false,
        },
      },
    };

    /* =======================================================
       7) Rebounds
    ======================================================= */
    // Beispiel: Offensive, Defensive, Total
    const reboundsLabels = ["Offensive Rebounds", "Defensive Rebounds", "Total"];
    const thunderRebounds = [10, 25, 35];
    const ironRebounds = [8, 28, 36];

    const reboundsData = {
      labels: reboundsLabels,
      datasets: [
        {
          label: "Thunder Raptors",
          data: thunderRebounds,
          backgroundColor: "#3498db",
        },
        {
          label: "Iron Titans",
          data: ironRebounds,
          backgroundColor: "#e74c3c",
        },
      ],
    };

    const reboundsOptions: ChartOptions<"bar"> = {
      responsive: true,
      plugins: {
        title: { display: true, text: "Rebounds" },
        legend: { position: "top" },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    /* =======================================================
       8) Turnovers
    ======================================================= */
    // Beispiel: Thunder = 10, Iron = 12
    const turnoversLabels = ["Thunder Raptors", "Iron Titans"];
    const turnoversData = {
      labels: turnoversLabels,
      datasets: [
        {
          label: "Turnovers",
          data: [10, 12],
          backgroundColor: "#7f8c8d",
        },
      ],
    };

    // Horizontal Bar => indexAxis: "y"
    const turnoversOptions: ChartOptions<"bar"> = {
      indexAxis: "y",
      responsive: true,
      plugins: {
        title: { display: true, text: "Turnovers" },
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    };

    /* =======================================================
       DEFAULT EXPORT
    ======================================================= */
    export default function GameAnalyticsPage() {
  // 1) Use Next.js router
  const router = useRouter();

  // 2) Define the handleBack function
  function handleBack() {
    router.back(); // Takes user back to previous page
  }

  // Login-Check
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
    }
  }, [router]);


  return (
    <div className="analytics-container">
    <PageHeader title="Spielstatistiken" subtitle="Detaillierte Analyse pro Spiel" />


      {/* Score-Per-Minute (Line) and Score-Per-Quarter (Stacked Bar) */}
      <div className="charts-row">
        <div className="chart-card">
          <Line data={lineData} options={lineOptions} />
        </div>
        <div className="chart-card">
          <Bar data={stackedData} options={stackedOptions} />
        </div>
      </div>

      {/* Shot Charts */}
      <div className="charts-row">
        <ShotChart shots={thunderShots} teamName="Thunder Raptors" />
        <ShotChart shots={ironShots} teamName="Iron Titans" />
      </div>

      {/* Fouls-Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <h2>Thunder Raptors Fouls</h2>
          <Bar data={thunderFoulData} options={foulOptions} />
        </div>
        <div className="chart-card">
          <h2>Iron Titans Fouls</h2>
          <Bar data={ironFoulData} options={foulOptions} />
        </div>
      </div>

      {/* Points-Charts (Pie) */}
      <div className="charts-row">
        <div className="chart-card">
          <h2>Thunder Raptors Points</h2>
          <Pie data={thunderPieData} options={pieOptions} />
        </div>
        <div className="chart-card">
          <h2>Iron Titans Points</h2>
          <Pie data={ironPieData} options={pieOptions} />
        </div>
      </div>

      {/* Points Differential, Rebounds, Turnovers */}
      <div className="charts-row">
        <div className="chart-card">
          <Line data={differentialLineData} options={differentialLineOptions} />
        </div>
        <div className="chart-card">
          <Bar data={reboundsData} options={reboundsOptions} />
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card" style={{ minWidth: "400px" }}>
          <Bar data={turnoversData} options={turnoversOptions} />
        </div>
      </div>

      {/* 3) Back button at bottom center */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={handleBack} className="back-btn">
          Zurück
         </button>
      </div>
    </div>
  );
}