// ─── Creditor / Settlement Tracking (CORE BUSINESS) ───

export type VerhandlungsStatus =
  | "nicht_kontaktiert"
  | "kontaktiert"
  | "in_verhandlung"
  | "angebot_gemacht"
  | "angebot_angenommen"
  | "zahlung_vereinbart"
  | "erledigt"
  | "abgelehnt";

export type MandantPhase =
  | "erstberatung"
  | "erfassung"
  | "anwalt_beauftragt"
  | "gläubiger_kontaktiert"
  | "in_verhandlung"
  | "vergleiche_laufend"
  | "abgeschlossen";

export type FristTyp = "insolvenzantrag" | "mahnbescheid" | "vollstreckung" | "vergleichsangebot" | "stundung" | "ratenzahlung" | "gerichtstermin";

export interface Glaeubiger {
  id: string;
  clientId: number;
  name: string;
  typ: "bank" | "versandhaus" | "finanzamt" | "vermieter" | "dienstleister" | "kreditkarte" | "inkasso" | "sonstige";
  originalBetrag: number;
  aktuellerBetrag: number;
  vergleichsAngebot: number | null;
  vergleichAkzeptiert: boolean;
  gezahlt: number;
  status: VerhandlungsStatus;
  anwalt: string | null;
  kontaktDatum: string | null;
  letzteAktion: string;
  naechsteFrist: string | null;
  fristTyp: FristTyp | null;
  notizen: string;
  pfaendung: boolean;
  aktenzeichen: string | null;
}

export interface MandantFortschritt {
  clientId: number;
  phase: MandantPhase;
  startDatum: string;
  schuldenStart: number;
  schuldenAktuell: number;
  vergleicheErreicht: number;
  glaeubigerGesamt: number;
  glaeubigerErledigt: number;
  anwalt: string;
  naechsterSchritt: string;
}

export interface Frist {
  id: string;
  clientId: number;
  clientName: string;
  typ: FristTyp;
  datum: string;
  beschreibung: string;
  kritisch: boolean;
  erledigt: boolean;
}

// ─── Gläubiger-Daten für Schuldner-Mandanten ───
export const GLAEUBIGER: Glaeubiger[] = [
  // Sandra Becker (clientId: 2) – 4 Gläubiger, 34.520€
  { id:"GL-B01", clientId:2, name:"Sparkasse Heilbronn", typ:"bank", originalBetrag:14200, aktuellerBetrag:14200, vergleichsAngebot:8500, vergleichAkzeptiert:false, gezahlt:0, status:"angebot_gemacht", anwalt:"RA Keller", kontaktDatum:"2025-01-18", letzteAktion:"Vergleichsangebot 8.500€ (60%) an Sparkasse gesendet, Frist 28.02.", naechsteFrist:"2025-02-28", fristTyp:"vergleichsangebot", notizen:"Sachbearbeiterin Fr. Müller, Sparkasse hat Gesprächsbereitschaft signalisiert", pfaendung:false, aktenzeichen:null },
  { id:"GL-B02", clientId:2, name:"Barclays Kreditkarte", typ:"kreditkarte", originalBetrag:8500, aktuellerBetrag:8500, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"kontaktiert", anwalt:"RA Keller", kontaktDatum:"2025-01-20", letzteAktion:"Erste Kontaktaufnahme, warten auf Rückmeldung", naechsteFrist:"2025-02-15", fristTyp:"mahnbescheid", notizen:"Inkasso EOS angekündigt", pfaendung:false, aktenzeichen:null },
  { id:"GL-B03", clientId:2, name:"Klarna / Zalando", typ:"versandhaus", originalBetrag:6820, aktuellerBetrag:6820, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"in_verhandlung", anwalt:"RA Keller", kontaktDatum:"2025-01-22", letzteAktion:"Mahnbescheid AG Heilbronn Az. 12 C 4567/24 – Widerspruch eingelegt", naechsteFrist:"2025-02-20", fristTyp:"mahnbescheid", notizen:"Widerspruch fristgerecht eingelegt, Verhandlung läuft", pfaendung:false, aktenzeichen:"12 C 4567/24" },
  { id:"GL-B04", clientId:2, name:"Vermieter Rückstand", typ:"vermieter", originalBetrag:5000, aktuellerBetrag:5000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"kontaktiert", anwalt:null, kontaktDatum:"2025-01-25", letzteAktion:"Direkte Kontaktaufnahme, Ratenzahlung vorgeschlagen", naechsteFrist:"2025-02-28", fristTyp:"ratenzahlung", notizen:"Vermieter zeigt sich gesprächsbereit, 250€/Monat vorgeschlagen", pfaendung:false, aktenzeichen:null },

  // Klaus Richter (clientId: 5) – 3 Gläubiger, 12.800€
  { id:"GL-R01", clientId:5, name:"Commerzbank", typ:"bank", originalBetrag:6200, aktuellerBetrag:5500, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:700, status:"zahlung_vereinbart", anwalt:"RA Keller", kontaktDatum:"2025-01-05", letzteAktion:"Ratenzahlung 150€/Monat vereinbart, läuft seit Feb", naechsteFrist:null, fristTyp:null, notizen:"Vereinbarung: 150€/Monat über 42 Monate, Zinsverzicht ab 01.02.", pfaendung:false, aktenzeichen:null },
  { id:"GL-R02", clientId:5, name:"MediaMarkt / CreditPlus", typ:"dienstleister", originalBetrag:4100, aktuellerBetrag:4100, vergleichsAngebot:2000, vergleichAkzeptiert:false, gezahlt:0, status:"angebot_gemacht", anwalt:"RA Keller", kontaktDatum:"2025-01-15", letzteAktion:"Vergleichsangebot 2.000€ (49%) gesendet", naechsteFrist:"2025-02-22", fristTyp:"vergleichsangebot", notizen:"CreditPlus-Sachbearbeiter prüft Angebot", pfaendung:false, aktenzeichen:null },
  { id:"GL-R03", clientId:5, name:"Stadtwerke Heilbronn", typ:"dienstleister", originalBetrag:2500, aktuellerBetrag:2500, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"in_verhandlung", anwalt:null, kontaktDatum:"2025-01-18", letzteAktion:"Stundung beantragt, Stadtwerke prüfen", naechsteFrist:"2025-02-18", fristTyp:"stundung", notizen:"Abschaltung Strom/Gas angedroht – Eilbedarf!", pfaendung:false, aktenzeichen:null },

  // Claudia Mayer (clientId: 10) – 5 Gläubiger, 35.500€ (21.300€ verbleibend)
  { id:"GL-M01", clientId:10, name:"Targobank", typ:"bank", originalBetrag:8500, aktuellerBetrag:0, vergleichsAngebot:4200, vergleichAkzeptiert:true, gezahlt:4200, status:"erledigt", anwalt:"RA Dr. Bauer", kontaktDatum:"2024-11-10", letzteAktion:"Vergleich erfolgreich! 4.200€ statt 8.500€ gezahlt", naechsteFrist:null, fristTyp:null, notizen:"50,6% Ersparnis – Vergleichsvereinbarung vom 15.01.2025", pfaendung:false, aktenzeichen:null },
  { id:"GL-M02", clientId:10, name:"Otto Versand", typ:"versandhaus", originalBetrag:4300, aktuellerBetrag:0, vergleichsAngebot:1800, vergleichAkzeptiert:true, gezahlt:1800, status:"erledigt", anwalt:"RA Dr. Bauer", kontaktDatum:"2024-11-15", letzteAktion:"Vergleich erfolgreich! 1.800€ statt 4.300€ gezahlt", naechsteFrist:null, fristTyp:null, notizen:"58,1% Ersparnis – Vergleich vom 20.01.2025", pfaendung:false, aktenzeichen:null },
  { id:"GL-M03", clientId:10, name:"Santander Consumer Bank", typ:"bank", originalBetrag:9200, aktuellerBetrag:9200, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"in_verhandlung", anwalt:"RA Dr. Bauer", kontaktDatum:"2025-01-10", letzteAktion:"Vergleichsgespräch für 12.02.2025 vereinbart", naechsteFrist:"2025-02-12", fristTyp:"vergleichsangebot", notizen:"Ansprechpartnerin Fr. Wagner, zeigt Gesprächsbereitschaft", pfaendung:false, aktenzeichen:null },
  { id:"GL-M04", clientId:10, name:"Consors Finanz", typ:"bank", originalBetrag:7800, aktuellerBetrag:7800, vergleichsAngebot:3500, vergleichAkzeptiert:false, gezahlt:0, status:"angebot_gemacht", anwalt:"RA Dr. Bauer", kontaktDatum:"2025-01-05", letzteAktion:"Vergleichsangebot 3.500€ (45%) gesendet, warten", naechsteFrist:"2025-02-25", fristTyp:"vergleichsangebot", notizen:"Inkasso-Abteilung prüft, Rückmeldung erwartet", pfaendung:false, aktenzeichen:null },
  { id:"GL-M05", clientId:10, name:"Vodafone / Inkasso", typ:"inkasso", originalBetrag:5700, aktuellerBetrag:4300, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:1400, status:"zahlung_vereinbart", anwalt:null, kontaktDatum:"2024-12-01", letzteAktion:"Ratenzahlung 200€/Monat, 7 von 21 Raten gezahlt", naechsteFrist:null, fristTyp:null, notizen:"Laufende Ratenzahlung, bisher pünktlich", pfaendung:false, aktenzeichen:null },

  // Maria Braun (clientId: 8) – 2 Gläubiger, 8.450€
  { id:"GL-BR01", clientId:8, name:"Consors Finanz", typ:"bank", originalBetrag:5200, aktuellerBetrag:5200, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"nicht_kontaktiert", anwalt:null, kontaktDatum:null, letzteAktion:"Erstberatung erfolgt, Schuldenaufstellung läuft", naechsteFrist:"2025-02-15", fristTyp:"mahnbescheid", notizen:"Mahnung Stufe 3 erhalten, Inkasso angekündigt", pfaendung:false, aktenzeichen:null },
  { id:"GL-BR02", clientId:8, name:"Bonprix Versand", typ:"versandhaus", originalBetrag:3250, aktuellerBetrag:3250, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"nicht_kontaktiert", anwalt:null, kontaktDatum:null, letzteAktion:"Noch nicht kontaktiert", naechsteFrist:"2025-02-10", fristTyp:"mahnbescheid", notizen:"Gerichtlicher Mahnbescheid angekündigt", pfaendung:false, aktenzeichen:null },

  // Markus Weber Unternehmen (clientId: 3) – 4 Gläubiger, 185.000€
  { id:"GL-W01", clientId:3, name:"Sparkasse Heilbronn", typ:"bank", originalBetrag:78000, aktuellerBetrag:78000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"in_verhandlung", anwalt:"RA Dr. Bauer", kontaktDatum:"2024-12-15", letzteAktion:"Stillhalteabkommen bis 28.02. – Sanierungskonzept Bedingung", naechsteFrist:"2025-02-28", fristTyp:"insolvenzantrag", notizen:"KRITISCH: Frist 28.02. für Sanierungskonzept, sonst kündigt Bank Kredit", pfaendung:false, aktenzeichen:null },
  { id:"GL-W02", clientId:3, name:"Volksbank Heilbronn", typ:"bank", originalBetrag:42000, aktuellerBetrag:42000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"kontaktiert", anwalt:"RA Dr. Bauer", kontaktDatum:"2025-01-10", letzteAktion:"Erstgespräch geführt, Stillhalteabkommen erbeten", naechsteFrist:"2025-02-20", fristTyp:"vollstreckung", notizen:"Volksbank wartet Sparkasse-Entscheidung ab", pfaendung:false, aktenzeichen:null },
  { id:"GL-W03", clientId:3, name:"Finanzamt Heilbronn", typ:"finanzamt", originalBetrag:35000, aktuellerBetrag:35000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"in_verhandlung", anwalt:null, kontaktDatum:"2025-01-15", letzteAktion:"Stundung USt Q3+Q4/2024 gewährt bis 31.03.2025", naechsteFrist:"2025-03-31", fristTyp:"stundung", notizen:"Stundung genehmigt – Raten ab April vereinbaren", pfaendung:false, aktenzeichen:null },
  { id:"GL-W04", clientId:3, name:"Schmid GmbH (Lieferant)", typ:"sonstige", originalBetrag:30000, aktuellerBetrag:30000, vergleichsAngebot:22000, vergleichAkzeptiert:false, gezahlt:0, status:"angebot_gemacht", anwalt:"RA Dr. Bauer", kontaktDatum:"2025-01-20", letzteAktion:"Vergleich 22.000€ (73%) angeboten, Schmid prüft", naechsteFrist:"2025-02-15", fristTyp:"vergleichsangebot", notizen:"Schmid droht mit Lieferstopp, Vergleich dringend", pfaendung:false, aktenzeichen:null },

  // Peter Klein Gastronomie (clientId: 7) – 3 Gläubiger
  { id:"GL-K01", clientId:7, name:"Finanzamt Heilbronn", typ:"finanzamt", originalBetrag:28000, aktuellerBetrag:28000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"kontaktiert", anwalt:"RA Schmidt", kontaktDatum:"2025-01-28", letzteAktion:"Stundungsantrag eingereicht, Vollstreckung angedroht", naechsteFrist:"2025-02-14", fristTyp:"vollstreckung", notizen:"USt+LSt Rückstände, Vollstreckungsankündigung erhalten", pfaendung:true, aktenzeichen:null },
  { id:"GL-K02", clientId:7, name:"Brauerei Dinkelacker", typ:"sonstige", originalBetrag:38000, aktuellerBetrag:38000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"in_verhandlung", anwalt:"RA Schmidt", kontaktDatum:"2025-02-01", letzteAktion:"Ratenzahlung verhandelt, Lieferung vorerst fortgesetzt", naechsteFrist:"2025-02-28", fristTyp:"ratenzahlung", notizen:"Lieferantenkredit, droht mit Lieferstopp", pfaendung:false, aktenzeichen:null },
  { id:"GL-K03", clientId:7, name:"Vermieter Gewerberäume", typ:"vermieter", originalBetrag:29000, aktuellerBetrag:29000, vergleichsAngebot:null, vergleichAkzeptiert:false, gezahlt:0, status:"kontaktiert", anwalt:"RA Schmidt", kontaktDatum:"2025-02-03", letzteAktion:"Mietrückstand 6 Monate, Räumungsklage angedroht", naechsteFrist:"2025-02-21", fristTyp:"vollstreckung", notizen:"Räumungsklage droht – höchste Priorität!", pfaendung:false, aktenzeichen:null },
];

// ─── Mandanten-Fortschritt ───
export const MANDANTEN_FORTSCHRITT: MandantFortschritt[] = [
  { clientId:2, phase:"in_verhandlung", startDatum:"2024-11-03", schuldenStart:34520, schuldenAktuell:34520, vergleicheErreicht:0, glaeubigerGesamt:4, glaeubigerErledigt:0, anwalt:"RA Keller", naechsterSchritt:"Vergleichsantwort Sparkasse abwarten (Frist 28.02.)" },
  { clientId:5, phase:"vergleiche_laufend", startDatum:"2025-01-22", schuldenStart:12800, schuldenAktuell:12100, vergleicheErreicht:0, glaeubigerGesamt:3, glaeubigerErledigt:0, anwalt:"RA Keller", naechsterSchritt:"CreditPlus-Vergleich klären, Stadtwerke-Stundung sichern" },
  { clientId:10, phase:"vergleiche_laufend", startDatum:"2024-10-15", schuldenStart:35500, schuldenAktuell:21300, vergleicheErreicht:2, glaeubigerGesamt:5, glaeubigerErledigt:2, anwalt:"RA Dr. Bauer", naechsterSchritt:"Santander-Vergleichsgespräch 12.02., Consors-Angebot nachfassen" },
  { clientId:8, phase:"erfassung", startDatum:"2025-02-01", schuldenStart:8450, schuldenAktuell:8450, vergleicheErreicht:0, glaeubigerGesamt:2, glaeubigerErledigt:0, anwalt:"—", naechsterSchritt:"Anwalt beauftragen, Gläubiger kontaktieren" },
  { clientId:3, phase:"gläubiger_kontaktiert", startDatum:"2024-06-20", schuldenStart:185000, schuldenAktuell:185000, vergleicheErreicht:0, glaeubigerGesamt:4, glaeubigerErledigt:0, anwalt:"RA Dr. Bauer", naechsterSchritt:"Sanierungskonzept bis 28.02. vorlegen (Sparkasse-Frist!)" },
  { clientId:7, phase:"gläubiger_kontaktiert", startDatum:"2024-09-08", schuldenStart:95000, schuldenAktuell:95000, vergleicheErreicht:0, glaeubigerGesamt:3, glaeubigerErledigt:0, anwalt:"RA Schmidt", naechsterSchritt:"Haftungsprüfung GF abschließen, Insolvenzantragsfrist beachten!" },
];

// ─── Fristen ───
export const FRISTEN: Frist[] = [
  { id:"FR-01", clientId:8, clientName:"Maria Braun", typ:"mahnbescheid", datum:"2025-02-10", beschreibung:"Bonprix – Gerichtlicher Mahnbescheid droht, Widerspruchsfrist", kritisch:true, erledigt:false },
  { id:"FR-02", clientId:10, clientName:"Claudia Mayer", typ:"vergleichsangebot", datum:"2025-02-12", beschreibung:"Santander – Vergleichsgespräch Termin", kritisch:false, erledigt:false },
  { id:"FR-03", clientId:7, clientName:"Peter Klein", typ:"vollstreckung", datum:"2025-02-14", beschreibung:"Finanzamt – Vollstreckungsankündigung USt+LSt", kritisch:true, erledigt:false },
  { id:"FR-04", clientId:2, clientName:"Sandra Becker", typ:"mahnbescheid", datum:"2025-02-15", beschreibung:"Barclays – Inkasso EOS angekündigt", kritisch:true, erledigt:false },
  { id:"FR-05", clientId:3, clientName:"Markus Weber", typ:"vergleichsangebot", datum:"2025-02-15", beschreibung:"Schmid GmbH – Vergleichsantwort erwartet", kritisch:false, erledigt:false },
  { id:"FR-06", clientId:5, clientName:"Klaus Richter", typ:"stundung", datum:"2025-02-18", beschreibung:"Stadtwerke – Stundungsentscheidung erwartet", kritisch:true, erledigt:false },
  { id:"FR-07", clientId:2, clientName:"Sandra Becker", typ:"mahnbescheid", datum:"2025-02-20", beschreibung:"Klarna – Gerichtsverhandlung nach Widerspruch", kritisch:false, erledigt:false },
  { id:"FR-08", clientId:3, clientName:"Markus Weber", typ:"vollstreckung", datum:"2025-02-20", beschreibung:"Volksbank – Entscheidung Stillhalteabkommen", kritisch:true, erledigt:false },
  { id:"FR-09", clientId:7, clientName:"Peter Klein", typ:"vollstreckung", datum:"2025-02-21", beschreibung:"Vermieter – Räumungsklage droht!", kritisch:true, erledigt:false },
  { id:"FR-10", clientId:5, clientName:"Klaus Richter", typ:"vergleichsangebot", datum:"2025-02-22", beschreibung:"CreditPlus – Vergleichsantwort erwartet", kritisch:false, erledigt:false },
  { id:"FR-11", clientId:10, clientName:"Claudia Mayer", typ:"vergleichsangebot", datum:"2025-02-25", beschreibung:"Consors Finanz – Vergleichsangebot 3.500€ Frist", kritisch:false, erledigt:false },
  { id:"FR-12", clientId:2, clientName:"Sandra Becker", typ:"vergleichsangebot", datum:"2025-02-28", beschreibung:"Sparkasse – Vergleichsangebot 8.500€ Antwortfrist", kritisch:true, erledigt:false },
  { id:"FR-13", clientId:3, clientName:"Markus Weber", typ:"insolvenzantrag", datum:"2025-02-28", beschreibung:"KRITISCH: Sparkasse-Frist für Sanierungskonzept!", kritisch:true, erledigt:false },
  { id:"FR-14", clientId:7, clientName:"Peter Klein", typ:"ratenzahlung", datum:"2025-02-28", beschreibung:"Brauerei – Ratenzahlungsvereinbarung Frist", kritisch:false, erledigt:false },
  { id:"FR-15", clientId:3, clientName:"Markus Weber", typ:"stundung", datum:"2025-03-31", beschreibung:"Finanzamt – Stundung USt läuft aus", kritisch:false, erledigt:false },
];

// ─── Helpers ───
export const PHASE_LABELS: Record<MandantPhase, {label:string; color:string; step:number}> = {
  erstberatung:          { label:"Erstberatung", color:"#94a3b8", step:1 },
  erfassung:             { label:"Schuldenerfassung", color:"#6366f1", step:2 },
  anwalt_beauftragt:     { label:"Anwalt beauftragt", color:"#8b5cf6", step:3 },
  "gläubiger_kontaktiert":{ label:"Gläubiger kontaktiert", color:"#d97706", step:4 },
  in_verhandlung:        { label:"In Verhandlung", color:"#ea580c", step:5 },
  vergleiche_laufend:    { label:"Vergleiche laufend", color:"#0891b2", step:6 },
  abgeschlossen:         { label:"Abgeschlossen", color:"#16a34a", step:7 },
};

export const STATUS_LABELS: Record<VerhandlungsStatus, {label:string; color:string; bg:string}> = {
  nicht_kontaktiert: { label:"Nicht kontaktiert", color:"#94a3b8", bg:"#f1f5f9" },
  kontaktiert:       { label:"Kontaktiert", color:"#6366f1", bg:"#eef2ff" },
  in_verhandlung:    { label:"In Verhandlung", color:"#d97706", bg:"#fffbeb" },
  angebot_gemacht:   { label:"Angebot gemacht", color:"#ea580c", bg:"#fff7ed" },
  angebot_angenommen:{ label:"Angenommen", color:"#0891b2", bg:"#ecfeff" },
  zahlung_vereinbart:{ label:"Ratenzahlung", color:"#7c3aed", bg:"#f5f3ff" },
  erledigt:          { label:"✓ Erledigt", color:"#16a34a", bg:"#f0fdf4" },
  abgelehnt:         { label:"Abgelehnt", color:"#dc2626", bg:"#fef2f2" },
};

export const FRIST_LABELS: Record<FristTyp, {label:string; icon:string; color:string}> = {
  insolvenzantrag:   { label:"Insolvenzantrag", icon:"🚨", color:"#dc2626" },
  mahnbescheid:      { label:"Mahnbescheid", icon:"⚖️", color:"#ea580c" },
  vollstreckung:     { label:"Vollstreckung", icon:"🔴", color:"#dc2626" },
  vergleichsangebot: { label:"Vergleich", icon:"🤝", color:"#0891b2" },
  stundung:          { label:"Stundung", icon:"⏸️", color:"#7c3aed" },
  ratenzahlung:      { label:"Ratenzahlung", icon:"💰", color:"#16a34a" },
  gerichtstermin:    { label:"Gerichtstermin", icon:"🏛️", color:"#d97706" },
};

export const fmtPct = (orig: number, current: number) => {
  if (orig === 0) return "0%";
  return Math.round(((orig - current) / orig) * 100) + "%";
};
