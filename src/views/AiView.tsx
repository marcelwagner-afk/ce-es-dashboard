import { useState, useRef, useEffect, useCallback } from "react";
import { fmt, docIcon, getClient, demoTodayStr } from "../data";
import type { Document } from "../data";
import { GLAEUBIGER, FRISTEN, MANDANTEN_FORTSCHRITT } from "../creditorData";
import { Sparkles, Send, Trash2, Copy, Check, User, Lightbulb, FileText, Scale, CalendarDays, TrendingUp, AlertTriangle, Loader2, Globe, BookOpen, Gavel, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { useClients, useAppointments, useInvoices, useCaseFiles } from "../useStore";
import { getPendingAiDoc } from "../dataStore";

interface Attachment {
  doc: Document;
  fileName: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: { title: string; url: string }[];
  attachments?: Attachment[];
}

const QUICK_PROMPTS = [
  { icon: <AlertTriangle size={13} />, label: "Kritische Fälle", prompt: "Welche Klienten sind aktuell in einem kritischen Status? Gib mir eine Zusammenfassung mit den wichtigsten Handlungsempfehlungen.", cat: "intern" },
  { icon: <Scale size={13} />, label: "Schulden-Übersicht", prompt: "Erstelle mir eine Übersicht über den aktuellen Stand der Schuldenreduzierung aller Mandanten. Wie viel wurde bereits eingespart?", cat: "intern" },
  { icon: <CalendarDays size={13} />, label: "Fristen diese Woche", prompt: "Welche kritischen Fristen stehen diese Woche an? Was muss dringend erledigt werden?", cat: "intern" },
  { icon: <TrendingUp size={13} />, label: "Verhandlungserfolge", prompt: "Zeige mir die erfolgreichsten Gläubiger-Verhandlungen. Bei welchen Gläubigern konnten wir die besten Vergleiche erzielen?", cat: "intern" },
  { icon: <FileText size={13} />, label: "Offene Rechnungen", prompt: "Welche Rechnungen sind noch offen oder überfällig? Wie hoch ist der Gesamtbetrag?", cat: "intern" },
  { icon: <Lightbulb size={13} />, label: "Nächste Schritte", prompt: "Was sind die wichtigsten nächsten Schritte für alle aktiven Mandanten? Priorisiere nach Dringlichkeit.", cat: "intern" },
  { icon: <Gavel size={13} />, label: "Insolvenzrecht aktuell", prompt: "Was gibt es Neues im deutschen Insolvenzrecht? Gibt es aktuelle Gesetzesänderungen die für unsere Mandanten relevant sind?", cat: "web" },
  { icon: <Globe size={13} />, label: "Schuldnerberatung Trends", prompt: "Welche aktuellen Trends und Best Practices gibt es in der Schuldnerberatung in Deutschland?", cat: "web" },
  { icon: <BookOpen size={13} />, label: "§ 305 InsO Erklärung", prompt: "Erkläre mir den außergerichtlichen Schuldenbereinigungsplan nach § 305 InsO. Wann ist er sinnvoll und wie läuft das Verfahren ab?", cat: "allgemein" },
];

function buildSystemPrompt(CLIENTS: any[], APPOINTMENTS: any[], INVOICES: any[]): string {
  const clientSummary = CLIENTS.map(c =>
    `- ${c.name}${c.company ? ` (${c.company})` : ""}: ${c.type}, Status: ${c.status}, Schulden: ${c.schulden ? fmt(c.schulden) : "k.A."}, seit ${c.created}`
  ).join("\n");

  const creditorSummary = GLAEUBIGER.map(g => {
    const client = CLIENTS.find(c => c.id === g.clientId);
    return `- ${g.name} (${g.typ}) → ${client?.name || "?"}: Original ${fmt(g.originalBetrag)}, Aktuell ${fmt(g.aktuellerBetrag)}, Status: ${g.status.replace(/_/g, " ")}${g.vergleichsAngebot ? `, Vergleich: ${fmt(g.vergleichsAngebot)}` : ""}`;
  }).join("\n");

  const fristenSummary = FRISTEN.filter(f => !f.erledigt).map(f => {
    const client = CLIENTS.find(c => c.id === f.clientId);
    return `- ${f.datum}: ${f.beschreibung} (${client?.name || "?"})${f.kritisch ? " ⚠️ KRITISCH" : ""}`;
  }).join("\n");

  const fortschritt = MANDANTEN_FORTSCHRITT.map(m => {
    const client = CLIENTS.find(c => c.id === m.clientId);
    return `- ${client?.name || "?"}: Start ${fmt(m.schuldenStart)} → Aktuell ${fmt(m.schuldenAktuell)} (${m.phase.replace(/_/g, " ")}), Gläubiger: ${m.glaeubigerGesamt}, davon erledigt: ${m.glaeubigerErledigt}`;
  }).join("\n");

  const invoiceSummary = INVOICES.map(i => {
    const client = CLIENTS.find(c => c.id === i.clientId);
    return `- ${i.id}: ${client?.name || "?"}, ${fmt(i.amount)}, Status: ${i.status}, Fällig: ${i.due}`;
  }).join("\n");

  const today = APPOINTMENTS.filter(a => a.date === demoTodayStr()).map(a => {
    const client = CLIENTS.find(c => c.id === a.clientId);
    return `- ${a.time} Uhr: ${a.title} (${client?.name || "?"}, ${a.location})`;
  }).join("\n");

  return `Du bist der KI-Assistent von Ce-eS Management Consultant, einer Schuldnerberatungsfirma in Heilbronn.

Du bist ein vielseitiger Assistent, der bei ALLEM helfen kann:

1. **Mandantendaten**: Du hast Zugriff auf die aktuellen Klienten-, Gläubiger- und Finanzdaten (siehe unten).
2. **Allgemeines Wissen**: Du kannst Fragen zu Recht, Insolvenzrecht, Schuldnerberatung, Betriebswirtschaft und allen anderen Themen beantworten.
3. **Web-Suche**: Du kannst im Internet nach aktuellen Informationen suchen.
4. **Dokumentenanalyse**: Wenn der Nutzer ein Dokument (PDF, Bild, etc.) anhängt, analysiere es gründlich. Du kannst Verträge prüfen, Rechnungen auslesen, Schriftstücke zusammenfassen, und Dokumente mit den Mandantendaten abgleichen.

Wenn ein Dokument angehängt ist:
- Fasse den Inhalt zusammen
- Identifiziere relevante Informationen (Beträge, Fristen, Namen, Aktenzeichen)
- Vergleiche mit bestehenden Mandantendaten wenn möglich
- Gib konkrete Handlungsempfehlungen

Antworte immer auf Deutsch, professionell aber freundlich. Formatiere Geldbeträge mit € und Tausendertrennzeichen.

═══ KLIENTEN (${CLIENTS.length}) ═══
${clientSummary}

═══ GLÄUBIGER (${GLAEUBIGER.length}) ═══
${creditorSummary}

═══ OFFENE FRISTEN ═══
${fristenSummary}

═══ MANDANTEN-FORTSCHRITT ═══
${fortschritt}

═══ RECHNUNGEN ═══
${invoiceSummary}

═══ HEUTIGE TERMINE (5. Feb 2025) ═══
${today || "Keine Termine heute"}`;
}

// Build multimodal content array for API
function buildMessageContent(text: string, attachments: Attachment[]): any {
  if (attachments.length === 0) return text;

  const content: any[] = [];
  for (const att of attachments) {
    if (!att.doc.fileData || !att.doc.mimeType) continue;
    const mime = att.doc.mimeType;

    if (mime === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: att.doc.fileData },
      });
    } else if (mime.startsWith("image/")) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: mime, data: att.doc.fileData },
      });
    } else if (mime === "text/plain" || mime === "text/csv") {
      try {
        const decoded = atob(att.doc.fileData);
        content.push({ type: "text", text: `[Dateiinhalt von "${att.fileName}"]\n\n${decoded}` });
      } catch {
        content.push({ type: "text", text: `[Datei: ${att.fileName} – konnte nicht gelesen werden]` });
      }
    } else {
      // For docx/xlsx etc – send as document (Claude can try to parse)
      content.push({
        type: "document",
        source: { type: "base64", media_type: mime, data: att.doc.fileData },
      });
    }
  }
  content.push({ type: "text", text: text || "Bitte analysiere dieses Dokument. Fasse den Inhalt zusammen und identifiziere die wichtigsten Informationen." });
  return content;
}

function extractSources(data: any): { title: string; url: string }[] {
  const sources: { title: string; url: string }[] = [];
  if (!data?.content) return sources;
  for (const block of data.content) {
    if (block.type === "web_search_tool_result" && block.content) {
      for (const result of block.content) {
        if (result.type === "web_search_result" && result.title && result.url) {
          if (!sources.some(s => s.url === result.url)) {
            sources.push({ title: result.title, url: result.url });
          }
        }
      }
    }
  }
  return sources;
}

// ─── Document Picker ───
function DocumentPicker({ onSelect, onClose }: { onSelect: (doc: Document) => void; onClose: () => void }) {
  const caseFiles = useCaseFiles();
  const [q, setQ] = useState("");
  const allDocs = caseFiles.flatMap(f => f.docs.filter(d => d.fileData).map(d => ({ ...d, _caseName: f.name, _clientId: f.clientId })));
  const filtered = q ? allDocs.filter(d => d.name.toLowerCase().includes(q.toLowerCase()) || d._caseName.toLowerCase().includes(q.toLowerCase())) : allDocs;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[70vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2"><Paperclip size={15} /> Dokument anhängen</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center border-none cursor-pointer text-slate-400 hover:bg-slate-200"><X size={14} /></button>
        </div>
        <div className="px-4 py-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Dokument suchen…" className="w-full py-2 px-3 border border-slate-200 rounded-lg text-[12px] bg-white placeholder:text-slate-300 focus:border-purple-300 focus:ring-1 focus:ring-purple-100" autoFocus />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-slate-400">
              {allDocs.length === 0 ? "Keine Dokumente mit Datei vorhanden. Laden Sie zuerst Dateien in den Akten hoch." : "Keine Dokumente gefunden."}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(doc => {
                const cl = getClient(doc._clientId);
                return (
                  <button key={doc.id} onClick={() => { onSelect(doc); onClose(); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-transparent border border-transparent hover:bg-purple-50 hover:border-purple-100 cursor-pointer transition-all text-left">
                    <span className="text-lg flex-shrink-0">{docIcon(doc.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-slate-700 truncate">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">{doc._caseName} · {cl?.name || "?"} · {doc.size}</div>
                    </div>
                    <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-semibold uppercase flex-shrink-0">{doc.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AiView() {
  const CLIENTS = useClients();
  const APPOINTMENTS = useAppointments();
  const INVOICES = useInvoices();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("KI denkt nach…");
  const [copied, setCopied] = useState<string | null>(null);
  const [promptFilter, setPromptFilter] = useState<string>("alle");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingHandled = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Check for pending document from FilesView
  useEffect(() => {
    if (pendingHandled.current) return;
    const pending = getPendingAiDoc();
    if (pending && pending.fileData) {
      pendingHandled.current = true;
      const att: Attachment = { doc: pending, fileName: pending.name };
      setAttachments([att]);
      // Auto-send analysis request
      setTimeout(() => {
        sendMessageWithAttachments(
          `Bitte analysiere das Dokument "${pending.name}" und fasse den Inhalt zusammen. Identifiziere relevante Informationen wie Beträge, Fristen, Namen und Aktenzeichen. Vergleiche wenn möglich mit den Mandantendaten.`,
          [att]
        );
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const addAttachment = (doc: Document) => {
    if (attachments.some(a => a.doc.id === doc.id)) { toast("Dokument bereits angehängt"); return; }
    if (attachments.length >= 3) { toast.error("Maximal 3 Dokumente gleichzeitig"); return; }
    setAttachments(prev => [...prev, { doc, fileName: doc.name }]);
    toast.success(`"${doc.name}" angehängt`);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.doc.id !== id));
  };

  const sendMessageWithAttachments = async (text: string, atts: Attachment[]) => {
    if ((!text.trim() && atts.length === 0) || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`, role: "user",
      content: text.trim() || "Bitte analysiere dieses Dokument.",
      timestamp: new Date(),
      attachments: atts.length > 0 ? [...atts] : undefined,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachments([]);
    setLoading(true);
    setLoadingLabel(atts.length > 0 ? "Analysiert Dokument…" : "KI denkt nach…");
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      // Build API messages – only include attachments for the CURRENT message
      const apiMessages = newMessages.map((m, idx) => {
        const isLast = idx === newMessages.length - 1;
        const msgAtts = isLast ? atts : (m.attachments || []);
        return {
          role: m.role,
          content: msgAtts.length > 0 ? buildMessageContent(m.content, msgAtts) : m.content,
        };
      });

      const isArtifact = window.location.hostname.includes("claude") || window.location.hostname.includes("anthropic") || document.referrer.includes("claude");
      const endpoint = isArtifact ? "https://api.anthropic.com/v1/messages" : "/api/chat";

      const needsSearch = /aktuell|neu|2024|2025|gesetz|urteil|änderung|trend|news|suche|finde|recherchier|internet|web|was gibt es|BGH|InsO|§/i.test(text);
      if (needsSearch) setLoadingLabel("Sucht im Web…");

      const requestBody: any = {
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: buildSystemPrompt(CLIENTS, APPOINTMENTS, INVOICES),
        messages: apiMessages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`API Fehler ${response.status}${errText ? ": " + errText.slice(0, 200) : ""}`);
      }

      const data = await response.json();
      const assistantText = data.content
        ?.filter((item: any) => item.type === "text")
        .map((item: any) => item.text)
        .filter(Boolean)
        .join("\n") || "Keine Antwort erhalten.";

      const sources = extractSources(data);

      const assistantMsg: Message = {
        id: `a-${Date.now()}`, role: "assistant",
        content: assistantText, timestamp: new Date(),
        sources: sources.length > 0 ? sources.slice(0, 5) : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      let errorText = err.message || "Unbekannter Fehler";
      if (errorText.includes("401")) errorText = "API-Key ungültig. Bitte prüfen Sie die .env Datei.";
      else if (errorText.includes("429")) errorText = "Zu viele Anfragen. Bitte warten Sie kurz.";
      else if (errorText.includes("413") || errorText.includes("too large")) errorText = "Dokument zu groß für die API. Versuchen Sie ein kleineres Dokument.";
      else if (errorText.includes("Failed to fetch") || errorText.includes("NetworkError")) errorText = "Keine Verbindung zum Server. Läuft der Server (node server.js)?";

      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: "assistant",
        content: `⚠️ ${errorText}`, timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (text: string) => sendMessageWithAttachments(text, attachments);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };
  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  const clearChat = () => {
    setMessages([]); setAttachments([]);
    toast.success("Chat gelöscht");
  };

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-amber-700 px-1 py-0.5 rounded text-[11px]">$1</code>');
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-purple-600 hover:text-purple-800 underline underline-offset-2">$1</a>');
      if (line.startsWith("# ")) return <h3 key={i} className="text-[14px] font-bold text-slate-800 mt-3 mb-1">{line.slice(2)}</h3>;
      if (line.startsWith("## ")) return <h4 key={i} className="text-[13px] font-bold text-slate-700 mt-2 mb-1">{line.slice(3)}</h4>;
      if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} className="flex gap-2 ml-1"><span className="text-amber-500 mt-0.5">•</span><span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} /></div>;
      if (line.match(/^\d+\.\s/)) return <div key={i} className="flex gap-2 ml-1"><span className="text-amber-600 font-bold text-[11px] mt-0.5 min-w-[16px]">{line.match(/^\d+/)![0]}.</span><span dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, "") }} /></div>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="m-0" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  const filteredPrompts = promptFilter === "alle" ? QUICK_PROMPTS : QUICK_PROMPTS.filter(p => p.cat === promptFilter);

  return (
    <div className="flex flex-col h-[calc(100dvh-56px-60px)] lg:h-[calc(100dvh-56px)]">
      {/* Header */}
      <div className="dark-card rounded-none lg:rounded-none p-4 lg:px-8 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-amber-500/10 border border-purple-400/15 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-300" />
            </div>
            <div>
              <div className="text-[15px] font-bold font-display text-white flex items-center gap-2">
                Ce-eS KI-Assistent
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/15 tracking-wider flex items-center gap-1">
                  <Globe size={8} /> WEB + DATEN + DOKUMENTE
                </span>
              </div>
              <div className="text-[11px] text-white/30">Mandantendaten · Web-Suche · Dokumentenanalyse</div>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/12 border-none rounded-xl text-white/50 hover:text-white/80 text-[11px] font-semibold cursor-pointer transition-colors">
              <Trash2 size={13} /> Neuer Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <div className="p-4 lg:p-8 max-w-3xl mx-auto">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-amber-50 border border-purple-200/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-purple-500" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-800 mb-1">Wie kann ich helfen?</h3>
              <p className="text-[13px] text-slate-400 max-w-lg mx-auto">
                Mandantendaten abfragen, im Web recherchieren oder Dokumente analysieren – hängen Sie eine Datei an oder stellen Sie eine Frage.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 mb-3 justify-center flex-wrap">
              {[
                { id: "alle", label: "Alle" },
                { id: "intern", label: "📊 Mandanten" },
                { id: "web", label: "🌐 Web" },
                { id: "allgemein", label: "📚 Allgemein" },
              ].map(f => (
                <button key={f.id} onClick={() => setPromptFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg border-none text-[11px] font-semibold cursor-pointer transition-all ${
                    promptFilter === f.id ? "bg-purple-100 text-purple-700" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredPrompts.map((qp, i) => (
                <button key={i} onClick={() => sendMessage(qp.prompt)}
                  className="ce-card p-3.5 text-left cursor-pointer hover:shadow-md hover:border-purple-200/40 transition-all group border-transparent">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      qp.cat === "web" ? "bg-blue-50 group-hover:bg-blue-100 text-blue-500"
                      : qp.cat === "allgemein" ? "bg-amber-50 group-hover:bg-amber-100 text-amber-600"
                      : "bg-purple-50 group-hover:bg-purple-100 text-purple-500"
                    }`}>
                      {qp.icon}
                    </div>
                    <span className="text-[12px] font-bold text-slate-700">{qp.label}</span>
                    {qp.cat === "web" && <Globe size={10} className="text-blue-400 ml-auto" />}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{qp.prompt}</div>
                </button>
              ))}

              {/* Document Analysis Card */}
              <button onClick={() => setShowDocPicker(true)}
                className="ce-card p-3.5 text-left cursor-pointer hover:shadow-md hover:border-purple-200/40 transition-all group border-dashed border-purple-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center text-purple-500 transition-colors">
                    <Paperclip size={13} />
                  </div>
                  <span className="text-[12px] font-bold text-purple-700">Dokument analysieren</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">PDF, Word oder Excel aus den Akten anhängen und von der KI auswerten lassen.</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4 pb-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-slate-100 text-slate-500" : "bg-gradient-to-br from-purple-100 to-amber-50 text-purple-600"
                }`}>
                  {msg.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
                </div>

                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}>
                  {/* Attachment chips */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={`flex gap-1.5 mb-1.5 flex-wrap ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.attachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100/80 border border-purple-200/60 text-[10px] font-semibold text-purple-700">
                          <span>{docIcon(att.doc.type)}</span> {att.fileName}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={`inline-block text-left rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-tr-md"
                      : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-md"
                  }`}>
                    <div className={`text-[13px] leading-relaxed ${msg.role === "user" ? "text-white/90" : "text-slate-700"}`}>
                      {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                    </div>
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded-xl p-2.5">
                      <div className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1"><Globe size={9} /> Quellen</div>
                      <div className="space-y-1">
                        {msg.sources.map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                            className="block text-[11px] text-blue-600 hover:text-blue-800 truncate no-underline hover:underline">
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                    <span className="text-[10px] text-slate-300">{msg.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                    {msg.role === "assistant" && (
                      <button onClick={() => copyMessage(msg.id, msg.content)}
                        className="text-slate-300 hover:text-slate-500 bg-transparent border-none cursor-pointer p-0.5 transition-colors">
                        {copied === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-purple-600" />
                </div>
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-purple-500 animate-spin" />
                    <span className="text-[12px] text-slate-400">{loadingLabel}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attachment Bar */}
      {attachments.length > 0 && (
        <div className="flex-shrink-0 bg-purple-50/80 border-t border-purple-100 px-3 lg:px-6 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-purple-500 font-semibold uppercase tracking-wider">Angehängt:</span>
            {attachments.map(att => (
              <span key={att.doc.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-[11px] font-medium text-purple-700">
                <span>{docIcon(att.doc.type)}</span>
                <span className="max-w-[150px] truncate">{att.fileName}</span>
                <button onClick={() => removeAttachment(att.doc.id)} className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center border-none cursor-pointer text-purple-500 hover:bg-purple-200 hover:text-purple-700 transition-colors ml-0.5"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white/80 backdrop-blur-lg p-3 lg:px-6 pb-[max(12px,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            {/* Attach Button */}
            <button type="button" onClick={() => setShowDocPicker(true)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border cursor-pointer transition-all flex-shrink-0 ${
                attachments.length > 0
                  ? "bg-purple-100 border-purple-300 text-purple-600"
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-purple-50 hover:text-purple-500 hover:border-purple-200"
              }`}
              title="Dokument aus Akten anhängen"
            >
              <Paperclip size={17} />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={attachments.length > 0 ? "Frage zum Dokument stellen… (oder Enter für automatische Analyse)" : "Frage stellen – Mandantendaten, Recht, Web-Suche, Dokumente…"}
                rows={1}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-[13px] bg-white resize-none placeholder:text-slate-300 focus:border-purple-300 focus:ring-1 focus:ring-purple-100 transition-all disabled:opacity-50"
                style={{ maxHeight: "150px" }}
              />
            </div>
            <button type="submit" disabled={(!input.trim() && attachments.length === 0) || loading}
              className="w-11 h-11 rounded-2xl flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              style={{
                background: (input.trim() || attachments.length > 0) ? 'linear-gradient(135deg, #8b5cf6, #c08b2e)' : '#e2e8f0',
                color: (input.trim() || attachments.length > 0) ? 'white' : '#94a3b8',
              }}>
              <Send size={17} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <div className="text-[10px] text-slate-300 flex items-center gap-2">
              <span>📊 {CLIENTS.length} Klienten</span>
              <span>·</span>
              <span className="text-blue-400 flex items-center gap-0.5"><Globe size={8} /> Web</span>
              <span>·</span>
              <span className="text-purple-400 flex items-center gap-0.5"><Paperclip size={8} /> Dokumente</span>
            </div>
            <div className="text-[10px] text-slate-300">⏎ Senden · ⇧⏎ Neue Zeile</div>
          </div>
        </form>
      </div>

      {/* Document Picker Modal */}
      {showDocPicker && <DocumentPicker onSelect={addAttachment} onClose={() => setShowDocPicker(false)} />}
    </div>
  );
}
