// ═══════════════════════════════════════════════════════
// Ce-eS Dashboard – Server mit KI-Proxy + Web-Suche
// ═══════════════════════════════════════════════════════

require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("\n❌ ANTHROPIC_API_KEY fehlt!\n");
  console.error("Option 1: .env Datei anlegen:");
  console.error("  Kopieren Sie .env.example nach .env und tragen Sie Ihren Key ein\n");
  console.error("Option 2: Direkt im Terminal:");
  console.error("  ANTHROPIC_API_KEY=sk-ant-... node server.js\n");
  console.error("API-Key erhalten Sie unter: https://console.anthropic.com/settings/keys\n");
  process.exit(1);
}

// JSON Body Parser (larger limit for tool responses)
app.use(express.json({ limit: "5mb" }));

// Dashboard (statische Dateien)
app.use(express.static(path.join(__dirname, "public")));

// ─── KI-Proxy Endpoint (supports web_search tool) ───
app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Fehler ${response.status}:`, error);
      return res.status(response.status).json({
        error: true,
        message: `API Fehler: ${response.status}`,
        detail: error,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy Fehler:", err.message);
    res.status(500).json({
      error: true,
      message: "Verbindung zur KI fehlgeschlagen",
    });
  }
});

// Fallback: Dashboard für alle anderen Routen
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Server starten
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║    Ce-eS Dashboard läuft! 🚀                 ║
  ║                                              ║
  ║    → http://localhost:${PORT}                   ║
  ║                                              ║
  ║    KI-Assistent:  ✅ Aktiv                   ║
  ║    Web-Suche:     ✅ Aktiv                   ║
  ║    API-Key: ${API_KEY.slice(0, 12)}...${API_KEY.slice(-4)}              ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});
