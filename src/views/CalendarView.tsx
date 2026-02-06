import { useState, useEffect, useMemo } from "react";
import { getClient, typeColor, demoTodayStr } from "../data";
import type { Client, BeratungsTyp, Priority } from "../data";
import { Badge } from "./shared";
import { Plus, Clock, MapPin, ChevronLeft, ChevronRight, Trash2, Edit } from "lucide-react";
import { useAppointments, useClients, Modal, Field, Input, Select, SubmitRow } from "../useStore";
import { addAppointment, deleteAppointment, updateAppointment } from "../dataStore";
import { toast } from "sonner";

const WEEKDAY_SHORT = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const WEEKDAY_LONG = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function getWeekDays(referenceDate: Date): {date:string;l:string;n:string;f:string}[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return Array.from({length:7}, (_,i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return {
      date: dd.toISOString().slice(0,10),
      l: WEEKDAY_SHORT[dd.getDay()],
      n: String(dd.getDate()),
      f: `${WEEKDAY_LONG[dd.getDay()]}, ${dd.getDate()}. ${MONTHS[dd.getMonth()]} ${dd.getFullYear()}`
    };
  });
}

function AppointmentForm({ onClose, defaultDate, editApt }: { onClose:()=>void; defaultDate:string; editApt?:any }) {
  const clients = useClients();
  const [d, setD] = useState(editApt ? {
    clientId: editApt.clientId, title: editApt.title, date: editApt.date,
    time: editApt.time, duration: editApt.duration, type: editApt.type,
    location: editApt.location, priority: editApt.priority
  } : {
    clientId: clients[0]?.id || 1, title: "", date: defaultDate,
    time: "09:00", duration: 60, type: "Schuldnerberatung" as BeratungsTyp,
    location: "Büro Heilbronn", priority: "normal" as Priority
  });
  const set = (k: string, v: any) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.title.trim()) { toast.error("Titel ist erforderlich"); return; }
    if (editApt) {
      updateAppointment(editApt.id, { ...d, clientId: Number(d.clientId), duration: Number(d.duration) });
      toast.success(`Termin "${d.title}" aktualisiert`);
    } else {
      addAppointment({ ...d, clientId: Number(d.clientId), duration: Number(d.duration) });
      toast.success(`Termin "${d.title}" angelegt`);
    }
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <Field label="Titel *"><Input value={d.title} onChange={e => set("title", e.target.value)} placeholder="z.B. Erstberatung Müller" required /></Field>
      <Field label="Klient">
        <Select value={d.clientId} onChange={e => set("clientId", e.target.value)}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Datum"><Input type="date" value={d.date} onChange={e => set("date", e.target.value)} /></Field>
        <Field label="Uhrzeit"><Input type="time" value={d.time} onChange={e => set("time", e.target.value)} /></Field>
        <Field label="Dauer (Min)"><Input type="number" value={d.duration} onChange={e => set("duration", e.target.value)} min="15" step="15" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Beratungstyp">
          <Select value={d.type} onChange={e => set("type", e.target.value)}>
            <option>Schuldnerberatung</option><option>Managementberatung</option><option>Insolvenzberatung</option><option>Coaching</option>
          </Select>
        </Field>
        <Field label="Ort"><Input value={d.location} onChange={e => set("location", e.target.value)} placeholder="Büro / Vor Ort / Tel." /></Field>
        <Field label="Priorität">
          <Select value={d.priority} onChange={e => set("priority", e.target.value)}>
            <option value="normal">Normal</option><option value="hoch">Hoch</option><option value="niedrig">Niedrig</option>
          </Select>
        </Field>
      </div>
      <SubmitRow onCancel={onClose} label={editApt ? "Speichern" : "Termin anlegen"} />
    </form>
  );
}

export function CalendarView({onSelectClient, autoCreate, onCreated}:{onSelectClient:(c:Client)=>void; autoCreate?: boolean; onCreated?: () => void}) {
  const appointments = useAppointments();
  // Start with current week, but if no appointments exist this week, fall back to demo data week
  const [weekRef, setWeekRef] = useState(() => {
    const now = new Date();
    const thisWeekDays = getWeekDays(now);
    const hasAppts = appointments.some(a => thisWeekDays.some(d => d.date === a.date));
    return hasAppts ? now : new Date(demoTodayStr());
  });
  const days = useMemo(() => getWeekDays(weekRef), [weekRef.toISOString().slice(0,10)]);
  const [sel, setSel] = useState(days[0].date);
  const [showNew, setShowNew] = useState(false);
  const [editApt, setEditApt] = useState<any>(null);
  const [delConfirm, setDelConfirm] = useState<number|null>(null);

  // Keep sel in sync when week changes
  useEffect(() => { setSel(days[0].date); }, [days[0].date]);

  useEffect(() => {
    if (autoCreate) { setShowNew(true); onCreated?.(); }
  }, [autoCreate]);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + dir * 7);
    setWeekRef(d);
  };
  const goToday = () => { setWeekRef(new Date()); };

  const apts = appointments.filter(a => a.date === sel).sort((a, b) => a.time.localeCompare(b.time));
  const monthLabel = `${MONTHS[weekRef.getMonth()]} ${weekRef.getFullYear()}`;

  const handleDelete = (id: number) => {
    deleteAppointment(id);
    toast.success("Termin gelöscht");
    setDelConfirm(null);
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Header with week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold font-display text-slate-800 m-0">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"><ChevronLeft size={16}/></button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">Heute</button>
            <button onClick={() => shiftWeek(1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"><ChevronRight size={16}/></button>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-emerald-700 text-white border-none rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-emerald-800 transition-colors shadow-lg shadow-black/10"><Plus size={16}/>Termin</button>
      </div>

      {/* Day pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {days.map(d => {
          const has = appointments.some(a => a.date === d.date);
          const act = sel === d.date;
          const isToday = d.date === new Date().toISOString().slice(0, 10);
          return (
            <button key={d.date} onClick={() => setSel(d.date)} className={`flex flex-col items-center py-3 px-4 lg:px-6 rounded-2xl border-none cursor-pointer min-w-[52px] transition-all ${act ? "bg-emerald-700 text-white shadow-xl shadow-emerald-700/30" : isToday ? "bg-amber-50 text-amber-700 ring-2 ring-amber-200 shadow-sm" : "bg-white text-slate-600 shadow-sm hover:shadow-md hover:-translate-y-[1px]"}`}>
              <span className="text-[10px] opacity-50">{d.l}</span>
              <span className="text-xl font-bold mt-0.5 font-display">{d.n}</span>
              {has && <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${act ? "bg-white" : "bg-emerald-500"}`} />}
            </button>
          );
        })}
      </div>

      <div className="text-[12px] text-slate-400 mb-4">{days.find(d => d.date === sel)?.f} · {apts.length} Termin{apts.length !== 1 ? "e" : ""}</div>

      {apts.length === 0 ? (
        <div className="text-center py-16 text-slate-300 bg-white rounded-2xl border border-slate-200/80">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-sm">Keine Termine an diesem Tag</div>
          <button onClick={() => setShowNew(true)} className="mt-3 text-[12px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-emerald-100">Termin anlegen →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {apts.map(apt => {
            const cl = getClient(apt.clientId);
            return (
              <div key={apt.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:shadow-lg hover:border-emerald-200 transition-all group" style={{ borderLeftWidth: 4, borderLeftColor: typeColor(apt.type) }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="cursor-pointer flex-1" onClick={() => cl && onSelectClient(cl)}>
                    <div className="text-[13px] font-semibold text-slate-800 hover:text-emerald-700 transition-colors">{apt.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{cl?.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge status={apt.priority} />
                    {/* Edit/Delete buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button onClick={() => setEditApt(apt)} className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 cursor-pointer transition-colors" title="Bearbeiten"><Edit size={12}/></button>
                      {delConfirm === apt.id
                        ? <button onClick={() => handleDelete(apt.id)} className="w-7 h-7 rounded-lg bg-red-500 border-none flex items-center justify-center text-white cursor-pointer animate-pulse" title="Bestätigen"><Trash2 size={12}/></button>
                        : <button onClick={() => setDelConfirm(apt.id)} className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 cursor-pointer transition-colors" title="Löschen"><Trash2 size={12}/></button>
                      }
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 flex-wrap">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg"><Clock size={12}/>{apt.time} · {apt.duration} Min</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg"><MapPin size={12}/>{apt.location}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Appointment Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Neuen Termin anlegen" wide>
        <AppointmentForm onClose={() => setShowNew(false)} defaultDate={sel} />
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal open={editApt !== null} onClose={() => setEditApt(null)} title="Termin bearbeiten" wide>
        {editApt && <AppointmentForm onClose={() => setEditApt(null)} defaultDate={sel} editApt={editApt} />}
      </Modal>
    </div>
  );
}
