const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database(path.join(__dirname, "scorecard.db"));

// ================= INITIAL DATA =================
const initialData = {
  prod: { actual: [85,87,88,86,89,91,88,87,90,92,89,88], budget: [85,85,85,85,85,85,85,85,85,85,85,85] },
  oee: { actual: [78,80,82,79,84,86,81,80,83,85,82,81], budget: [80,80,80,80,80,80,80,80,80,80,80,80] },
  volume: { actual: [1200,1250,1280,1220,1300,1350,1280,1270,1320,1400,1300,1290], budget: [1250,1250,1250,1250,1250,1250,1250,1250,1250,1250,1250,1250] },
  planned: { actual: [4.5,4.2,4.8,4.1,4.3,4.0,4.5,4.4,4.2,4.1,4.3,4.6], budget: [4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5] },
  changeover: { actual: [2.1,2.2,2.0,2.3,2.1,2.0,2.2,2.1,2.0,1.9,2.1,2.2], budget: [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0] },
  unplanned: { actual: [3.2,3.1,3.5,2.8,3.0,2.9,3.2,3.3,3.1,2.7,3.0,3.2], budget: [3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0] },
  breakdown: { actual: [1.8,1.9,1.7,2.1,1.8,1.6,1.9,2.0,1.8,1.5,1.7,1.8], budget: [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0] },
  waste: { actual: [2.3,2.2,2.5,2.1,2.4,2.2,2.3,2.4,2.2,2.0,2.2,2.3], budget: [2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5] },
  stops: { actual: [1.2,1.1,1.4,0.9,1.2,1.0,1.3,1.2,1.1,0.8,1.1,1.2], budget: [1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5] },
  emp: { actual: [45,46,47,45,48,50,47,46,49,51,48,47], budget: [45,45,45,45,45,45,45,45,45,45,45,45] },
  casual: { actual: [8,9,10,7,11,12,10,9,11,13,10,9], budget: [10,10,10,10,10,10,10,10,10,10,10,10] }
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

// ✅ ده المهم اللي كان ناقص
function buildDataPayload(rows) {
  const data = Object.fromEntries(
    knownKpis.map((k) => [k, { actual: Array(12).fill(0), budget: Array(12).fill(0) }])
  );

  rows.forEach(row => {
    data[row.kpi].actual[row.month] = row.actual;
    data[row.kpi].budget[row.month] = row.budget;
  });

  return data;
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
    for (const kpi of Object.keys(initialData)) {
      for (let i = 0; i < 12; i++) {
        await runSql(
          "INSERT INTO scorecard (kpi, month, actual, budget) VALUES (?, ?, ?, ?)",
          [kpi, i, initialData[kpi].actual[i], initialData[kpi].budget[i]]
        );
      }
    }
  }
}

// ================= ROUTES =================
app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/data', async (req, res) => {
  try {
    const rows = await allSql("SELECT kpi, month, actual, budget FROM scorecard ORDER BY kpi, month");
    res.json(buildDataPayload(rows)); // ✅ أهم fix
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post('/send', async (req, res) => {
  const { kpi, month, actual, budget } = req.body;

  if (!knownKpis.includes(kpi)) {
    return res.status(400).json({ error: "Invalid KPI" });
  }

  try {
    await runSql(
      "INSERT INTO scorecard (kpi, month, actual, budget) VALUES (?, ?, ?, ?) ON CONFLICT(kpi, month) DO UPDATE SET actual=excluded.actual, budget=excluded.budget",
      [kpi, month, actual, budget]
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Save error" });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB error:", err.message);
    process.exit(1);
  });
``