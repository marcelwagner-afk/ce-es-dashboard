// ─── Reactive Data Store ───
// Wraps static data into mutable state with CRUD and subscriber pattern

import type {
  Client, Appointment, Invoice, Offer, CaseFile, Document as Doc,
} from "./data";
import {
  CLIENTS as INIT_CLIENTS,
  APPOINTMENTS as INIT_APPOINTMENTS,
  INVOICES as INIT_INVOICES,
  OFFERS as INIT_OFFERS,
  CASE_FILES as INIT_CASE_FILES,
} from "./data";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() { listeners.forEach(fn => fn()); }

// ─── Mutable state ───
let clients = [...INIT_CLIENTS];
let appointments = [...INIT_APPOINTMENTS];
let invoices = [...INIT_INVOICES];
let offers = [...INIT_OFFERS];
let caseFiles = INIT_CASE_FILES.map(f => ({ ...f, docs: [...f.docs] }));

// ─── Getters ───
export const getClients = () => clients;
export const getAppointments = () => appointments;
export const getInvoices = () => invoices;
export const getOffers = () => offers;
export const getCaseFiles = () => caseFiles;

// ─── Subscribe (for React re-renders) ───
export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Clients ───
export function addClient(c: Omit<Client, "id">) {
  const id = Math.max(0, ...clients.map(x => x.id)) + 1;
  clients = [...clients, { ...c, id }];
  notify();
  return id;
}
export function updateClient(id: number, patch: Partial<Client>) {
  clients = clients.map(c => c.id === id ? { ...c, ...patch } : c);
  notify();
}
export function deleteClient(id: number) {
  clients = clients.filter(c => c.id !== id);
  notify();
}

// ─── Appointments ───
export function addAppointment(a: Omit<Appointment, "id">) {
  const id = Math.max(0, ...appointments.map(x => x.id)) + 1;
  appointments = [...appointments, { ...a, id }];
  notify();
  return id;
}
export function updateAppointment(id: number, patch: Partial<Appointment>) {
  appointments = appointments.map(a => a.id === id ? { ...a, ...patch } : a);
  notify();
}
export function deleteAppointment(id: number) {
  appointments = appointments.filter(a => a.id !== id);
  notify();
}

// ─── Invoices ───
export function addInvoice(inv: Invoice) {
  invoices = [...invoices, inv];
  notify();
}
export function updateInvoice(id: string, patch: Partial<Invoice>) {
  invoices = invoices.map(i => i.id === id ? { ...i, ...patch } : i);
  notify();
}
export function deleteInvoice(id: string) {
  invoices = invoices.filter(i => i.id !== id);
  notify();
}

// ─── Offers ───
export function addOffer(o: Offer) {
  offers = [...offers, o];
  notify();
}
export function updateOffer(id: string, patch: Partial<Offer>) {
  offers = offers.map(o => o.id === id ? { ...o, ...patch } : o);
  notify();
}
export function deleteOffer(id: string) {
  offers = offers.filter(o => o.id !== id);
  notify();
}

// ─── Case Files / Documents ───
export function addCaseFile(cf: Omit<CaseFile, "id">) {
  const id = Math.max(0, ...caseFiles.map(x => x.id)) + 1;
  caseFiles = [...caseFiles, { ...cf, id }];
  notify();
  return id;
}
export function addDocumentToFile(fileId: number, doc: Doc) {
  caseFiles = caseFiles.map(f =>
    f.id === fileId ? { ...f, docs: [...f.docs, doc], lastUpdate: new Date().toISOString().slice(0, 10) } : f
  );
  notify();
}
export function deleteDocument(fileId: number, docId: string) {
  caseFiles = caseFiles.map(f =>
    f.id === fileId ? { ...f, docs: f.docs.filter(d => d.id !== docId) } : f
  );
  notify();
}

// ─── Next IDs (for display) ───
export function nextInvoiceId() {
  const nums = invoices.map(i => parseInt(i.id.replace(/\D/g, "")) || 0);
  return `RE-2025-${String(Math.max(...nums) + 1).padStart(3, "0")}`;
}
export function nextOfferId() {
  const nums = offers.map(o => parseInt(o.id.replace(/\D/g, "")) || 0);
  return `AN-2025-${String(Math.max(...nums) + 1).padStart(3, "0")}`;
}

// ─── Pending AI Document (for cross-view navigation) ───
let pendingAiDoc: Doc | null = null;
export function setPendingAiDoc(doc: Doc | null) { pendingAiDoc = doc; }
export function getPendingAiDoc(): Doc | null { const d = pendingAiDoc; pendingAiDoc = null; return d; }
