import { useState } from "react";
import { GLAEUBIGER, MANDANTEN_FORTSCHRITT, FRISTEN, PHASE_LABELS, STATUS_LABELS, FRIST_LABELS, fmtPct } from "../creditorData";
import type { Glaeubiger } from "../creditorData";
import { fmt, fmtDate, getClient, demoToday } from "../data";
import type { Client } from "../data";
import { ChevronDown, ChevronRight, Clock, ArrowRight, Target, CheckCircle2 } from "lucide-react";

type CTab = "pipeline"|"glaeubiger"|"fristen"|"erfolge";

export function CreditorView({ onSelectClient }: { onSelectClient: (c: Client) => void }) {
  const [tab, setTab] = useState<CTab>("pipeline");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  const totalSchulden = MANDANTEN_FORTSCHRITT.reduce((s, m) => s + m.schuldenStart, 0);
  const aktuellSchulden = MANDANTEN_FORTSCHRITT.reduce((s, m) => s + m.schuldenAktuell, 0);
  const ersparnis = totalSchulden - aktuellSchulden;
  const glaeubigerTotal = GLAEUBIGER.length;
  const glaeubigerErledigt = GLAEUBIGER.filter(g => g.status === "erledigt").length;
  const fourWeeksOut = new Date(); fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);
  const kritischeFristen = FRISTEN.filter(f => f.kritisch && !f.erledigt && new Date(f.datum) <= fourWeeksOut).length;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Hero Stats */}
      <div className="dark-card p-5 lg:p-8 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="text-[10px] tracking-[2px] uppercase text-white/30 mb-3">Gläubiger & Vergleiche – Kerngeschäft</div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <HeroStat label="Schulden gesamt" value={fmt(totalSchulden)} sub={`${MANDANTEN_FORTSCHRITT.length} Mandanten`} />
            <HeroStat label="Aktueller Stand" value={fmt(aktuellSchulden)} sub={`bereits ${fmt(ersparnis)} reduziert`} highlight />
            <HeroStat label="Gläubiger" value={`${glaeubigerErledigt}/${glaeubigerTotal}`} sub={`${glaeubigerTotal - glaeubigerErledigt} in Bearbeitung`} />
            <HeroStat label="Vergleiche erzielt" value={GLAEUBIGER.filter(g => g.status === "erledigt").length.toString()} sub={`∅ ${fmtPct(GLAEUBIGER.filter(g=>g.status==="erledigt").reduce((s,g)=>s+g.originalBetrag,0), GLAEUBIGER.filter(g=>g.status==="erledigt").reduce((s,g)=>s+(g.vergleichsAngebot||0),0))} Ersparnis`} />
            <HeroStat label="Kritische Fristen" value={kritischeFristen.toString()} sub="nächste 3 Wochen" alert={kritischeFristen > 0} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-4 border border-slate-200/60 w-fit shadow-sm overflow-x-auto">
        {([["pipeline", "Mandanten-Pipeline"], ["glaeubiger", "Gläubiger-Übersicht"], ["fristen", "Fristenkalender"], ["erfolge", "Vergleichserfolge"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 border-none rounded-lg text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all ${tab === k ? "bg-[#1a1d26] text-white shadow-md" : "bg-transparent text-slate-400 hover:text-slate-600"}`}>{l}</button>
        ))}
      </div>

      {tab === "pipeline" && <PipelineTab onSelectClient={onSelectClient} />}
      {tab === "glaeubiger" && <GlaeubigerTab expandedClient={expandedClient} setExpandedClient={setExpandedClient} />}
      {tab === "fristen" && <FristenTab />}
      {tab === "erfolge" && <ErfolgeTab />}
    </div>
  );
}

// ═══════════════════════════════════════════
// PIPELINE TAB
// ═══════════════════════════════════════════
function PipelineTab({ onSelectClient }: { onSelectClient: (c: Client) => void }) {
  const sorted = [...MANDANTEN_FORTSCHRITT].sort((a, b) => {
    const aP = PHASE_LABELS[a.phase].step;
    const bP = PHASE_LABELS[b.phase].step;
    return aP - bP;
  });

  return (
    <div className="space-y-3">
      {sorted.map(m => {
        const cl = getClient(m.clientId);
        if (!cl) return null;
        const phase = PHASE_LABELS[m.phase];
        const pct = m.schuldenStart > 0 ? Math.round(((m.schuldenStart - m.schuldenAktuell) / m.schuldenStart) * 100) : 0;
        const isKritisch = cl.status === "kritisch";
        const glaeubiger = GLAEUBIGER.filter(g => g.clientId === m.clientId);

        return (
          <div key={m.clientId} className={`ce-card overflow-hidden transition-all hover:shadow-lg ${isKritisch ? "!border-red-200/50" : ""}`}>
            <div className="p-4 lg:p-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectClient(cl)}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold font-display ${isKritisch ? "bg-red-50 text-red-700 ring-1 ring-red-200/30" : "bg-amber-50/60 text-amber-800 ring-1 ring-amber-200/20"}`}>{cl.name.charAt(0)}</div>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-800 hover:text-emerald-700 transition-colors">{cl.name}{cl.company ? <span className="text-slate-400 font-normal"> · {cl.company}</span> : ""}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">seit {fmtDate(m.startDatum)} · Anwalt: {m.anwalt}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ color: phase.color, backgroundColor: phase.color + "14" }}>
                    {phase.label}
                  </span>
                  {isKritisch && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600">⚠ KRITISCH</span>}
                </div>
              </div>

              {/* Progress Pipeline */}
              <div className="flex items-center gap-1 mb-4">
                {Object.entries(PHASE_LABELS).map(([key, val]) => (
                  <div key={key} className="flex-1 h-2 rounded-full transition-all" style={{
                    backgroundColor: val.step <= phase.step ? phase.color : "#e2e8f0",
                    opacity: val.step <= phase.step ? 1 : 0.4,
                  }} />
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <MiniStat label="Schulden Start" value={fmt(m.schuldenStart)} />
                <MiniStat label="Aktuell" value={fmt(m.schuldenAktuell)} color={m.schuldenAktuell < m.schuldenStart ? "text-emerald-600" : "text-red-600"} />
                <MiniStat label="Reduziert" value={pct > 0 ? `${pct}% (${fmt(m.schuldenStart - m.schuldenAktuell)})` : "—"} color="text-emerald-600" />
                <MiniStat label="Gläubiger" value={`${m.glaeubigerErledigt} von ${m.glaeubigerGesamt} erledigt`} />
              </div>

              {/* Creditor Mini-List */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {glaeubiger.map(g => {
                  const st = STATUS_LABELS[g.status];
                  return (
                    <span key={g.id} className="px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1" style={{ color: st.color, backgroundColor: st.bg }}>
                      {g.pfaendung && "🔴 "}{g.name}: {fmt(g.aktuellerBetrag > 0 ? g.aktuellerBetrag : g.originalBetrag)} – {st.label}
                    </span>
                  );
                })}
              </div>

              {/* Next Step */}
              <div className={`rounded-xl p-3 text-[12px] flex items-start gap-2 ${isKritisch ? "bg-red-50 border border-red-100 text-red-700" : "bg-slate-50 border border-slate-100 text-slate-600"}`}>
                <Target size={14} className="mt-0.5 flex-shrink-0" />
                <div><span className="font-semibold">Nächster Schritt: </span>{m.naechsterSchritt}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// GLÄUBIGER TAB
// ═══════════════════════════════════════════
function GlaeubigerTab({ expandedClient, setExpandedClient }: { expandedClient: number | null; setExpandedClient: (id: number | null) => void }) {
  const grouped = new Map<number, Glaeubiger[]>();
  GLAEUBIGER.forEach(g => {
    if (!grouped.has(g.clientId)) grouped.set(g.clientId, []);
    grouped.get(g.clientId)!.push(g);
  });

  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([clientId, glaeubiger]) => {
        const cl = getClient(clientId);
        if (!cl) return null;
        const isOpen = expandedClient === clientId;
        const total = glaeubiger.reduce((s, g) => s + g.originalBetrag, 0);
        const aktuell = glaeubiger.reduce((s, g) => s + g.aktuellerBetrag, 0);
        const gezahlt = glaeubiger.reduce((s, g) => s + g.gezahlt, 0);

        return (
          <div key={clientId} className="ce-card overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setExpandedClient(isOpen ? null : clientId)}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-display ${cl.status === "kritisch" ? "bg-red-50 text-red-700" : "bg-amber-50/60 text-amber-800"}`}>{cl.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-800">{cl.name}</div>
                <div className="text-[11px] text-slate-400">{glaeubiger.length} Gläubiger · {fmt(total)} gesamt · {fmt(gezahlt)} gezahlt</div>
              </div>
              {aktuell < total && <span className="text-[11px] font-bold text-emerald-600">{fmtPct(total, aktuell)} reduziert</span>}
              {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-300" />}
            </div>

            {isOpen && (
              <div className="border-t border-slate-100">
                {glaeubiger.map(g => {
                  const st = STATUS_LABELS[g.status];
                  const savPct = g.vergleichsAngebot && g.originalBetrag > 0 ? Math.round(((g.originalBetrag - g.vergleichsAngebot) / g.originalBetrag) * 100) : null;

                  return (
                    <div key={g.id} className={`p-4 border-b border-slate-50 last:border-0 ${g.pfaendung ? "bg-red-50/30" : ""}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {g.pfaendung && <span className="text-red-500 text-xs">🔴</span>}
                          <span className="text-[13px] font-semibold text-slate-800">{g.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{g.typ}</span>
                          {g.aktenzeichen && <span className="text-[10px] text-slate-400 font-mono">Az. {g.aktenzeichen}</span>}
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                        <div><div className="text-[10px] text-slate-400">Original</div><div className="text-sm font-bold text-slate-700 font-display">{fmt(g.originalBetrag)}</div></div>
                        <div><div className="text-[10px] text-slate-400">Aktuell</div><div className={`text-sm font-bold font-display ${g.aktuellerBetrag === 0 ? "text-emerald-600" : "text-slate-700"}`}>{fmt(g.aktuellerBetrag)}</div></div>
                        <div><div className="text-[10px] text-slate-400">Vergleichsangebot</div><div className="text-sm font-bold font-display text-blue-600">{g.vergleichsAngebot ? `${fmt(g.vergleichsAngebot)}` : "—"}{savPct ? ` (${savPct}% ↓)` : ""}</div></div>
                        <div><div className="text-[10px] text-slate-400">Gezahlt</div><div className="text-sm font-bold font-display text-emerald-600">{fmt(g.gezahlt)}</div></div>
                      </div>

                      {/* Details Row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 mb-1.5">
                        {g.anwalt && <span>Anwalt: <span className="text-slate-600 font-medium">{g.anwalt}</span></span>}
                        {g.kontaktDatum && <span>Kontakt: {fmtDate(g.kontaktDatum)}</span>}
                        {g.naechsteFrist && <span className={g.fristTyp === "vollstreckung" || g.fristTyp === "insolvenzantrag" ? "text-red-500 font-semibold" : ""}>
                          Frist: {fmtDate(g.naechsteFrist)} {g.fristTyp && `(${FRIST_LABELS[g.fristTyp].label})`}
                        </span>}
                      </div>

                      <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{g.letzteAktion}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// FRISTEN TAB
// ═══════════════════════════════════════════
function FristenTab() {
  const sorted = [...FRISTEN].filter(f => !f.erledigt).sort((a, b) => +new Date(a.datum) - +new Date(b.datum));
  const today = demoToday();

  return (
    <div className="space-y-2">
      {sorted.map(f => {
        const d = new Date(f.datum);
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const fl = FRIST_LABELS[f.typ];
        const isUrgent = diff <= 7;
        const isPast = diff < 0;

        return (
          <div key={f.id} className={`ce-card p-4 flex items-start gap-3 transition-all hover:shadow-md ${isPast ? "!border-red-300 !bg-red-50/50" : isUrgent ? "!border-amber-200" : f.kritisch ? "!border-red-200/50" : ""}`}>
            <div className="text-xl flex-shrink-0 mt-0.5">{fl.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-slate-800">{f.clientName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ color: fl.color, backgroundColor: fl.color + "14" }}>{fl.label}</span>
              </div>
              <div className="text-[12px] text-slate-600 mt-1">{f.beschreibung}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-sm font-bold font-display ${isPast ? "text-red-600" : isUrgent ? "text-amber-600" : "text-slate-700"}`}>{fmtDate(f.datum)}</div>
              <div className={`text-[11px] font-semibold mt-0.5 ${isPast ? "text-red-500" : diff <= 3 ? "text-red-500" : diff <= 7 ? "text-amber-500" : "text-slate-400"}`}>
                {isPast ? `${Math.abs(diff)} Tage überfällig!` : diff === 0 ? "HEUTE!" : diff === 1 ? "Morgen!" : `in ${diff} Tagen`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// ERFOLGE TAB (like their website showcase)
// ═══════════════════════════════════════════
function ErfolgeTab() {
  const erledigte = GLAEUBIGER.filter(g => g.status === "erledigt" && g.vergleichsAngebot);
  const laufende = GLAEUBIGER.filter(g => g.vergleichsAngebot && g.status !== "erledigt");

  return (
    <div className="space-y-6">
      {/* Erzielte Vergleiche */}
      <div>
        <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle2 size={16} /> Erzielte Vergleiche</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {erledigte.map(g => {
            const cl = getClient(g.clientId);
            const ersparnis = g.originalBetrag - (g.vergleichsAngebot || 0);
            const pct = Math.round((ersparnis / g.originalBetrag) * 100);
            return (
              <div key={g.id} className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-5 border border-emerald-200/60">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎉</span>
                  <div><div className="text-[13px] font-semibold text-emerald-800">{g.name}</div><div className="text-[11px] text-slate-400">{cl?.name}</div></div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-center"><div className="text-[10px] text-slate-400">Schuld</div><div className="text-lg font-bold font-display text-red-500 line-through">{fmt(g.originalBetrag)}</div></div>
                  <ArrowRight size={20} className="text-emerald-500" />
                  <div className="text-center"><div className="text-[10px] text-slate-400">Gezahlt</div><div className="text-lg font-bold font-display text-emerald-700">{fmt(g.vergleichsAngebot!)}</div></div>
                  <div className="ml-auto bg-emerald-700 text-white rounded-xl px-3 py-2 text-center">
                    <div className="text-xl font-bold font-display">{pct}%</div>
                    <div className="text-[9px] uppercase tracking-wider">Ersparnis</div>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">Mandant spart {fmt(ersparnis)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Laufende Vergleichsangebote */}
      {laufende.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2"><Clock size={16} /> Laufende Vergleichsangebote</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {laufende.map(g => {
              const cl = getClient(g.clientId);
              const potErsparnis = g.originalBetrag - (g.vergleichsAngebot || 0);
              const potPct = Math.round((potErsparnis / g.originalBetrag) * 100);
              return (
                <div key={g.id} className="bg-white rounded-xl p-4 border border-amber-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <div><div className="text-[13px] font-semibold text-slate-800">{g.name}</div><div className="text-[11px] text-slate-400">{cl?.name} · {STATUS_LABELS[g.status].label}</div></div>
                    <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[11px] font-bold">~{potPct}% ↓</span>
                  </div>
                  <div className="flex gap-4 text-[12px]">
                    <span className="text-slate-500">Schuld: <span className="font-bold text-slate-700">{fmt(g.originalBetrag)}</span></span>
                    <span className="text-slate-500">Angebot: <span className="font-bold text-blue-600">{fmt(g.vergleichsAngebot!)}</span></span>
                    {g.naechsteFrist && <span className="text-slate-400">Frist: {fmtDate(g.naechsteFrist)}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Potential */}
          <div className="mt-4 rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1a1d26 0%, #252a36 100%)' }}>
            <div className="text-[10px] tracking-[2px] uppercase text-white/40 mb-2">Potenzial bei Annahme aller Vergleiche</div>
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-[10px] text-white/40">Ursprüngliche Schulden</div><div className="text-lg font-bold font-display">{fmt(laufende.reduce((s, g) => s + g.originalBetrag, 0))}</div></div>
              <div><div className="text-[10px] text-white/40">Vergleichssumme</div><div className="text-lg font-bold font-display">{fmt(laufende.reduce((s, g) => s + (g.vergleichsAngebot || 0), 0))}</div></div>
              <div><div className="text-[10px] text-white/40">Potenzielle Ersparnis</div><div className="text-lg font-bold font-display text-amber-400">{fmt(laufende.reduce((s, g) => s + g.originalBetrag - (g.vergleichsAngebot || 0), 0))}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───
function HeroStat({ label, value, sub, highlight, alert }: { label: string; value: string; sub: string; highlight?: boolean; alert?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${alert ? "bg-red-500/20" : "bg-white/10"}`}>
      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
      <div className={`text-lg lg:text-xl font-bold font-display mt-0.5 ${highlight ? "text-amber-400" : alert ? "text-red-300" : ""}`}>{value}</div>
      <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-[13px] font-bold font-display ${color || "text-slate-700"}`}>{value}</div>
    </div>
  );
}
