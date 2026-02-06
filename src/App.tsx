import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import type { Client, Invoice, Offer } from "./data";
import { hasPermission, tabToPermission } from "./authStore";
import type { AuthUser } from "./authStore";
import { HomeView } from "./views/HomeView";
import { ClientsView } from "./views/ClientsView";
import { CalendarView } from "./views/CalendarView";
import { FinanceView } from "./views/FinanceView";
import { FilesView } from "./views/FilesView";
import { DatevView } from "./views/DatevView";
import { BankView } from "./views/BankView";
import { LexwareView } from "./views/LexwareView";
import { SecurityView } from "./views/SecurityView";
import { CreditorView } from "./views/CreditorView";
import { ScannerView } from "./views/ScannerView";
import { TeamView } from "./views/TeamView";
import { AiView } from "./views/AiView";
import { LoginScreen } from "./views/LoginScreen";
import { ClientDetail } from "./views/ClientDetail";
import { InvoiceDetail, OfferDetail } from "./views/InvoiceDetail";
import { Home, Users, CalendarDays, Receipt, FolderArchive, Landmark, Plus, Bell, UserPlus, CalendarPlus, FileText, FilePlus2, Menu, Phone, Database, BookOpen, Shield, Scale, ScanLine, LogOut, UsersRound, Sparkles, Download, X } from "lucide-react";

// ─── PWA Install Banner ───
function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as any).standalone) return;

    // iOS detection
    const ua = navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Show iOS hint after a delay
    if (isIosDevice && !localStorage.getItem('ces-pwa-dismissed')) {
      setTimeout(() => { if (!dismissed.current) setShowBanner(true); }, 5000);
    }

    // Android/Chrome install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('ces-pwa-dismissed')) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        toast.success("App wird installiert!");
      }
      setDeferredPrompt(null);
    }
    setShowBanner(false);
  };

  const dismiss = () => {
    dismissed.current = true;
    setShowBanner(false);
    localStorage.setItem('ces-pwa-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-[360px] z-[200] animate-in slide-in-from-bottom-4" style={{animation:'slideUp .4s ease-out'}}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="bg-[#141c28] text-white rounded-2xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/10 border border-amber-400/15 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold mb-0.5">Ce-eS als App installieren</div>
            {isIos ? (
              <div className="text-[11px] text-white/50 leading-relaxed">
                Tippen Sie auf <span className="inline-flex items-center bg-white/10 px-1.5 py-0.5 rounded text-white/70 text-[10px] mx-0.5">⬆ Teilen</span> und dann auf <span className="text-white/70 font-semibold">"Zum Home-Bildschirm"</span>
              </div>
            ) : (
              <div className="text-[11px] text-white/50 leading-relaxed">
                Direkt auf Ihrem Startbildschirm – wie eine native App, ohne App Store.
              </div>
            )}
          </div>
          <button onClick={dismiss} className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer p-1 -mt-1 -mr-1">
            <X size={14} />
          </button>
        </div>
        {!isIos && deferredPrompt && (
          <button onClick={install}
            className="w-full mt-3 py-2.5 rounded-xl border-none text-[12px] font-bold cursor-pointer text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{background:'linear-gradient(135deg,#16794a,#0f5c37)'}}>
            <Download size={14} /> Jetzt installieren
          </button>
        )}
      </div>
    </div>
  );
}

type Tab = "home"|"clients"|"creditors"|"calendar"|"invoices"|"files"|"scanner"|"datev"|"lexware"|"bank"|"security"|"team"|"ai";

const NAV_SECTIONS: { label?: string; items: { id: Tab; icon: React.ReactNode; label: string }[] }[] = [
  {
    items: [
      { id: "home", icon: <Home size={18} />, label: "Übersicht" },
    ]
  },
  {
    label: "Beratung",
    items: [
      { id: "clients", icon: <Users size={18} />, label: "Klienten" },
      { id: "creditors", icon: <Scale size={18} />, label: "Gläubiger" },
      { id: "calendar", icon: <CalendarDays size={18} />, label: "Termine" },
      { id: "files", icon: <FolderArchive size={18} />, label: "Akten" },
      { id: "scanner", icon: <ScanLine size={18} />, label: "Scanner" },
    ]
  },
  {
    label: "Finanzen",
    items: [
      { id: "invoices", icon: <Receipt size={18} />, label: "Rechnungen" },
      { id: "bank", icon: <Landmark size={18} />, label: "Bankkonto" },
    ]
  },
  {
    label: "Schnittstellen",
    items: [
      { id: "datev", icon: <Database size={18} />, label: "DATEV" },
      { id: "lexware", icon: <BookOpen size={18} />, label: "Lexware" },
    ]
  },
  {
    label: "KI",
    items: [
      { id: "ai", icon: <Sparkles size={18} />, label: "KI-Assistent" },
    ]
  },
  {
    label: "System",
    items: [
      { id: "security", icon: <Shield size={18} />, label: "Datenschutz" },
      { id: "team", icon: <UsersRound size={18} />, label: "Team" },
    ]
  },
];

const ALL_TABS = NAV_SECTIONS.flatMap(s => s.items);
const MOBILE_TABS_IDS = ["home", "clients", "creditors", "scanner", "invoices"];

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [client, setClient] = useState<Client | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [mob, setMob] = useState(false);
  const [createAction, setCreateAction] = useState<string | null>(null);

  const handleLogin = (u: AuthUser) => { setUser(u); toast.success(`Willkommen, ${u.name}!`); };
  const handleLogout = () => { setUser(null); setTab("home"); setClient(null); setInvoice(null); setOffer(null); setMob(false); };

  const isAdmin = user?.role === "admin";

  // Permission check: "home" always allowed, others check permission
  const isTabAllowed = (id: string) => {
    if (id === "home") return true;
    const perm = tabToPermission(id);
    return perm ? hasPermission(user, perm) : true;
  };

  // Filter nav
  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(t => isTabAllowed(t.id)),
  })).filter(section => section.items.length > 0);

  const mobileTabs = ALL_TABS.filter(t => MOBILE_TABS_IDS.includes(t.id) && isTabAllowed(t.id));

  // ─── LOGIN GATE ───
  if (!user) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ className: "!rounded-xl !text-sm !font-semibold !border-none !shadow-xl", style: { background: '#1a1d26', color: '#fff' }, duration: 2200 }} />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  const go = (t: string) => {
    const tab = t as Tab;
    if (!isTabAllowed(tab)) { toast.error("Kein Zugriff auf diesen Bereich"); return; }
    setClient(null); setInvoice(null); setOffer(null); setTab(tab); setMob(false);
  };
  const back = () => { setClient(null); setInvoice(null); setOffer(null); };

  const content = client ? <ClientDetail client={client} onBack={back} onNavigate={go} />
    : invoice ? <InvoiceDetail invoice={invoice} onBack={back} />
    : offer ? <OfferDetail offer={offer} onBack={back} />
    : tab === "home" ? <HomeView onSelectClient={setClient} onNavigate={go} userName={user?.name} />
    : tab === "clients" ? <ClientsView onSelectClient={setClient} autoCreate={createAction === "client"} onCreated={() => setCreateAction(null)} />
    : tab === "creditors" ? <CreditorView onSelectClient={setClient} />
    : tab === "calendar" ? <CalendarView onSelectClient={setClient} autoCreate={createAction === "appointment"} onCreated={() => setCreateAction(null)} />
    : tab === "invoices" ? <FinanceView onSelectInvoice={setInvoice} onSelectOffer={setOffer} autoCreate={createAction === "invoice" ? "invoice" : createAction === "offer" ? "offer" : null} onCreated={() => setCreateAction(null)} />
    : tab === "files" ? <FilesView onSelectClient={setClient} onNavigate={go} />
    : tab === "scanner" ? <ScannerView />
    : tab === "ai" ? <AiView />
    : tab === "team" ? <TeamView />
    : tab === "datev" ? <DatevView />
    : tab === "lexware" ? <LexwareView />
    : tab === "bank" ? <BankView />
    : tab === "security" ? <SecurityView />
    : <HomeView onSelectClient={setClient} onNavigate={go} userName={user?.name} />;

  const pageTitle = client ? "Klientenakte" : invoice ? "Rechnung" : offer ? "Angebot" : ALL_TABS.find(t => t.id === tab)?.label ?? "";

  return (
    <div className="min-h-[100dvh] flex noise-bg">
      <Toaster position="top-center" toastOptions={{ className: "!rounded-xl !text-sm !font-semibold !border-none !shadow-xl", style: { background: '#1a1d26', color: '#fff' }, duration: 2200 }} />
      <PwaInstallBanner />

      {/* ═══ SIDEBAR ═══ */}
      <aside className="hidden lg:flex flex-col w-[256px] min-h-screen sidebar-gradient text-white flex-shrink-0 sticky top-0 h-screen select-none">
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/15 flex items-center justify-center">
              <span className="font-display text-[15px] text-amber-400/90 font-bold">C</span>
            </div>
            <div>
              <div className="text-[13px] font-bold tracking-tight leading-none">Ce-eS</div>
              <div className="text-[10px] text-white/25 font-medium mt-0.5">Management Consultant</div>
            </div>
          </div>
        </div>

        <div className="mx-5 h-px bg-white/[0.06]" />

        <nav className="flex-1 px-3 pt-4 pb-3 overflow-y-auto scrollbar-thin space-y-5">
          {filteredSections.map((section, si) => (
            <div key={si}>
              {section.label && <div className="px-3 mb-2 text-[9px] font-semibold tracking-[1.5px] uppercase text-white/20">{section.label}</div>}
              <div className="space-y-0.5">
                {section.items.map(t => (
                  <button key={t.id} onClick={() => go(t.id)}
                    className={`nav-item w-full flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium border-none cursor-pointer ${
                      t.id === "ai" && tab !== "ai" ? "bg-purple-500/[0.06] text-purple-300/60 hover:bg-purple-500/10 hover:text-purple-200" :
                      tab === t.id ? "active text-white" : "bg-transparent text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                    }`}>
                    <span className={t.id === "ai" ? (tab === "ai" ? "text-purple-400" : "text-purple-400/60") : tab === t.id ? "text-amber-400/80" : ""}>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.id === "creditors" && <span className="ml-auto text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">7</span>}
                    {t.id === "ai" && <span className="ml-auto text-[8px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded tracking-wide">NEU</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 pb-5 space-y-3">
          <div className="h-px bg-white/[0.06]" />
          <button onClick={() => setShowNew(true)} className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 text-[13px]">
            <Plus size={15} />Neu erstellen
          </button>
          <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${isAdmin ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white/80 truncate">{user.name}</div>
                <div className="text-[10px] text-white/25 flex items-center gap-1">
                  {isAdmin ? <Shield size={9} /> : <Users size={9} />}
                  {isAdmin ? "Administrator" : "Mitarbeiter"}
                </div>
              </div>
              <button onClick={handleLogout} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/15 border-none flex items-center justify-center text-white/25 hover:text-red-400 cursor-pointer transition-colors" title="Abmelden">
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col min-h-[100dvh] min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-black/[0.05] px-4 lg:px-8 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMob(!mob)} className="lg:hidden bg-transparent border-none cursor-pointer text-slate-500 p-1"><Menu size={21} /></button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-600/10 to-amber-500/5 border border-amber-500/10 flex items-center justify-center">
                <span className="font-display text-[11px] text-amber-700 font-bold">C</span>
              </div>
              <span className="font-display font-bold text-[15px] text-slate-800">Ce-eS</span>
            </div>
            <h1 className="hidden lg:block text-[15px] font-bold text-slate-700 m-0 tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 mr-1">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${isAdmin ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/30" : "bg-blue-50 text-blue-600 ring-1 ring-blue-200/30"}`}>{user.avatar}</div>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-700 leading-none">{user.name}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{isAdmin ? "Admin" : "Mitarbeiter"}</div>
              </div>
            </div>
            <button onClick={() => toast.info("Keine neuen Benachrichtigungen")} className="relative bg-white/60 hover:bg-white border border-black/[0.06] rounded-xl w-9 h-9 flex items-center justify-center text-slate-400 cursor-pointer transition-all">
              <Bell size={16} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
            </button>
            <button onClick={() => setShowNew(!showNew)} className="btn-gold h-9 px-4 flex items-center gap-2 text-[12px]">
              <Plus size={14} /><span className="hidden sm:inline">Neu</span>
            </button>
            <button onClick={handleLogout} className="lg:hidden bg-white/60 hover:bg-red-50 border border-black/[0.06] rounded-xl w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer transition-all" title="Abmelden">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mob && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade" onClick={() => setMob(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-[280px] sidebar-gradient z-50 lg:hidden flex flex-col py-5 px-3 shadow-2xl animate-in">
              <div className="px-3 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/15 flex items-center justify-center">
                  <span className="font-display text-[13px] text-amber-400/90 font-bold">C</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white tracking-tight">Ce-eS</div>
                  <div className="text-[10px] text-white/25">Management Consultant</div>
                </div>
              </div>
              <div className="mx-3 mb-4 rounded-xl p-3 bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${isAdmin ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>{user.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-white/80 truncate">{user.name}</div>
                    <div className="text-[10px] text-white/25 flex items-center gap-1">{isAdmin ? <><Shield size={9} /> Admin</> : <><Users size={9} /> Mitarbeiter</>}</div>
                  </div>
                </div>
              </div>
              <nav className="flex-1 space-y-4 overflow-y-auto">
                {filteredSections.map((section, si) => (
                  <div key={si}>
                    {section.label && <div className="px-3 mb-1.5 text-[9px] font-semibold tracking-[1.5px] uppercase text-white/20">{section.label}</div>}
                    {section.items.map(t => (
                      <button key={t.id} onClick={() => go(t.id)} className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium border-none cursor-pointer ${tab === t.id ? "active text-white" : "bg-transparent text-white/30 hover:bg-white/[0.04] hover:text-white/60"}`}>
                        <span className={tab === t.id ? "text-amber-400/80" : ""}>{t.icon}</span>{t.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="px-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div className="text-[10px] text-white/15 flex items-center gap-2"><Phone size={10} />+49 7133 1200-950</div>
                <button onClick={handleLogout} className="text-[10px] text-red-400/60 hover:text-red-400 bg-transparent border-none cursor-pointer flex items-center gap-1 font-semibold transition-colors"><LogOut size={10} /> Abmelden</button>
              </div>
            </div>
          </>
        )}

        {showNew && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNew(false)} />
            <div className="absolute top-[52px] right-4 lg:right-8 ce-card p-2 z-50 min-w-[220px] animate-in" style={{ background: 'white' }}>
              {[
                { icon: <UserPlus size={16} />, l: "Neuer Klient", c: "text-amber-600", action: "client", target: "clients" as Tab },
                { icon: <CalendarPlus size={16} />, l: "Neuer Termin", c: "text-blue-600", action: "appointment", target: "calendar" as Tab },
                { icon: <FileText size={16} />, l: "Neues Angebot", c: "text-emerald-600", action: "offer", target: "invoices" as Tab },
                { icon: <FilePlus2 size={16} />, l: "Neue Rechnung", c: "text-red-600", action: "invoice", target: "invoices" as Tab },
              ].map((x, i) => (
                <button key={i} onClick={() => { setShowNew(false); setCreateAction(x.action); go(x.target); }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 border-none bg-transparent cursor-pointer rounded-lg text-[13px] text-slate-700 font-medium text-left hover:bg-slate-50 transition-colors">
                  <span className={x.c}>{x.icon}</span>{x.l}
                </button>
              ))}
            </div>
          </>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-thin">{content}</main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-black/[0.05] flex justify-around px-1 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] z-30">
          {mobileTabs.map(t => (
            <button key={t.id} onClick={() => go(t.id)} className={`flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer px-3 py-1.5 rounded-lg transition-all ${tab === t.id ? "text-amber-700" : "text-slate-400"}`}>
              {t.icon}
              <span className={`text-[9px] tracking-wide ${tab === t.id ? "font-bold" : "font-medium"}`}>{t.label}</span>
              {tab === t.id && <div className="w-4 h-[2px] rounded-full bg-amber-600 mt-0.5" />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
