import { useState, useEffect } from "react";
import { fmt, fmtDate } from "../data";
import type { Client, BeratungsTyp, ClientStatus } from "../data";
import { Badge, TypeTag, ClientRow } from "./shared";
import { Search, Plus } from "lucide-react";
import { useClients } from "../useStore";
import { Modal, Field, Input, Select, Textarea, SubmitRow } from "../useStore";
import { addClient } from "../dataStore";
import { toast } from "sonner";

interface P { onSelectClient:(c:Client)=>void; autoCreate?: boolean; onCreated?: () => void; }

function NewClientForm({ onClose }: { onClose: () => void }) {
  const [d, setD] = useState({ name: "", company: "", type: "Schuldnerberatung" as BeratungsTyp, subtype: "", phone: "", email: "", address: "", status: "aktiv" as ClientStatus, schulden: "", notes: "" });
  const set = (k: string, v: string) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Name ist erforderlich"); return; }
    addClient({ ...d, company: d.company || null, schulden: d.schulden ? parseFloat(d.schulden) : null, created: new Date().toISOString().slice(0, 10) });
    toast.success(`Klient "${d.name}" angelegt`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name *"><Input value={d.name} onChange={e => set("name", e.target.value)} placeholder="Vor- und Nachname" required /></Field>
        <Field label="Firma"><Input value={d.company} onChange={e => set("company", e.target.value)} placeholder="Optional" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Beratungstyp">
          <Select value={d.type} onChange={e => set("type", e.target.value)}>
            <option>Schuldnerberatung</option><option>Managementberatung</option><option>Insolvenzberatung</option><option>Coaching</option>
          </Select>
        </Field>
        <Field label="Unterbereich"><Input value={d.subtype} onChange={e => set("subtype", e.target.value)} placeholder="z.B. Vergleichsverhandlung" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefon"><Input value={d.phone} onChange={e => set("phone", e.target.value)} placeholder="+49..." type="tel" /></Field>
        <Field label="E-Mail"><Input value={d.email} onChange={e => set("email", e.target.value)} placeholder="mail@beispiel.de" type="email" /></Field>
      </div>
      <Field label="Adresse"><Input value={d.address} onChange={e => set("address", e.target.value)} placeholder="Straße, PLZ, Ort" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select value={d.status} onChange={e => set("status", e.target.value)}>
            <option value="aktiv">Aktiv</option><option value="kritisch">Kritisch</option><option value="abgeschlossen">Abgeschlossen</option>
          </Select>
        </Field>
        <Field label="Schulden (€)"><Input value={d.schulden} onChange={e => set("schulden", e.target.value)} placeholder="0.00" type="number" step="0.01" /></Field>
      </div>
      <Field label="Notizen"><Textarea value={d.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Interne Notizen..." /></Field>
      <SubmitRow onCancel={onClose} label="Klient anlegen" />
    </form>
  );
}

export function ClientsView({onSelectClient, autoCreate, onCreated}:P) {
  const clients = useClients();
  const [q,setQ]=useState(""); const [f,setF]=useState("alle");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (autoCreate) { setShowNew(true); onCreated?.(); }
  }, [autoCreate]);
  const types=["alle","Managementberatung","Schuldnerberatung","Insolvenzberatung"];
  const res=clients.filter(c=>{
    const s=q.toLowerCase();
    return(!q||c.name.toLowerCase().includes(s)||(c.company||"").toLowerCase().includes(s)||c.email.toLowerCase().includes(s))&&(f==="alle"||c.type===f);
  });

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Name, Firma, E-Mail…" className="w-full py-2.5 pl-10 pr-4 border border-slate-200 rounded-xl text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300"/>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-emerald-700 text-white border-none rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-emerald-800 transition-colors shadow-lg shadow-black/10 whitespace-nowrap"><Plus size={16}/>Neuer Klient</button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto flex-shrink-0 mb-3">
        {types.map(t=><button key={t} onClick={()=>setF(t)} className={`px-3.5 py-2 rounded-xl border text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-all ${f===t?"bg-emerald-700 text-white border-emerald-700 shadow-lg shadow-black/10":"bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>{t==="alle"?"Alle":t.replace("beratung",".")}</button>)}
      </div>
      <div className="text-[11px] text-slate-400 mb-3">{res.length} Klienten</div>
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider">
            <th className="px-5 py-3">Klient</th><th className="px-5 py-3">Bereich</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Schulden</th><th className="px-5 py-3">Seit</th><th className="px-5 py-3">Kontakt</th>
          </tr></thead>
          <tbody>{res.map(c=>(
            <tr key={c.id} onClick={()=>onSelectClient(c)} className="border-b border-slate-50 hover:bg-emerald-50/40 cursor-pointer transition-colors">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display ${c.status==="kritisch"?"bg-red-50 text-red-700":"bg-emerald-50 text-emerald-800"}`}>{c.name.charAt(0)}</div><div><div className="font-semibold text-slate-700">{c.name}</div><div className="text-[11px] text-slate-400">{c.company||""}</div></div></div></td>
              <td className="px-5 py-3"><TypeTag type={c.type}/><div className="text-[11px] text-slate-400 mt-0.5">{c.subtype}</div></td>
              <td className="px-5 py-3"><Badge status={c.status}/></td>
              <td className="px-5 py-3">{c.schulden?<span className="font-bold text-red-600 text-[13px] font-display">{fmt(c.schulden)}</span>:<span className="text-slate-300">–</span>}</td>
              <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(c.created)}</td>
              <td className="px-5 py-3"><div className="text-xs text-slate-500">{c.phone}</div><div className="text-[11px] text-slate-400">{c.email}</div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="lg:hidden space-y-2">{res.map(c=><ClientRow key={c.id} client={c} onClick={()=>onSelectClient(c)}/>)}</div>
      {res.length===0&&<div className="text-center py-16 text-slate-300"><div className="text-4xl mb-3">🔍</div><div className="text-sm">Keine Klienten gefunden</div></div>}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Neuen Klienten anlegen" wide>
        <NewClientForm onClose={() => setShowNew(false)} />
      </Modal>
    </div>
  );
}
