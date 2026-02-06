import { useState } from "react";
import { fmt, fmtDate } from "../data";
import { Badge } from "./shared";
import { RefreshCw, Upload, Download, CheckCircle2, AlertCircle, ArrowRightLeft, Calculator, Settings, ExternalLink, Clock, Shield } from "lucide-react";
import { toast } from "sonner";

type LexTab = "uebersicht"|"sync"|"rechnungen"|"stammdaten";

// Simulation helper for external system actions
function simulateAction(msg: string, duration = 1200): Promise<void> {
  return new Promise(resolve => {
    toast.loading(msg, { id: "lex-action" });
    setTimeout(() => { toast.success(msg.replace("…","") + " ✓", { id: "lex-action" }); resolve(); }, duration);
  });
}

function exportSyncLog() {
  const header = "ID;Typ;Richtung;Datum;Status;Details;Anzahl";
  const rows = SYNC_LOG.map(e => `${e.id};${e.typ};${e.richtung};${e.datum};${e.status};${e.details};${e.count}`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Lexware_Sync_Log_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Sync-Log als CSV exportiert");
}

interface LexSyncEntry {
  id: string; typ: string; richtung: "import"|"export"; datum: string; status: "ok"|"warnung"|"fehler"; details: string; count: number;
}
interface LexInvoice {
  id: string; lexId: string; clientName: string; amount: number; date: string; status: "synchron"|"nur lokal"|"nur lexware"|"konflikt";
}

const SYNC_LOG: LexSyncEntry[] = [
  { id:"LS-001", typ:"Rechnungen", richtung:"export", datum:"2025-02-05T08:20:00", status:"ok", details:"9 Rechnungen exportiert nach Lexware faktura+auftrag", count:9 },
  { id:"LS-002", typ:"Kundenstamm", richtung:"export", datum:"2025-02-05T08:20:00", status:"ok", details:"10 Kunden synchronisiert", count:10 },
  { id:"LS-003", typ:"Angebote", richtung:"export", datum:"2025-02-05T08:20:00", status:"warnung", details:"5 von 6 Angeboten exportiert – AN-2025-003 (Entwurf) übersprungen", count:5 },
  { id:"LS-004", typ:"Zahlungen", richtung:"import", datum:"2025-02-04T19:00:00", status:"ok", details:"3 Zahlungseingänge importiert aus Lexware", count:3 },
  { id:"LS-005", typ:"Artikel/Leistungen", richtung:"export", datum:"2025-02-04T08:15:00", status:"ok", details:"Leistungskatalog aktualisiert (12 Positionen)", count:12 },
  { id:"LS-006", typ:"Rechnungen", richtung:"export", datum:"2025-02-04T08:15:00", status:"fehler", details:"RE-2025-004 – USt-Satz Konflikt (19% vs. 0% Insolvenzberatung)", count:0 },
  { id:"LS-007", typ:"Mahnwesen", richtung:"import", datum:"2025-02-03T19:00:00", status:"ok", details:"1 Mahnstufe importiert (RE-2025-004, Stufe 2)", count:1 },
  { id:"LS-008", typ:"Kundenstamm", richtung:"import", datum:"2025-02-03T08:15:00", status:"ok", details:"Adressänderung Braun importiert", count:1 },
];

const LEX_INVOICES: LexInvoice[] = [
  { id:"RE-2025-001", lexId:"LX-10234", clientName:"Thomas Müller", amount:4800, date:"2025-01-15", status:"synchron" },
  { id:"RE-2025-002", lexId:"LX-10235", clientName:"Sandra Becker", amount:1200, date:"2025-01-20", status:"synchron" },
  { id:"RE-2025-003", lexId:"LX-10236", clientName:"Lisa Hoffmann", amount:2400, date:"2025-01-25", status:"synchron" },
  { id:"RE-2025-004", lexId:"—", clientName:"Markus Weber", amount:3600, date:"2025-01-28", status:"konflikt" },
  { id:"RE-2025-005", lexId:"LX-10238", clientName:"Peter Klein", amount:2800, date:"2025-02-01", status:"synchron" },
  { id:"RE-2024-048", lexId:"LX-10190", clientName:"Anna Schwarz", amount:5200, date:"2024-12-10", status:"synchron" },
  { id:"RE-2025-006", lexId:"—", clientName:"Klaus Richter", amount:850, date:"2025-02-03", status:"nur lokal" },
  { id:"RE-2025-007", lexId:"LX-10240", clientName:"Stefan Fuchs", amount:6200, date:"2025-02-01", status:"synchron" },
  { id:"RE-2025-008", lexId:"LX-10241", clientName:"Claudia Mayer", amount:980, date:"2025-01-30", status:"synchron" },
];

const LEX_PRODUCTS = [
  { id:"LP-01", name:"Managementberatung (Std.)", einheit:"Stunde", preis:180, ust:19 },
  { id:"LP-02", name:"Schuldnerberatung (Std.)", einheit:"Stunde", preis:120, ust:0 },
  { id:"LP-03", name:"Insolvenzberatung (Std.)", einheit:"Stunde", preis:150, ust:0 },
  { id:"LP-04", name:"Coaching-Sitzung", einheit:"Sitzung", preis:250, ust:19 },
  { id:"LP-05", name:"Interims-Management (Tag)", einheit:"Tag", preis:1200, ust:19 },
  { id:"LP-06", name:"Businessplan-Erstellung", einheit:"Pauschal", preis:2400, ust:19 },
  { id:"LP-07", name:"Fördermittelberatung", einheit:"Pauschal", preis:800, ust:19 },
  { id:"LP-08", name:"Erstberatung", einheit:"Pauschal", preis:0, ust:0 },
];

export function LexwareView() {
  const [tab, setTab] = useState<LexTab>("uebersicht");
  const synced = LEX_INVOICES.filter(i=>i.status==="synchron").length;
  const conflicts = LEX_INVOICES.filter(i=>i.status==="konflikt").length;
  const localOnly = LEX_INVOICES.filter(i=>i.status==="nur lokal").length;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Header Card */}
      <div className="dark-card p-5 lg:p-8 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <span className="text-lg font-black font-display">Lx</span>
                </div>
                <div>
                  <div className="text-lg font-bold font-display">Lexware faktura+auftrag</div>
                  <div className="text-[11px] text-white/40">Version 2025 · Lizenz: Professional · Ce-eS Management Consultant</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-white/50">
                <CheckCircle2 size={13} className="text-emerald-400" />
                API-Verbindung aktiv · Letzte Sync: {new Date().toLocaleDateString("de-DE")}, {new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} Uhr
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => simulateAction("Lexware wird geöffnet…")}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border-none rounded-xl text-white text-sm font-medium cursor-pointer transition-colors">
                <ExternalLink size={15} /> Lexware öffnen
              </button>
              <button onClick={() => simulateAction("Synchronisation läuft…", 2000)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-colors shadow-lg">
                <RefreshCw size={15} /> Jetzt synchronisieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Synchronisiert" value={synced} icon={<CheckCircle2 size={16}/>} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Nur lokal" value={localOnly} icon={<Upload size={16}/>} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Konflikte" value={conflicts} icon={<AlertCircle size={16}/>} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Leistungen" value={LEX_PRODUCTS.length} icon={<Calculator size={16}/>} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Sub-Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-5 border border-slate-200/80 w-fit shadow-sm overflow-x-auto">
        {([["uebersicht","Übersicht"],["sync","Sync-Log"],["rechnungen","Rechnungen"],["stammdaten","Leistungen"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 border-none rounded-lg text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all ${
              tab===k ? "bg-[#1a1d26] text-white shadow-md" : "bg-transparent text-slate-400 hover:text-slate-600"
            }`}>{l}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "uebersicht" && <OverviewTab />}
      {tab === "sync" && <SyncLogTab />}
      {tab === "rechnungen" && <InvoicesSyncTab />}
      {tab === "stammdaten" && <ProductsTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sync-Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><ArrowRightLeft size={16} className="text-[#004B87]" />Synchronisations-Übersicht</h3>
        <div className="space-y-3">
          {[
            { modul: "Kundenstamm", status: "ok", letzte: "08:20", count: "10/10" },
            { modul: "Rechnungen", status: "ok", letzte: "08:20", count: "8/9" },
            { modul: "Angebote", status: "warnung", letzte: "08:20", count: "5/6" },
            { modul: "Zahlungen", status: "ok", letzte: "gestern 19:00", count: "3 importiert" },
            { modul: "Mahnwesen", status: "ok", letzte: "03.02., 19:00", count: "1 importiert" },
            { modul: "Leistungskatalog", status: "ok", letzte: "04.02., 08:15", count: "12 Positionen" },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${m.status==="ok"?"bg-emerald-500":m.status==="warnung"?"bg-amber-500":"bg-red-500"}`} />
                <span className="text-[13px] text-slate-700 font-medium">{m.modul}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">{m.count}</span>
                <span className="text-[10px] text-slate-300 flex items-center gap-1"><Clock size={10} />{m.letzte}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Einstellungen */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Settings size={16} className="text-[#004B87]" />Verbindungseinstellungen</h3>
        <div className="space-y-3">
          {[
            { label: "Lexware-Version", value: "faktura+auftrag 2025 Professional" },
            { label: "API-Endpunkt", value: "localhost:8080/lexware-api" },
            { label: "Mandant", value: "Ce-eS Mgmt. Consultant (001)" },
            { label: "Auto-Sync", value: "Täglich 08:00 + 19:00 Uhr" },
            { label: "Sync-Richtung", value: "Bidirektional" },
            { label: "Konflikt-Lösung", value: "Manuell (Benachrichtigung)" },
            { label: "USt-Mapping", value: "Automatisch (mit Ausnahmeliste)" },
            { label: "Backup vor Sync", value: "Aktiviert" },
          ].map((s, i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <span className="text-[12px] text-slate-500">{s.label}</span>
              <span className="text-[12px] text-slate-700 font-medium text-right max-w-[200px]">{s.value}</span>
            </div>
          ))}
        </div>
        <button onClick={() => simulateAction("Einstellungen werden geladen…")}
          className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[13px] text-slate-600 font-medium cursor-pointer transition-colors flex items-center justify-center gap-2">
          <Settings size={14} /> Einstellungen bearbeiten
        </button>
      </div>

      {/* Info */}
      <div className="lg:col-span-2 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-2 text-[11px] text-blue-700">
          <Shield size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold mb-1">Datenaustausch über lokale API</div>
            Die Lexware-Anbindung läuft über eine lokale REST-API auf dem Büroserver. Es werden keine Daten über das Internet übertragen. Die Synchronisation erfolgt verschlüsselt (TLS 1.3) innerhalb des lokalen Netzwerks. Alle Sync-Vorgänge werden im Audit-Log protokolliert.
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncLogTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 m-0">Synchronisations-Protokoll</h3>
        <button onClick={exportSyncLog} className="text-[11px] text-[#004B87] font-semibold bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1"><Download size={13} />Export</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
            <th className="px-5 py-2.5">ID</th><th className="px-5 py-2.5">Zeitpunkt</th><th className="px-5 py-2.5">Modul</th><th className="px-5 py-2.5">Richtung</th><th className="px-5 py-2.5">Anzahl</th><th className="px-5 py-2.5">Details</th><th className="px-5 py-2.5">Status</th>
          </tr></thead>
          <tbody>{SYNC_LOG.map(e => (
            <tr key={e.id} className={`border-b border-slate-50 ${e.status==="fehler"?"bg-red-50/50":""} hover:bg-slate-50 transition-colors`}>
              <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{e.id}</td>
              <td className="px-5 py-2.5 text-xs text-slate-600">{new Date(e.datum).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
              <td className="px-5 py-2.5 text-xs text-slate-700 font-medium">{e.typ}</td>
              <td className="px-5 py-2.5"><span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${e.richtung==="export"?"bg-blue-50 text-blue-600":"bg-violet-50 text-violet-600"}`}>{e.richtung==="export"?"↑ Export":"↓ Import"}</span></td>
              <td className="px-5 py-2.5 text-xs text-slate-600 font-mono">{e.count}</td>
              <td className="px-5 py-2.5 text-xs text-slate-500 max-w-[250px] truncate">{e.details}</td>
              <td className="px-5 py-2.5"><Badge status={e.status==="ok"?"bezahlt":e.status==="warnung"?"offen":"überfällig"}/></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function InvoicesSyncTab() {
  const statusCfg: Record<string,{bg:string;text:string;label:string}> = {
    synchron:    {bg:"bg-emerald-50",text:"text-emerald-700",label:"✓ Synchron"},
    "nur lokal": {bg:"bg-amber-50",text:"text-amber-700",label:"Nur lokal"},
    "nur lexware":{bg:"bg-blue-50",text:"text-blue-600",label:"Nur Lexware"},
    konflikt:    {bg:"bg-red-50",text:"text-red-700",label:"⚠ Konflikt"},
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 m-0">Rechnungsabgleich Ce-eS ↔ Lexware</h3>
        <button onClick={() => simulateAction("Abgleich läuft…", 1500)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26] text-white border-none rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-[#252a36] transition-colors"><RefreshCw size={12}/>Abgleichen</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
            <th className="px-5 py-2.5">Ce-eS Nr.</th><th className="px-5 py-2.5">Lexware Nr.</th><th className="px-5 py-2.5">Klient</th><th className="px-5 py-2.5">Datum</th><th className="px-5 py-2.5 text-right">Betrag</th><th className="px-5 py-2.5">Sync-Status</th><th className="px-5 py-2.5"></th>
          </tr></thead>
          <tbody>{LEX_INVOICES.map(inv => {
            const sc = statusCfg[inv.status];
            return (
              <tr key={inv.id} className={`border-b border-slate-50 ${inv.status==="konflikt"?"bg-red-50/30":""} hover:bg-slate-50 transition-colors`}>
                <td className="px-5 py-2.5 font-semibold text-slate-700 text-xs">{inv.id}</td>
                <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{inv.lexId}</td>
                <td className="px-5 py-2.5 text-xs text-slate-600">{inv.clientName}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{fmtDate(inv.date)}</td>
                <td className="px-5 py-2.5 text-right font-bold text-sm">{fmt(inv.amount)}</td>
                <td className="px-5 py-2.5"><span className={`${sc.bg} ${sc.text} px-2 py-[3px] rounded-md text-[10px] font-semibold whitespace-nowrap`}>{sc.label}</span></td>
                <td className="px-5 py-2.5">
                  {inv.status!=="synchron"&&<button onClick={()=>simulateAction(`${inv.id} wird synchronisiert…`)} className="text-[10px] text-[#004B87] font-semibold bg-transparent border-none cursor-pointer hover:underline">Lösen →</button>}
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 m-0">Leistungskatalog (Lexware Artikelstamm)</h3>
        <button onClick={() => simulateAction("Neue Leistung wird angelegt…")} className="text-[11px] text-[#004B87] font-semibold bg-transparent border-none cursor-pointer hover:underline">+ Leistung</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[550px]">
          <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
            <th className="px-5 py-2.5">Art.-Nr.</th><th className="px-5 py-2.5">Bezeichnung</th><th className="px-5 py-2.5">Einheit</th><th className="px-5 py-2.5 text-right">Preis (netto)</th><th className="px-5 py-2.5 text-right">USt</th>
          </tr></thead>
          <tbody>{LEX_PRODUCTS.map(p => (
            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{p.id}</td>
              <td className="px-5 py-2.5 text-xs text-slate-700 font-medium">{p.name}</td>
              <td className="px-5 py-2.5 text-xs text-slate-500">{p.einheit}</td>
              <td className="px-5 py-2.5 text-right font-bold text-sm">{p.preis>0?fmt(p.preis):"Kostenlos"}</td>
              <td className="px-5 py-2.5 text-right text-xs text-slate-500">{p.ust}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({label,value,icon,color,bg}:{label:string;value:number;icon:React.ReactNode;color:string;bg:string}) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-slate-100 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center ${color}`}>{icon}</div>
      <div><div className={`text-xl font-bold font-display ${color}`}>{value}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div></div>
    </div>
  );
}
