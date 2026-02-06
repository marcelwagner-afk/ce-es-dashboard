import type { Client } from "../data";
import { fmt, typeColor } from "../data";
import { ChevronRight } from "lucide-react";

const BC: Record<string, { bg: string; text: string; label: string; border?: string }> = {
  aktiv:        { bg: "bg-emerald-50/80", text: "text-emerald-700", label: "Aktiv", border: "border-emerald-200/40" },
  kritisch:     { bg: "bg-red-50/80", text: "text-red-700", label: "Kritisch", border: "border-red-200/40" },
  abgeschlossen:{ bg: "bg-slate-100/80", text: "text-slate-500", label: "Abgeschl.", border: "border-slate-200/40" },
  offen:        { bg: "bg-amber-50/80", text: "text-amber-700", label: "Offen", border: "border-amber-200/40" },
  bezahlt:      { bg: "bg-emerald-50/80", text: "text-emerald-700", label: "Bezahlt", border: "border-emerald-200/40" },
  "überfällig": { bg: "bg-red-50/80", text: "text-red-700", label: "Überfällig", border: "border-red-200/40" },
  entwurf:      { bg: "bg-violet-50/80", text: "text-violet-600", label: "Entwurf", border: "border-violet-200/40" },
  versendet:    { bg: "bg-blue-50/80", text: "text-blue-600", label: "Versendet", border: "border-blue-200/40" },
  angenommen:   { bg: "bg-emerald-50/80", text: "text-emerald-700", label: "Angenommen", border: "border-emerald-200/40" },
  abgelehnt:    { bg: "bg-red-50/80", text: "text-red-700", label: "Abgelehnt", border: "border-red-200/40" },
  hoch:         { bg: "bg-red-50/80", text: "text-red-700", label: "Hoch", border: "border-red-200/40" },
  normal:       { bg: "bg-blue-50/80", text: "text-blue-600", label: "Normal", border: "border-blue-200/40" },
  niedrig:      { bg: "bg-slate-50/80", text: "text-slate-400", label: "Niedrig", border: "border-slate-200/40" },
  gebucht:      { bg: "bg-emerald-50/80", text: "text-emerald-700", label: "Gebucht", border: "border-emerald-200/40" },
  fehlerhaft:   { bg: "bg-red-50/80", text: "text-red-700", label: "Fehlerhaft", border: "border-red-200/40" },
  storniert:    { bg: "bg-slate-100/80", text: "text-slate-500", label: "Storniert", border: "border-slate-200/40" },
  abgelaufen:   { bg: "bg-slate-100/80", text: "text-slate-400", label: "Abgelaufen", border: "border-slate-200/40" },
  mittel:       { bg: "bg-blue-50/80", text: "text-blue-600", label: "Mittel", border: "border-blue-200/40" },
};

export function Badge({ status }: { status: string }) {
  const c = BC[status] || { bg: "bg-slate-100", text: "text-slate-500", label: status, border: "border-slate-200/40" };
  return (
    <span className={`${c.bg} ${c.text} ${c.border || ""} px-2.5 py-[3px] rounded-md text-[10px] font-bold whitespace-nowrap leading-none border tracking-wide`}>
      {c.label}
    </span>
  );
}

export function TypeTag({ type }: { type: string }) {
  return (
    <span
      className="px-2 py-[2px] rounded-md text-[10px] font-semibold border tracking-wide"
      style={{
        color: typeColor(type),
        backgroundColor: typeColor(type) + "0c",
        borderColor: typeColor(type) + "18",
      }}
    >
      {type.replace("beratung", ".")}
    </span>
  );
}

export function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const isKrit = client.status === "kritisch";
  return (
    <div
      onClick={onClick}
      className={`ce-card p-3.5 cursor-pointer flex items-center gap-3.5 group transition-all hover:-translate-y-[1px] ${
        isKrit ? "!border-red-200/50 hover:!border-red-300" : "hover:!border-amber-200/40"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-display flex-shrink-0 transition-transform group-hover:scale-105 ${
        isKrit ? "bg-red-50 text-red-700 ring-1 ring-red-200/30" : "bg-amber-50/60 text-amber-800 ring-1 ring-amber-200/20"
      }`}>
        {client.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate text-slate-800 group-hover:text-amber-800 transition-colors">
          {client.name}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">{client.company || client.subtype}</div>
        <div className="flex gap-1.5 mt-1.5 items-center">
          <Badge status={client.status} />
          <TypeTag type={client.type} />
        </div>
      </div>
      {client.schulden && (
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="text-xs font-bold text-red-600 font-display">{fmt(client.schulden)}</div>
        </div>
      )}
      <ChevronRight size={15} className="text-slate-300 flex-shrink-0 group-hover:text-amber-500 transition-colors group-hover:translate-x-0.5" />
    </div>
  );
}

export function Card({
  title, icon, action, onAction, children, className = "", accent: _accent
}: {
  title?: string; icon?: React.ReactNode; action?: string; onAction?: () => void; children: React.ReactNode; className?: string; accent?: boolean;
}) {
  return (
    <div className={`ce-card ${className}`}>
      {title && (
        <div className="flex justify-between items-center px-5 pt-5 pb-0">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-600/70">{icon}</span>
            <h3 className="text-[13px] font-bold text-slate-700 m-0 tracking-tight">{title}</h3>
          </div>
          {action && (
            <button
              onClick={onAction}
              className="border-none bg-transparent text-[11px] font-semibold cursor-pointer hover:text-amber-700 transition-colors"
              style={{ color: 'var(--accent-gold)' }}
            >
              {action} →
            </button>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
