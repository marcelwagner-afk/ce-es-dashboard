import { fmt, fmtDate, typeColor, docIcon } from "../data";
import type { Client, Document as Doc, DocType } from "../data";
import { Badge, TypeTag } from "./shared";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, CalendarPlus, Edit, MapPin, Clock,
  FolderArchive, StickyNote, Save, X, Upload, Trash2, Eye,
  Download, Plus, FileUp, CheckCircle2, Sparkles, ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useInvoices, useOffers, useAppointments, useCaseFiles, Modal, Field, Input, Select, Textarea, SubmitRow } from "../useStore";
import { updateClient, deleteClient, addAppointment, addDocumentToFile, addCaseFile, deleteDocument, setPendingAiDoc } from "../dataStore";

interface P { client: Client; onBack: () => void; onNavigate: (t: string) => void; }

// ─── Helpers ───
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function detectDocType(filename: string): DocType {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, DocType> = { pdf:"pdf",docx:"docx",doc:"docx",xlsx:"xlsx",xls:"xlsx",csv:"xlsx",txt:"note",msg:"email",eml:"email",jpg:"scan",jpeg:"scan",png:"scan",gif:"scan",webp:"scan" };
  return map[ext] || "pdf";
}
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = { pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",doc:"application/msword",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",txt:"text/plain",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png" };
  return map[ext] || "application/octet-stream";
}
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}
function downloadDocument(doc: Doc) {
  if (!doc.fileData) { toast.error("Keine Datei hinterlegt (nur Metadaten)"); return; }
  try {
    const byteChars = atob(doc.fileData);
    const arr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([arr], { type: doc.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = doc.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`"${doc.name}" heruntergeladen`);
  } catch { toast.error("Download fehlgeschlagen"); }
}
const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.eml,.msg";

// ═══ EDIT CLIENT FORM ═══
function EditClientForm({ client, onClose }: { client: Client; onClose: () => void }) {
  const [d, setD] = useState({ name:client.name, company:client.company||"", type:client.type, subtype:client.subtype, phone:client.phone, email:client.email, address:client.address, status:client.status, schulden:client.schulden?.toString()||"", notes:client.notes });
  const set = (k: string, v: string) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Name ist erforderlich"); return; }
    updateClient(client.id, { ...d, company: d.company||null, schulden: d.schulden ? parseFloat(d.schulden) : null } as any);
    toast.success(`"${d.name}" aktualisiert`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name *"><Input value={d.name} onChange={e=>set("name",e.target.value)} required /></Field>
        <Field label="Firma"><Input value={d.company} onChange={e=>set("company",e.target.value)} placeholder="Optional" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Beratungstyp"><Select value={d.type} onChange={e=>set("type",e.target.value)}><option>Schuldnerberatung</option><option>Managementberatung</option><option>Insolvenzberatung</option><option>Coaching</option></Select></Field>
        <Field label="Unterbereich"><Input value={d.subtype} onChange={e=>set("subtype",e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefon"><Input value={d.phone} onChange={e=>set("phone",e.target.value)} type="tel" /></Field>
        <Field label="E-Mail"><Input value={d.email} onChange={e=>set("email",e.target.value)} type="email" /></Field>
      </div>
      <Field label="Adresse"><Input value={d.address} onChange={e=>set("address",e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status"><Select value={d.status} onChange={e=>set("status",e.target.value)}><option value="aktiv">Aktiv</option><option value="kritisch">Kritisch</option><option value="abgeschlossen">Abgeschlossen</option></Select></Field>
        <Field label="Schulden (€)"><Input value={d.schulden} onChange={e=>set("schulden",e.target.value)} type="number" step="0.01" /></Field>
      </div>
      <Field label="Notizen"><Textarea value={d.notes} onChange={e=>set("notes",e.target.value)} rows={3} /></Field>
      <SubmitRow onCancel={onClose} label="Speichern" />
    </form>
  );
}

// ═══ NEW APPOINTMENT FORM ═══
function NewAppointmentForm({ client, onClose }: { client: Client; onClose: () => void }) {
  const [d, setD] = useState({ title:"", date:new Date().toISOString().slice(0,10), time:"10:00", duration:"60", location:"Büro Heilbronn", type:"beratung", priority:"mittel", notes:"" });
  const set = (k: string, v: string) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.title.trim()) { toast.error("Titel erforderlich"); return; }
    addAppointment({ clientId:client.id, title:d.title, date:d.date, time:d.time, duration:parseInt(d.duration), location:d.location, type:d.type as any, priority:d.priority as any });
    toast.success(`Termin "${d.title}" angelegt`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <Field label="Titel *"><Input value={d.title} onChange={e=>set("title",e.target.value)} placeholder="z.B. Beratungsgespräch" required /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Datum"><Input value={d.date} onChange={e=>set("date",e.target.value)} type="date" /></Field>
        <Field label="Uhrzeit"><Input value={d.time} onChange={e=>set("time",e.target.value)} type="time" /></Field>
        <Field label="Dauer (Min)"><Input value={d.duration} onChange={e=>set("duration",e.target.value)} type="number" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ort"><Input value={d.location} onChange={e=>set("location",e.target.value)} /></Field>
        <Field label="Priorität"><Select value={d.priority} onChange={e=>set("priority",e.target.value)}><option value="niedrig">Niedrig</option><option value="mittel">Mittel</option><option value="hoch">Hoch</option><option value="kritisch">Kritisch</option></Select></Field>
      </div>
      <Field label="Notizen"><Textarea value={d.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Optional" /></Field>
      <SubmitRow onCancel={onClose} label="Termin anlegen" />
    </form>
  );
}

// ═══ UPLOAD FORM ═══
function UploadDocForm({ onClose, fileId }: { onClose: () => void; fileId: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = useCallback((newFiles: FileList|File[]) => {
    const arr = Array.from(newFiles).filter(f => f.size <= 25*1024*1024);
    if (arr.length < Array.from(newFiles).length) toast.error("Dateien über 25 MB übersprungen");
    setFiles(prev => [...prev, ...arr]);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) { toast.error("Bitte Dateien auswählen"); return; }
    setUploading(true);
    try {
      for (const file of files) {
        const fileData = await readFileAsBase64(file);
        addDocumentToFile(fileId, { id:`d-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name:file.name, type:detectDocType(file.name), size:formatFileSize(file.size), date:new Date().toISOString().slice(0,10), preview:file.name, fileData, mimeType:getMimeType(file.name) });
      }
      toast.success(`${files.length} Dokument${files.length>1?"e":""} hochgeladen`);
      onClose();
    } catch (err) { toast.error("Fehler: "+(err as Error).message); }
    finally { setUploading(false); }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);if(e.dataTransfer.files.length)addFiles(e.dataTransfer.files)}} onClick={()=>inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${dragOver?"border-emerald-400 bg-emerald-50":"border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"}`}>
        <input ref={inputRef} type="file" accept={ACCEPTED} multiple hidden onChange={e=>e.target.files&&addFiles(e.target.files)} />
        <FileUp size={28} className={`mx-auto mb-2 ${dragOver?"text-emerald-500":"text-slate-300"}`} />
        <div className="text-sm font-medium text-slate-600">Dateien hierher ziehen oder klicken</div>
        <div className="text-[11px] text-slate-400 mt-1">PDF, Word, Excel, Bilder – max. 25 MB</div>
      </div>
      {files.length>0&&<div className="space-y-1.5 mb-4">{files.map((f,i)=>(
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[12px]">
          <span>{docIcon(detectDocType(f.name))}</span>
          <span className="flex-1 truncate text-slate-700 font-medium">{f.name}</span>
          <span className="text-slate-400 text-[10px]">{formatFileSize(f.size)}</span>
          <button type="button" onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer text-slate-400 hover:text-red-500 flex items-center justify-center"><X size={12}/></button>
        </div>
      ))}</div>}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer">Abbrechen</button>
        <button type="submit" disabled={uploading||!files.length} className="px-5 py-2 rounded-xl border-none text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50" style={{background:"linear-gradient(135deg,#16794a,#1a6b42)"}}>
          {uploading?"Hochladen…":`${files.length} Datei${files.length!==1?"en":""} hochladen`}
        </button>
      </div>
    </form>
  );
}

// ═══ DOCUMENT PREVIEW ═══
function DocPreviewModal({ doc, fileId, onClose, onAnalyze }: { doc:Doc; fileId:number; onClose:()=>void; onAnalyze?:(d:Doc)=>void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const handleDelete = () => { deleteDocument(fileId, doc.id); toast.success(`"${doc.name}" gelöscht`); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2"><span className="text-lg">{docIcon(doc.type)}</span><div><div className="text-[13px] font-bold text-slate-800">{doc.name}</div><div className="text-[10px] text-slate-400">{doc.size} · {fmtDate(doc.date)}{doc.fileData&&" · ✓ Datei"}</div></div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border-none cursor-pointer flex items-center justify-center text-slate-400"><X size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {doc.preview&&<div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap">{doc.preview}</div>}
          {doc.fileData&&doc.mimeType?.startsWith("image/")&&<img src={`data:${doc.mimeType};base64,${doc.fileData}`} alt={doc.name} className="w-full rounded-xl mt-3 border border-slate-100"/>}
          {!doc.fileData&&!doc.preview&&<div className="text-center py-8 text-slate-400 text-sm">Keine Vorschau verfügbar</div>}
        </div>
        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100">
          {doc.fileData&&<button onClick={()=>downloadDocument(doc)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-emerald-100"><Download size={13}/>Download</button>}
          {doc.fileData&&onAnalyze&&<button onClick={()=>{onAnalyze(doc);onClose()}} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-purple-100"><Sparkles size={13}/>KI-Analyse</button>}
          <div className="flex-1"/>
          {!confirmDel?<button onClick={()=>setConfirmDel(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200"><Trash2 size={13}/>Löschen</button>
          :<button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white border-none rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-red-700 animate-pulse"><Trash2 size={13}/>Wirklich löschen?</button>}
        </div>
      </div>
    </div>
  );
}

// ═══ EDITABLE NOTES ═══
function EditableNotes({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(client.notes);
  const save = () => { updateClient(client.id, { notes: text }); toast.success("Notizen gespeichert"); setEditing(false); };
  return (
    <Crd title="Notizen" icon={<StickyNote size={14}/>}
      action={!editing
        ? <button onClick={()=>setEditing(true)} className="text-[10px] text-emerald-600 font-semibold bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1"><Edit size={11}/>Bearbeiten</button>
        : <div className="flex gap-1.5">
            <button onClick={()=>{setText(client.notes);setEditing(false)}} className="text-[10px] text-slate-400 bg-transparent border-none cursor-pointer hover:text-slate-600">Abbrechen</button>
            <button onClick={save} className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 cursor-pointer hover:bg-emerald-100 flex items-center gap-1"><Save size={10}/>Speichern</button>
          </div>
      }>
      {editing
        ? <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full text-[13px] text-slate-600 leading-relaxed border border-slate-200 rounded-xl p-3 bg-slate-50 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 outline-none resize-none min-h-[80px]"/>
        : <div className="text-[13px] text-slate-500 leading-relaxed whitespace-pre-wrap">{client.notes||<span className="text-slate-300 italic">Keine Notizen</span>}</div>
      }
    </Crd>
  );
}

// ═══════════════════════════════════════
// MAIN CLIENT DETAIL
// ═══════════════════════════════════════
export function ClientDetail({ client, onBack, onNavigate }: P) {
  const invs = useInvoices().filter(i => i.clientId === client.id);
  const offs = useOffers().filter(o => o.clientId === client.id);
  const apts = useAppointments().filter(a => a.clientId === client.id);
  const files = useCaseFiles().filter(f => f.clientId === client.id);

  const [openFile, setOpenFile] = useState<number|null>(files[0]?.id||null);
  const [showEdit, setShowEdit] = useState(false);
  const [showNewApt, setShowNewApt] = useState(false);
  const [uploadTo, setUploadTo] = useState<number|null>(null);
  const [previewDoc, setPreviewDoc] = useState<{doc:Doc;fileId:number}|null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClient = () => { deleteClient(client.id); toast.success(`"${client.name}" gelöscht`); onBack(); };
  const handleCreateCaseFile = () => {
    const id = addCaseFile({ name:`Akte ${client.name}`, clientId:client.id, category:client.type, docs:[], lastUpdate:new Date().toISOString().slice(0,10), urgent:client.status==="kritisch" });
    toast.success("Neue Akte angelegt");
    setUploadTo(id);
  };
  const handleAnalyze = (doc: Doc) => { setPendingAiDoc(doc); onNavigate("ai"); toast.success("Dokument wird analysiert…"); };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 border-none bg-transparent text-emerald-700 text-sm cursor-pointer mb-5 hover:text-emerald-900 p-0 font-medium"><ArrowLeft size={18}/>Zurück</button>

      {/* ═══ HEADER ═══ */}
      <div className="header-gradient rounded-2xl p-5 lg:p-8 mb-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl font-bold font-display flex-shrink-0">{client.name.charAt(0)}</div>
          <div className="flex-1">
            <div className="text-xl font-bold font-display">{client.name}</div>
            {client.company&&<div className="text-sm text-white/50 mt-0.5">{client.company}</div>}
            <div className="flex gap-2 mt-2 flex-wrap"><Badge status={client.status}/><TypeTag type={client.type}/><span className="text-xs text-white/40 px-2 py-0.5">{client.subtype}</span></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-medium transition-colors no-underline"><Phone size={15}/>Anrufen</a>
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-medium transition-colors no-underline"><Mail size={15}/>E-Mail</a>
            <button onClick={()=>setShowNewApt(true)} className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border-none rounded-xl cursor-pointer text-white text-xs font-medium transition-colors"><CalendarPlus size={15}/>Termin</button>
            <button onClick={()=>setShowEdit(true)} className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/30 hover:bg-amber-500/40 border-none rounded-xl cursor-pointer text-white text-xs font-medium transition-colors"><Edit size={15}/>Bearbeiten</button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact */}
            <Crd title="Kontaktdaten">{[
              {i:<Phone size={14}/>,l:"Telefon",v:client.phone,href:`tel:${client.phone}`},
              {i:<Mail size={14}/>,l:"E-Mail",v:client.email,href:`mailto:${client.email}`},
              {i:<MapPin size={14}/>,l:"Adresse",v:client.address,href:undefined}
            ].map((x,i,a)=>(
              <div key={i} className={`flex items-start gap-2.5 py-2.5 ${i<a.length-1?"border-b border-slate-100":""}`}>
                <span className="text-slate-300 mt-0.5">{x.i}</span>
                <div className="flex-1"><div className="text-[10px] text-slate-400 uppercase tracking-wider">{x.l}</div>
                  {x.href?<a href={x.href} className="text-[13px] text-emerald-700 hover:text-emerald-900 mt-0.5 no-underline hover:underline flex items-center gap-1">{x.v}<ExternalLink size={10}/></a>
                  :<div className="text-[13px] text-slate-600 mt-0.5">{x.v}</div>}
                </div>
              </div>
            ))}</Crd>
            {/* Debt or Info */}
            {client.schulden
              ? <div className={`rounded-2xl p-5 border ${client.status==="kritisch"?"bg-gradient-to-br from-red-50 to-white border-red-200":"bg-gradient-to-br from-amber-50 to-white border-amber-200"}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${client.status==="kritisch"?"text-red-600":"text-amber-600"}`}>Schuldensituation</div>
                  <div className={`text-3xl font-bold font-display ${client.status==="kritisch"?"text-red-700":"text-orange-600"}`}>{fmt(client.schulden)}</div>
                  <div className="text-xs text-slate-400 mt-1">Gesamtverbindlichkeiten</div>
                  <div className="mt-4 pt-3 border-t border-black/5 text-xs text-slate-500">Klient seit {fmtDate(client.created)}</div>
                </div>
              : <Crd title="Informationen"><div className="text-[13px] text-slate-500 leading-relaxed">{client.notes}</div><div className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-100">Klient seit {fmtDate(client.created)}</div></Crd>
            }
          </div>

          {/* Notes */}
          {client.schulden&&<EditableNotes client={client}/>}

          {/* Appointments */}
          <Crd title={`Termine (${apts.length})`} action={<button onClick={()=>setShowNewApt(true)} className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 cursor-pointer hover:bg-emerald-100 flex items-center gap-1"><Plus size={10}/>Neuer Termin</button>}>
            {apts.length>0
              ? <div className="space-y-2">{apts.map(apt=>(
                  <div key={apt.id} className="bg-slate-50/70 rounded-xl p-3 flex items-center gap-3 border border-slate-100" style={{borderLeft:`3px solid ${typeColor(apt.type)}`}}>
                    <div className="flex-1"><div className="text-[13px] font-semibold">{apt.title}</div><div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={11}/>{fmtDate(apt.date)} · {apt.time} · {apt.duration} Min · {apt.location}</div></div>
                    <Badge status={apt.priority}/>
                  </div>
                ))}</div>
              : <div className="text-center py-6 text-slate-300"><CalendarPlus size={24} className="mx-auto mb-2 text-slate-200"/><div className="text-[12px]">Noch keine Termine</div><button onClick={()=>setShowNewApt(true)} className="text-[12px] text-emerald-600 font-semibold bg-transparent border-none cursor-pointer mt-1 hover:underline">Jetzt anlegen →</button></div>
            }
          </Crd>

          {/* ═══ DOCUMENTS – Fully functional ═══ */}
          <Crd title={`Akten & Dokumente (${files.reduce((s,f)=>s+f.docs.length,0)})`} icon={<FolderArchive size={14}/>}
            action={<div className="flex gap-2">
              {files.length>0&&<button onClick={()=>setUploadTo(files[0].id)} className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 cursor-pointer hover:bg-emerald-100 flex items-center gap-1"><Upload size={10}/>Hochladen</button>}
              <button onClick={handleCreateCaseFile} className="text-[10px] text-slate-500 font-semibold bg-transparent border-none cursor-pointer hover:text-slate-700 flex items-center gap-1"><Plus size={10}/>Neue Akte</button>
            </div>}>
            {files.length>0 ? (
              <div className="space-y-3">{files.map(f=>(
                <div key={f.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={()=>setOpenFile(openFile===f.id?null:f.id)} className="flex items-center gap-2 flex-1 text-left border-none bg-transparent cursor-pointer p-0">
                      <FolderArchive size={15} className={f.urgent?"text-red-500":"text-emerald-600"}/><span className="text-[12px] font-semibold text-slate-700">{f.name}</span><span className="text-[10px] text-slate-400 ml-1">({f.docs.length})</span>
                    </button>
                    <button onClick={()=>setUploadTo(f.id)} className="text-[10px] text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 cursor-pointer hover:bg-emerald-100 flex items-center gap-1"><Upload size={10}/>Upload</button>
                  </div>
                  {openFile===f.id&&(
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 pl-6">
                      {f.docs.map(doc=>(
                        <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group text-[11px]">
                          <span className="text-lg">{docIcon(doc.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-600 truncate flex items-center gap-1">{doc.name}{doc.fileData&&<CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0"/>}</div>
                            <div className="text-slate-400 text-[10px]">{doc.size} · {fmtDate(doc.date)}</div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={()=>setPreviewDoc({doc,fileId:f.id})} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer" title="Vorschau"><Eye size={11}/></button>
                            {doc.fileData&&<button onClick={()=>downloadDocument(doc)} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer" title="Download"><Download size={11}/></button>}
                            {doc.fileData&&<button onClick={()=>handleAnalyze(doc)} className="w-6 h-6 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-500 hover:text-purple-700 cursor-pointer" title="KI-Analyse"><Sparkles size={11}/></button>}
                          </div>
                        </div>
                      ))}
                      {f.docs.length===0&&<div className="col-span-2 py-6 text-center"><FileUp size={20} className="mx-auto mb-2 text-slate-200"/><div className="text-[11px] text-slate-400">Noch keine Dokumente</div><button onClick={()=>setUploadTo(f.id)} className="text-[11px] text-emerald-600 font-semibold bg-transparent border-none cursor-pointer mt-1 hover:underline">Jetzt hochladen →</button></div>}
                    </div>
                  )}
                </div>
              ))}</div>
            ) : (
              <div className="text-center py-8"><FolderArchive size={28} className="mx-auto mb-2 text-slate-200"/><div className="text-[13px] text-slate-400">Noch keine Akten</div>
                <button onClick={handleCreateCaseFile} className="mt-2 text-[12px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-emerald-100 flex items-center gap-1.5 mx-auto"><Plus size={13}/>Erste Akte anlegen</button>
              </div>
            )}
          </Crd>
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="space-y-4">
          {invs.length>0&&<Crd title={`Rechnungen (${invs.length})`}><div className="space-y-2">{invs.map(inv=><div key={inv.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0"><div><div className="text-xs font-semibold text-slate-700">{inv.id}</div><div className="text-[10px] text-slate-400 mt-0.5">{fmtDate(inv.date)}</div></div><div className="text-right"><div className="text-sm font-bold font-display">{fmt(inv.amount)}</div><Badge status={inv.status}/></div></div>)}</div></Crd>}
          {offs.length>0&&<Crd title={`Angebote (${offs.length})`}><div className="space-y-2">{offs.map(off=><div key={off.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0"><div><div className="text-xs font-semibold text-slate-700">{off.id}</div><div className="text-[10px] text-slate-400 mt-0.5">{fmtDate(off.date)}</div></div><div className="text-right"><div className="text-sm font-bold font-display">{fmt(off.amount)}</div><Badge status={off.status}/></div></div>)}</div></Crd>}

          {/* Danger Zone */}
          <div className="rounded-2xl p-4 border border-red-200/60 bg-red-50/30">
            <div className="text-[11px] font-semibold text-red-600 mb-2 flex items-center gap-1.5"><AlertTriangle size={13}/>Gefahrenzone</div>
            {!confirmDelete
              ? <button onClick={()=>setConfirmDelete(true)} className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={13}/>Klient löschen</button>
              : <div className="space-y-2">
                  <div className="text-[11px] text-red-600">Klient und alle Daten werden unwiderruflich gelöscht.</div>
                  <div className="flex gap-2">
                    <button onClick={()=>setConfirmDelete(false)} className="flex-1 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-[12px] font-semibold cursor-pointer">Abbrechen</button>
                    <button onClick={handleDeleteClient} className="flex-1 py-2 bg-red-600 text-white border-none rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-red-700 animate-pulse">Endgültig löschen</button>
                  </div>
                </div>
            }
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <Modal open={showEdit} onClose={()=>setShowEdit(false)} title="Klient bearbeiten" wide><EditClientForm client={client} onClose={()=>setShowEdit(false)}/></Modal>
      <Modal open={showNewApt} onClose={()=>setShowNewApt(false)} title="Neuen Termin anlegen" wide><NewAppointmentForm client={client} onClose={()=>setShowNewApt(false)}/></Modal>
      <Modal open={uploadTo!==null} onClose={()=>setUploadTo(null)} title="📤 Dokumente hochladen" wide>{uploadTo!==null&&<UploadDocForm onClose={()=>setUploadTo(null)} fileId={uploadTo}/>}</Modal>
      {previewDoc&&<DocPreviewModal doc={previewDoc.doc} fileId={previewDoc.fileId} onClose={()=>setPreviewDoc(null)} onAnalyze={handleAnalyze}/>}
    </div>
  );
}

// ─── Card ───
function Crd({title,icon,action,children}:{title:string;icon?:React.ReactNode;action?:React.ReactNode;children:React.ReactNode}) {
  return <div className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/80 shadow-sm">
    <div className="flex items-center justify-between mb-3"><div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">{icon}{title}</div>{action}</div>{children}
  </div>;
}
