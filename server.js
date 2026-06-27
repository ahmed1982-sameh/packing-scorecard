const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();

// Suppress SQLite verbose logging in production
if (process.env.NODE_ENV === 'production') {
  sqlite3.verbose = () => sqlite3;
}

const db = new sqlite3.Database(path.join(__dirname, "scorecard.db"));

const initialData = {
  prod: { actual: [85, 87, 88, 86, 89, 91, 88, 87, 90, 92, 89, 88], budget: [85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85] },
  oee: { actual: [78, 80, 82, 79, 84, 86, 81, 80, 83, 85, 82, 81], budget: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80] },
  volume: { actual: [1200, 1250, 1280, 1220, 1300, 1350, 1280, 1270, 1320, 1400, 1300, 1290], budget: [1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250, 1250] },
  planned: { actual: [4.5, 4.2, 4.8, 4.1, 4.3, 4.0, 4.5, 4.4, 4.2, 4.1, 4.3, 4.6], budget: [4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5] },
  changeover: { actual: [2.1, 2.2, 2.0, 2.3, 2.1, 2.0, 2.2, 2.1, 2.0, 1.9, 2.1, 2.2], budget: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0] },
  unplanned: { actual: [3.2, 3.1, 3.5, 2.8, 3.0, 2.9, 3.2, 3.3, 3.1, 2.7, 3.0, 3.2], budget: [3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0] },
  breakdown: { actual: [1.8, 1.9, 1.7, 2.1, 1.8, 1.6, 1.9, 2.0, 1.8, 1.5, 1.7, 1.8], budget: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0] },
  waste: { actual: [2.3, 2.2, 2.5, 2.1, 2.4, 2.2, 2.3, 2.4, 2.2, 2.0, 2.2, 2.3], budget: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5] },
  stops: { actual: [1.2, 1.1, 1.4, 0.9, 1.2, 1.0, 1.3, 1.2, 1.1, 0.8, 1.1, 1.2], budget: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5] },
  emp: { actual: [45, 46, 47, 45, 48, 50, 47, 46, 49, 51, 48, 47], budget: [45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45] },
  casual: { actual: [8, 9, 10, 7, 11, 12, 10, 9, 11, 13, 10, 9], budget: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] }
};
const knownKpis = Object.freeze(Object.keys(initialData));

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function getSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function initializeDatabase() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS scorecard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kpi TEXT NOT NULL,
      month INTEGER NOT NULL,
      actual REAL NOT NULL,
      budget REAL NOT NULL,
      UNIQUE(kpi, month)
    )
  `);

  await runSql(`
    CREATE INDEX IF NOT EXISTS idx_scorecard_kpi_month
    ON scorecard (kpi, month)
  `);

  const row = await getSql("SELECT COUNT(*) AS count FROM scorecard");
  if (row.count === 0) {
    for (const [kpi, values] of Object.entries(initialData)) {
      for (let month = 0; month < 12; month += 1) {
        await runSql(
          "INSERT INTO scorecard (kpi, month, actual, budget) VALUES (?, ?, ?, ?)",
          [kpi, month, values.actual[month], values.budget[month]]
        );
      }
    }
  }
}

function buildDataPayload(rows) {
  const data = Object.fromEntries(
    knownKpis.map((kpi) => [kpi, { actual: Array(12).fill(0), budget: Array(12).fill(0) }])
  );

  rows.forEach((row) => {
    if (!data[row.kpi]) {
      data[row.kpi] = { actual: Array(12).fill(0), budget: Array(12).fill(0) };
    }

    data[row.kpi].actual[row.month] = row.actual;
    data[row.kpi].budget[row.month] = row.budget;
  });

  return data;
}

app.use(express.static(__dirname, { 
  extensions: ['html', 'htm'],
  etag: false 
}));
app.use(express.json());

// Serve dashboard.html for root path
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'dashboard.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving dashboard.html:', err.message);
      res.status(404).send('Dashboard not found. Ensure dashboard.html is deployed.');
    }
  });
});

app.get('/data', async (req, res) => {
  try {
    const rows = await allSql("SELECT kpi, month, actual, budget FROM scorecard ORDER BY kpi, month");
    res.json(buildDataPayload(rows));
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post('/send', async (req, res) => {
  const { kpi, month, actual, budget } = req.body;
  const numericActual = Number(actual) || 0;
  const numericBudget = Number(budget) || 0;

  if (!knownKpis.includes(kpi) || !Number.isInteger(month) || month < 0 || month > 11) {
    return res.status(400).json({ error: "Invalid input" });
  }

// 404 fallback handler
app.use((req, res) => {
  console.warn(`404: Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/data`);
    });
  })
  .catch((error) => {
    console.error("❌ 
    console.error("Failed to save data:", error.message);
    res.status(500).json({ error: "Failed to save data" });
  }
});

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  });
