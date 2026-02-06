# Ce-eS Dashboard – Deployment-Anleitung

## Übersicht

Das Ce-eS Dashboard ist eine Web-Anwendung mit integriertem KI-Assistenten.
Damit die KI-Funktion im Browser funktioniert, wird ein kleiner Server benötigt,
der als Vermittler (Proxy) zwischen dem Browser und der KI-API dient.

**Warum?** Browser können aus Sicherheitsgründen die KI-API nicht direkt aufrufen.
Der Server leitet die Anfragen sicher weiter und hält den API-Schlüssel geheim.

---

## Voraussetzungen

- **Node.js** (Version 18 oder neuer) → [https://nodejs.org](https://nodejs.org)
- **Anthropic API-Key** → [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

## Option A: Lokale Installation (eigener PC/Server)

### 1. Ordner vorbereiten

Den mitgelieferten Ordner `ce-es-deploy` an einen beliebigen Ort kopieren.
Die Struktur sieht so aus:

```
ce-es-deploy/
├── server.js          ← Server-Datei
├── package.json       ← Abhängigkeiten
├── .env.example       ← Vorlage für API-Key
├── Dockerfile         ← Für Docker (optional)
└── public/
    └── index.html     ← Das Dashboard
```

### 2. Abhängigkeiten installieren

Terminal öffnen, in den Ordner navigieren:

```bash
cd ce-es-deploy
npm install
```

### 3. API-Key eintragen

Die Datei `.env.example` kopieren und umbenennen:

```bash
cp .env.example .env
```

Dann `.env` mit einem Texteditor öffnen und den API-Key eintragen:

```
ANTHROPIC_API_KEY=sk-ant-api03-DEIN-ECHTER-KEY
PORT=3000
```

### 4. Server starten

```bash
# Mit .env-Datei (braucht dotenv):
npm install dotenv
node -e "require('dotenv').config()" -e "" && node server.js

# ODER direkt im Terminal:
ANTHROPIC_API_KEY=sk-ant-api03-DEIN-KEY node server.js

# Unter Windows (PowerShell):
$env:ANTHROPIC_API_KEY="sk-ant-api03-DEIN-KEY"; node server.js

# Unter Windows (CMD):
set ANTHROPIC_API_KEY=sk-ant-api03-DEIN-KEY && node server.js
```

### 5. Dashboard öffnen

Im Browser aufrufen: **http://localhost:3000**

Das Dashboard erscheint mit Login-Seite. Der KI-Assistent funktioniert jetzt! 🎉

---

## Option B: Docker

### 1. Image bauen

```bash
cd ce-es-deploy
docker build -t ce-es-dashboard .
```

### 2. Container starten

```bash
docker run -d \
  --name ce-es \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-api03-DEIN-KEY \
  ce-es-dashboard
```

Dashboard erreichbar unter: **http://localhost:3000**

---

## Option C: Online hosten (Render.com – kostenlos)

### 1. GitHub Repository erstellen

Den `ce-es-deploy` Ordner in ein neues GitHub Repository hochladen.

### 2. Render.com

1. Account erstellen auf [render.com](https://render.com)
2. "New +" → "Web Service"
3. GitHub Repository verbinden
4. Einstellungen:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:** `ANTHROPIC_API_KEY` = dein Key
5. "Deploy" klicken

Nach 1–2 Minuten läuft das Dashboard unter einer `.onrender.com` URL.

### Alternative: Railway.app

1. Account auf [railway.app](https://railway.app)
2. "New Project" → GitHub Repository
3. Environment Variable setzen: `ANTHROPIC_API_KEY`
4. Automatisches Deployment

---

## Option D: Eigener Webserver (VPS/Root-Server)

### Mit PM2 (Prozess-Manager, empfohlen)

```bash
# PM2 installieren
npm install -g pm2

# In den Ordner wechseln
cd ce-es-deploy
npm install

# Starten mit API-Key
ANTHROPIC_API_KEY=sk-ant-... pm2 start server.js --name ce-es

# Autostart einrichten (überlebt Server-Neustart)
pm2 startup
pm2 save

# Status prüfen
pm2 status
pm2 logs ce-es
```

### Mit Nginx als Reverse Proxy (HTTPS)

Falls du eine eigene Domain hast (z.B. `dashboard.ce-es.de`):

```nginx
server {
    listen 443 ssl;
    server_name dashboard.ce-es.de;

    ssl_certificate     /etc/letsencrypt/live/dashboard.ce-es.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.ce-es.de/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL-Zertifikat mit Let's Encrypt:

```bash
sudo certbot --nginx -d dashboard.ce-es.de
```

---

## Kosten

| Komponente | Kosten |
|---|---|
| Dashboard & Server | Kostenlos (Open Source) |
| Anthropic API (Opus) | ca. $15 / 1 Mio. Input-Tokens, $75 / 1 Mio. Output-Tokens |
| Render.com (Free Tier) | Kostenlos (schläft nach 15 Min Inaktivität) |
| Render.com (Starter) | $7/Monat (immer an) |
| Eigener VPS | ab ca. $5/Monat (z.B. Hetzner, Netcup) |

**Geschätzte KI-Kosten pro Monat bei normaler Nutzung:** ca. $5–20
(abhängig davon, wie oft der KI-Assistent benutzt wird)

---

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| "ANTHROPIC_API_KEY fehlt" | Umgebungsvariable setzen (siehe Schritt 3) |
| "API Fehler: 401" | API-Key ist ungültig → neuen Key generieren |
| "API Fehler: 429" | Rate Limit erreicht → kurz warten |
| "API Fehler: 529" | Anthropic überlastet → 1-2 Min warten |
| KI antwortet nicht | Prüfen ob Server läuft: `curl http://localhost:3000/api/chat` |
| Seite lädt nicht | Port prüfen, Firewall-Regeln checken |

---

## Sicherheitshinweise

- **API-Key niemals im Frontend-Code oder in Git speichern**
- Der Key ist nur auf dem Server in der Umgebungsvariable
- Bei öffentlichem Zugang: Login-System ist bereits integriert
- Für Produktionsbetrieb: HTTPS über Nginx/Caddy einrichten
- Optional: IP-Whitelist im Server einrichten
