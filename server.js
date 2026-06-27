const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();

const db = new sqlite3.Database(path.join(__dirname, "scorecard.db"));

const initialData = {
  prod: { actual: [85,87,88,86,89,91,88,87,90,92,89,88], budget: Array(12).fill(85) },
  oee: { actual: [78,80,82,79,84,86,81,80,83,85,82,81], budget: Array(12).fill(80) }
};

const knownKpis = Object.keys(initialData);

// ================= DB HELPERS =================
function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allSql(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ================= INIT DB =================
async function initializeDatabase() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS scorecard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kpi TEXT,
      month INTEGER,
      actual REAL,
      budget REAL,
      UNIQUE(kpi, month)
    )
  `);

  const rows = await allSql("SELECT * FROM scorecard");

  if (rows.length === 0) {
    for (let kpi of Object.keys(initialData)) {
      for (let i = 0; i < 12; i++) {
        await runSql(
          "INSERT INTO scorecard VALUES (NULL, ?, ?, ?, ?)",
          [kpi, i, initialData[kpi].actual[i], initialData[kpi].budget[i]]
        );
      }
    }
  }
}

// ================= MIDDLEWARE =================
app.use(express.static(__dirname));
app.use(express.json());

// ================= ROUTES =================

// serve UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// get data
app.get("/data", async (req, res) => {
  try {
    const rows = await allSql("SELECT * FROM scorecard ORDER BY kpi, month");

    let data = {};
    knownKpis.forEach(k => {
      data[k] = { actual: Array(12).fill(0), budget: Array(12).fill(0) };
    });

    rows.forEach(r => {
      data[r.kpi].actual[r.month] = r.actual;
      data[r.kpi].budget[r.month] = r.budget;
    });

    res.json(data);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "DB error" });
  }
});

// save data (snag / update)
app.post("/send", async (req, res) => {
  const { kpi, month, actual, budget } = req.body;

  if (!knownKpis.includes(kpi)) {
    return res.status(400).json({ error: "Invalid KPI" });
  }

  try {
    await runSql(
      `INSERT INTO scorecard (kpi, month, actual, budget)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(kpi, month)
       DO UPDATE SET actual=excluded.actual, budget=excluded.budget`,
      [kpi, month, actual, budget]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Save error" });
  }
});

// ================= START =================
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});
