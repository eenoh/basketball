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
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "referee"
});


const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/logos"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const logoUpload = multer({ storage: logoStorage });

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  }
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
      const insertQuery = "INSERT INTO persons (`vorname`, `nachname`, `geburtsdatum`, `email`, `username`, `passwort`) VALUES (?, ?, ?, ?, ?, ?)";
      const values = [vorname, nachname, geburtsdatum, email, username, hashedPasswort];

      db.query(insertQuery, values, (error, results) => {
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
    const {username, passwort} = req.body;

    db.query("SELECT * FROM persons WHERE username = ?", [username], (error, results) => {
        if (error || results.length === 0) {
            return res.status(401).json({ success: false, message: "Ungültiger Benutzername"});
        }

        const user = results[0];
        bcrypt.compare(passwort, user.passwort, (error, result) => {
            if (result) {
                res.json({ success: true});
            } else {
                res.status(401).json({ success: false, message: "Falsches Passwort"});
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

app.post('/players', (req, res) => {
  const { username, jersey_number, position, height, weight, experience_years, team_id } = req.body;

  // Alle Felder validieren, aber jersey_number explizit auf null oder undefined prüfen, nicht auf 0
  if (
    !username ||
    jersey_number === undefined || jersey_number === null ||
    !position ||
    !height ||
    !weight ||
    !experience_years ||
    !team_id
  ) {
    return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein." });
  }

  // Prüfe, ob Spieler schon in einem Team ist
  const checkQuery = "SELECT id FROM players WHERE username = ?";
  db.query(checkQuery, [username], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Fehler bei Spieler-Prüfung:", checkErr);
      return res.status(500).json({ error: "Fehler bei der Prüfung des Spielers." });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({ error: "Dieser Benutzer ist bereits einem Team zugeordnet!" });
    }

    // Wenn Spieler nicht existiert → einfügen
    const insertQuery = `
      INSERT INTO players
      (username, jersey_number, position, height, weight, experience_years, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [username, jersey_number, position, height, weight, experience_years, team_id];

    db.query(insertQuery, values, (insertErr, results) => {
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
    db.query(coachQuery, [team.head_coach, team.assistant_coach], (err, coachResults) => {
      if (err) return res.status(500).json({ error: "Fehler bei Coach-Abfrage" });

      const coaches = {};
      coachResults.forEach((c) => {
        coaches[c.username] = `${c.vorname} ${c.nachname}`;
      });

        res.json({
          team_name: team.name,
          logo_path: team.logo_path,
          logo_url: team.logo_path ? `http://localhost:8081${team.logo_path}` : null,
          head_coach_fullname: coaches[team.head_coach] || team.head_coach,
          assistant_coach_fullname: coaches[team.assistant_coach] || team.assistant_coach
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
  let params = [];

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

  // Komma-getrennte Usernames aus dem Frontend
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

    // Map für schnelle Zuordnung im Frontend
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
  const { username, jersey_number, position, height, weight, experience_years } = req.body;

  const query = `
    UPDATE players
    SET jersey_number = ?, position = ?, height = ?, weight = ?, experience_years = ?
    WHERE id = ?
  `;

  const values = [jersey_number, position, height, weight, experience_years, playerId];

  db.query(query, values, (err, results) => {
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

  db.query(query, [playerId], (err, results) => {
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

  db.query(insertQuery, [name, address, postal_code, capacity, home_team_id], (err, results) => {
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

app.post("/games", videoUpload.single("video"), (req, res) => {
  const { date, tip_off, home_team, away_team } = req.body;
  const videoPath = req.file ? `/uploads/videos/${req.file.filename}` : null;

  if (!date || !tip_off || !home_team || !away_team) {
    return res.status(400).json({ error: "Alle Felder (außer Video) sind Pflichtfelder." });
  }

  const gymQuery = `
    SELECT g.id FROM gyms g
    JOIN teams t ON g.home_team_id = t.id
    WHERE t.name = ? LIMIT 1
  `;

  db.query(gymQuery, [home_team], (err, gymResults) => {
    if (err) return res.status(500).json({ error: "Fehler bei der Gymsuche." });
    const gym_id = gymResults.length > 0 ? gymResults[0].id : null;

    const insertQuery = `
      INSERT INTO games (date, tip_off, home_team, away_team, gym_id, video_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [date, tip_off, home_team, away_team, gym_id, videoPath];

    db.query(insertQuery, values, (error, result) => {
      if (error) return res.status(500).json({ error: "Fehler beim Speichern des Spiels." });
      res.status(201).json({ message: "Spiel erfolgreich erstellt!", gameId: result.insertId });
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
      console.error("❌ SQL Fehler:", err.sqlMessage); // ← Genaue Fehlermeldung
      return res.status(500).json({ error: "Fehler beim Abrufen der Spiele." });
    }

    console.log("✅ Spiele gefunden:", results);
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
    ...bench.map((player_id) => ({ player_id, is_starting: 0 }))
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
        // Spieler ist bereits im Roster → überspringen
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


// GET: Roster für ein bestimmtes Spiel abrufen
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

app.post('/player-stats', (req, res) => {
  const stats = req.body; // Array von Stat-Objekten

  if (!Array.isArray(stats)) {
    return res.status(400).json({ error: "Array von Spieler-Statistiken erwartet." });
  }

  const values = stats.map(stat => [
    stat.game_roster_id,
    stat.mp,
    stat.fg,
    stat.fga,
    stat.three_p,
    stat.three_pa,
    stat.ft,
    stat.fta,
    stat.orb,
    stat.drb,
    stat.trb,
    stat.ast,
    stat.blk,
    stat.tov,
    stat.pf,
    stat.pst,
    stat.plus_minus
  ]);

  const query = `
    INSERT INTO player_stats (
      game_roster_id, mp, fg, fga, three_p, three_pa,
      ft, fta, orb, drb, trb, ast, blk, tov, pf, pst, plus_minus
    ) VALUES ?
  `;

  db.query(query, [values], (err) => {
    if (err) {
      console.error("Fehler beim Speichern der Stats:", err);
      return res.status(500).json({ error: "Fehler beim Speichern der Stats." });
    }
    res.status(201).json({ message: "Spieler-Statistiken gespeichert!" });
  });
});


// Aggregierte Statistiken für ein Spiel abrufen
app.get("/stats/:gameId", (req, res) => {
  const gameId = req.params.gameId;

  // --- Aggregation pro Spieler ---
  const byPlayerSql = `
    SELECT
      p.id            AS player_id,
      p.username      AS username,
      p.jersey_number AS jersey_number,
      t.id            AS team_id,
      t.name          AS team_name,
      SUM(ps.pst)     AS points,
      SUM(ps.fg)      AS fg,
      SUM(ps.fga)     AS fga,
      SUM(ps.three_p) AS three_p,
      SUM(ps.three_pa)AS three_pa,
      SUM(ps.ft)      AS ft,
      SUM(ps.fta)     AS fta,
      SUM(ps.orb)     AS orb,
      SUM(ps.drb)     AS drb,
      SUM(ps.trb)     AS trb,
      SUM(ps.ast)     AS ast,
      SUM(ps.blk)     AS blk,
      SUM(ps.tov)     AS tov,
      SUM(ps.pf)      AS pf,
      SUM(ps.plus_minus) AS plus_minus,
      SUM(ps.mp)      AS mp
    FROM game_rosters gr
    JOIN players p      ON p.id = gr.player_id
    JOIN teams t        ON t.id = p.team_id
    JOIN player_stats ps ON ps.game_roster_id = gr.id
    WHERE gr.game_id = ?
    GROUP BY p.id, p.username, p.jersey_number, t.id, t.name
    ORDER BY t.name ASC, points DESC, p.username ASC
  `;

  // --- Aggregation pro Team ---
  const byTeamSql = `
    SELECT
      t.id            AS team_id,
      t.name          AS team_name,
      SUM(ps.pst)     AS points,
      SUM(ps.fg)      AS fg,
      SUM(ps.fga)     AS fga,
      SUM(ps.three_p) AS three_p,
      SUM(ps.three_pa)AS three_pa,
      SUM(ps.ft)      AS ft,
      SUM(ps.fta)     AS fta,
      SUM(ps.orb)     AS orb,
      SUM(ps.drb)     AS drb,
      SUM(ps.trb)     AS trb,
      SUM(ps.ast)     AS ast,
      SUM(ps.blk)     AS blk,
      SUM(ps.tov)     AS tov,
      SUM(ps.pf)      AS pf,
      SUM(ps.plus_minus) AS plus_minus
    FROM game_rosters gr
    JOIN players p       ON p.id = gr.player_id
    JOIN teams t         ON t.id = p.team_id
    JOIN player_stats ps ON ps.game_roster_id = gr.id
    WHERE gr.game_id = ?
    GROUP BY t.id, t.name
    ORDER BY points DESC, team_name ASC
  `;

  db.query(byPlayerSql, [gameId], (errPlayer, rowsPlayer) => {
    if (errPlayer) {
      console.error("Fehler (byPlayerSql):", errPlayer);
      return res.status(500).json({ error: "Fehler beim Abrufen der Spielerstatistiken." });
    }

    db.query(byTeamSql, [gameId], (errTeam, rowsTeam) => {
      if (errTeam) {
        console.error("Fehler (byTeamSql):", errTeam);
        return res.status(500).json({ error: "Fehler beim Abrufen der Teamstatistiken." });
      }

      // Prozentwerte on-the-fly berechnen (ohne in DB zu speichern)
      const safePct = (made, att) => (att > 0 ? +( (made / att) * 100 ).toFixed(1) : null);

      const byPlayer = rowsPlayer.map(r => ({
        player_id: r.player_id,
        username: r.username,
        jersey_number: r.jersey_number,
        team_id: r.team_id,
        team_name: r.team_name,
        points: r.points,
        fg: r.fg, fga: r.fga, fg_pct: safePct(r.fg, r.fga),
        three_p: r.three_p, three_pa: r.three_pa, three_p_pct: safePct(r.three_p, r.three_pa),
        ft: r.ft, fta: r.fta, ft_pct: safePct(r.ft, r.fta),
        orb: r.orb, drb: r.drb, trb: r.trb,
        ast: r.ast, blk: r.blk, tov: r.tov, pf: r.pf,
        plus_minus: r.plus_minus,
        mp: r.mp
      }));

      const byTeam = rowsTeam.map(r => ({
        team_id: r.team_id,
        team_name: r.team_name,
        points: r.points,
        fg: r.fg, fga: r.fga, fg_pct: safePct(r.fg, r.fga),
        three_p: r.three_p, three_pa: r.three_pa, three_p_pct: safePct(r.three_p, r.three_pa),
        ft: r.ft, fta: r.fta, ft_pct: safePct(r.ft, r.fta),
        orb: r.orb, drb: r.drb, trb: r.trb,
        ast: r.ast, blk: r.blk, tov: r.tov, pf: r.pf,
        plus_minus: r.plus_minus
      }));

      return res.json({
        game_id: Number(gameId),
        byPlayer,
        byTeam
      });
    });
  });
});


app.get("/game-roster-detailed/:gameId", (req, res) => {
  const gameId = req.params.gameId;

  const gameQuery = "SELECT home_team, away_team FROM games WHERE id = ?";
  db.query(gameQuery, [gameId], (err, gameResults) => {
    if (err || gameResults.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden" });
    }

    const { home_team, away_team } = gameResults[0];

    const teamQuery = "SELECT id, name, logo_path FROM teams WHERE name IN (?, ?)";
    db.query(teamQuery, [home_team, away_team], (err, teamResults) => {
      if (err || teamResults.length < 2) {
        return res.status(500).json({ error: "Teams konnten nicht geladen werden" });
      }

      const homeTeam = teamResults.find((t) => t.name === home_team);
      const awayTeam = teamResults.find((t) => t.name === away_team);

      const rosterQuery = `
        SELECT gr.player_id, gr.is_starting, p.username, p.jersey_number, p.position, p.team_id
        FROM game_rosters gr
        JOIN players p ON gr.player_id = p.id
        WHERE gr.game_id = ?
      `;

      db.query(rosterQuery, [gameId], (err, rosterResults) => {
        if (err) {
          return res.status(500).json({ error: "Roster konnte nicht geladen werden" });
        }

        const homeStarters = rosterResults.filter(
          (p) => p.team_id === homeTeam.id && p.is_starting === 1
        );
        const homeBench = rosterResults.filter(
          (p) => p.team_id === homeTeam.id && p.is_starting === 0
        );

        const awayStarters = rosterResults.filter(
          (p) => p.team_id === awayTeam.id && p.is_starting === 1
        );
        const awayBench = rosterResults.filter(
          (p) => p.team_id === awayTeam.id && p.is_starting === 0
        );

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

// GET /roster-exists/:gameId/:teamName
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

// POST /games/:gameId/players/:playerId/stats-event
// Body: { type: 'off_reb' | 'def_reb' | 'three_pa' | 'three_p' }
app.post("/games/:gameId/players/:playerId/stats-event", (req, res) => {
  const { gameId, playerId } = req.params;
  const { type } = req.body;

  const allowedTypes = ["off_reb", "def_reb", "three_pa", "three_p"];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ success: false, message: "Ungültiger Statistik-Typ" });
  }

  // Mapping: welcher DB-Column wird erhöht?
  const columnMap = {
    fg: "fg",                     // 2P Make
    fga: "fga",                   // 2P Attempt

    three_p: "three_p",           // 3P Make
    three_pa: "three_pa",         // 3P Attempt

    ft: "ft",                     // FT Make
    fta: "fta",                   // FT Attempt

    orb: "orb",                   // Offensiv-Rebound
    drb: "drb",                   // Defensiv-Rebound
    trb: "trb",                   // Total-Rebound

    ast: "ast",                   // Assist

    blk: "blk",                   // Block
    stl: "stl",                   // → Nur wenn du die DB erweiterst!

    tov: "tov",                   // Turnover
    pf: "pf",                     // Foul

    pst: "pst",                   // Punkte

    plus_minus: "plus_minus",     // +/- Wert
  };


  const column = columnMap[type];

  // 1) Roster-Eintrag holen/erstellen
  const findRosterSql =
    "SELECT id FROM game_rosters WHERE game_id = ? AND player_id = ? LIMIT 1";

  db.query(findRosterSql, [gameId, playerId], (err, rosterRows) => {
    if (err) {
      console.error("Fehler beim Lesen game_rosters:", err);
      return res.status(500).json({ success: false, message: "DB-Fehler" });
    }

    const ensureStatsRow = (game_roster_id) => {
      const findStatsSql =
        "SELECT id FROM player_stats WHERE game_roster_id = ? LIMIT 1";

      db.query(findStatsSql, [game_roster_id], (err2, statRows) => {
        if (err2) {
          console.error("Fehler beim Lesen player_stats:", err2);
          return res.status(500).json({ success: false, message: "DB-Fehler" });
        }

        if (statRows.length === 0) {
          // Noch keine Stats → neue Zeile mit 1 in der entsprechenden Spalte
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
          // Stats existieren → Spalte um 1 erhöhen
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

    if (rosterRows.length > 0) {
      const rosterId = rosterRows[0].id;
      return ensureStatsRow(rosterId);
    }

    // Kein Roster → neu anlegen
    const insertRosterSql =
      "INSERT INTO game_rosters (game_id, player_id, is_starting) VALUES (?, ?, 0)";
    db.query(insertRosterSql, [gameId, playerId], (err5, resultRoster) => {
      if (err5) {
        console.error("Fehler beim Erstellen game_rosters:", err5);
        return res.status(500).json({ success: false, message: "DB-Fehler" });
      }

      ensureStatsRow(resultRoster.insertId);
    });
  });
});

// Spieler zu einem Spiel laden (für Dropdown)
// GET /games/:gameId/players
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




const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));


