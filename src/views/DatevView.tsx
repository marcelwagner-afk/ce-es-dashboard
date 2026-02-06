import { DATEV_ENTRIES, fmt, fmtDate } from "../data";
import { Badge } from "./shared";
import { RefreshCw, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useState } from "react";

export function DatevView() {
  const [syncing, setSyncing] = useState(false);
  const gebucht=DATEV_ENTRIES.filter(e=>e.status==="gebucht").length;
  const offen=DATEV_ENTRIES.filter(e=>e.status==="offen").length;
  const fehler=DATEV_ENTRIES.filter(e=>e.status==="fehlerhaft").length;

  const handleCsvExport = () => {
    const header = "Buchungs-Nr.;Datum;Konto Soll;Konto Haben;Betrag;Buchungstext;Beleg-Nr.;Status";
    const rows = DATEV_ENTRIES.map(e =>
      `${e.id};${e.date};${e.kontoSoll};${e.kontoHaben};${e.betrag.toFixed(2).replace(".",",")};${e.buchungstext};${e.belegnr};${e.status}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `DATEV_Export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DATEV-Export als CSV heruntergeladen");
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success("DATEV-Synchronisation abgeschlossen"); }, 1500);
  };

  return(
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-5 lg:p-8 mb-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold font-display">D</div>
              <div>
                <div className="text-lg font-bold font-display">DATEV Unternehmen online</div>
                <div className="text-[11px] text-white/40">Mandant: Ce-eS Management · StB: Kanzlei Maier, Heilbronn</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-white/50"><CheckCircle2 size={13} className="text-emerald-400"/>Verbindung aktiv · Letzte Sync: {new Date().toLocaleDateString("de-DE")}, {new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} Uhr</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCsvExport} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border-none rounded-xl text-white text-sm font-medium cursor-pointer transition-colors"><Upload size={15}/>Export</button>
            <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-colors shadow-lg disabled:opacity-50"><RefreshCw size={15} className={syncing?"animate-spin":""}/>Sync</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center"><div className="text-2xl font-bold font-display text-emerald-700">{gebucht}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Gebucht</div></div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center"><div className="text-2xl font-bold font-display text-amber-600">{offen}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Offen</div></div>
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center"><div className="text-2xl font-bold font-display text-red-600">{fehler}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Fehlerhaft</div></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 m-0">Buchungsjournal 2025</h3>
          <button onClick={handleCsvExport} className="text-[11px] text-emerald-600 font-semibold bg-transparent border-none cursor-pointer hover:text-emerald-800 flex items-center gap-1"><Download size={13}/>CSV Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-2.5">Buchungs-Nr.</th><th className="px-5 py-2.5">Datum</th><th className="px-5 py-2.5">Konto Soll</th><th className="px-5 py-2.5">Konto Haben</th><th className="px-5 py-2.5 text-right">Betrag</th><th className="px-5 py-2.5">Buchungstext</th><th className="px-5 py-2.5">Beleg</th><th className="px-5 py-2.5">Status</th>
            </tr></thead>
            <tbody>{DATEV_ENTRIES.map(e=>(
              <tr key={e.id} className={`border-b border-slate-50 transition-colors ${e.status==="fehlerhaft"?"bg-red-50/50 hover:bg-red-50":"hover:bg-slate-50"}`}>
                <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{e.id}</td>
                <td className="px-5 py-2.5 text-xs text-slate-600">{fmtDate(e.date)}</td>
                <td className="px-5 py-2.5 text-xs text-slate-600 font-mono">{e.kontoSoll}</td>
                <td className="px-5 py-2.5 text-xs text-slate-600 font-mono">{e.kontoHaben}</td>
                <td className="px-5 py-2.5 text-right font-bold text-slate-700">{fmt(e.betrag)}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{e.buchungstext}</td>
                <td className="px-5 py-2.5 text-xs text-slate-400 font-mono">{e.belegnr}</td>
                <td className="px-5 py-2.5"><Badge status={e.status}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 mb-1"><AlertCircle size={13}/>Hinweise zur DATEV-Anbindung</div>
        <ul className="m-0 pl-5 space-y-0.5">
          <li>Buchungen werden täglich um 08:00 Uhr automatisch synchronisiert</li>
          <li>Fehlerhafte Buchungen erfordern manuelle Korrektur in DATEV Unternehmen online</li>
          <li>Export-Dateien werden im DATEV-ASCII-Format (KY) erstellt</li>
          <li>Steuerberater-Zugang: Kanzlei Maier, Heilbronn · Mandant-Nr. 12450</li>
        </ul>
      </div>
    </div>
  );
}
