// ─── React integration for dataStore ───
import { useSyncExternalStore } from "react";
import * as store from "./dataStore";
import { X } from "lucide-react";

// Hook: re-renders component when store changes
export function useStore<T>(selector: () => T): T {
  return useSyncExternalStore(
    store.subscribe,
    selector,
    selector
  );
}

// Convenience hooks
export const useClients = () => useStore(store.getClients);
export const useAppointments = () => useStore(store.getAppointments);
export const useInvoices = () => useStore(store.getInvoices);
export const useOffers = () => useStore(store.getOffers);
export const useCaseFiles = () => useStore(store.getCaseFiles);

// ─── Reusable Modal ───
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-2xl ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"} max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border-none cursor-pointer flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Form Field helpers ───
const labelCls = "block text-[11px] font-semibold text-slate-500 mb-1";
const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all outline-none";
const selectCls = inputCls;

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className={labelCls}>{label}</label>{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={selectCls}>{children}</select>;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} resize-none ${props.className || ""}`} />;
}

export function SubmitRow({ onCancel, label = "Speichern" }: { onCancel: () => void; label?: string }) {
  return (
    <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-slate-100">
      <button type="button" onClick={onCancel}
        className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
        Abbrechen
      </button>
      <button type="submit"
        className="px-5 py-2 rounded-xl border-none text-[12px] font-semibold text-white cursor-pointer transition-colors"
        style={{ background: "linear-gradient(135deg, #16794a, #1a6b42)" }}>
        {label}
      </button>
    </div>
  );
}
