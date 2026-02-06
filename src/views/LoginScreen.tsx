import { useState } from "react";
import { Eye, EyeOff, Lock, User, Shield, LogIn, AlertCircle } from "lucide-react";
import { authenticateUser } from "../authStore";
import type { AuthUser } from "../authStore";

// Re-export types for backward compat
export type { AuthUser, UserRole, Permission } from "../authStore";
export { RESTRICTED_TABS } from "./LoginCompat";

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginScreen({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const user = authenticateUser(username.trim(), password);
      if (user) {
        onLogin(user);
      } else {
        setError("Benutzername oder Passwort falsch");
        setLoading(false);
      }
    }, 800);
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  /* 16px font-size prevents iOS auto-zoom on input focus */
  const inputCls = [
    "w-full py-3 rounded-xl font-medium",
    "border border-white/[0.08]",
    "placeholder:text-white/15 text-white",
    "focus:border-amber-500/40 transition-colors",
    "text-[16px] sm:text-[14px]",
  ].join(" ");

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    WebkitAppearance: "none",
    appearance: "none" as const,
    boxSizing: "border-box",
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center px-4 py-6 sm:py-8 relative overflow-x-hidden overflow-y-auto"
      style={{ background: "linear-gradient(135deg, #12141a 0%, #1a1d26 40%, #21242f 100%)" }}
    >
      {/* BG decoration */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />
      <div className="absolute -top-[30%] -right-[20%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[30%] -left-[20%] w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-amber-600/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* ═══ LOGO ═══ */}
        <div className="text-center mb-5 sm:mb-8">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 sm:mb-5 flex items-center justify-center border border-amber-500/15"
            style={{ background: "linear-gradient(135deg, rgba(192,139,46,0.15) 0%, rgba(192,139,46,0.05) 100%)" }}
          >
            <span className="font-display text-xl sm:text-2xl text-amber-400 font-bold">C</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-0.5">Ce-eS</h1>
          <p className="text-[12px] sm:text-[13px] text-white/25 font-medium">Management Consultant · Dashboard</p>
        </div>

        {/* ═══ FORM CARD ═══ */}
        <div
          className="rounded-2xl p-4 sm:p-7 border border-white/[0.06]"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-white mb-1">Anmelden</h2>
            <p className="text-[11px] sm:text-[12px] text-white/30">Melden Sie sich mit Ihren Zugangsdaten an</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {/* Username */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-semibold text-white/40 mb-1.5 block tracking-wide uppercase">
                Benutzername
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Benutzername eingeben"
                  autoComplete="username"
                  autoFocus
                  className={`${inputCls} pl-10 pr-4`}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-semibold text-white/40 mb-1.5 block tracking-wide uppercase">
                Passwort
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Passwort eingeben"
                  autoComplete="current-password"
                  className={`${inputCls} pl-10 pr-12`}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 bg-transparent border-none cursor-pointer transition-colors p-1"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/15 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-[12px] text-red-400 font-medium">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 text-[14px] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={17} /> Anmelden</>
              }
            </button>
          </form>
        </div>

        {/* ═══ DEMO HINTS ═══ */}
        <div className="mt-3.5 sm:mt-5 rounded-xl border border-white/[0.05] p-3 sm:p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-[9px] sm:text-[10px] font-semibold text-white/20 tracking-[1px] uppercase mb-2 sm:mb-3 text-center">
            Demo-Zugänge
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Admin */}
            <button
              onClick={() => quickLogin("admin", "admin")}
              className="rounded-xl p-2.5 sm:p-3 border border-white/[0.06] bg-transparent cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-left group"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Shield size={12} className="text-amber-400" />
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-white/70 group-hover:text-white transition-colors leading-tight">
                  Admin
                </span>
              </div>
              <div className="text-[10px] text-white/20 leading-relaxed">
                <span className="text-white/35 font-mono text-[9px] sm:text-[10px]">admin / admin</span>
              </div>
              <div className="text-[8px] sm:text-[9px] text-amber-500/50 mt-1 font-semibold">Vollzugriff</div>
            </button>

            {/* Mitarbeiter */}
            <button
              onClick={() => quickLogin("mitarbeiter", "mitarbeiter")}
              className="rounded-xl p-2.5 sm:p-3 border border-white/[0.06] bg-transparent cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-left group"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-blue-400" />
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-white/70 group-hover:text-white transition-colors leading-tight">
                  Mitarbeiter
                </span>
              </div>
              <div className="text-[10px] text-white/20 leading-relaxed">
                <span className="text-white/35 font-mono text-[9px] sm:text-[10px]">mitarbeiter</span>
              </div>
              <div className="text-[8px] sm:text-[9px] text-blue-400/50 mt-1 font-semibold">Eingeschränkt</div>
            </button>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-6 text-[9px] sm:text-[10px] text-white/15 px-2">
          Ce-eS Management Consultant · Im Zukunftspark 4 · 74076 Heilbronn
        </div>
      </div>
    </div>
  );
}
