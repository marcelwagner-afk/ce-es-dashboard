import { useState, useEffect } from "react";import { getClient, fmt, fmtDate } from "../data";
import type { Invoice, Offer, InvoiceStatus, OfferStatus } from "../data";
import { Badge } from "./shared";
import { Plus } from "lucide-react";
import { useInvoices, useOffers, useClients, Modal, Field, Input, Select, SubmitRow } from "../useStore";
import { addInvoice, addOffer, nextInvoiceId, nextOfferId } from "../dataStore";
import { toast } from "sonner";

interface P { onSelectInvoice:(i:Invoice)=>void; onSelectOffer:(o:Offer)=>void; autoCreate?: "invoice" | "offer" | null; onCreated?: () => void; }

function NewInvoiceForm({ onClose }: { onClose: () => void }) {
  const clients = useClients();
  const nid = nextInvoiceId();
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [d, setD] = useState({ id: nid, clientId: clients[0]?.id || 1, amount: "", date: today, due, status: "entwurf" as InvoiceStatus, description: "" });
  const set = (k: string, v: any) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.amount || !d.description.trim()) { toast.error("Betrag und Beschreibung erforderlich"); return; }
    addInvoice({ ...d, clientId: Number(d.clientId), amount: parseFloat(d.amount as string) });
    toast.success(`Rechnung ${d.id} erstellt`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rechnungs-Nr."><Input value={d.id} readOnly className="bg-slate-50" /></Field>
        <Field label="Klient">
          <Select value={d.clientId} onChange={e => set("clientId", e.target.value)}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Beschreibung *"><Input value={d.description} onChange={e => set("description", e.target.value)} placeholder="z.B. Schuldnerberatung Januar 2025" required /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Betrag (€) *"><Input type="number" value={d.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" step="0.01" required /></Field>
        <Field label="Datum"><Input type="date" value={d.date} onChange={e => set("date", e.target.value)} /></Field>
        <Field label="Fällig"><Input type="date" value={d.due} onChange={e => set("due", e.target.value)} /></Field>
      </div>
      <Field label="Status">
        <Select value={d.status} onChange={e => set("status", e.target.value)}>
          <option value="entwurf">Entwurf</option><option value="offen">Offen</option><option value="bezahlt">Bezahlt</option>
        </Select>
      </Field>
      <SubmitRow onCancel={onClose} label="Rechnung erstellen" />
    </form>
  );
}

function NewOfferForm({ onClose }: { onClose: () => void }) {
  const clients = useClients();
  const nid = nextOfferId();
  const today = new Date().toISOString().slice(0, 10);
  const valid = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [d, setD] = useState({ id: nid, clientId: clients[0]?.id || 1, amount: "", date: today, validUntil: valid, status: "entwurf" as OfferStatus, description: "" });
  const set = (k: string, v: any) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.amount || !d.description.trim()) { toast.error("Betrag und Beschreibung erforderlich"); return; }
    addOffer({ ...d, clientId: Number(d.clientId), amount: parseFloat(d.amount as string) });
    toast.success(`Angebot ${d.id} erstellt`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Angebots-Nr."><Input value={d.id} readOnly className="bg-slate-50" /></Field>
        <Field label="Klient">
          <Select value={d.clientId} onChange={e => set("clientId", e.target.value)}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Beschreibung *"><Input value={d.description} onChange={e => set("description", e.target.value)} placeholder="z.B. Beratungspaket Restrukturierung" required /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Summe (€) *"><Input type="number" value={d.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" step="0.01" required /></Field>
        <Field label="Erstellt"><Input type="date" value={d.date} onChange={e => set("date", e.target.value)} /></Field>
        <Field label="Gültig bis"><Input type="date" value={d.validUntil} onChange={e => set("validUntil", e.target.value)} /></Field>
      </div>
      <Field label="Status">
        <Select value={d.status} onChange={e => set("status", e.target.value)}>
          <option value="entwurf">Entwurf</option><option value="versendet">Versendet</option><option value="angenommen">Angenommen</option><option value="abgelehnt">Abgelehnt</option>
        </Select>
      </Field>
      <SubmitRow onCancel={onClose} label="Angebot erstellen" />
    </form>
  );
}

export function FinanceView({onSelectInvoice,onSelectOffer,autoCreate,onCreated}:P) {
  const invoices = useInvoices();
  const offers = useOffers();
  const [tab,setTab]=useState<"r"|"a">("r");
  const [showNewInv, setShowNewInv] = useState(false);
  const [showNewOff, setShowNewOff] = useState(false);

  useEffect(() => {
    if (autoCreate === "invoice") { setTab("r"); setShowNewInv(true); onCreated?.(); }
    else if (autoCreate === "offer") { setTab("a"); setShowNewOff(true); onCreated?.(); }
  }, [autoCreate]);
  const si=[...invoices].sort((a,b)=>{const o:Record<string,number>={"überfällig":0,offen:1,entwurf:2,bezahlt:3};return(o[a.status]??9)-(o[b.status]??9);});
  const so=[...offers].sort((a,b)=>+new Date(b.date)-+new Date(a.date));

  return(
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SC label="Offen" v={invoices.filter(i=>i.status==="offen").length} a={fmt(invoices.filter(i=>i.status==="offen").reduce((s,i)=>s+i.amount,0))} color="text-amber-600" bg="bg-amber-50"/>
        <SC label="Überfällig" v={invoices.filter(i=>i.status==="überfällig").length} a={fmt(invoices.filter(i=>i.status==="überfällig").reduce((s,i)=>s+i.amount,0))} color="text-red-600" bg="bg-red-50"/>
        <SC label="Bezahlt" v={invoices.filter(i=>i.status==="bezahlt").length} a={fmt(invoices.filter(i=>i.status==="bezahlt").reduce((s,i)=>s+i.amount,0))} color="text-emerald-600" bg="bg-emerald-50"/>
        <SC label="Angebote offen" v={offers.filter(o=>o.status==="versendet").length} a={fmt(offers.filter(o=>o.status==="versendet").reduce((s,o)=>s+o.amount,0))} color="text-blue-600" bg="bg-blue-50"/>
      </div>
      <div className="flex justify-between items-center mb-5">
        <div className="flex bg-white rounded-xl p-1 border border-slate-200/80 w-fit shadow-sm">
          {([["r","Rechnungen"],["a","Angebote"]] as const).map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-6 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all ${tab===k?"bg-[#1a1d26] text-white shadow-md":"bg-transparent text-slate-400 hover:text-slate-600"}`}>{l}</button>)}
        </div>
        <button onClick={() => tab === "r" ? setShowNewInv(true) : setShowNewOff(true)} className="bg-emerald-700 text-white border-none rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-emerald-800 transition-colors shadow-lg shadow-black/10"><Plus size={16}/>{tab === "r" ? "Rechnung" : "Angebot"}</button>
      </div>

      {tab==="r"?(
        <>
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider"><th className="px-5 py-3">Nr.</th><th className="px-5 py-3">Klient</th><th className="px-5 py-3">Beschreibung</th><th className="px-5 py-3">Datum</th><th className="px-5 py-3">Fällig</th><th className="px-5 py-3 text-right">Betrag</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody>{si.map(inv=>{const cl=getClient(inv.clientId);return(
              <tr key={inv.id} onClick={()=>onSelectInvoice(inv)} className="border-b border-slate-50 hover:bg-emerald-50/40 cursor-pointer transition-colors">
                <td className="px-5 py-3 font-semibold text-slate-700">{inv.id}</td>
                <td className="px-5 py-3 text-slate-600">{cl?.name}</td>
                <td className="px-5 py-3 text-slate-400 max-w-[240px] truncate">{inv.description}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(inv.date)}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(inv.due)}</td>
                <td className="px-5 py-3 text-right font-bold font-display">{fmt(inv.amount)}</td>
                <td className="px-5 py-3"><Badge status={inv.status}/></td>
              </tr>
            );})}</tbody></table>
          </div>
          <div className="lg:hidden space-y-2">{si.map(inv=>{const cl=getClient(inv.clientId);return(
            <div key={inv.id} onClick={()=>onSelectInvoice(inv)} className="bg-white rounded-xl p-3.5 cursor-pointer border border-slate-200/80 hover:shadow-md transition-all">
              <div className="flex justify-between items-start"><div className="min-w-0"><div className="text-sm font-semibold">{inv.id}</div><div className="text-[11px] text-slate-400 mt-0.5">{cl?.name} · {fmtDate(inv.date)}</div></div><div className="text-right ml-3"><div className="text-base font-bold font-display">{fmt(inv.amount)}</div><div className="mt-1"><Badge status={inv.status}/></div></div></div>
            </div>
          );})}</div>
        </>
      ):(
        <>
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase tracking-wider"><th className="px-5 py-3">Nr.</th><th className="px-5 py-3">Klient</th><th className="px-5 py-3">Beschreibung</th><th className="px-5 py-3">Erstellt</th><th className="px-5 py-3">Gültig bis</th><th className="px-5 py-3 text-right">Summe</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody>{so.map(off=>{const cl=getClient(off.clientId);return(
              <tr key={off.id} onClick={()=>onSelectOffer(off)} className="border-b border-slate-50 hover:bg-emerald-50/40 cursor-pointer transition-colors">
                <td className="px-5 py-3 font-semibold text-slate-700">{off.id}</td>
                <td className="px-5 py-3 text-slate-600">{cl?.name}</td>
                <td className="px-5 py-3 text-slate-400 max-w-[240px] truncate">{off.description}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(off.date)}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(off.validUntil)}</td>
                <td className="px-5 py-3 text-right font-bold font-display">{fmt(off.amount)}</td>
                <td className="px-5 py-3"><Badge status={off.status}/></td>
              </tr>
            );})}</tbody></table>
          </div>
          <div className="lg:hidden space-y-2">{so.map(off=>{const cl=getClient(off.clientId);return(
            <div key={off.id} onClick={()=>onSelectOffer(off)} className="bg-white rounded-xl p-3.5 cursor-pointer border border-slate-200/80 hover:shadow-md transition-all">
              <div className="flex justify-between items-start"><div className="min-w-0"><div className="text-sm font-semibold">{off.id}</div><div className="text-[11px] text-slate-400 mt-0.5">{cl?.name} · {fmtDate(off.date)}</div></div><div className="text-right ml-3"><div className="text-base font-bold font-display">{fmt(off.amount)}</div><div className="mt-1"><Badge status={off.status}/></div></div></div>
            </div>
          );})}</div>
        </>
      )}

      <Modal open={showNewInv} onClose={() => setShowNewInv(false)} title="Neue Rechnung erstellen" wide>
        <NewInvoiceForm onClose={() => setShowNewInv(false)} />
      </Modal>
      <Modal open={showNewOff} onClose={() => setShowNewOff(false)} title="Neues Angebot erstellen" wide>
        <NewOfferForm onClose={() => setShowNewOff(false)} />
      </Modal>
    </div>
  );
}

function SC({label,v,a,color,bg}:{label:string;v:number;a:string;color:string;bg:string}) {
  return <div className={`${bg} rounded-2xl p-4 border border-slate-100`}><div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</div><div className={`text-2xl font-bold font-display ${color}`}>{v}</div><div className="text-[11px] text-slate-400 mt-0.5">{a}</div></div>;
}
