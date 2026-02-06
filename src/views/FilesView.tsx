import { useState, useRef, useCallback } from "react";
import { getClient, fmtDate, typeColor, docIcon } from "../data";
import type { Client, Document, DocType, BeratungsTyp } from "../data";
import { FolderArchive, Search, ChevronDown, ChevronRight, Eye, Download, X, Plus, Upload, Trash2, FileUp, File, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCaseFiles, useClients, Modal, Field, Input, Select, Textarea, SubmitRow } from "../useStore";
import { addDocumentToFile, addCaseFile, deleteDocument, setPendingAiDoc } from "../dataStore";

interface P { onSelectClient:(c:Client)=>void; onNavigate?:(tab:string)=>void; }

// ─── Helpers ───
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function detectDocType(filename: string): DocType {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, DocType> = {
    pdf: "pdf", docx: "docx", doc: "docx", xlsx: "xlsx", xls: "xlsx",
    csv: "xlsx", txt: "note", msg: "email", eml: "email",
    jpg: "scan", jpeg: "scan", png: "scan", gif: "scan", webp: "scan", tiff: "scan", bmp: "scan",
  };
  return map[ext] || "pdf";
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    txt: "text/plain",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
    msg: "application/vnd.ms-outlook", eml: "message/rfc822",
  };
  return map[ext] || "application/octet-stream";
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:...;base64, prefix
    };
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

function downloadDocument(doc: Document) {
  if (!doc.fileData) {
    toast.error("Keine Datei hinterlegt (nur Metadaten)");
    return;
  }
  try {
    const byteChars = atob(doc.fileData);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: doc.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`"${doc.name}" heruntergeladen`);
  } catch {
    toast.error("Download fehlgeschlagen");
  }
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.eml,.msg";

// ─── Upload Document Form ───
function UploadDocumentForm({ onClose, fileId }: { onClose: () => void; fileId: number }) {
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.size <= 25 * 1024 * 1024); // 25MB limit
    if (arr.length < Array.from(newFiles).length) toast.error("Dateien über 25 MB werden übersprungen");
    setFiles(prev => [...prev, ...arr.map(f => ({ file: f, preview: "" }))]);
  }, []);

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { toast.error("Bitte mindestens eine Datei auswählen"); return; }
    setUploading(true);
    try {
      for (const { file } of files) {
        const fileData = await readFileAsBase64(file);
        const doc: Document = {
          id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: detectDocType(file.name),
          size: formatFileSize(file.size),
          date: new Date().toISOString().slice(0, 10),
          preview: description || file.name,
          fileData,
          mimeType: getMimeType(file.name),
        };
        addDocumentToFile(fileId, doc);
      }
      toast.success(`${files.length} Dokument${files.length > 1 ? "e" : ""} hochgeladen`);
      onClose();
    } catch (err) {
      toast.error("Fehler beim Hochladen: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
          dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
        }`}
      >
        <input ref={inputRef} type="file" multiple accept={ACCEPTED_TYPES} onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} className="hidden" />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${dragOver ? "bg-emerald-100" : "bg-slate-100"}`}>
          <FileUp size={22} className={dragOver ? "text-emerald-600" : "text-slate-400"} />
        </div>
        <div className="text-[13px] font-semibold text-slate-700">
          {dragOver ? "Dateien hier ablegen" : "Dateien hierher ziehen oder klicken"}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          PDF, Word, Excel, Bilder, CSV, TXT · Max. 25 MB pro Datei
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {files.length} Datei{files.length > 1 ? "en" : ""} ausgewählt
          </div>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-lg flex-shrink-0">{docIcon(detectDocType(f.file.name))}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-slate-700 truncate">{f.file.name}</div>
                <div className="text-[10px] text-slate-400">{formatFileSize(f.file.size)}</div>
              </div>
              <button type="button" onClick={() => removeFile(i)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 cursor-pointer transition-colors">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Optional Description */}
      <Field label="Beschreibung (optional)">
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Kurzbeschreibung des Dokuments…" />
      </Field>

      <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500 bg-white cursor-pointer hover:bg-slate-50 transition-colors">Abbrechen</button>
        <button type="submit" disabled={files.length === 0 || uploading}
          className="px-5 py-2 rounded-xl border-none text-[12px] font-semibold text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: files.length > 0 ? "linear-gradient(135deg,#16794a,#1a6b42)" : "#94a3b8" }}
        >
          {uploading ? "Wird hochgeladen…" : `${files.length > 0 ? files.length + " " : ""}Dokument${files.length !== 1 ? "e" : ""} hochladen`}
        </button>
      </div>
    </form>
  );
}

// ─── Manual Document Form (without file) ───
function NewDocumentForm({ onClose, fileId }: { onClose: () => void; fileId: number }) {
  const [d, setD] = useState({ name: "", type: "pdf" as DocType, size: "0 KB", preview: "" });
  const set = (k: string, v: string) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Dokumentname ist erforderlich"); return; }
    const id = `d-${Date.now()}`;
    addDocumentToFile(fileId, { ...d, id, date: new Date().toISOString().slice(0, 10) });
    toast.success(`"${d.name}" hinzugefügt`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <Field label="Dokumentname *"><Input value={d.name} onChange={e => set("name", e.target.value)} placeholder="z.B. Vergleichsangebot_Sparkasse.pdf" required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dateityp">
          <Select value={d.type} onChange={e => set("type", e.target.value)}>
            <option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="email">E-Mail</option><option value="scan">Scan</option><option value="note">Notiz</option>
          </Select>
        </Field>
        <Field label="Dateigröße"><Input value={d.size} onChange={e => set("size", e.target.value)} placeholder="z.B. 250 KB" /></Field>
      </div>
      <Field label="Beschreibung / Vorschau"><Textarea value={d.preview} onChange={e => set("preview", e.target.value)} rows={3} placeholder="Kurzbeschreibung des Dokuments..." /></Field>
      <SubmitRow onCancel={onClose} label="Eintrag hinzufügen" />
    </form>
  );
}

function NewCaseFileForm({ onClose }: { onClose: () => void }) {
  const clients = useClients();
  const [d, setD] = useState({ clientId: clients[0]?.id || 1, name: "", category: "Schuldnerberatung" as BeratungsTyp, urgent: false });
  const set = (k: string, v: any) => setD(prev => ({ ...prev, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Aktenname ist erforderlich"); return; }
    addCaseFile({ ...d, clientId: Number(d.clientId), docs: [], lastUpdate: new Date().toISOString().slice(0, 10) });
    toast.success(`Akte "${d.name}" angelegt`);
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <Field label="Aktenname *"><Input value={d.name} onChange={e => set("name", e.target.value)} placeholder="z.B. Schuldenabbau Müller" required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Klient">
          <Select value={d.clientId} onChange={e => set("clientId", e.target.value)}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Kategorie">
          <Select value={d.category} onChange={e => set("category", e.target.value)}>
            <option>Schuldnerberatung</option><option>Managementberatung</option><option>Insolvenzberatung</option><option>Coaching</option>
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 mt-2 cursor-pointer">
        <input type="checkbox" checked={d.urgent} onChange={e => set("urgent", e.target.checked)} className="accent-red-500" />
        <span className="text-[12px] text-slate-600">Dringend / Eilakte</span>
      </label>
      <SubmitRow onCancel={onClose} label="Akte anlegen" />
    </form>
  );
}

// ─── Document Preview Modal ───
function DocumentPreviewModal({ doc, onClose, fileId, onAnalyze }: { doc: Document; onClose: () => void; fileId: number; onAnalyze?: (doc: Document) => void }) {
  const hasFile = !!doc.fileData;
  const isImage = doc.mimeType?.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";
  const isText = doc.mimeType === "text/plain" || doc.mimeType === "text/csv";
  const [confirmDelete, setConfirmDelete] = useState(false);

  let blobUrl = "";
  if (hasFile) {
    try {
      const byteChars = atob(doc.fileData!);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      blobUrl = URL.createObjectURL(new Blob([byteArray], { type: doc.mimeType }));
    } catch { /* ignore */ }
  }

  const handleDelete = () => {
    deleteDocument(fileId, doc.id);
    toast.success(`"${doc.name}" gelöscht`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl flex-shrink-0">{docIcon(doc.type)}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{doc.name}</div>
              <div className="text-[10px] text-slate-400">{doc.size} · {fmtDate(doc.date)} {hasFile && <span className="text-emerald-500">· Datei vorhanden</span>}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border-none cursor-pointer text-slate-500 hover:bg-slate-200 flex-shrink-0"><X size={16} /></button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-auto flex-1">
          {/* File Preview */}
          {hasFile && isImage && blobUrl && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 mb-4 flex items-center justify-center">
              <img src={blobUrl} alt={doc.name} className="max-h-80 rounded-lg object-contain" />
            </div>
          )}
          {hasFile && isPdf && blobUrl && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 mb-4 overflow-hidden" style={{ height: 400 }}>
              <iframe src={blobUrl} className="w-full h-full border-none" title={doc.name} />
            </div>
          )}
          {hasFile && isText && blobUrl && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-4 max-h-60 overflow-auto">
              <pre className="text-[12px] text-slate-600 whitespace-pre-wrap font-mono m-0">
                {(() => { try { return atob(doc.fileData!); } catch { return ""; } })()}
              </pre>
            </div>
          )}
          {!hasFile && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Beschreibung</div>
              <div className="text-[13px] text-slate-600 leading-relaxed">{doc.preview || "Keine Beschreibung"}</div>
            </div>
          )}
          {hasFile && !isImage && !isPdf && !isText && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4 flex items-center gap-3">
              <File size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <div className="text-[13px] font-semibold text-slate-700">Vorschau nicht verfügbar</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Laden Sie die Datei herunter, um sie zu öffnen.</div>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { l: "Dateityp", v: doc.type.toUpperCase() },
              { l: "Größe", v: doc.size },
              { l: "Hochgeladen", v: fmtDate(doc.date) },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">{item.l}</div>
                <div className="text-[13px] font-semibold text-slate-700 mt-0.5">{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5 flex-shrink-0">
          {hasFile && (
            <button onClick={() => downloadDocument(doc)}
              className="flex-1 py-2.5 bg-emerald-700 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors">
              <Download size={15} />Herunterladen
            </button>
          )}
          {hasFile && onAnalyze && (
            <button onClick={() => { onAnalyze(doc); onClose(); }}
              className="flex-1 py-2.5 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #c08b2e)" }}>
              <Sparkles size={15} />KI Analyse
            </button>
          )}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="px-4 py-2.5 bg-slate-100 text-slate-500 border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1.5">
              <Trash2 size={14} />Löschen
            </button>
          ) : (
            <button onClick={handleDelete}
              className="px-4 py-2.5 bg-red-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-red-700 transition-colors flex items-center gap-1.5 animate-pulse">
              <Trash2 size={14} />Wirklich löschen?
            </button>
          )}
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-600 border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-slate-200 transition-colors">Schließen</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ───
export function FilesView({onSelectClient, onNavigate}:P) {
  const caseFiles = useCaseFiles();
  const [q,setQ]=useState("");
  const [open,setOpen]=useState<number|null>(null);
  const [previewDoc,setPreviewDoc]=useState<{doc:Document;fileId:number}|null>(null);
  const [showNewFile, setShowNewFile] = useState(false);
  const [uploadTo, setUploadTo] = useState<number|null>(null);
  const [manualDocTo, setManualDocTo] = useState<number|null>(null);

  const sorted=[...caseFiles].sort((a,b)=>(b.urgent?1:0)-(a.urgent?1:0)||+new Date(b.lastUpdate)-+new Date(a.lastUpdate))
    .filter(f=>{if(!q) return true; const s=q.toLowerCase(); const cl=getClient(f.clientId); return f.name.toLowerCase().includes(s)||(cl?.name||"").toLowerCase().includes(s);});

  // Count files with actual data
  const totalDocs = sorted.reduce((s, f) => s + f.docs.length, 0);
  const totalWithFiles = sorted.reduce((s, f) => s + f.docs.filter(d => d.fileData).length, 0);

  return(
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Akte oder Klient suchen…" className="w-full py-2.5 pl-10 pr-4 border border-slate-200 rounded-xl text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300"/>
        </div>
        <button onClick={() => setShowNewFile(true)} className="bg-emerald-700 text-white border-none rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-emerald-800 transition-colors shadow-lg shadow-black/10 whitespace-nowrap"><Plus size={16}/>Neue Akte</button>
        <div className="text-[11px] text-slate-400 self-center">
          {sorted.length} Akten · {totalDocs} Dokumente
          {totalWithFiles > 0 && <span className="text-emerald-500"> · {totalWithFiles} mit Datei</span>}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map(file=>{
          const cl=getClient(file.clientId);
          const isOpen=open===file.id;
          const filesWithData = file.docs.filter(d => d.fileData).length;
          return(
            <div key={file.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${file.urgent?"border-red-200":"border-slate-200/80"} ${isOpen?"shadow-lg":""}`}>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-2xl" onClick={()=>setOpen(isOpen?null:file.id)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${file.urgent?"bg-red-50 text-red-500":"bg-emerald-50 text-emerald-700"}`}><FolderArchive size={18}/></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                    {file.name} {file.urgent&&<span className="w-2 h-2 rounded-full bg-red-500"/>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {cl?.name} · {file.docs.length} Dokumente
                    {filesWithData > 0 && <span className="text-emerald-500"> ({filesWithData} Dateien)</span>}
                    {" · "}{fmtDate(file.lastUpdate)}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{color:typeColor(file.category),backgroundColor:typeColor(file.category)+"14"}}>{file.category.replace("beratung",".")}</span>
                {isOpen?<ChevronDown size={16} className="text-slate-400"/>:<ChevronRight size={16} className="text-slate-300"/>}
              </div>
              {isOpen&&(
                <div className="border-t border-slate-100 px-4 pb-4">
                  <div className="flex justify-between items-center pt-3 mb-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Dokumente</span>
                    <div className="flex gap-2">
                      <button onClick={() => setManualDocTo(file.id)} className="text-[11px] text-slate-500 font-semibold bg-transparent border-none cursor-pointer hover:text-slate-700 transition-colors flex items-center gap-1"><Plus size={12}/>Manuell</button>
                      <button onClick={() => setUploadTo(file.id)} className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-emerald-100 transition-colors flex items-center gap-1"><Upload size={12}/>Datei hochladen</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {file.docs.map(doc=>(
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                        <span className="text-lg flex-shrink-0">{docIcon(doc.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-slate-700 truncate flex items-center gap-1.5">
                            {doc.name}
                            {doc.fileData && <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{doc.size} · {fmtDate(doc.date)}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={(e)=>{e.stopPropagation();setPreviewDoc({doc,fileId:file.id});}} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer transition-colors" title="Vorschau"><Eye size={13}/></button>
                          {doc.fileData && (
                            <button onClick={(e)=>{e.stopPropagation();downloadDocument(doc);}} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer transition-colors" title="Download"><Download size={13}/></button>
                          )}
                          {doc.fileData && onNavigate && (
                            <button onClick={(e)=>{e.stopPropagation();setPendingAiDoc(doc);onNavigate("ai");toast.success("Dokument wird analysiert…");}} className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-500 hover:text-purple-700 hover:border-purple-400 cursor-pointer transition-colors" title="Mit KI analysieren"><Sparkles size={13}/></button>
                          )}
                        </div>
                      </div>
                    ))}
                    {file.docs.length === 0 && (
                      <div className="col-span-2 py-8 text-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><FileUp size={20} className="text-slate-300" /></div>
                        <div className="text-[12px] text-slate-400">Noch keine Dokumente.</div>
                        <button onClick={() => setUploadTo(file.id)} className="text-[12px] text-emerald-600 font-semibold bg-transparent border-none cursor-pointer mt-1 hover:underline">Jetzt hochladen →</button>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>cl&&onSelectClient(cl)} className="mt-3 text-[11px] text-emerald-600 font-semibold bg-transparent border-none cursor-pointer hover:text-emerald-800 transition-colors">Klient öffnen →</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewDoc && <DocumentPreviewModal doc={previewDoc.doc} fileId={previewDoc.fileId} onClose={() => setPreviewDoc(null)} onAnalyze={onNavigate ? (doc) => { setPendingAiDoc(doc); onNavigate("ai"); toast.success("Dokument wird analysiert…"); } : undefined} />}

      {/* New Case File Modal */}
      <Modal open={showNewFile} onClose={() => setShowNewFile(false)} title="Neue Akte anlegen" wide>
        <NewCaseFileForm onClose={() => setShowNewFile(false)} />
      </Modal>

      {/* Upload Document Modal */}
      <Modal open={uploadTo !== null} onClose={() => setUploadTo(null)} title="📤 Dokumente hochladen" wide>
        {uploadTo !== null && <UploadDocumentForm onClose={() => setUploadTo(null)} fileId={uploadTo} />}
      </Modal>

      {/* Manual Document Modal */}
      <Modal open={manualDocTo !== null} onClose={() => setManualDocTo(null)} title="Eintrag manuell hinzufügen">
        {manualDocTo !== null && <NewDocumentForm onClose={() => setManualDocTo(null)} fileId={manualDocTo} />}
      </Modal>
    </div>
  );
}
