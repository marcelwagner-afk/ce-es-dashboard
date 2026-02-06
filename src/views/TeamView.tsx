import { useState } from "react";
import { getUniqueUsers, addUser, updateUser, deleteUser, ALL_PERMISSIONS, PERMISSION_GROUPS, DEFAULT_MITARBEITER_PERMISSIONS } from "../authStore";
import type { ManagedUser, Permission, UserRole } from "../authStore";
import { toast } from "sonner";
import { UserPlus, Shield, Users, Pencil, Trash2, X, Check, Eye, EyeOff, ToggleLeft, ToggleRight, Lock, Mail, Phone, Briefcase, ChevronDown, ChevronUp, Search, AlertTriangle } from "lucide-react";
import { Card } from "./shared";

type Mode = "list" | "create" | "edit";

export function TeamView() {
  const [mode, setMode] = useState<Mode>("list");
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [, forceRender] = useState(0);
  const refresh = () => forceRender(n => n + 1);

  const users = getUniqueUsers();
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const admins = users.filter(u => u.role === "admin" && u.active);
  const activeCount = users.filter(u => u.active).length;

  const handleEdit = (u: ManagedUser) => { setEditUser({ ...u }); setMode("edit"); };
  const handleCreate = () => {
    setEditUser({
      id: "", username: "", password: "", name: "", email: "",
      role: "mitarbeiter", avatar: "", permissions: [...DEFAULT_MITARBEITER_PERMISSIONS],
      active: true, createdAt: "", position: "", phone: "",
    });
    setMode("create");
  };

  const handleDelete = (id: string) => {
    const u = users.find(x => x.id === id);
    if (u?.role === "admin" && admins.length <= 1) {
      toast.error("Letzter Admin kann nicht gelöscht werden");
      return;
    }
    deleteUser(id);
    setConfirmDelete(null);
    toast.success("Benutzer gelöscht");
    refresh();
  };

  const handleToggleActive = (u: ManagedUser) => {
    if (u.role === "admin" && u.active && admins.length <= 1) {
      toast.error("Letzter Admin kann nicht deaktiviert werden");
      return;
    }
    updateUser(u.id, { active: !u.active });
    toast.success(u.active ? `${u.name} deaktiviert` : `${u.name} aktiviert`);
    refresh();
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto">
      {/* Hero */}
      <div className="dark-card p-5 lg:p-7 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Users size={22} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-bold font-display text-white">Benutzerverwaltung</div>
                  <div className="text-[11px] text-white/30">Mitarbeiter anlegen, Berechtigungen verwalten</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Stat label="Gesamt" value={String(users.length)} />
              <Stat label="Aktiv" value={String(activeCount)} />
              <Stat label="Admins" value={String(admins.length)} />
            </div>
          </div>
        </div>
      </div>

      {mode === "list" ? (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, Benutzername oder E-Mail suchen…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13px] bg-white placeholder:text-slate-300 focus:border-amber-400 transition-colors"
              />
            </div>
            <button onClick={handleCreate} className="btn-gold px-5 py-2.5 flex items-center gap-2 text-[13px]">
              <UserPlus size={16} /> Neuer Mitarbeiter
            </button>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {filtered.map(u => (
              <div key={u.id} className={`ce-card p-4 transition-all ${!u.active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                    u.role === "admin"
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/30"
                      : "bg-blue-50 text-blue-600 ring-1 ring-blue-200/30"
                  }`}>
                    {u.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-slate-800">{u.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        u.role === "admin"
                          ? "bg-amber-50 text-amber-700 border-amber-200/40"
                          : "bg-blue-50 text-blue-600 border-blue-200/40"
                      }`}>
                        {u.role === "admin" ? "ADMIN" : "MITARBEITER"}
                      </span>
                      {!u.active && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200/40">INAKTIV</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>@{u.username}</span>
                      <span>{u.email}</span>
                      {u.position && <span className="text-slate-300">· {u.position}</span>}
                    </div>
                    {/* Permission pills */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {u.role === "admin" ? (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">Vollzugriff</span>
                      ) : (
                        u.permissions.slice(0, 6).map(p => (
                          <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">{ALL_PERMISSIONS.find(x => x.id === p)?.label || p}</span>
                        ))
                      )}
                      {u.role !== "admin" && u.permissions.length > 6 && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-400">+{u.permissions.length - 6}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => handleToggleActive(u)} title={u.active ? "Deaktivieren" : "Aktivieren"}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer transition-colors ${u.active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>
                      {u.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => handleEdit(u)} title="Bearbeiten"
                      className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center border-none cursor-pointer transition-colors">
                      <Pencil size={14} />
                    </button>
                    {confirmDelete === u.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(u.id)}
                          className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center border-none cursor-pointer">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border-none cursor-pointer">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)} title="Löschen"
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center border-none cursor-pointer transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Last login */}
                {u.lastLogin && (
                  <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-300">
                    Letzter Login: {new Date(u.lastLogin).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <UserForm
          user={editUser!}
          isNew={mode === "create"}
          onSave={(data) => {
            if (mode === "create") {
              // Generate avatar from name
              const parts = data.name.trim().split(/\s+/);
              const avatar = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : data.name.slice(0, 2).toUpperCase();
              addUser({ ...data, avatar });
              toast.success(`${data.name} wurde angelegt`);
            } else {
              updateUser(data.id!, data);
              toast.success(`${data.name} wurde aktualisiert`);
            }
            setMode("list");
            setEditUser(null);
            refresh();
          }}
          onCancel={() => { setMode("list"); setEditUser(null); }}
        />
      )}
    </div>
  );
}

// ─── Stat Pill ───
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.04] rounded-lg px-3 py-2 text-center min-w-[70px]">
      <div className="text-[9px] text-white/25 font-semibold tracking-wider uppercase">{label}</div>
      <div className="text-lg font-bold font-display text-white mt-0.5">{value}</div>
    </div>
  );
}

// ─── User Create/Edit Form ───
function UserForm({ user, isNew, onSave, onCancel }: {
  user: ManagedUser; isNew: boolean;
  onSave: (data: ManagedUser) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ManagedUser>({ ...user });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(PERMISSION_GROUPS.map(g => [g, true]))
  );

  const set = (key: keyof ManagedUser, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const togglePerm = (perm: Permission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleGroup = (group: string) => {
    const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.id);
    const allChecked = groupPerms.every(p => form.permissions.includes(p));
    setForm(prev => ({
      ...prev,
      permissions: allChecked
        ? prev.permissions.filter(p => !groupPerms.includes(p))
        : [...new Set([...prev.permissions, ...groupPerms])],
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name ist erforderlich";
    if (!form.username.trim()) e.username = "Benutzername ist erforderlich";
    if (isNew && !form.password) e.password = "Passwort ist erforderlich";
    if (form.password && form.password.length < 4) e.password = "Mindestens 4 Zeichen";
    if (!form.email.trim()) e.email = "E-Mail ist erforderlich";
    if (form.email && !form.email.includes("@")) e.email = "Ungültige E-Mail";
    if (form.role === "mitarbeiter" && form.permissions.length === 0) e.permissions = "Mindestens eine Berechtigung erforderlich";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSave(form);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Form */}
      <div className="lg:col-span-7 space-y-4">
        <Card title={isNew ? "Neuer Mitarbeiter" : `${form.name} bearbeiten`} icon={isNew ? <UserPlus size={15} /> : <Pencil size={15} />}>
          <div className="space-y-4">
            {/* Name */}
            <Field label="Vollständiger Name" error={errors.name} required>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Vor- und Nachname" className={inputCls(errors.name)} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <Field label="Benutzername" error={errors.username} required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-[13px]">@</span>
                  <input type="text" value={form.username} onChange={e => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                    placeholder="benutzername" className={`${inputCls(errors.username)} !pl-8`} />
                </div>
              </Field>

              {/* Password */}
              <Field label={isNew ? "Passwort" : "Neues Passwort"} error={errors.password} required={isNew}>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                    placeholder={isNew ? "Passwort vergeben" : "Leer = unverändert"} className={`${inputCls(errors.password)} !pl-10 !pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 bg-transparent border-none cursor-pointer p-0.5">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <Field label="E-Mail" error={errors.email} required>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    placeholder="email@ce-es.de" className={`${inputCls(errors.email)} !pl-10`} />
                </div>
              </Field>

              {/* Phone */}
              <Field label="Telefon">
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="tel" value={form.phone || ""} onChange={e => set("phone", e.target.value)}
                    placeholder="+49 …" className={`${inputCls()} !pl-10`} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Position */}
              <Field label="Position / Funktion">
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" value={form.position || ""} onChange={e => set("position", e.target.value)}
                    placeholder="z.B. Sachbearbeiter, Beraterin" className={`${inputCls()} !pl-10`} />
                </div>
              </Field>

              {/* Role */}
              <Field label="Rolle" required>
                <div className="flex gap-2">
                  {(["mitarbeiter", "admin"] as UserRole[]).map(r => (
                    <button key={r} onClick={() => {
                      set("role", r);
                      if (r === "admin") set("permissions", ALL_PERMISSIONS.map(p => p.id));
                    }}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border cursor-pointer transition-all flex items-center justify-center gap-2 ${
                        form.role === r
                          ? r === "admin" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-600 border-blue-200"
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}>
                      {r === "admin" ? <Shield size={13} /> : <Users size={13} />}
                      {r === "admin" ? "Administrator" : "Mitarbeiter"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <div>
                <div className="text-[13px] font-semibold text-slate-700">Konto aktiv</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Deaktivierte Konten können sich nicht anmelden</div>
              </div>
              <button onClick={() => set("active", !form.active)}
                className={`w-12 h-7 rounded-full border-none cursor-pointer transition-all relative ${form.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${form.active ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSubmit}
            className="btn-gold px-6 py-2.5 flex items-center gap-2 text-[13px]">
            <Check size={15} /> {isNew ? "Mitarbeiter anlegen" : "Speichern"}
          </button>
        </div>
      </div>

      {/* Right: Permissions */}
      <div className="lg:col-span-5">
        <Card title="Berechtigungen" icon={<Shield size={15} />}>
          {form.role === "admin" ? (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/40 text-center">
              <Shield size={24} className="text-amber-500 mx-auto mb-2" />
              <div className="text-[13px] font-bold text-amber-800">Vollzugriff</div>
              <div className="text-[11px] text-amber-600/70 mt-1">Administratoren haben automatisch Zugriff auf alle Bereiche</div>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.permissions && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200/40 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="text-red-500" />
                  <span className="text-[11px] text-red-600 font-medium">{errors.permissions}</span>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2">
                <button onClick={() => set("permissions", ALL_PERMISSIONS.filter(p => p.id !== "team").map(p => p.id))}
                  className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-amber-100 transition-colors">
                  Alle aktivieren
                </button>
                <button onClick={() => set("permissions", [...DEFAULT_MITARBEITER_PERMISSIONS])}
                  className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-blue-100 transition-colors">
                  Standard
                </button>
                <button onClick={() => set("permissions", [])}
                  className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-slate-100 transition-colors">
                  Keine
                </button>
              </div>

              {/* Permission groups */}
              {PERMISSION_GROUPS.map(group => {
                const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                const checkedCount = groupPerms.filter(p => form.permissions.includes(p.id)).length;
                const allChecked = checkedCount === groupPerms.length;
                const expanded = expandedGroups[group] !== false;

                return (
                  <div key={group} className="rounded-xl border border-slate-100 overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 cursor-pointer select-none"
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !expanded }))}>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                          className={`w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-colors ${
                            allChecked ? "bg-amber-500 border-amber-500 text-white" : checkedCount > 0 ? "bg-amber-200 border-amber-300 text-white" : "bg-white border-slate-300"
                          }`}>
                          {(allChecked || checkedCount > 0) && <Check size={10} />}
                        </button>
                        <span className="text-[12px] font-bold text-slate-700">{group}</span>
                        <span className="text-[10px] text-slate-400">{checkedCount}/{groupPerms.length}</span>
                      </div>
                      {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                    </div>

                    {/* Permissions */}
                    {expanded && (
                      <div className="divide-y divide-slate-50">
                        {groupPerms.map(perm => {
                          const checked = form.permissions.includes(perm.id);
                          return (
                            <label key={perm.id} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-slate-50/50 transition-colors">
                              <button onClick={() => togglePerm(perm.id)}
                                className={`w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-colors flex-shrink-0 ${
                                  checked ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-300 hover:border-amber-300"
                                }`}>
                                {checked && <Check size={10} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-slate-700">{perm.label}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{perm.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Helpers ───
function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <div className="text-[10px] text-red-500 mt-1 font-medium">{error}</div>}
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-white placeholder:text-slate-300 transition-colors ${error ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-amber-400"}`;
}
