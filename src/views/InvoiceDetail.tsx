import { useState } from "react";
import { getClient, fmt, fmtDate } from "../data";
import type { Invoice, Offer, InvoiceStatus, OfferStatus } from "../data";
import { Badge } from "./shared";
import { toast } from "sonner";
import { ArrowLeft, Download, Mail, Printer, Receipt, Edit, Trash2, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Modal, Field, Input, Textarea, SubmitRow } from "../useStore";
import { updateInvoice, deleteInvoice, updateOffer, deleteOffer, addInvoice, nextInvoiceId } from "../dataStore";

// ─── PDF generation helper ───
function generatePdfContent(type: "rechnung"|"angebot", data: any, cl: any): string {
  return `
${type === "rechnung" ? "RECHNUNG" : "ANGEBOT"} ${data.id}
═══════════════════════════════════════

Von:    Ce-eS Management Consultant
        Am Zukunftspark 10, 74076 Heilbronn
        info@ce-es.de | +49 7131 123456

An:     ${cl?.name || "–"}
        ${cl?.company || ""}
        ${cl?.address || "–"}
        ${cl?.email || ""}

─────────────────────────────────────
Datum:        ${fmtDate(data.date)}
${type === "rechnung" ? `Fällig:       ${fmtDate(data.due)}` : `Gültig bis:   ${fmtDate(data.validUntil)}`}
Status:       ${data.status}
─────────────────────────────────────

Beschreibung:
${data.description}

─────────────────────────────────────
${type === "rechnung" ? "BETRAG (inkl. MwSt.)" : "SUMME (netto zzgl. MwSt.)"}:  ${fmt(data.amount)}
─────────────────────────────────────

Ce-eS Management Consultant
Holger Schwan · Geschäftsführer
`.trim();
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Status change buttons ───
function InvoiceStatusActions({ invoice }: { invoice: Invoice }) {
  const statusOptions: { status: InvoiceStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { status: "offen", label: "Offen", icon: <Clock size={13}/>, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { status: "bezahlt", label: "Bezahlt", icon: <CheckCircle2 size={13}/>, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { status: "überfällig", label: "Überfällig", icon: <AlertTriangle size={13}/>, color: "text-red-600 bg-red-50 border-red-200" },
    { status: "storniert", label: "Storniert", icon: <XCircle size={13}/>, color: "text-slate-500 bg-slate-50 border-slate-200" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-[10px] text-slate-400 self-center mr-1">Status ändern:</span>
      {statusOptions.filter(s => s.status !== invoice.status).map(s => (
        <button key={s.status} onClick={() => { updateInvoice(invoice.id, { status: s.status }); toast.success(`Status → ${s.label}`); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${s.color} hover:opacity-80`}>
          {s.icon}{s.label}
        </button>
      ))}
    </div>
  );
}

function OfferStatusActions({ offer }: { offer: Offer }) {
  const statusOptions: { status: OfferStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { status: "offen", label: "Offen", icon: <Clock size={13}/>, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { status: "angenommen", label: "Angenommen", icon: <CheckCircle2 size={13}/>, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { status: "abgelehnt", label: "Abgelehnt", icon: <XCircle size={13}/>, color: "text-red-600 bg-red-50 border-red-200" },
    { status: "abgelaufen", label: "Abgelaufen", icon: <AlertTriangle size={13}/>, color: "text-slate-500 bg-slate-50 border-slate-200" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-[10px] text-slate-400 self-center mr-1">Status ändern:</span>
      {statusOptions.filter(s => s.status !== offer.status).map(s => (
        <button key={s.status} onClick={() => { updateOffer(offer.id, { status: s.status }); toast.success(`Status → ${s.label}`); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${s.color} hover:opacity-80`}>
          {s.icon}{s.label}
        </button>
      ))}
    </div>
  );
}

// ═══ INVOICE DETAIL ═══
export function InvoiceDetail({invoice, onBack}:{invoice:Invoice; onBack:()=>void}) {
  const cl = getClient(invoice.clientId);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handlePdf = () => {
    const content = generatePdfContent("rechnung", invoice, cl);
    downloadTextFile(content, `${invoice.id}.txt`);
    toast.success(`${invoice.id}.txt heruntergeladen`);
  };
  const handlePrint = () => { window.print(); };
  const handleEmail = () => {
    const subject = encodeURIComponent(`Rechnung ${invoice.id} – Ce-eS Management`);
    const body = encodeURIComponent(`Sehr geehrte(r) ${cl?.name || "Kunde"},\n\nanbei erhalten Sie die Rechnung ${invoice.id} über ${fmt(invoice.amount)}.\n\nFällig bis: ${fmtDate(invoice.due)}\n\nMit freundlichen Grüßen\nCe-eS Management Consultant`);
    window.open(`mailto:${cl?.email || ""}?subject=${subject}&body=${body}`);
  };
  const handleDelete = () => { deleteInvoice(invoice.id); toast.success(`${invoice.id} gelöscht`); onBack(); };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[900px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 border-none bg-transparent text-emerald-700 text-sm cursor-pointer mb-5 hover:text-emerald-900 p-0 font-medium"><ArrowLeft size={18}/>Zurück</button>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="header-gradient p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Rechnung</div><div className="text-2xl font-bold font-display">{invoice.id}</div><div className="mt-2"><Badge status={invoice.status}/></div></div>
            <div className="text-right"><div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Betrag</div><div className="text-3xl font-bold font-display">{fmt(invoice.amount)}</div><div className="text-xs text-white/40 mt-1">inkl. MwSt.</div></div>
          </div>
        </div>
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            {[{l:"Klient",v:cl?.name||"–"},{l:"Unternehmen",v:cl?.company||"Privat"},{l:"Rechnungsdatum",v:fmtDate(invoice.date)},{l:"Fällig am",v:fmtDate(invoice.due)},{l:"E-Mail",v:cl?.email||"–"},{l:"Adresse",v:cl?.address||"–"}].map((r,i)=><div key={i}><div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{r.l}</div><div className="text-sm font-medium text-slate-700">{r.v}</div></div>)}
          </div>
          <div className="border-t border-slate-100 pt-4 mb-6"><div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Beschreibung</div><div className="text-sm text-slate-600">{invoice.description}</div></div>

          {/* Status change */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100"><InvoiceStatusActions invoice={invoice} /></div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button onClick={handlePdf} className="flex-1 py-3 bg-emerald-700 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors shadow-lg shadow-black/10"><Download size={16}/>PDF/TXT</button>
            <button onClick={handleEmail} className="flex-1 py-3 bg-white text-emerald-700 border border-emerald-700 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"><Mail size={16}/>Versenden</button>
            <button onClick={handlePrint} className="py-3 px-5 bg-slate-100 text-slate-600 border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Printer size={16}/>Drucken</button>
          </div>

          {/* Edit/Delete */}
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-slate-50"><Edit size={13}/>Bearbeiten</button>
            {!confirmDel
              ? <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:text-red-500 hover:border-red-200 hover:bg-red-50"><Trash2 size={13}/>Löschen</button>
              : <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white border-none rounded-xl text-[12px] font-semibold cursor-pointer animate-pulse"><Trash2 size={13}/>Wirklich löschen?</button>
            }
          </div>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Rechnung bearbeiten" wide>
        <EditInvoiceForm invoice={invoice} onClose={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}

// ═══ OFFER DETAIL ═══
export function OfferDetail({offer, onBack}:{offer:Offer; onBack:()=>void}) {
  const cl = getClient(offer.clientId);
  const [confirmDel, setConfirmDel] = useState(false);

  const handlePdf = () => {
    const content = generatePdfContent("angebot", offer, cl);
    downloadTextFile(content, `${offer.id}.txt`);
    toast.success(`${offer.id}.txt heruntergeladen`);
  };
  const handleEmail = () => {
    const subject = encodeURIComponent(`Angebot ${offer.id} – Ce-eS Management`);
    const body = encodeURIComponent(`Sehr geehrte(r) ${cl?.name || "Kunde"},\n\nanbei erhalten Sie unser Angebot ${offer.id} über ${fmt(offer.amount)}.\n\nGültig bis: ${fmtDate(offer.validUntil)}\n\nMit freundlichen Grüßen\nCe-eS Management Consultant`);
    window.open(`mailto:${cl?.email || ""}?subject=${subject}&body=${body}`);
  };
  const handleConvertToInvoice = () => {
    const id = nextInvoiceId();
    const today = new Date().toISOString().slice(0,10);
    const due = new Date(); due.setDate(due.getDate() + 14);
    addInvoice({ id, clientId: offer.clientId, amount: offer.amount, date: today, due: due.toISOString().slice(0,10), status: "offen", description: `Aus Angebot ${offer.id}: ${offer.description}` });
    updateOffer(offer.id, { status: "angenommen" });
    toast.success(`Rechnung ${id} aus Angebot erstellt`);
    onBack();
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[900px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 border-none bg-transparent text-emerald-700 text-sm cursor-pointer mb-5 hover:text-emerald-900 p-0 font-medium"><ArrowLeft size={18}/>Zurück</button>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="header-gradient p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Angebot</div><div className="text-2xl font-bold font-display">{offer.id}</div><div className="mt-2"><Badge status={offer.status}/></div></div>
            <div className="text-right"><div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Summe</div><div className="text-3xl font-bold font-display">{fmt(offer.amount)}</div><div className="text-xs text-white/40 mt-1">netto zzgl. MwSt.</div></div>
          </div>
        </div>
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            {[{l:"Klient",v:cl?.name||"–"},{l:"Unternehmen",v:cl?.company||"Privat"},{l:"Erstellt",v:fmtDate(offer.date)},{l:"Gültig bis",v:fmtDate(offer.validUntil)},{l:"E-Mail",v:cl?.email||"–"},{l:"Adresse",v:cl?.address||"–"}].map((r,i)=><div key={i}><div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{r.l}</div><div className="text-sm font-medium text-slate-700">{r.v}</div></div>)}
          </div>
          <div className="border-t border-slate-100 pt-4 mb-6"><div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Beschreibung</div><div className="text-sm text-slate-600">{offer.description}</div></div>

          {/* Status change */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100"><OfferStatusActions offer={offer} /></div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button onClick={handlePdf} className="flex-1 py-3 bg-emerald-700 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors shadow-lg shadow-black/10"><Download size={16}/>PDF/TXT</button>
            <button onClick={handleConvertToInvoice} className="flex-1 py-3 bg-white text-emerald-700 border border-emerald-700 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"><Receipt size={16}/>→ Rechnung erstellen</button>
            <button onClick={handleEmail} className="py-3 px-5 bg-slate-100 text-slate-600 border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Mail size={16}/>Versenden</button>
          </div>

          {!confirmDel
            ? <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:text-red-500 hover:border-red-200 hover:bg-red-50 mt-4"><Trash2 size={13}/>Angebot löschen</button>
            : <button onClick={() => { deleteOffer(offer.id); toast.success(`${offer.id} gelöscht`); onBack(); }} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white border-none rounded-xl text-[12px] font-semibold cursor-pointer animate-pulse mt-4"><Trash2 size={13}/>Wirklich löschen?</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Edit Invoice Form ───
function EditInvoiceForm({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [d, setD] = useState({ amount: String(invoice.amount), date: invoice.date, due: invoice.due, description: invoice.description });
  const set = (k: string, v: string) => setD(p => ({ ...p, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoice(invoice.id, { amount: parseFloat(d.amount), date: d.date, due: d.due, description: d.description });
    toast.success(`${invoice.id} aktualisiert`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <Field label="Betrag (€)"><Input value={d.amount} onChange={e => set("amount", e.target.value)} type="number" step="0.01" required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rechnungsdatum"><Input value={d.date} onChange={e => set("date", e.target.value)} type="date" /></Field>
        <Field label="Fällig am"><Input value={d.due} onChange={e => set("due", e.target.value)} type="date" /></Field>
      </div>
      <Field label="Beschreibung"><Textarea value={d.description} onChange={e => set("description", e.target.value)} rows={3} /></Field>
      <SubmitRow onCancel={onClose} label="Speichern" />
    </form>
  );
}
