const express = require("express");
const app = express();

require("dotenv").config();

const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// Multer Error Handler
function multerErrorHandler(err, req, res, next) {
  // Multer-spezifische Fehler
  if (err && err.name === "MulterError") {
    return res.status(400).json({
      error: "Upload fehlgeschlagen.",
      details: err.message,
      code: err.code,
    });
  }

  // z.B. fileFilter/andere Upload-Errors
  if (err) {
    return res.status(400).json({
      error: "Upload fehlgeschlagen.",
      details: err.message || String(err),
    });
  }

  return next();
}

// Helpers (bei dir schon vorhanden – falls doppelt, nur einmal behalten)
function toInt(v) {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
}
function clamp0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}
function safePct(made, att) {
  const a = clamp0(att);
  const m = clamp0(made);
  if (!a) return 0;
  return Math.round((m / a) * 1000) / 10; // 1 Nachkommastelle
}
function calcPoints(r) {
  const fg = clamp0(r.fg);
  const three_p = clamp0(r.three_p);
  const ft = clamp0(r.ft);
  const twoMade = Math.max(0, fg - three_p);
  return twoMade * 2 + three_p * 3 + ft;
}

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "referee",
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/logos"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const logoUpload = multer({ storage: logoStorage });

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});

const videoUpload = multer({ storage: videoStorage });

db.connect((err) => {
  if (err) {
    console.error("Datenbankverbindung fehlgeschlagen: ", err);
  } else {
    console.log("Datenbank verbunden!");
  }
});

app.get("/persons", (req, res) => {
  const query = "SELECT * FROM persons";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Fehler bei der Datenbankabfrage:", error);
      return res.status(500).json({ error: "Datenbankfehler" });
    }
    return res.json(results);
  });
});

app.post("/teams", logoUpload.single("logo"), (req, res) => {
  const { teamName, headCoach, assistantCoach, teamColor } = req.body;
  const logoPath = req.file ? `/uploads/logos/${req.file.filename}` : null;

  db.query("SELECT * FROM teams WHERE name = ?", [teamName], (checkErr, checkResults) => {
    if (checkErr) return res.status(500).json({ error: "Prüfungsfehler" });
    if (checkResults.length > 0) return res.status(409).json({ error: "Teamname bereits vergeben" });

    const insertQuery = `
      INSERT INTO teams (name, head_coach, assistant_coach, color_hex, logo_path)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [teamName, headCoach, assistantCoach, teamColor, logoPath];

    db.query(insertQuery, values, (err, results) => {
      if (err) return res.status(500).json({ error: "Fehler beim Speichern" });
      res.status(201).json({ message: "Team erfolgreich erstellt!", id: results.insertId });
    });
  });
});

app.post("/signup", async (req, res) => {
  try {
    const { vorname, nachname, geburtsdatum, email, username, passwort } = req.body;

    const checkQuery = "SELECT * FROM persons WHERE username = ?";
    db.query(checkQuery, [username], async (err, results) => {
      if (err) {
        console.error("DB Fehler: ", err);
        return res.status(500).json({ error: "Fehler bei der Registrierung" });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: "Username bereits vergeben" });
      }

      const saltRounds = 10;
      const hashedPasswort = await bcrypt.hash(passwort, saltRounds);
      const insertQuery =
        "INSERT INTO persons (`vorname`, `nachname`, `geburtsdatum`, `email`, `username`, `passwort`) VALUES (?, ?, ?, ?, ?, ?)";
      const values = [vorname, nachname, geburtsdatum, email, username, hashedPasswort];

      db.query(insertQuery, values, (error) => {
        if (error) {
          console.error("DB Fehler beim Einfügen: ", error);
          return res.status(500).json({ error: "Fehler beim Speichern" });
        }

        return res.status(200).json({ message: "Registrierung erfolgreich!" });
      });
    });
  } catch (error) {
    console.error("Serverfehler: ", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.post("/login", (req, res) => {
  const { username, passwort } = req.body;

  db.query("SELECT * FROM persons WHERE username = ?", [username], (error, results) => {
    if (error || results.length === 0) {
      return res.status(401).json({ success: false, message: "Ungültiger Benutzername" });
    }

    const user = results[0];
    bcrypt.compare(passwort, user.passwort, (error2, result) => {
      if (result) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: "Falsches Passwort" });
      }
    });
  });
});

app.get("/usernames", (req, res) => {
  const searchTerm = req.query.q || "";
  const query = "SELECT username FROM persons WHERE username LIKE ? LIMIT 10";

  db.query(query, [`%${searchTerm}%`], (error, results) => {
    if (error) {
      console.error("Fehler beim Abrufen der Usernames: ", error);
      return res.status(500).json({ error: "Fehler beim Laden" });
    }
    res.json(results.map((r) => r.username));
  });
});

app.post("/players", (req, res) => {
  const { username, jersey_number, position, height, weight, experience_years, team_id } = req.body;

  if (
    !username ||
    jersey_number === undefined ||
    jersey_number === null ||
    !position ||
    !height ||
    !weight ||
    !experience_years ||
    !team_id
  ) {
    return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein." });
  }

  const checkQuery = "SELECT id FROM players WHERE username = ?";
  db.query(checkQuery, [username], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Fehler bei Spieler-Prüfung:", checkErr);
      return res.status(500).json({ error: "Fehler bei der Prüfung des Spielers." });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({ error: "Dieser Benutzer ist bereits einem Team zugeordnet!" });
    }

    const insertQuery = `
      INSERT INTO players
      (username, jersey_number, position, height, weight, experience_years, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [username, jersey_number, position, height, weight, experience_years, team_id];

    db.query(insertQuery, values, (insertErr) => {
      if (insertErr) {
        console.error("Fehler beim Einfügen des Spielers:", insertErr);
        return res.status(500).json({ error: "Fehler beim Speichern in der Datenbank." });
      }

      return res.status(201).json({ message: "Spieler erfolgreich erstellt!" });
    });
  });
});

app.get("/check-jersey", (req, res) => {
  const { team_id, jersey_number } = req.query;

  if (!team_id || !jersey_number) {
    return res.status(400).json({ error: "team_id und jersey_number sind erforderlich" });
  }

  const query = `
    SELECT id FROM players
    WHERE team_id = ? AND jersey_number = ?
    LIMIT 1
  `;

  db.query(query, [team_id, jersey_number], (err, results) => {
    if (err) {
      console.error("Fehler bei der Jersey-Abfrage:", err);
      return res.status(500).json({ error: "Fehler bei der Datenbankabfrage" });
    }

    const isTaken = results.length > 0;
    res.json({ taken: isTaken });
  });
});

app.get("/team-info/:id", (req, res) => {
  const teamId = req.params.id;

  const teamQuery = "SELECT * FROM teams WHERE id = ?";
  db.query(teamQuery, [teamId], (err, teamResults) => {
    if (err || teamResults.length === 0) {
      return res.status(404).json({ error: "Team nicht gefunden" });
    }

    const team = teamResults[0];

    const coachQuery = `
      SELECT username, vorname, nachname FROM persons
      WHERE username IN (?, ?)
    `;
    db.query(coachQuery, [team.head_coach, team.assistant_coach], (err2, coachResults) => {
      if (err2) return res.status(500).json({ error: "Fehler bei Coach-Abfrage" });

      const coaches = {};
      coachResults.forEach((c) => {
        coaches[c.username] = `${c.vorname} ${c.nachname}`;
      });

      res.json({
        team_name: team.name,
        logo_path: team.logo_path,
        logo_url: team.logo_path ? `http://localhost:8081${team.logo_path}` : null,
        head_coach_fullname: coaches[team.head_coach] || team.head_coach,
        assistant_coach_fullname: coaches[team.assistant_coach] || team.assistant_coach,
      });
    });
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/players", (req, res) => {
  const { team_id } = req.query;

  let query = `
    SELECT id, username, jersey_number, position, height, weight, experience_years, team_id
    FROM players
  `;
  const params = [];

  if (team_id) {
    query += " WHERE team_id = ?";
    params.push(team_id);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Fehler beim Laden der Spieler:", err);
      return res.status(500).json({ error: "Fehler bei der Datenbankabfrage" });
    }

    res.json(results);
  });
});

app.get("/player-names", (req, res) => {
  const { usernames } = req.query;

  if (!usernames) {
    return res.status(400).json({ error: "Benutzername(n) erforderlich" });
  }

  const usernameArray = usernames.split(",");

  const query = `
    SELECT username, vorname, nachname
    FROM persons
    WHERE username IN (?)
  `;

  db.query(query, [usernameArray], (err, results) => {
    if (err) {
      console.error("Fehler beim Laden der Namen:", err);
      return res.status(500).json({ error: "Fehler bei der Datenbankabfrage" });
    }

    const nameMap = {};
    results.forEach((person) => {
      nameMap[person.username] = `${person.vorname} ${person.nachname}`;
    });

    res.json(nameMap);
  });
});

app.get("/player/:id", (req, res) => {
  const playerId = req.params.id;

  const query = `
    SELECT id, username, jersey_number, position, height, weight, experience_years, team_id
    FROM players
    WHERE id = ?
    LIMIT 1
  `;

  db.query(query, [playerId], (err, results) => {
    if (err) {
      console.error("Fehler beim Abrufen des Spielers:", err);
      return res.status(500).json({ error: "Fehler beim Abrufen des Spielers" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Spieler nicht gefunden" });
    }

    res.json(results[0]);
  });
});

app.put("/player/:id", (req, res) => {
  const playerId = req.params.id;
  const { jersey_number, position, height, weight, experience_years } = req.body;

  const query = `
    UPDATE players
    SET jersey_number = ?, position = ?, height = ?, weight = ?, experience_years = ?
    WHERE id = ?
  `;

  const values = [jersey_number, position, height, weight, experience_years, playerId];

  db.query(query, values, (err) => {
    if (err) {
      console.error("Fehler beim Update:", err);
      return res.status(500).json({ error: "Fehler beim Speichern" });
    }

    res.json({ message: "Spieler aktualisiert!" });
  });
});

app.delete("/player/:id", (req, res) => {
  const playerId = req.params.id;
  const query = `DELETE FROM players WHERE id = ?`;

  db.query(query, [playerId], (err) => {
    if (err) {
      console.error("Fehler beim Löschen des Spielers:", err);
      return res.status(500).json({ error: "Fehler beim Löschen" });
    }

    res.json({ message: "Spieler gelöscht!" });
  });
});

app.post("/gyms", (req, res) => {
  const { name, address, postal_code, capacity, home_team_id } = req.body;

  if (!name || !address || !postal_code || !capacity || !home_team_id) {
    return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein." });
  }

  const insertQuery = `
    INSERT INTO gyms (name, address, postal_code, capacity, home_team_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [name, address, postal_code, capacity, home_team_id], (err) => {
    if (err) {
      console.error("Fehler beim Einfügen der Halle:", err);
      return res.status(500).json({ error: "Fehler beim Speichern der Halle" });
    }

    return res.status(201).json({ message: "Halle erfolgreich erstellt!" });
  });
});

app.get("/gym/:teamId", (req, res) => {
  const teamId = req.params.teamId;

  const query = `
    SELECT name, address, postal_code, capacity
    FROM gyms
    WHERE home_team_id = ?
    LIMIT 1
  `;

  db.query(query, [teamId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: "Halle nicht gefunden" });
    }

    res.json(results[0]);
  });
});

app.post("/games", (req, res, next) => {
  videoUpload.single("video")(req, res, (err) => {
    if (err) return next(err);

    const date = String(req.body.date || "").trim();
    const tip_off_raw = String(req.body.tip_off || "").trim();
    const home_team = String(req.body.home_team || "").trim();
    const away_team = String(req.body.away_team || "").trim();

    // ✅ Pflichtfelder
    if (!date || !tip_off_raw || !home_team || !away_team) {
      return res.status(400).json({ error: "Alle Felder (außer Video) sind Pflichtfelder." });
    }

    // ✅ TIME-Format absichern (Frontend sendet HH:MM:SS, aber wir sind tolerant)
    let tip_off = tip_off_raw;
    if (/^\d{1,2}:\d{2}$/.test(tip_off)) tip_off = `${tip_off}:00`; // HH:MM -> HH:MM:SS
    if (!/^\d{1,2}:\d{2}:\d{2}$/.test(tip_off)) {
      return res.status(400).json({ error: "tip_off muss im Format HH:MM oder HH:MM:SS sein." });
    }

    // ✅ Video optional -> NULL oder Pfad
    const videoPath = req.file ? `/uploads/videos/${req.file.filename}` : null;

    // ✅ Gym stabil über Team-Namen finden (wie bei dir), aber wenn keines existiert -> 400 statt NULL insert
    const gymQuery = `
      SELECT g.id
      FROM gyms g
      JOIN teams t ON g.home_team_id = t.id
      WHERE t.name = ?
      LIMIT 1
    `;

    db.query(gymQuery, [home_team], (err2, gymResults) => {
      if (err2) {
        console.error("❌ gymQuery error:", err2);
        return res.status(500).json({
          error: "Fehler bei der Gymsuche.",
          details: err2.sqlMessage || err2.message,
        });
      }

      if (!gymResults || gymResults.length === 0) {
        return res.status(400).json({
          error: `Für das Home Team "${home_team}" ist keine Halle (Gym) hinterlegt.`,
        });
      }

      const gym_id = gymResults[0].id;

      const insertQuery = `
        INSERT INTO games (date, tip_off, home_team, away_team, gym_id, video_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [date, tip_off, home_team, away_team, gym_id, videoPath];

      db.query(insertQuery, values, (error, result) => {
        if (error) {
          console.error("❌ insert games error:", error);
          return res.status(500).json({
            error: "Fehler beim Speichern des Spiels.",
            details: error.sqlMessage || error.message,
            code: error.code,
          });
        }

        return res.status(201).json({
          message: "Spiel erfolgreich erstellt!",
          gameId: result.insertId,
        });
      });
    });
  });
});


app.get("/games", (req, res) => {
  const query = `
    SELECT g.id, g.date, g.tip_off, g.home_team, g.away_team,
           g.video_path, gy.name AS gym_name
    FROM games g
    LEFT JOIN gyms gy ON gy.id = g.gym_id
    ORDER BY g.date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ SQL Fehler:", err.sqlMessage);
      return res.status(500).json({ error: "Fehler beim Abrufen der Spiele." });
    }

    res.json(results);
  });
});

app.get("/teamnames", (req, res) => {
  const searchTerm = req.query.q || "";

  const query = `
    SELECT name FROM teams
    WHERE name LIKE ?
    ORDER BY name ASC
    LIMIT 10
  `;

  db.query(query, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      console.error("Fehler beim Abrufen der Teamnamen:", err);
      return res.status(500).json({ error: "Fehler beim Laden der Teamnamen" });
    }

    res.json(results.map((team) => team.name));
  });
});

app.get("/game-video/:gameId", (req, res) => {
  const gameId = req.params.gameId;

  const query = `
    SELECT video_path FROM games
    WHERE id = ?
    LIMIT 1
  `;

  db.query(query, [gameId], (err, results) => {
    if (err) {
      console.error("Fehler beim Laden des Videos:", err);
      return res.status(500).json({ error: "Datenbankfehler" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Kein Video gefunden" });
    }

    res.json(results[0]);
  });
});

app.get("/teams", (req, res) => {
  const query = "SELECT * FROM teams";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Fehler beim Abrufen der Teams:", err);
      return res.status(500).json({ error: "Datenbankfehler" });
    }
    res.json(results);
  });
});

app.post("/game-roster", (req, res) => {
  const { game_id, starting_five, bench } = req.body;

  if (!game_id || !Array.isArray(starting_five) || !Array.isArray(bench)) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }

  const playersToInsert = [
    ...starting_five.map((player_id) => ({ player_id, is_starting: 1 })),
    ...bench.map((player_id) => ({ player_id, is_starting: 0 })),
  ];

  const insertNext = (index = 0) => {
    if (index >= playersToInsert.length) {
      return res.json({ message: "Roster erfolgreich ergänzt!" });
    }

    const { player_id, is_starting } = playersToInsert[index];

    const checkQuery = `
      SELECT id FROM game_rosters
      WHERE game_id = ? AND player_id = ?
    `;

    db.query(checkQuery, [game_id, player_id], (checkErr, existing) => {
      if (checkErr) {
        console.error("Fehler bei Prüfung:", checkErr);
        return res.status(500).json({ error: "Fehler bei Prüfung" });
      }

      if (existing.length > 0) {
        insertNext(index + 1);
      } else {
        const insertQuery = `
          INSERT INTO game_rosters (game_id, player_id, is_starting)
          VALUES (?, ?, ?)
        `;
        db.query(insertQuery, [game_id, player_id, is_starting], (insertErr) => {
          if (insertErr) {
            console.error("Fehler beim Einfügen:", insertErr);
            return res.status(500).json({ error: "Fehler beim Speichern" });
          }
          insertNext(index + 1);
        });
      }
    });
  };

  insertNext();
});

app.get("/game-roster/:gameId", (req, res) => {
  const gameId = req.params.gameId;

  const query = `
    SELECT gr.player_id, gr.is_starting, p.username, p.jersey_number, p.position
    FROM game_rosters gr
    JOIN players p ON gr.player_id = p.id
    WHERE gr.game_id = ?
  `;

  db.query(query, [gameId], (err, results) => {
    if (err) {
      console.error("Fehler beim Abrufen des Rosters:", err);
      return res.status(500).json({ error: "Fehler beim Abrufen des Rosters" });
    }

    const starting = results.filter((r) => r.is_starting === 1);
    const bench = results.filter((r) => r.is_starting === 0);

    res.json({ starting, bench });
  });
});

/**
 * ✅ UPDATED: Roster detailed liefert jetzt auch:
 * - game_roster_id
 * - bestehende player_stats (LEFT JOIN)
 */
app.get("/game-roster-detailed/:gameId", (req, res) => {
  const gameId = req.params.gameId;

  const gameQuery = "SELECT home_team, away_team FROM games WHERE id = ?";
  db.query(gameQuery, [gameId], (err, gameResults) => {
    if (err || gameResults.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden" });
    }

    const { home_team, away_team } = gameResults[0];

    const teamQuery = "SELECT id, name, logo_path FROM teams WHERE name IN (?, ?)";
    db.query(teamQuery, [home_team, away_team], (err2, teamResults) => {
      if (err2 || teamResults.length < 2) {
        return res.status(500).json({ error: "Teams konnten nicht geladen werden" });
      }

      const homeTeam = teamResults.find((t) => t.name === home_team);
      const awayTeam = teamResults.find((t) => t.name === away_team);

      const rosterQuery = `
        SELECT
          gr.id AS game_roster_id,
          gr.player_id,
          gr.is_starting,
          p.username,
          p.jersey_number,
          p.position,
          p.team_id,

          ps.mp,
          ps.fg,
          ps.fga,
          ps.three_p,
          ps.three_pa,
          ps.ft,
          ps.fta,
          ps.orb,
          ps.drb,
          ps.trb,
          ps.ast,
          ps.blk,
          ps.stl,
          ps.tov,
          ps.pf,
          ps.pst,
          ps.plus_minus
        FROM game_rosters gr
        JOIN players p ON gr.player_id = p.id
        LEFT JOIN player_stats ps ON ps.game_roster_id = gr.id
        WHERE gr.game_id = ?
      `;

      db.query(rosterQuery, [gameId], (err3, rosterResults) => {
        if (err3) {
          console.error("Roster detailed SQL error:", err3);
          return res.status(500).json({ error: "Roster konnte nicht geladen werden" });
        }

        const homeStarters = rosterResults.filter((r) => r.team_id === homeTeam.id && r.is_starting === 1);
        const homeBench = rosterResults.filter((r) => r.team_id === homeTeam.id && r.is_starting === 0);

        const awayStarters = rosterResults.filter((r) => r.team_id === awayTeam.id && r.is_starting === 1);
        const awayBench = rosterResults.filter((r) => r.team_id === awayTeam.id && r.is_starting === 0);

        res.json({
          home: {
            team_name: homeTeam.name,
            logo_path: homeTeam.logo_path,
            starters: homeStarters,
            bench: homeBench,
          },
          away: {
            team_name: awayTeam.name,
            logo_path: awayTeam.logo_path,
            starters: awayStarters,
            bench: awayBench,
          },
        });
      });
    });
  });
});

app.get("/vorname", (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username erforderlich" });

  const query = `SELECT vorname FROM persons WHERE username = ? LIMIT 1`;

  db.query(query, [username], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    res.json({ vorname: results[0].vorname });
  });
});

app.put("/gym/:teamId", (req, res) => {
  const { teamId } = req.params;
  const { name, address, postal_code, capacity } = req.body;

  if (!name || !address || !postal_code || !capacity) {
    return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein." });
  }

  const updateQuery = `
    UPDATE gyms
    SET name = ?, address = ?, postal_code = ?, capacity = ?
    WHERE home_team_id = ?
  `;

  db.query(updateQuery, [name, address, postal_code, capacity, teamId], (err, results) => {
    if (err) {
      console.error("Fehler beim Aktualisieren der Halle:", err);
      return res.status(500).json({ error: "Fehler beim Speichern der Halle" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Keine passende Halle gefunden" });
    }

    res.json({ message: "Halle erfolgreich aktualisiert!" });
  });
});

app.get("/roster-exists/:gameId/:teamName", (req, res) => {
  const { gameId, teamName } = req.params;

  const query = `
    SELECT COUNT(*) as count
    FROM game_rosters gr
    JOIN players p ON gr.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    WHERE gr.game_id = ? AND t.name = ?
  `;

  db.query(query, [gameId, teamName], (err, results) => {
    if (err) {
      console.error("Fehler bei roster-exists:", err);
      return res.status(500).json({ error: "Interner Serverfehler" });
    }

    res.json({ exists: results[0].count > 0 });
  });
});

app.post("/games/:gameId/players/:playerId/stats-event", (req, res) => {
  const { gameId, playerId } = req.params;
  const { type } = req.body;

  const allowedTypes = ["off_reb", "def_reb", "three_pa", "three_p"];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ success: false, message: "Ungültiger Statistik-Typ" });
  }

  const columnMap = {
    fg: "fg",
    fga: "fga",
    three_p: "three_p",
    three_pa: "three_pa",
    ft: "ft",
    fta: "fta",
    orb: "orb",
    drb: "drb",
    trb: "trb",
    ast: "ast",
    blk: "blk",
    stl: "stl",
    tov: "tov",
    pf: "pf",
    pst: "pst",
    plus_minus: "plus_minus",
  };

  const column = columnMap[type];
  if (!column) return res.status(400).json({ success: false, message: "Mapping fehlt" });

  const findRosterSql = "SELECT id FROM game_rosters WHERE game_id = ? AND player_id = ? LIMIT 1";

  db.query(findRosterSql, [gameId, playerId], (err, rosterRows) => {
    if (err) {
      console.error("Fehler beim Lesen game_rosters:", err);
      return res.status(500).json({ success: false, message: "DB-Fehler" });
    }

    const ensureStatsRow = (game_roster_id) => {
      const findStatsSql = "SELECT id FROM player_stats WHERE game_roster_id = ? LIMIT 1";

      db.query(findStatsSql, [game_roster_id], (err2, statRows) => {
        if (err2) {
          console.error("Fehler beim Lesen player_stats:", err2);
          return res.status(500).json({ success: false, message: "DB-Fehler" });
        }

        if (statRows.length === 0) {
          const insertSql = `
            INSERT INTO player_stats (game_roster_id, ${column})
            VALUES (?, 1)
          `;
          db.query(insertSql, [game_roster_id], (err3) => {
            if (err3) {
              console.error("Fehler beim Einfügen player_stats:", err3);
              return res.status(500).json({ success: false, message: "DB-Fehler" });
            }
            return res.json({ success: true });
          });
        } else {
          const updateSql = `
            UPDATE player_stats
            SET ${column} = ${column} + 1
            WHERE game_roster_id = ?
          `;
          db.query(updateSql, [game_roster_id], (err4) => {
            if (err4) {
              console.error("Fehler beim Aktualisieren player_stats:", err4);
              return res.status(500).json({ success: false, message: "DB-Fehler" });
            }
            return res.json({ success: true });
          });
        }
      });
    };

    if (rosterRows.length > 0) return ensureStatsRow(rosterRows[0].id);

    const insertRosterSql = "INSERT INTO game_rosters (game_id, player_id, is_starting) VALUES (?, ?, 0)";
    db.query(insertRosterSql, [gameId, playerId], (err5, resultRoster) => {
      if (err5) {
        console.error("Fehler beim Erstellen game_rosters:", err5);
        return res.status(500).json({ success: false, message: "DB-Fehler" });
      }

      ensureStatsRow(resultRoster.insertId);
    });
  });
});

app.get("/games/:gameId/players", (req, res) => {
  const { gameId } = req.params;

  const sql = `
    SELECT p.id, p.username, p.jersey_number
    FROM game_rosters gr
    JOIN players p ON gr.player_id = p.id
    WHERE gr.game_id = ?
    ORDER BY p.jersey_number, p.username
  `;

  db.query(sql, [gameId], (err, rows) => {
    if (err) {
      console.error("Fehler beim Laden der Spieler:", err);
      return res.status(500).json({ success: false, message: "DB-Fehler" });
    }

    return res.json({
      success: true,
      players: rows,
    });
  });
});

/**
 * ✅ FIXED: bulk-upsert (kein SQL-Syntax-Fehler mehr, immer gleiche Anzahl Platzhalter/Values)
 * PUT /player-stats/bulk-upsert
 * Body: { updates: [{ game_id, player_id, mp, fg, fga, ... }] }
 */
app.put("/player-stats/bulk-upsert", (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "updates muss ein nicht-leeres Array sein." });
  }

  const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };
  const clamp0 = (v) => Math.max(0, toInt(v));
  const clampPM = (v) => toInt(v);

  const normalizeMp = (mp) => {
    const s = String(mp ?? "").trim();
    if (!s) return "00:00:00";

    if (/^\d{1,2}:\d{2}$/.test(s)) {
      const [mm, ss] = s.split(":");
      return `00:${String(mm).padStart(2, "0")}:${ss}`;
    }

    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
      const [hh, mm, ss] = s.split(":");
      return `${String(hh).padStart(2, "0")}:${mm}:${ss}`;
    }

    if (/^\d{1,3}$/.test(s)) {
      const mm = String(s).padStart(2, "0");
      return `00:${mm}:00`;
    }

    return "00:00:00";
  };

  const safePct = (made, att) => (att > 0 ? Math.round((made / att) * 1000) / 10 : 0);

  const processOne = (idx) => {
    if (idx >= updates.length) {
      return res.json({ success: true, saved: updates.length });
    }

    const u = updates[idx];

    const gameId = toInt(u.game_id);
    const playerId = toInt(u.player_id);

    if (!gameId || !playerId) {
      return res.status(400).json({ error: "game_id und player_id sind Pflicht." });
    }

    let fg = clamp0(u.fg);
    let fga = clamp0(u.fga);
    let three_p = clamp0(u.three_p);
    let three_pa = clamp0(u.three_pa);
    let ft = clamp0(u.ft);
    let fta = clamp0(u.fta);

    if (fg > fga) fga = fg;
    if (three_p > three_pa) three_pa = three_p;
    if (ft > fta) fta = ft;

    const orb = clamp0(u.orb);
    const drb = clamp0(u.drb);
    const trb = clamp0(u.trb ?? (orb + drb));
    const ast = clamp0(u.ast);
    const blk = clamp0(u.blk);
    const stl = clamp0(u.stl);
    const tov = clamp0(u.tov);
    const pf = clamp0(u.pf);
    const pst = clamp0(u.pst);
    const plus_minus = clampPM(u.plus_minus);
    const mp = normalizeMp(u.mp);

    const fg_percent = safePct(fg, fga);
    const three_p_percent = safePct(three_p, three_pa);
    const ft_percent = safePct(ft, fta);

    const findRosterSql = `
      SELECT id FROM game_rosters
      WHERE game_id = ? AND player_id = ?
      LIMIT 1
    `;

    db.query(findRosterSql, [gameId, playerId], (err, rosterRows) => {
      if (err) {
        console.error("bulk-upsert: Fehler beim Lesen game_rosters:", err);
        return res.status(500).json({ error: "DB Fehler (game_rosters lesen)" });
      }

      const ensureStatsUpsert = (rosterId) => {
        /**
         * ✅ Robust: keine VALUES()-Funktion, keine Alias-Probleme
         * 21 Columns + 21 VALUES + 20 Updates (ohne game_roster_id)
         */
        const upsertSql = `
          INSERT INTO player_stats (
            game_roster_id, mp,
            fg, fga, fg_percent,
            three_p, three_pa, three_p_percent,
            ft, fta, ft_percent,
            orb, drb, trb,
            ast, blk, stl,
            tov, pf, pst, plus_minus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            mp = ?,
            fg = ?,
            fga = ?,
            fg_percent = ?,
            three_p = ?,
            three_pa = ?,
            three_p_percent = ?,
            ft = ?,
            fta = ?,
            ft_percent = ?,
            orb = ?,
            drb = ?,
            trb = ?,
            ast = ?,
            blk = ?,
            stl = ?,
            tov = ?,
            pf = ?,
            pst = ?,
            plus_minus = ?
        `;

        // 21 insert values + 20 update values = 41
        const insertValues = [
          rosterId, mp,
          fg, fga, fg_percent,
          three_p, three_pa, three_p_percent,
          ft, fta, ft_percent,
          orb, drb, trb,
          ast, blk, stl,
          tov, pf, pst, plus_minus,
        ];

        const updateValues = [
          mp,
          fg,
          fga,
          fg_percent,
          three_p,
          three_pa,
          three_p_percent,
          ft,
          fta,
          ft_percent,
          orb,
          drb,
          trb,
          ast,
          blk,
          stl,
          tov,
          pf,
          pst,
          plus_minus,
        ];

        const values = [...insertValues, ...updateValues];

        db.query(upsertSql, values, (err2) => {
          if (err2) {
            console.error("bulk-upsert: Fehler beim Upsert player_stats:", err2);
            return res.status(500).json({
              error: "DB Fehler (player_stats upsert)",
              code: err2.code,
              sqlMessage: err2.sqlMessage,
            });
          }
          return processOne(idx + 1);
        });
      };

      if (rosterRows.length > 0) return ensureStatsUpsert(rosterRows[0].id);

      const insertRosterSql = `
        INSERT INTO game_rosters (game_id, player_id, is_starting)
        VALUES (?, ?, 0)
      `;
      db.query(insertRosterSql, [gameId, playerId], (err3, r) => {
        if (err3) {
          console.error("bulk-upsert: Fehler beim Erstellen game_rosters:", err3);
          return res.status(500).json({ error: "DB Fehler (game_rosters insert)" });
        }
        return ensureStatsUpsert(r.insertId);
      });
    });
  };

  processOne(0);
});

// GET /game-analytics/:gameId
app.get("/game-analytics/:gameId", (req, res) => {
  const gameId = toInt(req.params.gameId);
  if (!gameId) return res.status(400).json({ error: "Ungültige gameId" });

  const gameSql = `
    SELECT id, home_team, away_team
    FROM games
    WHERE id = ?
    LIMIT 1
  `;

  db.query(gameSql, [gameId], (gErr, gRows) => {
    if (gErr) {
      console.error("game-analytics: Fehler beim Lesen games:", gErr);
      return res.status(500).json({ error: "DB Fehler (game lesen)" });
    }
    if (!gRows || gRows.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden" });
    }

    const homeName = gRows[0].home_team;
    const awayName = gRows[0].away_team;

    const sql = `
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.color_hex AS team_color,
        t.logo_path AS team_logo_path,

        p.id AS player_id,
        p.username,
        p.jersey_number,

        gr.id AS game_roster_id,

        ps.mp,
        COALESCE(ps.fg, 0) AS fg,
        COALESCE(ps.fga, 0) AS fga,
        COALESCE(ps.three_p, 0) AS three_p,
        COALESCE(ps.three_pa, 0) AS three_pa,
        COALESCE(ps.ft, 0) AS ft,
        COALESCE(ps.fta, 0) AS fta,
        COALESCE(ps.orb, 0) AS orb,
        COALESCE(ps.drb, 0) AS drb,
        COALESCE(ps.trb, 0) AS trb,
        COALESCE(ps.ast, 0) AS ast,
        COALESCE(ps.blk, 0) AS blk,
        COALESCE(ps.stl, 0) AS stl,
        COALESCE(ps.tov, 0) AS tov,
        COALESCE(ps.pf, 0) AS pf,
        COALESCE(ps.pst, 0) AS pst
      FROM game_rosters gr
      JOIN players p ON p.id = gr.player_id
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN player_stats ps ON ps.game_roster_id = gr.id
      WHERE gr.game_id = ?
        AND t.name IN (?, ?)
      ORDER BY t.name, p.jersey_number IS NULL, p.jersey_number, p.username
    `;

    db.query(sql, [gameId, homeName, awayName], (err, rows) => {
      if (err) {
        console.error("game-analytics: Fehler beim Lesen rosters/stats:", err);
        return res.status(500).json({
          error: "DB Fehler (rosters/stats lesen)",
          code: err.code,
          sqlMessage: err.sqlMessage,
        });
      }

      const byPlayer = (rows || []).map((r) => {
        const fg = clamp0(r.fg);
        const fga = clamp0(r.fga);
        const three_p = clamp0(r.three_p);
        const three_pa = clamp0(r.three_pa);
        const ft = clamp0(r.ft);
        const fta = clamp0(r.fta);

        return {
          player_id: toInt(r.player_id),
          username: r.username,
          jersey_number: r.jersey_number ?? null,
          team_id: toInt(r.team_id),
          team_name: r.team_name,

          points: calcPoints(r),

          fg,
          fga,
          fg_pct: safePct(fg, fga),

          three_p,
          three_pa,
          three_p_pct: safePct(three_p, three_pa),

          ft,
          fta,
          ft_pct: safePct(ft, fta),

          orb: clamp0(r.orb),
          drb: clamp0(r.drb),
          trb: clamp0(r.trb),
          ast: clamp0(r.ast),
          blk: clamp0(r.blk),
          stl: clamp0(r.stl),
          tov: clamp0(r.tov),
          pf: clamp0(r.pf),
        };
      });

      const teams = {};

      function ensureTeam(team_id, team_name, team_color, team_logo_path) {
        if (!teams[team_name]) {
          teams[team_name] = {
            team_id,
            team_name,
            team_color: team_color || "#3f4a54",
            team_logo_url: team_logo_path ? `http://localhost:8081${team_logo_path}` : null,

            points: 0,
            fg: 0,
            fga: 0,
            fg_pct: 0,
            three_p: 0,
            three_pa: 0,
            three_p_pct: 0,
            ft: 0,
            fta: 0,
            ft_pct: 0,
            orb: 0,
            drb: 0,
            trb: 0,
            ast: 0,
            blk: 0,
            stl: 0,
            tov: 0,
            pf: 0,
          };
        }
        return teams[team_name];
      }

      // Team-Metadaten aus rows nehmen (Farbe/Logo)
      for (const r of rows || []) {
        ensureTeam(
          toInt(r.team_id),
          r.team_name,
          r.team_color,
          r.team_logo_path
        );
      }

      for (const p of byPlayer) {
        const agg = teams[p.team_name];
        agg.points += p.points;
        agg.fg += p.fg;
        agg.fga += p.fga;
        agg.three_p += p.three_p;
        agg.three_pa += p.three_pa;
        agg.ft += p.ft;
        agg.fta += p.fta;

        agg.orb += p.orb;
        agg.drb += p.drb;
        agg.trb += p.trb;
        agg.ast += p.ast;
        agg.blk += p.blk;
        agg.stl += p.stl;
        agg.tov += p.tov;
        agg.pf += p.pf;
      }

      for (const k of Object.keys(teams)) {
        const t = teams[k];
        t.fg_pct = safePct(t.fg, t.fga);
        t.three_p_pct = safePct(t.three_p, t.three_pa);
        t.ft_pct = safePct(t.ft, t.fta);
      }

      return res.json({
        game_id: gameId,
        home_team: homeName,
        away_team: awayName,
        teams,
        byPlayer,
      });
    });
  });
});


app.use(multerErrorHandler);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
