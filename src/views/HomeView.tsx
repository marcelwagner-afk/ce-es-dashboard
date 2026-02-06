import { getClient, fmt, fmtDate, typeColor, demoToday, demoTodayStr } from "../data";
import { FRISTEN, FRIST_LABELS, MANDANTEN_FORTSCHRITT, GLAEUBIGER } from "../creditorData";
import type { Client } from "../data";
import { Badge, ClientRow, Card } from "./shared";
import { AlertTriangle, CalendarDays, TrendingUp, Users, Clock, MapPin, Euro, ChevronRight, Scale, Target, Briefcase, Phone } from "lucide-react";
import { useClients, useAppointments, useInvoices } from "../useStore";

interface P { onSelectClient: (c: Client) => void; onNavigate: (t: string) => void; userName?: string; }

const WEEKDAYS = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
function todayStr() { const d = new Date(); return d.toISOString().slice(0,10); }
function todayLabel() { const d = new Date(); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function greetingText() { const h = new Date().getHours(); return h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend"; }

export function HomeView({ onSelectClient, onNavigate, userName }: P) {
  const CLIENTS = useClients();
  const APPOINTMENTS = useAppointments();
  const INVOICES = useInvoices();
  const todayDate = todayStr();
  const todayAppts = APPOINTMENTS.filter(a => a.date === todayDate);
  // Fallback: wenn heute keine Termine, zeige nächsten Tag mit Terminen (Demo-Daten sind Feb 2025)
  const today = todayAppts.length > 0 ? todayAppts : APPOINTMENTS.filter(a => a.date === demoTodayStr());
  const activeClients = CLIENTS.filter(c => c.status === "aktiv" || c.status === "kritisch");
  const critical = CLIENTS.filter(c => c.status === "kritisch");
  const overdue = INVOICES.filter(i => i.status === "überfällig");
  const openAmt = INVOICES.filter(i => i.status === "offen" || i.status === "überfällig").reduce((s, i) => s + i.amount, 0);
  const paidAmt = INVOICES.filter(i => i.status === "bezahlt").reduce((s, i) => s + i.amount, 0);
  const totalSchulden = MANDANTEN_FORTSCHRITT.reduce((s, m) => s + m.schuldenStart, 0);
  const aktuellSchulden = MANDANTEN_FORTSCHRITT.reduce((s, m) => s + m.schuldenAktuell, 0);
  const ersparnis = totalSchulden - aktuellSchulden;
  const nextAppt = today.sort((a,b) => a.time.localeCompare(b.time))[0];
  const inFourWeeks = new Date(demoToday()); inFourWeeks.setDate(inFourWeeks.getDate() + 28);
  const kritischeFristen = FRISTEN.filter(f => f.kritisch && !f.erledigt && new Date(f.datum) <= inFourWeeks && new Date(f.datum) >= demoToday()).length;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* ═══ HERO BANNER ═══ */}
      <div className="dark-card p-5 lg:p-7 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
            <div>
              <div className="text-[10px] font-semibold tracking-[2px] uppercase text-white/25 mb-1">{todayLabel()}</div>
              <h2 className="text-xl lg:text-2xl font-display font-bold text-white m-0">{greetingText()}, {userName ? userName.split(" ")[0] : "Holger"}.</h2>
            </div>
            {kritischeFristen > 0 && (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/20 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-500/20 transition-colors" onClick={() => onNavigate("creditors")}>
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-[12px] text-red-300 font-semibold">{kritischeFristen} kritische Fristen</span>
                <ChevronRight size={13} className="text-red-400/60" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPIDark label="Aktive Klienten" value={String(activeClients.length)} sub={`von ${CLIENTS.length} gesamt`} />
            <KPIDark label="Termine heute" value={String(today.length)} sub={nextAppt ? `nächster: ${nextAppt.time}` : "keine geplant"} />
            <KPIDark label="Offene Forderungen" value={fmt(openAmt)} sub={`${INVOICES.filter(i => i.status === "offen").length} Rechnungen`} />
            <KPIDark label="Schulden betreut" value={fmt(totalSchulden)} sub={`${MANDANTEN_FORTSCHRITT.length} Mandanten`} />
            <KPIDark label="Bereits reduziert" value={fmt(ersparnis)} sub={`${Math.round(ersparnis / totalSchulden * 100)}% Erfolgsquote`} highlight />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* ═══ LEFT ═══ */}
        <div className="lg:col-span-8 space-y-4">
          {/* Handlungsbedarf */}
          {(critical.length > 0 || overdue.length > 0) && (
            <Card title="Handlungsbedarf" icon={<AlertTriangle size={15} />}>
              <div className="space-y-2.5">
                {critical.map(c => (
                  <div key={c.id} onClick={() => onSelectClient(c)}
                    className="rounded-xl p-3.5 cursor-pointer flex items-center gap-3 group transition-all hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #fef2f2 0%, white 100%)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-red-800">{c.name} <span className="font-medium text-red-400">· {c.company}</span></div>
                      <div className="text-[11px] text-red-400/80 mt-0.5 truncate">{c.notes.slice(0, 80)}…</div>
                    </div>
                    <ChevronRight size={14} className="text-red-300 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
                {overdue.map(inv => { const cl = getClient(inv.clientId); return (
                  <div key={inv.id} className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, white 100%)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0"><Euro size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-amber-800">{inv.id} · {fmt(inv.amount)}</div>
                      <div className="text-[11px] text-amber-500/80 mt-0.5">Überfällig seit {fmtDate(inv.due)} · {cl?.name}</div>
                    </div>
                  </div>
                ); })}
              </div>
            </Card>
          )}

          {/* Termine */}
          <Card title="Heutige Termine" icon={<CalendarDays size={15} />} action="Alle Termine" onAction={() => onNavigate("calendar")}>
            <div className="space-y-2.5">
              {today.map(apt => { const cl = getClient(apt.clientId); return (
                <div key={apt.id} onClick={() => cl && onSelectClient(cl)}
                  className="rounded-xl p-4 cursor-pointer border border-slate-100 hover:border-amber-200/60 hover:shadow-md transition-all flex gap-4 bg-slate-50/60 group"
                  style={{ borderLeftWidth: 3, borderLeftColor: typeColor(apt.type) }}>
                  <div className="flex flex-col items-center min-w-[48px]">
                    <span className="text-[20px] font-bold text-slate-800 font-display leading-none">{apt.time.split(":")[0]}</span>
                    <span className="text-[12px] text-slate-300 leading-none mt-0.5">:{apt.time.split(":")[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 group-hover:text-amber-800 transition-colors">{apt.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{cl?.name} {cl?.company ? `· ${cl.company}` : ""}</div>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={11} />{apt.duration} Min</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin size={11} />{apt.location}</span>
                    </div>
                  </div>
                  <Badge status={apt.priority} />
                </div>
              ); })}
            </div>
          </Card>

          {/* Neueste Klienten */}
          <Card title="Neueste Klienten" icon={<Users size={15} />} action="Alle" onAction={() => onNavigate("clients")}>
            <div className="space-y-2.5">
              {[...CLIENTS].sort((a, b) => +new Date(b.created) - +new Date(a.created)).slice(0, 4).map(c => (
                <ClientRow key={c.id} client={c} onClick={() => onSelectClient(c)} />
              ))}
            </div>
          </Card>
        </div>

        {/* ═══ RIGHT ═══ */}
        <div className="lg:col-span-4 space-y-4">
          {/* Fristen */}
          <Card title="Nächste Fristen" icon={<Target size={15} />} action="Alle" onAction={() => onNavigate("creditors")}>
            <div className="space-y-2">
              {FRISTEN.filter(f => !f.erledigt).sort((a, b) => +new Date(a.datum) - +new Date(b.datum)).slice(0, 5).map(f => {
                const diff = Math.ceil((+new Date(f.datum) - +demoToday()) / 86400000);
                const fl = FRIST_LABELS[f.typ];
                return (
                  <div key={f.id} className={`rounded-lg p-2.5 flex items-start gap-2.5 ${diff <= 3 ? "bg-red-50 border border-red-200/50" : diff <= 7 ? "bg-amber-50 border border-amber-200/40" : "bg-slate-50 border border-slate-100"}`}>
                    <span className="text-[14px] mt-0.5 leading-none">{fl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-700 truncate">{f.clientName}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{f.beschreibung}</div>
                    </div>
                    <span className={`text-[10px] font-bold whitespace-nowrap ${diff <= 3 ? "text-red-600" : diff <= 7 ? "text-amber-600" : "text-slate-400"}`}>
                      {diff <= 0 ? "HEUTE" : diff === 1 ? "Morgen" : `${diff}T`}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Gläubiger */}
          <Card title="Gläubiger" icon={<Scale size={15} />} action="Details" onAction={() => onNavigate("creditors")}>
            <div className="space-y-1.5">
              {[
                { s: "in_verhandlung", l: "In Verhandlung", c: "#d97706", bg: "#fffbeb" },
                { s: "angebot_gemacht", l: "Angebot gemacht", c: "#ea580c", bg: "#fff7ed" },
                { s: "zahlung_vereinbart", l: "Ratenzahlung", c: "#7c3aed", bg: "#f5f3ff" },
                { s: "erledigt", l: "Erledigt", c: "#059669", bg: "#ecfdf5" },
              ].map(x => {
                const n = GLAEUBIGER.filter(g => g.status === x.s).length;
                return n > 0 ? (
                  <div key={x.s} className="rounded-lg px-3 py-2.5 flex justify-between items-center" style={{ backgroundColor: x.bg }}>
                    <span className="text-[11px] text-slate-600 font-medium">{x.l}</span>
                    <span className="text-[14px] font-bold font-display" style={{ color: x.c }}>{n}</span>
                  </div>
                ) : null;
              })}
              {GLAEUBIGER.filter(g => g.pfaendung).length > 0 && (
                <div className="rounded-lg px-3 py-2.5 flex justify-between items-center bg-red-50 border border-red-100/60">
                  <span className="text-[11px] text-slate-600 font-medium">🔴 Mit Pfändung</span>
                  <span className="text-[14px] font-bold font-display text-red-600">{GLAEUBIGER.filter(g => g.pfaendung).length}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Finanzübersicht */}
          <Card title="Finanzübersicht" icon={<TrendingUp size={15} />} action="Details" onAction={() => onNavigate("invoices")}>
            <div className="space-y-3">
              <FR label="Offene Rechnungen" value={fmt(openAmt)} color="#d97706" />
              <FR label="Bezahlt (2025)" value={fmt(paidAmt)} color="#059669" />
              <div className="h-px bg-slate-100 my-1" />
              <FR label="Kontostand" value="24.680 €" color="#1a1d26" />
            </div>
          </Card>

          {/* Beratungsbereiche */}
          <Card title="Beratungsbereiche" icon={<Briefcase size={15} />}>
            <div className="space-y-3.5">
              {(["Managementberatung", "Schuldnerberatung", "Insolvenzberatung"] as const).map(t => {
                const active = CLIENTS.filter(c => c.type === t && c.status !== "abgeschlossen").length;
                const total = CLIENTS.filter(c => c.type === t).length;
                const pct = Math.round(active / Math.max(total, 1) * 100);
                return (
                  <div key={t}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] text-slate-500 font-medium">{t.replace("beratung", ".")}</span>
                      <span className="text-[12px] font-bold font-display" style={{ color: typeColor(t) }}>{active}/{total}</span>
                    </div>
                    <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: typeColor(t) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* DATEV */}
          <div className="dark-card p-5 cursor-pointer hover:bg-[#1f2330] transition-colors" onClick={() => onNavigate("datev")}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md bg-white/8 flex items-center justify-center text-[13px] font-bold text-white font-display">D</div>
              <div className="text-[13px] font-semibold text-white">DATEV</div>
              <span className="text-[10px] text-white/25 ml-auto">Sync: heute 08:15</span>
            </div>
            <div className="flex gap-2">
              {[{ v: "10", l: "Gebucht", c: "text-emerald-400" }, { v: "1", l: "Offen", c: "text-amber-400" }, { v: "1", l: "Fehler", c: "text-red-400" }].map(x => (
                <div key={x.l} className="bg-white/5 rounded-lg px-3 py-2 text-center flex-1">
                  <div className={`text-[14px] font-bold font-display ${x.c}`}>{x.v}</div>
                  <div className="text-[9px] text-white/25 mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Kontakt */}
          <div className="rounded-[14px] p-5 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #c08b2e 0%, #8b6318 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <div className="font-display font-bold text-[15px] mb-2">Ce-eS Management Consultant</div>
              <div className="space-y-0.5 text-[11px] text-white/60">
                <div>Im Zukunftspark 4 · 74076 Heilbronn</div>
                <div className="text-white/80 font-semibold pt-1 flex items-center gap-1.5"><Phone size={11} />+49 7133 1200-950</div>
                <div>cs@ce-es.de</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIDark({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-amber-500/10 border border-amber-500/15" : "bg-white/[0.04] border border-white/[0.04]"}`}>
      <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-white/25">{label}</div>
      <div className={`text-lg font-bold font-display mt-1 ${highlight ? "text-amber-400" : "text-white"}`}>{value}</div>
      <div className="text-[10px] text-white/20 mt-0.5">{sub}</div>
    </div>
  );
}

function FR({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] text-slate-500 font-medium">{label}</span>
      <span className="text-[14px] font-bold font-display" style={{ color }}>{value}</span>
    </div>
  );
}
