import { useState, useRef, useCallback } from "react";
import { Camera, Upload, FileText, Copy, Check, Trash2, Download, ChevronDown, Smartphone, ScanLine, Sparkles, Clock, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useClients } from "../useStore";

type ScanPhase = "idle" | "preview" | "scanning" | "done";

interface ScanResult {
  id: string;
  image: string;
  text: string;
  confidence: number;
  timestamp: Date;
  assignedClient: string | null;
  label: string;
}

// Load Tesseract.js from CDN
const loadTesseract = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => {
      if ((window as any).Tesseract) resolve((window as any).Tesseract);
      else reject(new Error("Tesseract nicht geladen"));
    };
    script.onerror = () => reject(new Error("CDN nicht erreichbar"));
    document.head.appendChild(script);
  });
};

// ─── Image Preprocessing for better OCR ───
function preprocessImage(src: string, options: { grayscale: boolean; contrast: number; sharpen: boolean; threshold: boolean; scale: number }): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = Math.round(img.width * options.scale);
      const h = Math.round(img.height * options.scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Draw scaled image
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // Grayscale
        if (options.grayscale) {
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          r = g = b = gray;
        }

        // Contrast enhancement
        if (options.contrast !== 1) {
          const factor = (259 * (options.contrast * 128 + 255)) / (255 * (259 - options.contrast * 128));
          r = Math.min(255, Math.max(0, Math.round(factor * (r - 128) + 128)));
          g = Math.min(255, Math.max(0, Math.round(factor * (g - 128) + 128)));
          b = Math.min(255, Math.max(0, Math.round(factor * (b - 128) + 128)));
        }

        // Adaptive threshold (binarize)
        if (options.threshold) {
          const avg = (r + g + b) / 3;
          const val = avg > 140 ? 255 : 0;
          r = g = b = val;
        }

        data[i] = r; data[i + 1] = g; data[i + 2] = b;
      }

      // Simple sharpen with unsharp mask
      if (options.sharpen && !options.threshold) {
        const copy = new Uint8ClampedArray(data);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
              const center = copy[idx + c] * 5;
              const neighbors = copy[idx - 4 + c] + copy[idx + 4 + c] + copy[((y-1)*w+x)*4 + c] + copy[((y+1)*w+x)*4 + c];
              data[idx + c] = Math.min(255, Math.max(0, center - neighbors));
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = src;
  });
}

export function ScannerView() {
  const CLIENTS = useClients();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [assignClient, setAssignClient] = useState<string | null>(null);
  const [docLabel, setDocLabel] = useState("");
  const [showAssign, setShowAssign] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preprocess, setPreprocess] = useState({ grayscale: true, contrast: 1.5, sharpen: true, threshold: false, scale: 2 });

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setPhase("preview");
      setOcrText("");
      setConfidence(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const startOCR = async () => {
    if (!imageSrc) return;
    setPhase("scanning");
    setProgress(0);
    setProgressLabel("Bild wird vorverarbeitet…");

    try {
      // Preprocess image for better OCR
      const processedSrc = await preprocessImage(imageSrc, preprocess);
      setProgress(10);
      setProgressLabel("Tesseract.js wird geladen…");

      const Tesseract = await loadTesseract();
      setProgressLabel("Texterkennung wird vorbereitet…");

      const result = await Tesseract.recognize(processedSrc, "deu+eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
            setProgressLabel("Text wird erkannt…");
          } else if (m.status === "loading language traineddata") {
            setProgress(Math.round(m.progress * 50));
            setProgressLabel("Sprachmodell wird geladen (DE+EN)…");
          } else {
            setProgressLabel(m.status || "Verarbeitung…");
          }
        },
      });

      const text = result.data.text.trim();
      const conf = Math.round(result.data.confidence);
      setOcrText(text);
      setConfidence(conf);
      setPhase("done");

      if (text.length > 0) {
        toast.success(`Fertig! ${text.split(/\s+/).length} Wörter erkannt (${conf}% Konfidenz)`);
      } else {
        toast.error("Kein Text erkannt. Versuchen Sie ein schärferes Bild.");
      }
    } catch (err) {
      console.error(err);
      toast.error("OCR-Fehler: " + (err as Error).message);
      setPhase("preview");
    }
  };

  const saveToHistory = () => {
    const entry: ScanResult = {
      id: `SCAN-${Date.now()}`,
      image: imageSrc!,
      text: ocrText,
      confidence,
      timestamp: new Date(),
      assignedClient: assignClient,
      label: docLabel || "Unbenanntes Dokument",
    };
    setHistory(prev => [entry, ...prev]);
    toast.success(`"${entry.label}" gespeichert${assignClient ? ` → ${assignClient}` : ""}`);
    reset();
  };

  const reset = () => {
    setPhase("idle");
    setImageSrc(null);
    setOcrText("");
    setConfidence(0);
    setProgress(0);
    setAssignClient(null);
    setDocLabel("");
    setShowAssign(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(ocrText).then(() => {
      setCopied(true);
      toast.success("Text in Zwischenablage kopiert");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="dark-card p-5 lg:p-7 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <ScanLine size={22} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-bold font-display text-white">Dokumenten-Scanner</div>
                  <div className="text-[11px] text-white/30">Foto aufnehmen oder Bild hochladen · Texterkennung (OCR)</div>
                </div>
              </div>
            </div>
            {history.length > 0 && (
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/8 hover:bg-white/12 border-none rounded-xl text-white text-[12px] font-semibold cursor-pointer transition-colors">
                <Clock size={14} /> {history.length} gespeichert
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ═══ LEFT: Scanner ═══ */}
        <div className="lg:col-span-7 space-y-4">
          {/* Upload Area */}
          {phase === "idle" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="ce-card p-8 lg:p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
                <ScanLine size={28} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-800 mb-2">Dokument scannen</h3>
              <p className="text-[13px] text-slate-400 mb-6 max-w-md mx-auto">
                Nehmen Sie ein Foto mit der Kamera auf oder laden Sie ein Bild hoch. Der Text wird automatisch erkannt (deutsch & englisch).
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button onClick={() => cameraRef.current?.click()}
                  className="btn-gold px-6 py-3 flex items-center justify-center gap-2 text-[13px]">
                  <Camera size={17} /> Foto aufnehmen
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="px-6 py-3 flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl border-2 border-dashed border-slate-200 text-slate-500 bg-white hover:border-amber-300 hover:text-amber-700 cursor-pointer transition-colors">
                  <Upload size={17} /> Bild hochladen
                </button>
              </div>

              <div className="text-[11px] text-slate-300">
                Unterstützte Formate: JPG, PNG, HEIC, WebP · Drag & Drop möglich
              </div>

              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>
          )}

          {/* Image Preview */}
          {(phase === "preview" || phase === "scanning" || phase === "done") && imageSrc && (
            <div className="ce-card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-amber-600" />
                  <span className="text-[13px] font-bold text-slate-700">Vorschau</span>
                </div>
                <div className="flex items-center gap-2">
                  {phase === "done" && (
                    <button onClick={() => { setPhase("idle"); cameraRef.current?.click(); }}
                      className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/40 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-amber-100 transition-colors flex items-center gap-1">
                      <Camera size={12} /> Neues Foto
                    </button>
                  )}
                  <button onClick={reset}
                    className="text-[11px] text-slate-400 font-semibold bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-1">
                    <Trash2 size={12} /> Verwerfen
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50">
                <div className="relative rounded-xl overflow-hidden border border-slate-200/60 bg-white">
                  <img src={imageSrc} alt="Scan" className="w-full h-auto max-h-[50vh] object-contain" />
                  {phase === "scanning" && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                      <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-[280px]">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                          <Sparkles size={22} className="text-amber-600" />
                        </div>
                        <div className="text-[13px] font-bold text-slate-800 mb-1">Texterkennung läuft…</div>
                        <div className="text-[11px] text-slate-400 mb-3">{progressLabel}</div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #c08b2e, #daa84e)' }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1.5 font-semibold">{progress}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {phase === "preview" && (
                <div className="p-4 border-t border-slate-100 space-y-3">
                  {/* Preprocessing Options */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">⚙️ Bildoptimierung (OCR-Qualität)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-600">
                        <input type="checkbox" checked={preprocess.grayscale} onChange={e => setPreprocess(p => ({...p, grayscale: e.target.checked}))} className="accent-amber-600 w-3.5 h-3.5" />
                        Graustufen
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-600">
                        <input type="checkbox" checked={preprocess.sharpen} onChange={e => setPreprocess(p => ({...p, sharpen: e.target.checked}))} className="accent-amber-600 w-3.5 h-3.5" />
                        Schärfen
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-600">
                        <input type="checkbox" checked={preprocess.threshold} onChange={e => setPreprocess(p => ({...p, threshold: e.target.checked}))} className="accent-amber-600 w-3.5 h-3.5" />
                        Schwarz/Weiß
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-600">
                        <input type="checkbox" checked={preprocess.scale > 1} onChange={e => setPreprocess(p => ({...p, scale: e.target.checked ? 2 : 1}))} className="accent-amber-600 w-3.5 h-3.5" />
                        Hochskalieren (2×)
                      </label>
                    </div>
                    <div className="mt-2">
                      <label className="text-[11px] text-slate-500 flex items-center gap-2">
                        Kontrast: <span className="font-semibold text-slate-700">{preprocess.contrast.toFixed(1)}×</span>
                        <input type="range" min="0.5" max="3" step="0.1" value={preprocess.contrast}
                          onChange={e => setPreprocess(p => ({...p, contrast: parseFloat(e.target.value)}))}
                          className="flex-1 h-1.5 accent-amber-600" />
                      </label>
                    </div>
                  </div>
                  <button onClick={startOCR}
                    className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 text-[14px]">
                    <Sparkles size={17} /> Text erkennen (OCR)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scan Tipps */}
          {phase === "idle" && (
            <div className="ce-card p-5">
              <h4 className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Smartphone size={15} className="text-amber-600" /> Tipps für beste Ergebnisse
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { icon: "📸", title: "Gute Beleuchtung", desc: "Gleichmäßiges Licht, keine Schatten auf dem Dokument" },
                  { icon: "📐", title: "Gerade ausrichten", desc: "Kamera parallel zum Dokument halten" },
                  { icon: "🔍", title: "Scharf stellen", desc: "Warten bis Autofokus greift, dann auslösen" },
                  { icon: "📄", title: "Kontrast", desc: "Weißes Papier auf dunklem Hintergrund" },
                ].map((tip, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px]">{tip.icon}</span>
                      <span className="text-[12px] font-bold text-slate-700">{tip.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{tip.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Results ═══ */}
        <div className="lg:col-span-5 space-y-4">
          {/* OCR Result */}
          {phase === "done" && ocrText && (
            <>
              <div className="ce-card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-amber-600" />
                    <span className="text-[13px] font-bold text-slate-700">Erkannter Text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      confidence >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/40"
                      : confidence >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200/40"
                      : "bg-red-50 text-red-700 border border-red-200/40"
                    }`}>
                      {confidence}% Konfidenz
                    </span>
                    <button onClick={copyText}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer border transition-colors bg-amber-50 text-amber-700 border-amber-200/40 hover:bg-amber-100">
                      {copied ? <><Check size={12} /> Kopiert</> : <><Copy size={12} /> Kopieren</>}
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-[400px] overflow-y-auto scrollbar-thin">
                    <pre className="text-[12px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed m-0">{ocrText}</pre>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-3">
                    <span>{ocrText.split(/\s+/).length} Wörter</span>
                    <span>{ocrText.length} Zeichen</span>
                    <span>Sprache: Deutsch + Englisch</span>
                  </div>
                </div>
              </div>

              {/* Zuordnung & Speichern */}
              <div className="ce-card p-5">
                <h4 className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <FolderPlus size={15} className="text-amber-600" /> Dokument speichern
                </h4>

                {/* Label */}
                <div className="mb-3">
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Bezeichnung</label>
                  <input
                    type="text"
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    placeholder="z.B. Mahnbescheid Sparkasse, Schreiben Inkasso…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white placeholder:text-slate-300 focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Quick Labels */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {["Mahnbescheid", "Gläubiger-Schreiben", "Vollstreckungsbescheid", "Inkasso-Brief", "Gerichtsschreiben", "Rechnung", "Lohnabrechnung", "Kontoauszug"].map(l => (
                    <button key={l} onClick={() => setDocLabel(l)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                        docLabel === l ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-100 hover:border-amber-200 hover:text-amber-600"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Client Assignment */}
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Mandant zuordnen (optional)</label>
                  <div className="relative">
                    <button onClick={() => setShowAssign(!showAssign)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-left bg-white cursor-pointer flex items-center justify-between hover:border-amber-300 transition-colors">
                      <span className={assignClient ? "text-slate-700 font-medium" : "text-slate-300"}>{assignClient || "Mandant wählen…"}</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    {showAssign && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAssign(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-[200px] overflow-y-auto scrollbar-thin">
                          <button onClick={() => { setAssignClient(null); setShowAssign(false); }}
                            className="w-full px-3.5 py-2 text-left text-[12px] text-slate-400 border-none bg-transparent cursor-pointer hover:bg-slate-50 transition-colors">
                            — Kein Mandant —
                          </button>
                          {CLIENTS.filter(c => c.status !== "abgeschlossen").map(c => (
                            <button key={c.id} onClick={() => { setAssignClient(c.name); setShowAssign(false); }}
                              className={`w-full px-3.5 py-2 text-left text-[12px] border-none bg-transparent cursor-pointer hover:bg-amber-50 transition-colors flex items-center justify-between ${assignClient === c.name ? "text-amber-700 font-semibold bg-amber-50/50" : "text-slate-700"}`}>
                              <span>{c.name}{c.company ? ` · ${c.company}` : ""}</span>
                              {c.status === "kritisch" && <span className="text-[9px] text-red-500 font-bold">KRITISCH</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Save */}
                <button onClick={saveToHistory}
                  className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-[13px]">
                  <Download size={15} /> Scan speichern
                </button>
              </div>
            </>
          )}

          {/* Empty state when no result yet */}
          {phase !== "done" && (
            <div className="ce-card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-slate-300" />
              </div>
              <div className="text-[14px] font-display font-bold text-slate-400 mb-1">Noch kein Text erkannt</div>
              <div className="text-[12px] text-slate-300">
                {phase === "idle" ? "Nehmen Sie ein Foto auf oder laden Sie ein Bild hoch" :
                 phase === "preview" ? `Klicken Sie auf \u201EText erkennen\u201C um fortzufahren` :
                 "Texterkennung läuft…"}
              </div>
            </div>
          )}

          {/* Scan History */}
          {history.length > 0 && (
            <div className="ce-card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-600" />
                  <span className="text-[13px] font-bold text-slate-700">Letzte Scans</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{history.length}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </div>
              {showHistory && (
                <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {history.map(scan => (
                    <div key={scan.id} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={scan.image} className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-slate-700 truncate">{scan.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{scan.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                            <span>{scan.confidence}%</span>
                            {scan.assignedClient && <span className="text-amber-600">→ {scan.assignedClient}</span>}
                          </div>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(scan.text); toast.success("Kopiert"); }}
                          className="text-slate-300 hover:text-amber-600 bg-transparent border-none cursor-pointer transition-colors p-1">
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
