// ─── Types ───

// Demo-Referenzdatum: alle Fristen/Termine sind relativ zu diesem Datum
// Im Produktionsbetrieb würde hier new Date() stehen
export const DEMO_TODAY = "2025-02-05";
export function demoToday(): Date { return new Date(DEMO_TODAY + "T12:00:00"); }
export function demoTodayStr(): string { return DEMO_TODAY; }

export type ClientStatus = "aktiv" | "kritisch" | "abgeschlossen";
export type BeratungsTyp = "Managementberatung" | "Schuldnerberatung" | "Insolvenzberatung" | "Coaching";
export type InvoiceStatus = "offen" | "bezahlt" | "überfällig" | "entwurf" | "storniert";
export type OfferStatus = "versendet" | "angenommen" | "entwurf" | "abgelehnt" | "offen" | "abgelaufen";
export type Priority = "hoch" | "normal" | "niedrig";
export type DocType = "pdf" | "docx" | "xlsx" | "email" | "scan" | "note";

export interface Client {
  id: number; name: string; company: string | null; type: BeratungsTyp; subtype: string;
  phone: string; email: string; address: string; status: ClientStatus;
  schulden: number | null; created: string; notes: string;
}
export interface Appointment {
  id: number; clientId: number; title: string; date: string; time: string;
  duration: number; type: BeratungsTyp; location: string; priority: Priority;
}
export interface Invoice {
  id: string; clientId: number; amount: number; date: string; due: string;
  status: InvoiceStatus; description: string;
}
export interface Offer {
  id: string; clientId: number; amount: number; date: string; validUntil: string;
  status: OfferStatus; description: string;
}
export interface CaseFile {
  id: number; clientId: number; name: string; docs: Document[]; lastUpdate: string;
  category: BeratungsTyp; urgent: boolean;
}
export interface Document {
  id: string; name: string; type: DocType; size: string; date: string;
  preview: string;
  fileData?: string; // base64 encoded file content
  mimeType?: string; // e.g. application/pdf
}
export interface DatevEntry {
  id: string; date: string; kontoSoll: string; kontoHaben: string; betrag: number;
  buchungstext: string; belegnr: string; status: "gebucht" | "offen" | "fehlerhaft";
}
export interface BankTransaction {
  id: string; date: string; betrag: number; gegenkonto: string; verwendungszweck: string;
  saldo: number; type: "eingang" | "ausgang";
}

// ─── Clients ───
export const CLIENTS: Client[] = [
  { id:1, name:"Thomas Müller", company:"Müller Maschinenbau GmbH", type:"Managementberatung", subtype:"Krisenmanagement", phone:"+49 7131 456789", email:"t.mueller@mm-gmbh.de", address:"Industriestr. 12, 74072 Heilbronn", status:"aktiv", schulden:null, created:"2024-08-15", notes:"Restrukturierung Produktion, wöchentliche Meetings. Kostensenkungsprogramm seit Q4/2024." },
  { id:2, name:"Sandra Becker", company:null, type:"Schuldnerberatung", subtype:"Vergleichsverhandlung", phone:"+49 7133 234567", email:"s.becker@web.de", address:"Gartenstr. 5, 74076 Heilbronn", status:"aktiv", schulden:34520, created:"2024-11-03", notes:"4 Gläubiger, Vergleich mit Sparkasse läuft. Ratenzahlungsplan wird erstellt." },
  { id:3, name:"Markus Weber", company:"Weber & Söhne KG", type:"Insolvenzberatung", subtype:"Insolvenzabwendung", phone:"+49 7132 987654", email:"m.weber@weber-soehne.de", address:"Hauptstr. 88, 74081 Heilbronn", status:"kritisch", schulden:185000, created:"2024-06-20", notes:"Drohende Insolvenz, Frist 28.02.2025 – Eilbedarf! Sanierungskonzept wird erarbeitet." },
  { id:4, name:"Lisa Hoffmann", company:"Hoffmann Consulting", type:"Managementberatung", subtype:"Neugründung", phone:"+49 176 34567890", email:"lisa@hoffmann-consulting.de", address:"Mozartstr. 3, 74074 Heilbronn", status:"aktiv", schulden:null, created:"2025-01-10", notes:"Businessplan-Erstellung, Fördermittelberatung. KfW-Antrag in Vorbereitung." },
  { id:5, name:"Klaus Richter", company:null, type:"Schuldnerberatung", subtype:"Schuldenabbau", phone:"+49 7133 111222", email:"k.richter@gmx.de", address:"Am Markt 7, 74078 Heilbronn", status:"aktiv", schulden:12800, created:"2025-01-22", notes:"3 Gläubiger, Ratenzahlung vereinbart. Monatliche Rate: 250 €." },
  { id:6, name:"Anna Schwarz", company:"Schwarz IT Solutions", type:"Managementberatung", subtype:"Marketingstrategie", phone:"+49 7131 556677", email:"a.schwarz@schwarz-it.de", address:"Technopark 5, 74076 Heilbronn", status:"abgeschlossen", schulden:null, created:"2024-03-12", notes:"Projekt erfolgreich abgeschlossen. Umsatzsteigerung von 22 % erreicht." },
  { id:7, name:"Peter Klein", company:"Klein Gastronomie GmbH", type:"Insolvenzberatung", subtype:"Insolvenzverschleppung", phone:"+49 7133 445566", email:"p.klein@klein-gastro.de", address:"Bahnhofstr. 22, 74076 Heilbronn", status:"kritisch", schulden:95000, created:"2024-09-08", notes:"Dringende Beratung wg. Haftungsrisiken. Anwalt eingeschaltet." },
  { id:8, name:"Maria Braun", company:null, type:"Schuldnerberatung", subtype:"Vergleichsverhandlung", phone:"+49 176 99887766", email:"m.braun@outlook.de", address:"Ringstr. 14, 74072 Heilbronn", status:"aktiv", schulden:8450, created:"2025-02-01", notes:"Erstberatung erfolgt, Schuldenaufstellung läuft." },
  { id:9, name:"Stefan Fuchs", company:"Fuchs Bau GmbH", type:"Managementberatung", subtype:"Interims-Management", phone:"+49 7131 778899", email:"s.fuchs@fuchs-bau.de", address:"Neckarstr. 45, 74072 Heilbronn", status:"aktiv", schulden:null, created:"2024-12-01", notes:"Interims-Geschäftsführung seit Dez 2024. Stabilisierung läuft." },
  { id:10, name:"Claudia Mayer", company:null, type:"Schuldnerberatung", subtype:"Schuldenabbau", phone:"+49 176 55443322", email:"c.mayer@yahoo.de", address:"Bergstr. 8, 74074 Heilbronn", status:"aktiv", schulden:21300, created:"2024-10-15", notes:"5 Gläubiger. Schulden um 40 % reduziert." },
];

export const APPOINTMENTS: Appointment[] = [
  { id:1, clientId:3, title:"Eiltermin Weber & Söhne", date:"2025-02-05", time:"09:00", duration:90, type:"Insolvenzberatung", location:"Büro Heilbronn", priority:"hoch" },
  { id:2, clientId:2, title:"Vergleichsgespräch Becker", date:"2025-02-05", time:"11:00", duration:60, type:"Schuldnerberatung", location:"Büro Heilbronn", priority:"normal" },
  { id:3, clientId:4, title:"Businessplan Review Hoffmann", date:"2025-02-05", time:"14:30", duration:60, type:"Managementberatung", location:"Vor Ort", priority:"normal" },
  { id:4, clientId:1, title:"Restrukturierung Update Müller", date:"2025-02-06", time:"10:00", duration:120, type:"Managementberatung", location:"Müller Maschinenbau", priority:"normal" },
  { id:5, clientId:7, title:"Haftungsprüfung Klein", date:"2025-02-06", time:"14:00", duration:90, type:"Insolvenzberatung", location:"Büro Heilbronn", priority:"hoch" },
  { id:6, clientId:8, title:"Erstberatung Braun", date:"2025-02-07", time:"09:30", duration:60, type:"Schuldnerberatung", location:"Büro Heilbronn", priority:"normal" },
  { id:7, clientId:5, title:"Ratenzahlung Richter", date:"2025-02-07", time:"11:00", duration:45, type:"Schuldnerberatung", location:"Telefonisch", priority:"niedrig" },
  { id:8, clientId:9, title:"Interims-Report Fuchs Bau", date:"2025-02-07", time:"15:00", duration:90, type:"Managementberatung", location:"Fuchs Bau GmbH", priority:"normal" },
  { id:9, clientId:10, title:"Vergleichsergebnis Mayer", date:"2025-02-10", time:"09:00", duration:60, type:"Schuldnerberatung", location:"Büro Heilbronn", priority:"normal" },
  { id:10, clientId:1, title:"Coaching Sitzung Müller", date:"2025-02-10", time:"14:00", duration:120, type:"Coaching", location:"Büro Heilbronn", priority:"normal" },
];

export const INVOICES: Invoice[] = [
  { id:"RE-2025-001", clientId:1, amount:4800, date:"2025-01-15", due:"2025-02-14", status:"offen", description:"Krisenmanagement-Beratung Januar 2025" },
  { id:"RE-2025-002", clientId:2, amount:1200, date:"2025-01-20", due:"2025-02-19", status:"bezahlt", description:"Schuldnerberatung – Vergleichsverhandlung" },
  { id:"RE-2025-003", clientId:4, amount:2400, date:"2025-01-25", due:"2025-02-24", status:"offen", description:"Neugründungsberatung & Businessplan Phase 1" },
  { id:"RE-2025-004", clientId:3, amount:3600, date:"2025-01-28", due:"2025-02-27", status:"überfällig", description:"Insolvenzberatung – Eilmandat Weber & Söhne" },
  { id:"RE-2025-005", clientId:7, amount:2800, date:"2025-02-01", due:"2025-03-03", status:"offen", description:"Insolvenzberatung – Haftungsprüfung GF" },
  { id:"RE-2024-048", clientId:6, amount:5200, date:"2024-12-10", due:"2025-01-09", status:"bezahlt", description:"Marketingstrategie Schwarz IT" },
  { id:"RE-2025-006", clientId:5, amount:850, date:"2025-02-03", due:"2025-03-05", status:"entwurf", description:"Schuldnerberatung – Ratenzahlungsvereinbarung" },
  { id:"RE-2025-007", clientId:9, amount:6200, date:"2025-02-01", due:"2025-03-03", status:"offen", description:"Interims-Management Fuchs Bau – Feb 2025" },
  { id:"RE-2025-008", clientId:10, amount:980, date:"2025-01-30", due:"2025-02-28", status:"bezahlt", description:"Schuldnerberatung – Vergleich Mayer" },
];

export const OFFERS: Offer[] = [
  { id:"AN-2025-001", clientId:8, amount:1500, date:"2025-02-01", validUntil:"2025-02-28", status:"versendet", description:"Schuldnerberatung – Komplettpaket Braun" },
  { id:"AN-2025-002", clientId:1, amount:8400, date:"2025-01-30", validUntil:"2025-02-28", status:"angenommen", description:"Interims-Management Feb–Apr 2025 Müller" },
  { id:"AN-2025-003", clientId:4, amount:3200, date:"2025-02-03", validUntil:"2025-03-05", status:"entwurf", description:"Fördermittelberatung & Coaching Hoffmann" },
  { id:"AN-2024-018", clientId:6, amount:5200, date:"2024-11-15", validUntil:"2024-12-15", status:"angenommen", description:"Marketingstrategie Schwarz IT" },
  { id:"AN-2025-004", clientId:7, amount:4500, date:"2025-02-04", validUntil:"2025-03-04", status:"versendet", description:"Sanierungsberatung Klein Gastronomie" },
  { id:"AN-2025-005", clientId:9, amount:18600, date:"2025-01-28", validUntil:"2025-02-15", status:"angenommen", description:"Interims-Management Q1 2025 Fuchs Bau" },
];

// ─── Documents inside case files ───
export const CASE_FILES: CaseFile[] = [
  { id:1, clientId:3, name:"Insolvenzabwendung Weber & Söhne", lastUpdate:"2025-02-04", category:"Insolvenzberatung", urgent:true,
    docs: [
      { id:"d1-1", name:"Sanierungskonzept_v3.pdf", type:"pdf", size:"2.4 MB", date:"2025-02-04", preview:"Sanierungskonzept mit Maßnahmenplan, Zeitplan und Finanzierungsvorschlag für Weber & Söhne KG. Inhalt: Kostenreduktion Personal (-15%), Standortkonsolidierung, Verhandlung Bankenpool." },
      { id:"d1-2", name:"Gläubigerliste_komplett.xlsx", type:"xlsx", size:"145 KB", date:"2025-02-03", preview:"Gläubiger: Sparkasse HN (78.000€), Volksbank (42.000€), Finanzamt HN (35.000€), Lieferant Schmid GmbH (30.000€). Gesamt: 185.000€." },
      { id:"d1-3", name:"Anwaltsschreiben_RA_Bauer.pdf", type:"pdf", size:"890 KB", date:"2025-02-01", preview:"Stellungnahme RA Dr. Bauer zur Haftungssituation der Geschäftsführer. Empfehlung: Sofortige Einberufung Gesellschafterversammlung." },
      { id:"d1-4", name:"Bilanz_2024_vorlaeufig.pdf", type:"pdf", size:"1.8 MB", date:"2025-01-28", preview:"Vorläufige Bilanz 2024: Bilanzsumme 1.2 Mio €, EK-Quote 8.3% (kritisch), Umsatz -22% ggü. Vorjahr." },
      { id:"d1-5", name:"Protokoll_Bankengespräch_20250125.docx", type:"docx", size:"320 KB", date:"2025-01-25", preview:"Protokoll Gespräch mit Sparkasse HN: Stillhalteabkommen bis 28.02., Bedingung: Vorlage Sanierungskonzept." },
      { id:"d1-6", name:"Mail_FA_Heilbronn_Stundung.email", type:"email", size:"45 KB", date:"2025-01-20", preview:"Finanzamt Heilbronn gewährt vorläufige Stundung USt Q3+Q4/2024 (35.000€) bis 31.03.2025." },
      { id:"d1-7", name:"Organigramm_IST_SOLL.pdf", type:"pdf", size:"560 KB", date:"2025-01-15", preview:"Vergleich IST-Organisation (47 MA) vs. SOLL (38 MA). Abbau in Verwaltung (-4) und Logistik (-5)." },
      { id:"d1-8", name:"Liquiditätsplanung_Q1_2025.xlsx", type:"xlsx", size:"210 KB", date:"2025-02-04", preview:"Woche 6-13: Krit. Liquiditätsengpass KW8 (Deckungslücke ca. 18.000€). Maßnahme: Factoring Debitoren." },
      { id:"d1-9", name:"Scan_Handelsregisterauszug.scan", type:"scan", size:"1.1 MB", date:"2024-12-10", preview:"HRA 12445, AG Heilbronn. Weber & Söhne KG, Komplementär: Markus Weber." },
      { id:"d1-10", name:"Vermerk_Erstgespräch.note", type:"note", size:"28 KB", date:"2024-06-20", preview:"Erstgespräch mit Herrn Weber: Umsatzrückgang seit 2023, Hauptursache Wegfall Großkunde Automobilzulieferer. Dringender Handlungsbedarf signalisiert." },
      { id:"d1-11", name:"BWA_Dez_2024_DATEV.pdf", type:"pdf", size:"780 KB", date:"2025-01-10", preview:"BWA Dezember 2024: Gesamtleistung 89.200€, Rohertrag 52.100€, Ergebnis vor Steuern: -12.300€." },
      { id:"d1-12", name:"Fotos_Betriebsbegehung.pdf", type:"pdf", size:"5.2 MB", date:"2024-11-15", preview:"Dokumentation Betriebsbegehung: Werkshalle 1 (veraltet), Werkshalle 2 (modernisiert 2021), Bürotrakt, Lager." },
    ]},
  { id:2, clientId:2, name:"Vergleichsakte Becker", lastUpdate:"2025-02-03", category:"Schuldnerberatung", urgent:false,
    docs: [
      { id:"d2-1", name:"Schuldenaufstellung_Becker.xlsx", type:"xlsx", size:"98 KB", date:"2025-01-15", preview:"4 Gläubiger: Sparkasse (14.200€), Barclays Kreditkarte (8.500€), Zalando/Klarna (6.820€), Vermieter Rückstand (5.000€). Gesamt: 34.520€." },
      { id:"d2-2", name:"Vergleichsangebot_Sparkasse.pdf", type:"pdf", size:"420 KB", date:"2025-02-03", preview:"Vergleichsangebot an Sparkasse HN: Einmalzahlung 8.500€ (60% Nachlass). Frist Annahme: 28.02.2025." },
      { id:"d2-3", name:"Einkommensbescheinigung_Becker.scan", type:"scan", size:"650 KB", date:"2025-01-10", preview:"Nettoeinkommen: 1.850€/Monat, Teilzeit 30h/Woche, Arbeitgeber: Stadtwerke Heilbronn." },
      { id:"d2-4", name:"Haushaltsplan_monatlich.xlsx", type:"xlsx", size:"75 KB", date:"2025-01-12", preview:"Einnahmen: 1.850€, Fixkosten: 1.420€ (Miete 680€, NK 180€, Versicherungen 160€, Lebenshaltung 400€). Frei verfügbar: 430€." },
      { id:"d2-5", name:"Vollmacht_Gläubigerverhandlung.pdf", type:"pdf", size:"180 KB", date:"2024-11-05", preview:"Vollmacht für Ce-eS Management Consultant zur Verhandlung mit allen Gläubigern im Namen von Sandra Becker." },
      { id:"d2-6", name:"Ratenzahlungsplan_Entwurf.pdf", type:"pdf", size:"250 KB", date:"2025-02-01", preview:"Vorschlag: 250€/Monat über 36 Monate = 9.000€ an Sparkasse. Restschulderlass bei planmäßiger Tilgung." },
      { id:"d2-7", name:"Mahnbescheid_Klarna_20241201.scan", type:"scan", size:"340 KB", date:"2024-12-01", preview:"Mahnbescheid AG Heilbronn, Az. 12 C 4567/24. Klarna Bank AB fordert 6.820€ zzgl. Zinsen." },
      { id:"d2-8", name:"Beratungsprotokoll_20250103.docx", type:"docx", size:"120 KB", date:"2025-01-03", preview:"Protokoll 2. Beratungstermin: Strategie – Vergleich mit Sparkasse priorisieren, danach Klarna. Mietschulden separat regeln." },
    ]},
  { id:3, clientId:1, name:"Restrukturierung Müller Maschinenbau", lastUpdate:"2025-02-01", category:"Managementberatung", urgent:false,
    docs: [
      { id:"d3-1", name:"Restrukturierungskonzept_v5.pdf", type:"pdf", size:"3.8 MB", date:"2025-02-01", preview:"Gesamtkonzept: 4 Phasen über 18 Monate. Phase 1: Analyse (abgeschlossen), Phase 2: Quick Wins (laufend), Phase 3: Strukturmaßnahmen, Phase 4: Nachhaltigkeit." },
      { id:"d3-2", name:"Kostenanalyse_2024.xlsx", type:"xlsx", size:"890 KB", date:"2025-01-20", preview:"Gesamtkosten 2024: 4.2 Mio €. Identifiziertes Einsparpotenzial: 680.000€ (16.2%). Haupthebel: Einkauf (-280k), Personal (-200k), Prozesse (-200k)." },
      { id:"d3-3", name:"Organigramm_NEU_2025.pdf", type:"pdf", size:"420 KB", date:"2025-01-15", preview:"Neue Struktur: 3 Geschäftsbereiche statt 5 Abteilungen. Wegfall Stabsstelle Marketing (Outsourcing), neue Rolle: Head of Operations." },
      { id:"d3-4", name:"Wochenbericht_KW05.docx", type:"docx", size:"180 KB", date:"2025-02-01", preview:"KW05: Einkaufsverhandlung mit Stahllieferant abgeschlossen (-12% Materialkosten). Neue CNC-Maschine bestellt (Lieferung KW12). 2 MA-Gespräche geführt." },
      { id:"d3-5", name:"Marktanalyse_Maschinenbau_BW.pdf", type:"pdf", size:"2.1 MB", date:"2024-10-20", preview:"Branchenreport Maschinenbau Baden-Württemberg: Marktwachstum 1.8% p.a., Haupttrends: Digitalisierung, E-Mobilität, Fachkräftemangel." },
      { id:"d3-6", name:"Protokoll_GF_Meeting_20250128.docx", type:"docx", size:"95 KB", date:"2025-01-28", preview:"GF Thomas Müller + Ce-eS: Freigabe Phase 2 Maßnahmen, Budget 150.000€ genehmigt. Nächster Meilenstein: KW10." },
    ]},
  { id:4, clientId:7, name:"Haftungsprüfung Klein Gastronomie", lastUpdate:"2025-02-04", category:"Insolvenzberatung", urgent:true,
    docs: [
      { id:"d4-1", name:"Haftungsanalyse_GF_Klein.pdf", type:"pdf", size:"1.2 MB", date:"2025-02-04", preview:"Analyse GF-Haftung nach § 15a InsO: Überschuldung seit ca. Sept. 2024 erkennbar. Empfehlung: Sofortige Insolvenzantragstellung oder Sanierungsnachweis." },
      { id:"d4-2", name:"Gutachten_Überschuldung.pdf", type:"pdf", size:"2.8 MB", date:"2025-02-02", preview:"Überschuldungsstatus: Aktiva 180.000€, Passiva 275.000€. Fortführungsprognose negativ bei aktuellem Geschäftsverlauf." },
      { id:"d4-3", name:"BWA_Nov_Dez_2024.xlsx", type:"xlsx", size:"320 KB", date:"2025-01-15", preview:"Nov: Umsatz 28.400€, Kosten 41.200€, Ergebnis -12.800€. Dez: Umsatz 22.100€, Kosten 38.900€, Ergebnis -16.800€." },
      { id:"d4-4", name:"Beratungsvertrag_Klein.pdf", type:"pdf", size:"380 KB", date:"2024-09-10", preview:"Beratungsvertrag Ce-eS – Klein Gastronomie GmbH. Umfang: Insolvenzberatung, Haftungsprüfung, ggf. Sanierungsbegleitung." },
      { id:"d4-5", name:"Korrespondenz_RA_Schmidt.email", type:"email", size:"65 KB", date:"2025-01-30", preview:"RA Schmidt empfiehlt dringendes Handeln: 3-Wochen-Frist für Insolvenzantrag läuft. Haftungsrisiko GF persönlich bis 95.000€." },
      { id:"d4-6", name:"Vermerk_Steuerberater.note", type:"note", size:"18 KB", date:"2025-01-28", preview:"StB Maier bestätigt: Steuerschulden USt+LSt ca. 28.000€, Vollstreckung angedroht. Stundungsantrag empfohlen." },
    ]},
  { id:5, clientId:4, name:"Gründungsunterlagen Hoffmann", lastUpdate:"2025-01-28", category:"Managementberatung", urgent:false,
    docs: [
      { id:"d5-1", name:"Businessplan_Hoffmann_v2.pdf", type:"pdf", size:"1.5 MB", date:"2025-01-28", preview:"Businessplan Hoffmann Consulting: IT-Beratung für KMU. Zielmarkt: Region HN/Stuttgart. Umsatzprognose Jahr 1: 120.000€, Break-even: Monat 8." },
      { id:"d5-2", name:"Finanzplan_3_Jahre.xlsx", type:"xlsx", size:"280 KB", date:"2025-01-25", preview:"Jahr 1: Umsatz 120k, Kosten 95k, Gewinn 25k. Jahr 2: 180k/120k/60k. Jahr 3: 250k/155k/95k. KfW-Kredit 50.000€ eingeplant." },
      { id:"d5-3", name:"KfW_Antrag_Entwurf.pdf", type:"pdf", size:"920 KB", date:"2025-01-20", preview:"Gründerkredit – StartGeld Nr. 067. Beantragte Summe: 50.000€, Laufzeit 5 Jahre, tilgungsfrei 1 Jahr." },
      { id:"d5-4", name:"Marktrecherche_IT_Beratung.pdf", type:"pdf", size:"1.8 MB", date:"2025-01-15", preview:"Markt IT-Beratung Deutschland: 42 Mrd.€ Volumen, Wachstum 6.5% p.a. Segment KMU unterversorgt (nur 12% nutzen externe IT-Beratung)." },
      { id:"d5-5", name:"Lebenslauf_Hoffmann_Lisa.pdf", type:"pdf", size:"340 KB", date:"2025-01-10", preview:"Lisa Hoffmann, geb. 1988. Dipl.-Informatikerin (KIT), 8 Jahre SAP-Beratung bei Deloitte, PMP-zertifiziert." },
    ]},
  { id:6, clientId:5, name:"Schuldenplan Richter", lastUpdate:"2025-01-25", category:"Schuldnerberatung", urgent:false,
    docs: [
      { id:"d6-1", name:"Schuldenübersicht_Richter.xlsx", type:"xlsx", size:"65 KB", date:"2025-01-25", preview:"3 Gläubiger: Commerzbank (6.200€), MediaMarkt/CreditPlus (4.100€), Stadtwerke HN (2.500€). Gesamt: 12.800€." },
      { id:"d6-2", name:"Ratenzahlungsvereinbarung_Commerzbank.pdf", type:"pdf", size:"290 KB", date:"2025-01-22", preview:"Vereinbarung: 150€/Monat über 42 Monate. Verzicht auf weitere Zinsen ab 01.02.2025." },
      { id:"d6-3", name:"Einkommensnachweise_2024.scan", type:"scan", size:"1.4 MB", date:"2025-01-20", preview:"Gehaltsabrechnungen Jul-Dez 2024. Netto durchschnittlich 2.150€. Arbeitgeber: Audi AG, Werk Neckarsulm." },
    ]},
  { id:7, clientId:8, name:"Erstberatung Braun", lastUpdate:"2025-02-01", category:"Schuldnerberatung", urgent:false,
    docs: [
      { id:"d7-1", name:"Erstberatung_Protokoll.docx", type:"docx", size:"85 KB", date:"2025-02-01", preview:"Erstberatung Maria Braun: Schulden ca. 8.450€ bei 2 Gläubigern (Consors Finanz, Versandhaus). Einkommen: 1.650€ netto." },
      { id:"d7-2", name:"Vollmacht_Braun.pdf", type:"pdf", size:"140 KB", date:"2025-02-01", preview:"Generalvollmacht für Ce-eS zur Gläubigerverhandlung. Unterschrieben am 01.02.2025." },
    ]},
  { id:8, clientId:9, name:"Interims-Management Fuchs Bau", lastUpdate:"2025-02-04", category:"Managementberatung", urgent:false,
    docs: [
      { id:"d8-1", name:"Interims_Vertrag_Fuchs.pdf", type:"pdf", size:"520 KB", date:"2024-12-01", preview:"Interimsvertrag: Ce-eS stellt Interims-GF ab 01.12.2024. Laufzeit 6 Monate, Tagessatz 1.200€, max. 20 Tage/Monat." },
      { id:"d8-2", name:"Monatsbericht_Jan_2025.pdf", type:"pdf", size:"1.1 MB", date:"2025-02-01", preview:"Monatsbericht Januar: 18 Einsatztage, Umsatz +8% ggü. Dez. 3 neue Bauaufträge akquiriert. Krankenstand von 12% auf 7% gesenkt." },
      { id:"d8-3", name:"Projektliste_aktuell.xlsx", type:"xlsx", size:"180 KB", date:"2025-02-04", preview:"12 aktive Projekte, Auftragsvolumen gesamt: 2.8 Mio €. Größtes Projekt: Neubau Logistikzentrum Neckarsulm (890.000€)." },
      { id:"d8-4", name:"Personalübersicht_Fuchs_Bau.xlsx", type:"xlsx", size:"95 KB", date:"2025-01-15", preview:"32 Mitarbeiter: 4 Bauleiter, 22 Facharbeiter, 3 Azubis, 3 Verwaltung. 2 offene Stellen (Polier, Maurer)." },
      { id:"d8-5", name:"Organigramm_Fuchs_Bau.pdf", type:"pdf", size:"280 KB", date:"2024-12-05", preview:"Org-Chart mit Interims-GF an der Spitze. 3 Bereiche: Hochbau, Tiefbau, Verwaltung." },
    ]},
  { id:9, clientId:10, name:"Schuldenabbau Mayer", lastUpdate:"2025-02-02", category:"Schuldnerberatung", urgent:false,
    docs: [
      { id:"d9-1", name:"Vergleichsergebnis_Gläubiger_1_2.pdf", type:"pdf", size:"380 KB", date:"2025-02-02", preview:"Vergleich erzielt: Gläubiger 1 (Targobank) akzeptiert 4.200€ statt 8.500€. Gläubiger 2 (Otto) akzeptiert 1.800€ statt 4.300€. Ersparnis: 6.800€." },
      { id:"d9-2", name:"Gesamtschuldenplan_Mayer.xlsx", type:"xlsx", size:"110 KB", date:"2025-01-20", preview:"5 Gläubiger, Ausgangssumme: 35.500€. Nach 2 Vergleichen: 21.300€ verbleibend. Ziel: Gesamtvergleich unter 15.000€." },
      { id:"d9-3", name:"Korrespondenz_Santander.email", type:"email", size:"38 KB", date:"2025-01-28", preview:"Santander Consumer Bank: Bereitschaft zu Vergleichsgespräch signalisiert. Termin 12.02.2025, Ansprechpartner Fr. Wagner." },
      { id:"d9-4", name:"Schufa_Auskunft_Mayer.pdf", type:"pdf", size:"890 KB", date:"2024-10-15", preview:"SCHUFA-Score: 78.4 (ausreichend). 3 Negativmerkmale, 2 erledigte Mahnverfahren." },
    ]},
];

// ─── DATEV ───
export const DATEV_ENTRIES: DatevEntry[] = [
  { id:"BU-2025-001", date:"2025-02-04", kontoSoll:"1200 Forderungen", kontoHaben:"8400 Erlöse", betrag:6200, buchungstext:"RE-2025-007 Interims-Mgmt Fuchs Bau", belegnr:"RE-2025-007", status:"gebucht" },
  { id:"BU-2025-002", date:"2025-02-03", kontoSoll:"1200 Forderungen", kontoHaben:"8400 Erlöse", betrag:850, buchungstext:"RE-2025-006 Schuldnerberatung Richter", belegnr:"RE-2025-006", status:"offen" },
  { id:"BU-2025-003", date:"2025-02-01", kontoSoll:"1200 Forderungen", kontoHaben:"8400 Erlöse", betrag:2800, buchungstext:"RE-2025-005 Insolvenzberatung Klein", belegnr:"RE-2025-005", status:"gebucht" },
  { id:"BU-2025-004", date:"2025-01-30", kontoSoll:"1800 Bank", kontoHaben:"1200 Forderungen", betrag:980, buchungstext:"Zahlungseingang Mayer RE-2025-008", belegnr:"BK-0130", status:"gebucht" },
  { id:"BU-2025-005", date:"2025-01-28", kontoSoll:"1200 Forderungen", kontoHaben:"8400 Erlöse", betrag:3600, buchungstext:"RE-2025-004 Insolvenzberatung Weber", belegnr:"RE-2025-004", status:"fehlerhaft" },
  { id:"BU-2025-006", date:"2025-01-25", kontoSoll:"1200 Forderungen", kontoHaben:"8400 Erlöse", betrag:2400, buchungstext:"RE-2025-003 Gründungsberatung Hoffmann", belegnr:"RE-2025-003", status:"gebucht" },
  { id:"BU-2025-007", date:"2025-01-20", kontoSoll:"1800 Bank", kontoHaben:"1200 Forderungen", betrag:1200, buchungstext:"Zahlungseingang Becker RE-2025-002", belegnr:"BK-0120", status:"gebucht" },
  { id:"BU-2025-008", date:"2025-01-15", kontoSoll:"1200 Forderungen", kontoHaben:"8400 Erlöse", betrag:4800, buchungstext:"RE-2025-001 Krisenmanagement Müller", belegnr:"RE-2025-001", status:"gebucht" },
  { id:"BU-2025-009", date:"2025-01-10", kontoSoll:"4100 Gehälter", kontoHaben:"1800 Bank", betrag:8500, buchungstext:"Gehaltszahlung Januar 2025", belegnr:"GH-0110", status:"gebucht" },
  { id:"BU-2025-010", date:"2025-01-05", kontoSoll:"4210 Miete", kontoHaben:"1800 Bank", betrag:2200, buchungstext:"Büromiete Im Zukunftspark 4, Jan 2025", belegnr:"MI-0105", status:"gebucht" },
  { id:"BU-2024-098", date:"2024-12-20", kontoSoll:"1800 Bank", kontoHaben:"1200 Forderungen", betrag:5200, buchungstext:"Zahlungseingang Schwarz IT RE-2024-048", belegnr:"BK-1220", status:"gebucht" },
  { id:"BU-2024-097", date:"2024-12-15", kontoSoll:"4900 Sonstige", kontoHaben:"1800 Bank", betrag:1800, buchungstext:"Versicherungen Q4/2024", belegnr:"VS-1215", status:"gebucht" },
];

// ─── Bank ───
export const BANK_ACCOUNT = {
  bank: "Sparkasse Heilbronn",
  iban: "DE89 6205 0000 0012 3456 78",
  bic: "HEISDE66XXX",
  inhaber: "Ce-eS Management Consultant Schäfer & Schäfer GbR",
  kontostand: 24_680.45,
  verfuegbar: 22_480.45,
  kreditlinie: 15_000,
};

export const BANK_TRANSACTIONS: BankTransaction[] = [
  { id:"BT-01", date:"2025-02-04", betrag:6200, gegenkonto:"Fuchs Bau GmbH", verwendungszweck:"RE-2025-007 Interims-Management Feb", saldo:24680.45, type:"eingang" },
  { id:"BT-02", date:"2025-02-03", betrag:-420, gegenkonto:"Telekom Deutschland", verwendungszweck:"Rg. 8834567 Internet+Telefon Feb", saldo:18480.45, type:"ausgang" },
  { id:"BT-03", date:"2025-02-01", betrag:-2200, gegenkonto:"Zukunftspark Verwaltung", verwendungszweck:"Büromiete Februar 2025", saldo:18900.45, type:"ausgang" },
  { id:"BT-04", date:"2025-01-30", betrag:980, gegenkonto:"Claudia Mayer", verwendungszweck:"RE-2025-008 Schuldnerberatung", saldo:21100.45, type:"eingang" },
  { id:"BT-05", date:"2025-01-28", betrag:-185.50, gegenkonto:"HUK-COBURG", verwendungszweck:"Berufshaftpflicht Jan 2025", saldo:20120.45, type:"ausgang" },
  { id:"BT-06", date:"2025-01-25", betrag:-8500, gegenkonto:"Gehaltskonto", verwendungszweck:"Gehälter Januar 2025", saldo:20305.95, type:"ausgang" },
  { id:"BT-07", date:"2025-01-22", betrag:1200, gegenkonto:"Sandra Becker", verwendungszweck:"RE-2025-002 Schuldnerberatung", saldo:28805.95, type:"eingang" },
  { id:"BT-08", date:"2025-01-20", betrag:-340, gegenkonto:"DATEV eG", verwendungszweck:"DATEV Unternehmen online Jan", saldo:27605.95, type:"ausgang" },
  { id:"BT-09", date:"2025-01-15", betrag:5200, gegenkonto:"Schwarz IT Solutions", verwendungszweck:"RE-2024-048 Marketingstrategie", saldo:27945.95, type:"eingang" },
  { id:"BT-10", date:"2025-01-10", betrag:-890, gegenkonto:"Amazon Business", verwendungszweck:"Büromaterial + Technik", saldo:22745.95, type:"ausgang" },
  { id:"BT-11", date:"2025-01-05", betrag:-2200, gegenkonto:"Zukunftspark Verwaltung", verwendungszweck:"Büromiete Januar 2025", saldo:23635.95, type:"ausgang" },
  { id:"BT-12", date:"2025-01-03", betrag:8400, gegenkonto:"Thomas Müller / MM GmbH", verwendungszweck:"AN-2025-002 Anzahlung Interims-Mgmt", saldo:25835.95, type:"eingang" },
];

// ─── Helpers ───
export const fmt = (v: number) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
export const fmtDateLong = (d: string) => new Date(d).toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"short"});
export const getClient = (id: number) => CLIENTS.find(c=>c.id===id);
export const typeColor = (t: string) => ({Managementberatung:"#16794a",Schuldnerberatung:"#b88a1c",Insolvenzberatung:"#b83a2e",Coaching:"#2a7ab8"}[t]||"#666");
export const docIcon = (t: DocType) => ({pdf:"📄",docx:"📝",xlsx:"📊",email:"📧",scan:"📋",note:"📌"}[t]||"📎");
