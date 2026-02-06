import { BANK_ACCOUNT, BANK_TRANSACTIONS, fmt, fmtDate } from "../data";
import { Landmark, ArrowDownLeft, ArrowUpRight, RefreshCw, Download, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BankView() {
  const [showIban,setShowIban]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const ein=BANK_TRANSACTIONS.filter(t=>t.type==="eingang").reduce((s,t)=>s+t.betrag,0);
  const aus=BANK_TRANSACTIONS.filter(t=>t.type==="ausgang").reduce((s,t)=>s+Math.abs(t.betrag),0);

  const handleCsvExport = () => {
    const header = "Datum;Gegenkonto;Verwendungszweck;Betrag;Saldo;Typ";
    const rows = BANK_TRANSACTIONS.map(t =>
      `${t.date};${t.gegenkonto};${t.verwendungszweck};${t.betrag.toFixed(2).replace(".",",")};${t.saldo.toFixed(2).replace(".",",")};${t.type}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Kontoauszug_${BANK_ACCOUNT.iban.replace(/\s/g,"")}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Kontoauszug als CSV heruntergeladen");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); toast.success("Kontodaten aktualisiert"); }, 1200);
  };

  return(
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Account Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 rounded-2xl p-5 lg:p-8 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"/>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Landmark size={20}/></div>
                <div>
                  <div className="text-base font-bold font-display">{BANK_ACCOUNT.bank}</div>
                  <div className="text-[11px] text-white/40">{BANK_ACCOUNT.inhaber}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-white/50">
                <span>IBAN: {showIban?BANK_ACCOUNT.iban:"DE89 •••• •••• •••• •••• 78"}</span>
                <button onClick={()=>setShowIban(!showIban)} className="bg-transparent border-none cursor-pointer text-white/40 hover:text-white/70 transition-colors p-0">{showIban?<EyeOff size={13}/>:<Eye size={13}/>}</button>
                <button onClick={()=>{navigator.clipboard?.writeText?.(BANK_ACCOUNT.iban);toast.success("IBAN kopiert");}} className="bg-transparent border-none cursor-pointer text-white/40 hover:text-white/70 transition-colors p-0"><Copy size={13}/></button>
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">BIC: {BANK_ACCOUNT.bic}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCsvExport} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border-none rounded-xl text-white text-sm font-medium cursor-pointer transition-colors"><Download size={15}/>Auszug</button>
              <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"><RefreshCw size={15} className={refreshing?"animate-spin":""}/>Aktualisieren</button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Kontostand</div>
              <div className="text-xl lg:text-2xl font-bold font-display mt-1">{fmt(BANK_ACCOUNT.kontostand)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Verfügbar</div>
              <div className="text-xl lg:text-2xl font-bold font-display mt-1">{fmt(BANK_ACCOUNT.verfuegbar)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Kreditlinie</div>
              <div className="text-xl lg:text-2xl font-bold font-display mt-1">{fmt(BANK_ACCOUNT.kreditlinie)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Letzte Aktualisierung</div>
              <div className="text-sm font-semibold mt-1">{new Date().toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}, {new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700"><ArrowDownLeft size={18}/></div>
          <div><div className="text-[10px] text-slate-400 uppercase tracking-wider">Eingänge (Jan–Feb)</div><div className="text-lg font-bold font-display text-emerald-700 mt-0.5">{fmt(ein)}</div></div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><ArrowUpRight size={18}/></div>
          <div><div className="text-[10px] text-slate-400 uppercase tracking-wider">Ausgänge (Jan–Feb)</div><div className="text-lg font-bold font-display text-red-600 mt-0.5">{fmt(aus)}</div></div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-700 m-0">Kontobewegungen</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-2.5">Datum</th><th className="px-5 py-2.5">Gegenkonto</th><th className="px-5 py-2.5">Verwendungszweck</th><th className="px-5 py-2.5 text-right">Betrag</th><th className="px-5 py-2.5 text-right">Saldo</th>
            </tr></thead>
            <tbody>{BANK_TRANSACTIONS.map(t=>(
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-xs text-slate-600">{fmtDate(t.date)}</td>
                <td className="px-5 py-3 text-xs text-slate-700 font-medium">{t.gegenkonto}</td>
                <td className="px-5 py-3 text-xs text-slate-500 max-w-[250px] truncate">{t.verwendungszweck}</td>
                <td className={`px-5 py-3 text-right font-bold text-sm ${t.type==="eingang"?"text-emerald-600":"text-red-600"}`}>{t.type==="eingang"?"+":""}{fmt(t.betrag)}</td>
                <td className="px-5 py-3 text-right text-xs text-slate-500 font-mono">{fmt(t.saldo)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
