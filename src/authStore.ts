// ─── Auth Store ───
// Shared user database that can be modified at runtime by admins

export type UserRole = "admin" | "mitarbeiter";

export type Permission =
  | "clients"     // Klienten verwalten
  | "creditors"   // Gläubiger verwalten
  | "calendar"    // Termine verwalten
  | "files"       // Akten verwalten
  | "scanner"     // Dokumente scannen
  | "invoices"    // Rechnungen verwalten
  | "bank"        // Bankkonto einsehen
  | "datev"       // DATEV Schnittstelle
  | "lexware"     // Lexware Schnittstelle
  | "security"    // Datenschutz & Sicherheit
  | "team"        // Benutzerverwaltung
  | "ai";         // KI-Assistent

export const ALL_PERMISSIONS: { id: Permission; label: string; group: string; description: string }[] = [
  { id: "clients",   label: "Klienten",        group: "Beratung",       description: "Klienten anlegen, bearbeiten, einsehen" },
  { id: "creditors", label: "Gläubiger",       group: "Beratung",       description: "Gläubiger-Management und Verhandlungen" },
  { id: "calendar",  label: "Termine",         group: "Beratung",       description: "Terminkalender und Planung" },
  { id: "files",     label: "Akten",           group: "Beratung",       description: "Dokumentenablage und Aktenführung" },
  { id: "scanner",   label: "Scanner",         group: "Beratung",       description: "Dokumente scannen und OCR" },
  { id: "invoices",  label: "Rechnungen",      group: "Finanzen",       description: "Rechnungen und Angebote verwalten" },
  { id: "bank",      label: "Bankkonto",       group: "Finanzen",       description: "Kontostände und Transaktionen" },
  { id: "datev",     label: "DATEV",           group: "Schnittstellen", description: "DATEV Unternehmen online" },
  { id: "lexware",   label: "Lexware",         group: "Schnittstellen", description: "Lexware Buchhaltung" },
  { id: "security",  label: "Datenschutz",     group: "System",         description: "DSGVO, Sicherheit, Protokolle" },
  { id: "team",      label: "Benutzerverwaltung", group: "System",      description: "Mitarbeiter anlegen und verwalten" },
  { id: "ai",        label: "KI-Assistent",    group: "System",         description: "KI-Assistent nutzen" },
];

export const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

// All permissions for admin
const ADMIN_PERMISSIONS: Permission[] = ALL_PERMISSIONS.map(p => p.id);

// Default permissions for new mitarbeiter
export const DEFAULT_MITARBEITER_PERMISSIONS: Permission[] = [
  "clients", "creditors", "calendar", "files", "scanner", "invoices", "ai"
];

export interface ManagedUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  position?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  permissions: Permission[];
}

// ─── Initial user database ───
let userDB: ManagedUser[] = [
  {
    id: "u1",
    username: "admin",
    password: "admin",
    name: "Holger Schäfer",
    email: "hs@ce-es.de",
    role: "admin",
    avatar: "HS",
    permissions: ADMIN_PERMISSIONS,
    active: true,
    createdAt: "2024-01-15",
    lastLogin: "2025-02-05T08:12:00",
    phone: "+49 7133 1200-950",
    position: "Geschäftsführer",
  },
  {
    id: "u2",
    username: "holger",
    password: "cees2025",
    name: "Holger Schäfer",
    email: "hs@ce-es.de",
    role: "admin",
    avatar: "HS",
    permissions: ADMIN_PERMISSIONS,
    active: true,
    createdAt: "2024-01-15",
    phone: "+49 7133 1200-950",
    position: "Geschäftsführer",
  },
  {
    id: "u7",
    username: "marcel",
    password: "admin123",
    name: "Marcel",
    email: "marcel@ce-es.de",
    role: "admin",
    avatar: "MA",
    permissions: ADMIN_PERMISSIONS,
    active: true,
    createdAt: "2025-02-05",
    phone: "",
    position: "IT-Administrator",
  },
  {
    id: "u3",
    username: "christine",
    password: "cees2025",
    name: "Christine Schäfer",
    email: "cs@ce-es.de",
    role: "mitarbeiter",
    avatar: "CS",
    permissions: DEFAULT_MITARBEITER_PERMISSIONS,
    active: true,
    createdAt: "2024-03-01",
    lastLogin: "2025-02-04T16:45:00",
    phone: "+49 7133 1200-951",
    position: "Beraterin",
  },
  {
    id: "u4",
    username: "mitarbeiter",
    password: "mitarbeiter",
    name: "Christine Schäfer",
    email: "cs@ce-es.de",
    role: "mitarbeiter",
    avatar: "CS",
    permissions: DEFAULT_MITARBEITER_PERMISSIONS,
    active: true,
    createdAt: "2024-03-01",
    position: "Beraterin",
  },
  {
    id: "u5",
    username: "thomas",
    password: "cees2025",
    name: "Thomas Weber",
    email: "tw@ce-es.de",
    role: "mitarbeiter",
    avatar: "TW",
    permissions: ["clients", "creditors", "calendar", "scanner", "ai"],
    active: true,
    createdAt: "2024-06-15",
    lastLogin: "2025-02-03T09:30:00",
    phone: "+49 7133 1200-952",
    position: "Sachbearbeiter",
  },
  {
    id: "u6",
    username: "maria",
    password: "cees2025",
    name: "Maria Hoffmann",
    email: "mh@ce-es.de",
    role: "mitarbeiter",
    avatar: "MH",
    permissions: ["clients", "calendar", "files", "invoices"],
    active: false,
    createdAt: "2024-09-01",
    position: "Assistenz (Elternzeit)",
  },
];

// ─── Store API ───

export function getUsers(): ManagedUser[] {
  return [...userDB];
}

export function getUniqueUsers(): ManagedUser[] {
  // Deduplicate by email, prefer the one with a more descriptive username
  const seen = new Map<string, ManagedUser>();
  for (const u of userDB) {
    const existing = seen.get(u.email + u.role);
    if (!existing || u.username.length > existing.username.length) {
      seen.set(u.email + u.role, u);
    }
  }
  return [...seen.values()];
}

export function authenticateUser(username: string, password: string): AuthUser | null {
  const found = userDB.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password && u.active);
  if (!found) return null;
  // Update last login
  found.lastLogin = new Date().toISOString();
  return {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    avatar: found.avatar,
    permissions: found.role === "admin" ? ADMIN_PERMISSIONS : found.permissions,
  };
}

export function addUser(user: Omit<ManagedUser, "id" | "createdAt">): ManagedUser {
  const newUser: ManagedUser = {
    ...user,
    id: `u${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  userDB = [...userDB, newUser];
  return newUser;
}

export function updateUser(id: string, updates: Partial<ManagedUser>): void {
  userDB = userDB.map(u => u.id === id ? { ...u, ...updates } : u);
}

export function deleteUser(id: string): void {
  userDB = userDB.filter(u => u.id !== id);
}

export function hasPermission(user: AuthUser | null, perm: Permission): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions.includes(perm);
}

// Map tab IDs to permission IDs
export function tabToPermission(tabId: string): Permission | null {
  const map: Record<string, Permission> = {
    clients: "clients", creditors: "creditors", calendar: "calendar",
    files: "files", scanner: "scanner", invoices: "invoices",
    bank: "bank", datev: "datev", lexware: "lexware",
    security: "security", team: "team", ai: "ai",
  };
  return map[tabId] || null;
}
