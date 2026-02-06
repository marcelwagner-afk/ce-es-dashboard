import { useState } from "react";
import { Shield, Lock, Server, UserCheck, FileKey, AlertTriangle, CheckCircle2, Globe, HardDrive, KeyRound, Fingerprint, ShieldCheck, ShieldAlert, History, Download, Users, Database, Wifi, WifiOff, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";

type SecTab = "uebersicht"|"zugriff"|"verschluesselung"|"audit"|"dsgvo";

// ─── Helper: Download text file ───
function downloadTextFile(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateSecurityReport() {
  const now = new Date().toLocaleString("de-DE");
  const report = `SICHERHEITS-REPORT
Ce-eS Management Consultant
Erstellt: ${now}
═══════════════════════════════════════

GESAMTBEWERTUNG: 92/100 (Sehr gut)

VERSCHLÜSSELUNG:
  ✓ AES-256 Verschlüsselung aktiv
  ✓ TLS 1.3 für alle Verbindungen
  ✓ Ende-zu-Ende-Verschlüsselung für Dokumente
  ✓ Datenbank verschlüsselt (at rest)

ZUGRIFFSKONTROLLE:
  ✓ 3 von 4 Benutzer mit 2FA
  ⚠ RA Dr. Bauer ohne 2FA (Empfehlung: aktivieren)
  ✓ Rollenbasierte Zugriffskontrolle aktiv
  ✓ Session-Timeout: 30 Min

DATENSPEICHERUNG:
  ✓ Primär: Hetzner Cloud (Nürnberg, DE)
  ✓ Backup: IONOS Backup (Frankfurt, DE)
  ✓ Tägliche automatische Backups
  ✓ Letztes Backup: heute 10:30 Uhr

DSGVO-COMPLIANCE:
  ✓ Auftragsverarbeitungsverträge vorhanden
  ✓ Verarbeitungsverzeichnis gepflegt
  ✓ Datenschutzerklärung aktuell
  ✓ Löschkonzept implementiert

OFFENE MASSNAHMEN:
  1. 2FA für RA Dr. Bauer aktivieren (Priorität: Hoch)
  2. Nächster Penetrationstest: Q2/2025

───────────────────────────────────────
Report automatisch generiert von Ce-eS Dashboard
`;
  downloadTextFile(report, `Sicherheits-Report_${new Date().toISOString().slice(0,10)}.txt`);
  toast.success("Sicherheits-Report heruntergeladen");
}

function exportAuditLog() {
  const header = "ID;Zeitpunkt;Benutzer;Aktion;Details;Risiko";
  const rows = AUDIT_LOG.map(e =>
    `${e.id};${e.datum};${e.user};${e.aktion};${e.details};${e.risiko}`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Audit_Log_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Audit-Log als CSV exportiert");
}

interface AuditEntry {
  id: string; datum: string; user: string; aktion: string; details: string; risiko: "niedrig"|"mittel"|"hoch";
}

const AUDIT_LOG: AuditEntry[] = [
  { id:"AU-001", datum:"2025-02-05T08:22:00", user:"H. Schäfer", aktion:"Login", details:"Erfolgreiche Anmeldung via 2FA (Büro-PC)", risiko:"niedrig" },
  { id:"AU-002", datum:"2025-02-05T08:20:00", user:"System", aktion:"Lexware-Sync", details:"Automatische Synchronisation – 9 Rechnungen, 10 Kunden", risiko:"niedrig" },
  { id:"AU-003", datum:"2025-02-05T08:15:00", user:"System", aktion:"DATEV-Sync", details:"Buchungsdaten exportiert (12 Einträge)", risiko:"niedrig" },
  { id:"AU-004", datum:"2025-02-04T17:45:00", user:"H. Schäfer", aktion:"Klient bearbeitet", details:"Weber & Söhne KG – Notiz aktualisiert", risiko:"niedrig" },
  { id:"AU-005", datum:"2025-02-04T16:30:00", user:"C. Schäfer", aktion:"Dokument hochgeladen", details:"Sanierungskonzept_v3.pdf → Akte Weber & Söhne", risiko:"niedrig" },
  { id:"AU-006", datum:"2025-02-04T14:00:00", user:"H. Schäfer", aktion:"Rechnung erstellt", details:"RE-2025-007 – Fuchs Bau GmbH – 6.200 €", risiko:"niedrig" },
  { id:"AU-007", datum:"2025-02-04T10:30:00", user:"System", aktion:"Backup", details:"Vollbackup erfolgreich (verschlüsselt, 2.4 GB)", risiko:"niedrig" },
  { id:"AU-008", datum:"2025-02-03T21:15:00", user:"System", aktion:"Fehlgeschlagener Login", details:"3 fehlgeschlagene Versuche von IP 192.168.1.105 – Account gesperrt (30 Min)", risiko:"hoch" },
  { id:"AU-009", datum:"2025-02-03T18:00:00", user:"System", aktion:"Daten-Export", details:"Klient Schwarz – Projektdaten archiviert und exportiert", risiko:"mittel" },
  { id:"AU-010", datum:"2025-02-03T09:00:00", user:"H. Schäfer", aktion:"Bankdaten eingesehen", details:"IBAN angezeigt – Zugriff protokolliert", risiko:"mittel" },
];

const ACCESS_ROLES = [
  { name:"Holger Schäfer", rolle:"Administrator", rechte:["Alle Klienten","Finanzen","DATEV","Lexware","Bank","Einstellungen","Benutzerverwaltung"], status:"aktiv", lastLogin:"05.02.2025, 08:22", twofa:true },
  { name:"Christine Schäfer", rolle:"Berater (Vollzugriff)", rechte:["Alle Klienten","Akten","Termine","Angebote"], status:"aktiv", lastLogin:"04.02.2025, 16:30", twofa:true },
  { name:"Extern: StB Maier", rolle:"Steuerberater (Lesezugriff)", rechte:["DATEV (nur Lesen)","Rechnungen (nur Lesen)"], status:"aktiv", lastLogin:"03.02.2025, 10:00", twofa:true },
  { name:"Extern: RA Dr. Bauer", rolle:"Anwalt (Fallbezogen)", rechte:["Akte Weber & Söhne (nur Lesen)","Akte Klein (nur Lesen)"], status:"aktiv", lastLogin:"01.02.2025, 14:20", twofa:false },
];

export function SecurityView() {
  const [tab, setTab] = useState<SecTab>("uebersicht");

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="dark-card p-5 lg:p-8 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center"><Shield size={22} /></div>
                <div>
                  <div className="text-lg font-bold font-display">Datenschutz & Sicherheit</div>
                  <div className="text-[11px] text-white/40">Mandantendaten · Unternehmensdaten · DSGVO-Konformität</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400"><CheckCircle2 size={13}/>Verschlüsselung aktiv</span>
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400"><CheckCircle2 size={13}/>2FA aktiviert</span>
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400"><CheckCircle2 size={13}/>DSGVO-konform</span>
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400"><CheckCircle2 size={13}/>Backup: heute 10:30</span>
              </div>
            </div>
            <button onClick={generateSecurityReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border-none rounded-xl text-white text-sm font-medium cursor-pointer transition-colors">
              <Download size={15} /> Report
            </button>
          </div>
        </div>
      </div>

      {/* Security Score */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <ScoreCard label="Sicherheits-Score" value="94/100" icon={<ShieldCheck size={16}/>} color="text-amber-600" bg="bg-emerald-50" />
        <ScoreCard label="Aktive Nutzer" value="4" icon={<Users size={16}/>} color="text-blue-600" bg="bg-blue-50" />
        <ScoreCard label="Offene Warnungen" value="1" icon={<ShieldAlert size={16}/>} color="text-amber-600" bg="bg-amber-50" />
        <ScoreCard label="Letztes Backup" value="10:30" icon={<HardDrive size={16}/>} color="text-slate-600" bg="bg-slate-50" />
      </div>

      {/* Sub-Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-5 border border-slate-200/80 w-fit shadow-sm overflow-x-auto">
        {([["uebersicht","Übersicht"],["zugriff","Zugriffsrechte"],["verschluesselung","Verschlüsselung"],["audit","Audit-Log"],["dsgvo","DSGVO"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 border-none rounded-lg text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all ${
              tab===k ? "bg-[#1a1d26] text-white shadow-md" : "bg-transparent text-slate-400 hover:text-slate-600"
            }`}>{l}</button>
        ))}
      </div>

      {tab === "uebersicht" && <OverviewTab />}
      {tab === "zugriff" && <AccessTab />}
      {tab === "verschluesselung" && <EncryptionTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "dsgvo" && <DsgvoTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Lock size={16} className="text-amber-700"/>Sicherheitsmaßnahmen</h3>
        <div className="space-y-3">
          {[
            { icon:<Fingerprint size={15}/>, label:"Zwei-Faktor-Authentifizierung", status:true, detail:"TOTP via Authenticator-App" },
            { icon:<Lock size={15}/>, label:"Ende-zu-Ende-Verschlüsselung", status:true, detail:"AES-256 für alle Mandantendaten" },
            { icon:<HardDrive size={15}/>, label:"Automatisches Backup", status:true, detail:"Täglich 02:00 + 10:30, verschlüsselt" },
            { icon:<WifiOff size={15}/>, label:"Lokaler Server (kein Cloud)", status:true, detail:"Daten verlassen nicht das Büronetzwerk" },
            { icon:<History size={15}/>, label:"Zugriffs-Protokollierung", status:true, detail:"Lückenlose Audit-Trail" },
            { icon:<KeyRound size={15}/>, label:"Passwort-Richtlinie", status:true, detail:"Min. 12 Zeichen, Rotation alle 90 Tage" },
            { icon:<MonitorSmartphone size={15}/>, label:"Geräteverwaltung", status:true, detail:"Nur freigegebene Geräte" },
            { icon:<Globe size={15}/>, label:"SSL/TLS Verschlüsselung", status:true, detail:"TLS 1.3 für alle Verbindungen" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <span className="text-amber-600">{m.icon}</span>
              <div className="flex-1">
                <div className="text-[12px] font-medium text-slate-700">{m.label}</div>
                <div className="text-[10px] text-slate-400">{m.detail}</div>
              </div>
              <CheckCircle2 size={14} className="text-amber-500 flex-shrink-0"/>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Warning */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0"/>
            <div>
              <div className="text-[12px] font-semibold text-amber-700">Offene Empfehlung</div>
              <div className="text-[11px] text-amber-600 mt-1">RA Dr. Bauer hat noch keine 2FA aktiviert. Externer Zugriff ohne 2FA stellt ein erhöhtes Sicherheitsrisiko dar.</div>
              <button onClick={() => { toast.loading("2FA-Einladung wird versendet…", { id: "2fa" }); setTimeout(() => toast.success("2FA-Einladung an RA Dr. Bauer gesendet ✓", { id: "2fa" }), 1200); }} className="mt-2 text-[11px] text-amber-700 font-semibold bg-transparent border-none cursor-pointer hover:underline p-0">2FA-Einladung senden →</button>
            </div>
          </div>
        </div>

        {/* Data Location */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Server size={16} className="text-amber-700"/>Datenspeicherung</h3>
          <div className="space-y-3">
            {[
              { label:"Primärer Server", value:"Büro Im Zukunftspark 4, HN", icon:<Server size={13}/> },
              { label:"Backup-Server", value:"Externes Rechenzentrum DE (verschlüsselt)", icon:<HardDrive size={13}/> },
              { label:"Datenbank", value:"PostgreSQL 16, verschlüsselt at-rest", icon:<Database size={13}/> },
              { label:"Dateispeicher", value:"Lokal, AES-256 verschlüsselt", icon:<FileKey size={13}/> },
              { label:"Netzwerk", value:"Lokales VPN, kein Cloud-Zugang", icon:<Wifi size={13}/> },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                <span className="text-slate-400">{s.icon}</span>
                <div className="flex-1"><div className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</div><div className="text-[12px] text-slate-700 font-medium">{s.value}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-2xl border border-amber-200/40 p-4">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-amber-700 mt-0.5 flex-shrink-0"/>
            <div className="text-[11px] text-amber-700">
              <div className="font-semibold mb-1">Berufsgeheimnisschutz § 203 StGB</div>
              Alle Mandantendaten unterliegen dem besonderen Schutz des Berufsgeheimnisses. Der Zugriff ist streng auf autorisierte Personen beschränkt. Externe Partner erhalten nur fallbezogenen Lesezugriff.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-700 m-0">Benutzer & Zugriffsrechte</h3></div>
      <div className="divide-y divide-slate-50">
        {ACCESS_ROLES.map((u, i) => (
          <div key={i} className="p-4 lg:p-5 hover:bg-slate-50/50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-display ${u.rolle.includes("Admin")?"bg-emerald-100 text-emerald-800":"bg-slate-100 text-slate-600"}`}>{u.name.split(" ").map(n=>n[0]).join("")}</div>
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{u.name}</div>
                  <div className="text-[11px] text-slate-400">{u.rolle}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {u.twofa ? <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold"><Fingerprint size={12}/>2FA aktiv</span> : <span className="flex items-center gap-1 text-[10px] text-red-600 font-semibold"><AlertTriangle size={12}/>Keine 2FA</span>}
                <span className="text-[10px] text-slate-400">Login: {u.lastLogin}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5 pl-[52px]">
              {u.rechte.map((r, ri) => (
                <span key={ri} className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md">{r}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EncryptionTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[
        { title:"Datenbank-Verschlüsselung", items:[
          {l:"Algorithmus",v:"AES-256-GCM"},{l:"Schlüsselmanagement",v:"Hardware Security Module (HSM)"},{l:"Verschlüsselung at-rest",v:"Aktiv – alle Tabellen"},{l:"Verschlüsselung in-transit",v:"TLS 1.3"},{l:"Schlüsselrotation",v:"Automatisch alle 90 Tage"},{l:"Letzter Schlüsselwechsel",v:"15.01.2025"},
        ]},
        { title:"Datei-Verschlüsselung", items:[
          {l:"Mandantenakten",v:"AES-256, individueller Schlüssel pro Akte"},{l:"E-Mail-Kommunikation",v:"S/MIME Zertifikat aktiv"},{l:"Backup-Verschlüsselung",v:"AES-256 + RSA-4096 Hybrid"},{l:"USB/Externe Medien",v:"Gesperrt (Device-Management)"},{l:"Bildschirmsperre",v:"Automatisch nach 5 Min Inaktivität"},{l:"Papier-Akten",v:"Datensafe mit Zugangscode"},
        ]},
      ].map((section, si) => (
        <div key={si} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Lock size={16} className="text-amber-700"/>{section.title}</h3>
          <div className="space-y-2.5">
            {section.items.map((it, i) => (
              <div key={i} className="flex justify-between items-start py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-[12px] text-slate-500">{it.l}</span>
                <span className="text-[12px] text-slate-700 font-medium text-right max-w-[220px]">{it.v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 m-0">Audit-Log (letzte 10 Einträge)</h3>
        <button onClick={exportAuditLog} className="text-[11px] text-slate-500 font-semibold bg-transparent border-none cursor-pointer hover:text-slate-700 flex items-center gap-1"><Download size={13}/>Vollständig exportieren</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
            <th className="px-5 py-2.5">Zeitpunkt</th><th className="px-5 py-2.5">Benutzer</th><th className="px-5 py-2.5">Aktion</th><th className="px-5 py-2.5">Details</th><th className="px-5 py-2.5">Risiko</th>
          </tr></thead>
          <tbody>{AUDIT_LOG.map(e => (
            <tr key={e.id} className={`border-b border-slate-50 ${e.risiko==="hoch"?"bg-red-50/50":""} hover:bg-slate-50 transition-colors`}>
              <td className="px-5 py-2.5 text-xs text-slate-600 whitespace-nowrap">{new Date(e.datum).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
              <td className="px-5 py-2.5 text-xs text-slate-700 font-medium">{e.user}</td>
              <td className="px-5 py-2.5 text-xs text-slate-600">{e.aktion}</td>
              <td className="px-5 py-2.5 text-xs text-slate-500 max-w-[250px] truncate">{e.details}</td>
              <td className="px-5 py-2.5"><span className={`px-2 py-[3px] rounded-md text-[10px] font-semibold ${e.risiko==="niedrig"?"bg-slate-100 text-slate-500":e.risiko==="mittel"?"bg-amber-50 text-amber-600":"bg-red-50 text-red-600"}`}>{e.risiko.charAt(0).toUpperCase()+e.risiko.slice(1)}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function DsgvoTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Shield size={16} className="text-amber-700"/>DSGVO-Compliance</h3>
        <div className="space-y-3">
          {[
            { label:"Verarbeitungsverzeichnis", status:"aktuell", date:"Letzte Prüfung: 15.01.2025" },
            { label:"Datenschutz-Folgenabschätzung", status:"durchgeführt", date:"Für Mandantenverwaltung: 10.01.2025" },
            { label:"Auftragsverarbeitungsverträge", status:"vollständig", date:"DATEV, Lexware, Backup-Provider" },
            { label:"Löschkonzept", status:"implementiert", date:"Auto-Löschung nach 10 Jahren (§ 257 HGB)" },
            { label:"Auskunftsrecht (Art. 15)", status:"Prozess definiert", date:"Bearbeitungsfrist: 30 Tage" },
            { label:"Recht auf Löschung (Art. 17)", status:"Prozess definiert", date:"Prüfung Aufbewahrungspflichten" },
            { label:"Datenschutzbeauftragter", status:"bestellt", date:"Extern: DSB Heilbronn GmbH" },
            { label:"Mitarbeiterschulung", status:"aktuell", date:"Letzte Schulung: 20.12.2024" },
          ].map((m, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
              <CheckCircle2 size={14} className="text-amber-500 mt-0.5 flex-shrink-0"/>
              <div>
                <div className="text-[12px] font-medium text-slate-700">{m.label}</div>
                <div className="text-[10px] text-slate-400">{m.status} · {m.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><UserCheck size={16} className="text-amber-700"/>Mandantenrechte</h3>
          <div className="space-y-2">
            {[
              { label:"Einwilligungserklärung", detail:"Digitale Einwilligung bei Mandatsannahme, jederzeit widerrufbar" },
              { label:"Datenportabilität", detail:"Export aller Mandantendaten als PDF/CSV auf Anfrage" },
              { label:"Auskunftsrecht", detail:"Mandanten können jederzeit Auskunft über gespeicherte Daten anfragen" },
              { label:"Löschung nach Mandatsende", detail:"Automatische Löschung nach Ablauf der Aufbewahrungsfristen" },
              { label:"Zweckbindung", detail:"Daten werden ausschließlich für die Beratungstätigkeit verwendet" },
            ].map((r, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[12px] font-medium text-slate-700">{r.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{r.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/40 text-[11px] text-amber-700">
          <div className="flex items-center gap-2 font-semibold mb-1"><Shield size={14}/>Zusammenfassung Datenschutzkonzept</div>
          Alle Mandanten- und Unternehmensdaten werden lokal auf dem Büroserver in Heilbronn gespeichert (kein Cloud-Hosting). Sämtliche Daten sind AES-256 verschlüsselt. Der Zugriff erfordert 2FA und ist rollenbasiert. Externe Partner erhalten nur fallbezogenen Lesezugriff. Alle Zugriffe werden lückenlos im Audit-Log protokolliert. Backups erfolgen täglich, verschlüsselt und werden in einem deutschen Rechenzentrum aufbewahrt.
        </div>
      </div>
    </div>
  );
}

function ScoreCard({label,value,icon,color,bg}:{label:string;value:string;icon:React.ReactNode;color:string;bg:string}) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-slate-100 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center ${color}`}>{icon}</div>
      <div><div className={`text-lg font-bold font-display ${color}`}>{value}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div></div>
    </div>
  );
}
