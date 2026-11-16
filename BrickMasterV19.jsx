// Maçon Hero / BrickMaster - V19 - serious game de maçonnerie (version éducative pro)
// Fichier unique React. Aucun dégradé SVG à identifiant (évite les bugs d'ID dupliqués).
// Persistance : Capacitor Preferences si présent, sinon localStorage.
import React, { useState, useEffect, useRef, useMemo } from "react";

const VERSION = "V19";
// Visuels Creative Claw : placez le dossier "assets" à côté de index.html (Vite : dans /public).
const ASSET_BASE = "./assets/";
const IMG = {
  carlos_angry: "carlos_bras_croises.webp", carlos_ok: "carlos_ordre.webp", miguel: "miguel.webp",
  player_h_epi: "stagiaire_h_epi.webp", player_f_epi: "stagiaire_f_epi.webp",
  player_h: "stagiaire_h.webp", player_f: "stagiaire_f.webp",
  bg_home: "bg_accueil.webp", bg_map: "bg_carte.webp",
};
const BG_LEVEL = { 1: "bg_n1_betonniere.webp", 2: "bg_n2_mur.webp", 3: "bg_n3_plan.webp", 4: "bg_n4_beton.webp", 5: "bg_n5_ferraillage.webp", 6: "bg_n6_enduit.webp", 7: "bg_n7_carrelage.webp", 8: "bg_n8_cloisons.webp", 9: "bg_n9_escalier.webp", 10: "bg_n10_inspection.webp" };
const asset = (f) => ASSET_BASE + f;
const C = {
  orange: "#F28C28", yellow: "#FFC72C", dark: "#23272E", ink: "#2D3436", sand: "#E9D7AE",
  grey: "#9AA0A6", green: "#27AE60", red: "#E74C3C", blue: "#3B82F6", sky: "#CFE8FF",
  paper: "#FFF8EC", concrete: "#B8BCC2", water: "#5DADE2",
};
const FONT = "'Nunito', 'Segoe UI', system-ui, sans-serif";

// ---------- Stockage ----------
const store = {
  async get(k) {
    try {
      const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
      if (P) { const r = await P.get({ key: k }); return r && r.value ? JSON.parse(r.value) : null; }
      const v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  },
  async set(k, v) {
    try {
      const s = JSON.stringify(v);
      const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
      if (P) { await P.set({ key: k, value: s }); return; }
      window.localStorage.setItem(k, s);
    } catch (e) { /* stockage indisponible : on continue en mémoire */ }
  },
};

// ---------- Son + haptique ----------
let actx = null;
let muted = false;
function sfx(type) {
  try {
    if (navigator.vibrate) navigator.vibrate(type === "ko" ? [60, 40, 60] : type === "win" ? [30, 30, 30, 30, 90] : 12);
    if (muted) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = actx || new AC();
    const t = actx.currentTime;
    const tones = {
      ok: [[660, 0], [880, 0.09]], ko: [[230, 0], [160, 0.13]], tap: [[540, 0]],
      win: [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]], pose: [[150, 0], [110, 0.05]],
    };
    (tones[type] || tones.tap).forEach(([f, d]) => {
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type = type === "pose" ? "triangle" : "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.16, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.17);
      o.connect(g); g.connect(actx.destination); o.start(t + d); o.stop(t + d + 0.2);
    });
  } catch (e) { /* audio non disponible */ }
}

// ---------- Voix de Carlos (gratuite : synthèse vocale du système) ----------
let voiceOn = true;
try { voiceOn = window.localStorage.getItem("mh_voice") !== "off"; } catch (e) { /* défaut : activée */ }
let frVoice = null;
function pickVoice() {
  try {
    const vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const fr = vs.filter((v) => /^fr/i.test(v.lang));
    const male = fr.find((v) => /thomas|paul|henri|mathieu|nicolas|daniel|claude|male|homme/i.test(v.name));
    frVoice = male || fr[0] || null;
  } catch (e) { frVoice = null; }
}
if (typeof window !== "undefined" && window.speechSynthesis) { pickVoice(); window.speechSynthesis.onvoiceschanged = pickVoice; }
function speakCarlos(text) {
  if (!voiceOn || !text) return;
  const clean = text.replace(/[^\p{L}\p{N}\s.,;:!?'’«»()-]/gu, "");
  try {
    const TTS = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
    if (TTS) { TTS.stop().catch(() => {}); TTS.speak({ text: clean, lang: "fr-FR", rate: 0.95, pitch: 0.7 }).catch(() => {}); return; }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "fr-FR"; u.pitch = 0.7; u.rate = 0.98;
    if (frVoice) u.voice = frVoice;
    window.speechSynthesis.speak(u);
  } catch (e) { /* synthèse vocale indisponible */ }
}
function stopVoice() {
  try {
    const TTS = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
    if (TTS) TTS.stop().catch(() => {});
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch (e) { /* rien */ }
}

// ---------- Utilitaires ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const starsFor = (s) => (s >= 90 ? 3 : s >= 70 ? 2 : s >= 50 ? 1 : 0);
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtSeau = (v) => { const w = Math.floor(v); const h = v - w >= 0.5; return w === 0 && h ? "½" : h ? `${w} ½` : `${w}`; };
const fr = (n, d = 1) => Number(n).toFixed(d).replace(".", ",");

// ---------- Données pédagogiques ----------
const LEVELS = [
  { id: 1, name: "Bétonnière", skill: "Dosage et ordre de chargement", coach: "carlos",
    intro: "Premier test : la bétonnière. Un mortier pour monter des parpaings. Rate le dosage et le mur tombe… et c'est moi qu'on engueule.",
    memo: ["Mortier de montage : 1 ciment : 3 sable : 0,5 eau (en volume)", "Ordre de chargement : eau → sable → ciment, puis malaxer 3 à 5 min", "Réf. NF EN 998-2 / NF DTU 20.1"] },
  { id: 2, name: "Montage du mur", skill: "Joints, appareil, niveau", coach: "miguel",
    intro: "On monte un mur de 3 rangées de 4 parpaings. Mortier, pose, niveau à bulle. Et des joints réguliers, hein !",
    memo: ["Joint horizontal ≈ 1 cm (0,8 à 1,5 cm)", "Joints verticaux décalés d'un demi-bloc (harpage)", "Contrôle au niveau à bulle à chaque bloc", "Réf. NF DTU 20.1"] },
  { id: 3, name: "Lecture de plan", skill: "Cotes, surfaces, quantités", coach: "carlos",
    intro: "Un maçon qui ne sait pas lire un plan, c'est un maçon qui démolit. Garage de 6 m × 4 m : à toi de jouer.",
    memo: ["Parpaing 50 × 20 : 10 blocs par m² (+5 % de casse)", "1 m³ de mortier ≈ 55 m² de mur ≈ 550 parpaings", "Toujours déduire les ouvertures de la surface de mur"] },
  { id: 4, name: "Coffrage / béton", skill: "Béton de fondation", coach: "miguel",
    intro: "Les fondations ! Le béton, c'est un mortier avec du gravier en plus. Et un bon dosage en ciment.",
    memo: ["Béton de fondation : 1 ciment : 2 sable : 3 gravier : 0,5 eau", "Béton structurel : 350 kg de ciment par m³", "Sac de ciment courant : 35 kg", "Réf. NF EN 206-1"] },
  { id: 5, name: "Ferraillage", skill: "Enrobage, densité d'acier", coach: "carlos",
    intro: "Le béton résiste à la compression, l'acier à la traction. Mal placé, l'acier rouille et ne sert à rien.",
    memo: ["Enrobage minimal : 3 cm (corrosion, feu)", "Densité courante : 80 à 120 kg d'acier par m³", "Caler les armatures avec des cales d'enrobage"] },
  { id: 6, name: "Enduit", skill: "Trois couches dégressives", coach: "miguel",
    intro: "Trois couches, chacune moins dosée que la précédente. Comme une bonne feijoada : on ne brûle pas les étapes.",
    memo: ["Gobetis : 550 kg/m³, 3 à 5 mm — accroche", "Corps d'enduit : 450 kg/m³, 10 à 15 mm — planéité, imperméabilisation", "Finition : 350 kg/m³, 5 à 7 mm — aspect", "Dosage dégressif du support vers l'extérieur — Réf. NF DTU 26.1"] },
  { id: 7, name: "Carrelage", skill: "Joints, planité", coach: "carlos",
    intro: "Carrelage : la moindre dalle qui dépasse, le client la voit. Et moi aussi.",
    memo: ["Joint : 2 à 4 mm selon le format", "Planité : ±3 mm sous la règle de 2 m", "Réf. NF DTU 52.2"] },
  { id: 8, name: "Cloisons", skill: "Montants tous les 60 cm", coach: "miguel",
    intro: "Cloisons en plaques de plâtre : un montant tous les 60 cm, sinon la plaque ondule.",
    memo: ["Entraxe des montants : 60 cm (plaques de 1,20 m)", "Un montant à chaque extrémité du rail", "Réf. NF DTU 25.41"] },
  { id: 9, name: "Escalier", skill: "Formule de Blondel", coach: "carlos",
    intro: "Un escalier mal calculé, c'est une chute assurée. Monsieur Blondel avait tout prévu dès 1675.",
    memo: ["Loi de Blondel : 2h + g ≈ 63 cm (60 à 64)", "Hauteur de marche h : 16 à 18 cm", "Giron g : 24 à 32 cm"] },
  { id: 10, name: "Inspection finale", skill: "Synthèse des compétences", coach: "carlos",
    intro: "Inspection finale. Je vais vérifier TOUT ce que tu as appris. Et je ne ferai pas de cadeau.",
    memo: ["Bravo : tu as validé les 10 étapes du chantier !", "Prochaine étape : relecture de ta fiche avec ton formateur"] },
];

const BANK = [
  { q: "Dosage d'un mortier de montage (ciment : sable : eau) ?", opts: ["1 : 3 : 0,5", "1 : 1 : 1", "3 : 1 : 0,5", "1 : 5 : 2"], a: 0, why: "1 volume de ciment pour 3 de sable et 0,5 d'eau." },
  { q: "Béton de fondation (ciment : sable : gravier : eau) ?", opts: ["1 : 3 : 0 : 0,5", "1 : 2 : 3 : 0,5", "2 : 2 : 2 : 1", "1 : 1 : 5 : 1"], a: 1, why: "On ajoute du gravier : 1 : 2 : 3 : 0,5." },
  { q: "Enrobage minimal des armatures ?", opts: ["5 mm", "1 cm", "3 cm", "15 cm"], a: 2, why: "Au moins 3 cm pour protéger l'acier de la corrosion et du feu." },
  { q: "Largeur de joint en carrelage courant ?", opts: ["2 à 4 mm", "1 cm", "0 mm", "2 cm"], a: 0, why: "Entre 2 et 4 mm selon le format." },
  { q: "Entraxe des montants d'une cloison en plaques ?", opts: ["30 cm", "45 cm", "1 m", "60 cm"], a: 3, why: "60 cm : une plaque de 1,20 m repose sur 3 montants." },
  { q: "Loi de Blondel ?", opts: ["h + g = 45 cm", "2h + g ≈ 63 cm", "h × g = 500", "2g + h = 63 cm"], a: 1, why: "2 hauteurs + 1 giron ≈ 63 cm (60 à 64)." },
  { q: "Ordre des couches d'enduit ?", opts: ["Finition, corps, gobetis", "Corps, gobetis, finition", "Gobetis, corps, finition", "Une seule couche épaisse"], a: 2, why: "Gobetis (accroche), corps d'enduit, puis finition." },
  { q: "Combien de parpaings 50 × 20 par m² ?", opts: ["5", "10", "20", "12,5"], a: 1, why: "0,50 × 0,20 = 0,1 m² → 10 blocs par m²." },
  { q: "1 m³ de mortier permet de monter environ :", opts: ["10 m² de mur", "55 m² de mur", "200 m² de mur", "1 m² de mur"], a: 1, why: "Environ 55 m², soit environ 550 parpaings." },
  { q: "Dosage en ciment d'un béton structurel ?", opts: ["150 kg/m³", "250 kg/m³", "350 kg/m³", "600 kg/m³"], a: 2, why: "350 kg de ciment par m³." },
  { q: "Tolérance de planité d'un carrelage sous la règle de 2 m ?", opts: ["±3 mm", "±1 cm", "±10 mm", "Aucune"], a: 0, why: "±3 mm sous la règle de 2 m." },
  { q: "Quelle couche d'enduit est la plus dosée en ciment ?", opts: ["La finition", "Le corps d'enduit", "Le gobetis", "Elles sont identiques"], a: 2, why: "Le gobetis (550 kg/m³) : le dosage diminue vers l'extérieur." },
  { q: "Densité d'acier courante dans un béton armé ?", opts: ["5 à 10 kg/m³", "80 à 120 kg/m³", "500 kg/m³", "1 tonne/m³"], a: 1, why: "80 à 120 kg d'acier par m³." },
  { q: "EPI obligatoires sur le chantier ?", opts: ["Casquette et baskets", "Aucun si on fait attention", "Casque, gants, chaussures de sécurité", "Seulement les gants"], a: 2, why: "Casque, gants et chaussures de sécurité, au minimum." },
  { q: "Épaisseur d'un joint horizontal de parpaings ?", opts: ["≈ 1 cm", "≈ 3 cm", "≈ 2 mm", "≈ 5 cm"], a: 0, why: "Environ 1 cm (0,8 à 1,5 cm)." },
];

// ---------- Styles communs ----------
const btn = (bg = C.orange, fg = "#fff") => ({
  background: bg, color: fg, border: "none", borderRadius: 14, padding: "12px 16px", fontSize: 17,
  fontWeight: 800, fontFamily: FONT, cursor: "pointer", boxShadow: "0 3px 0 rgba(0,0,0,.25)", touchAction: "manipulation",
});
const card = { background: "#fff", borderRadius: 18, padding: 14, boxShadow: "0 4px 14px rgba(0,0,0,.12)" };

const GlobalStyle = () => (
  <style>{`
    @keyframes mh-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
    @keyframes mh-pop { 0% { transform: scale(.4); opacity: 0 } 70% { transform: scale(1.15) } 100% { transform: scale(1); opacity: 1 } }
    @keyframes mh-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
    @keyframes mh-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
    @keyframes mh-sweep { from { transform: translateY(-10px) } to { transform: translateY(330px) } }
    .mh-pop { animation: mh-pop .45s ease-out both }
    .mh-float { animation: mh-float 2.4s ease-in-out infinite }
    .mh-shake { animation: mh-shake .3s ease-in-out 2 }
    input[type=range].mh-range { width: 100%; height: 34px; accent-color: ${C.orange} }
    .mh-app button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.25) !important }
  `}</style>
);

// ---------- Personnages (SVG plat, sans ID) ----------
const hasEpi = (e) => !!(e && e.casque && e.gants && e.bottes);
function Worker(props) {
  const { who = "player", gender = "h", epi, size = 120, mood = "ok" } = props;
  const [broken, setBroken] = useState(false);
  const key = who === "carlos" ? (mood === "angry" ? "carlos_angry" : "carlos_ok") : who === "miguel" ? "miguel" : `player_${gender === "f" ? "f" : "h"}${hasEpi(epi) ? "_epi" : ""}`;
  if (!broken) {
    return <img src={asset(IMG[key])} alt={who} onError={() => setBroken(true)} draggable={false} style={{ height: size, width: "auto", display: "block", filter: "drop-shadow(0 4px 4px rgba(0,0,0,.25))", transform: mood === "happy" && who !== "carlos" ? "rotate(-2deg)" : undefined }} />;
  }
  return <WorkerSVG {...props} />;
}
function WorkerSVG({ who = "player", gender = "h", epi, size = 120, mood = "ok" }) {
  const shirt = who === "carlos" ? "#C0392B" : who === "miguel" ? "#2E86DE" : "#E67E22";
  const skin = who === "carlos" ? "#D4A27A" : who === "miguel" ? "#C68B59" : "#F1C27D";
  const hair = who === "carlos" ? "#3E2723" : who === "miguel" ? "#1B1B1B" : "#6D4C41";
  const e = epi || { casque: C.yellow, gants: C.orange, bottes: "#5B4636" };
  const col = (v, d) => (typeof v === "string" ? v : v ? d : null);
  const helmet = col(e.casque, C.yellow); const gloves = col(e.gants, C.orange) || skin; const boots = col(e.bottes, "#1C1C1C") || "#ECF0F1";
  const mouth = mood === "happy" ? "M43 42 Q50 49 57 42" : mood === "angry" ? "M44 46 Q50 41 56 46" : "M45 44 L55 44";
  return (
    <svg viewBox="0 0 100 140" width={(size * 100) / 140} height={size} style={{ overflow: "visible" }}>
      <ellipse cx="50" cy="134" rx="28" ry="5" fill="rgba(0,0,0,.15)" />
      <rect x="36" y="92" width="12" height="34" rx="4" fill="#34495E" />
      <rect x="52" y="92" width="12" height="34" rx="4" fill="#34495E" />
      <rect x="31" y="121" width="19" height="11" rx="3" fill={boots} />
      <rect x="50" y="121" width="19" height="11" rx="3" fill={boots} />
      {gender === "f" && who === "player" && <circle cx="66" cy="34" r="8" fill={hair} />}
      <rect x="30" y="52" width="40" height="44" rx="10" fill={shirt} />
      <rect x="30" y="76" width="40" height="5" fill="#F7DC6F" />
      {mood === "angry" ? (
        <g>
          <rect x="26" y="62" width="48" height="11" rx="5" fill={shirt} stroke="rgba(0,0,0,.15)" />
          <circle cx="29" cy="67" r="6" fill={gloves} /><circle cx="71" cy="67" r="6" fill={gloves} />
        </g>
      ) : (
        <g>
          <g><rect x="20" y="54" width="10" height="34" rx="5" fill={shirt} /><circle cx="25" cy="90" r="6" fill={gloves} /></g>
          <g transform={mood === "happy" ? "rotate(-150 75 57)" : undefined}>
            <rect x="70" y="54" width="10" height="34" rx="5" fill={shirt} /><circle cx="75" cy="90" r="6" fill={gloves} />
          </g>
        </g>
      )}
      <rect x="45" y="46" width="10" height="8" fill={skin} />
      <circle cx="50" cy="36" r="16" fill={skin} />
      {who === "carlos" && <path d="M36 40 Q50 58 64 40 Q60 50 50 52 Q40 50 36 40 Z" fill="#5D4037" opacity=".45" />}
      <circle cx="44" cy="35" r="2" fill="#222" /><circle cx="56" cy="35" r="2" fill="#222" />
      {mood === "angry" && <g stroke="#222" strokeWidth="2"><line x1="40" y1="29" x2="47" y2="31" /><line x1="60" y1="29" x2="53" y2="31" /></g>}
      <path d={mouth} stroke="#5a2d1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {helmet ? (
        <g><path d="M33 31 Q50 8 67 31 Z" fill={helmet} /><rect x="29" y="29" width="42" height="5" rx="2" fill={helmet} /><rect x="48" y="14" width="4" height="15" fill="rgba(255,255,255,.35)" /></g>
      ) : (
        <path d="M34 32 Q36 16 50 18 Q64 16 66 32 Q58 24 50 25 Q42 24 34 32 Z" fill={hair} />
      )}
    </svg>
  );
}

// ---------- Bulle de dialogue (une seule bulle cliquable) ----------
function Dialogue({ lines, profile, onDone }) {
  const [st, setSt] = useState({ i: 0, n: 0 });
  const line = lines[st.i];
  const full = st.n >= line.text.length;
  useEffect(() => {
    if (full) return undefined;
    const t = setTimeout(() => setSt((s) => ({ ...s, n: Math.min(lines[s.i].text.length, s.n + 2) })), 22);
    return () => clearTimeout(t);
  }, [st, full, lines]);
  useEffect(() => { if (lines[st.i].who === "carlos") speakCarlos(lines[st.i].text); }, [st.i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopVoice(), []);
  const tap = () => {
    sfx("tap");
    if (!full) { setSt((s) => ({ ...s, n: lines[s.i].text.length })); return; }
    if (st.i < lines.length - 1) setSt({ i: st.i + 1, n: 0 }); else onDone();
  };
  const speakers = [...new Set(lines.map((l) => l.who))];
  const names = { carlos: "Carlos", miguel: "Miguel", player: (profile && profile.name) || "Toi" };
  return (
    <div onClick={tap} style={{ cursor: "pointer", userSelect: "none" }}>
      <div style={{ ...card, position: "relative", minHeight: 110, marginBottom: 16, border: `3px solid ${C.dark}` }}>
        <div style={{ fontWeight: 900, color: line.who === "carlos" ? "#C0392B" : line.who === "miguel" ? "#2E86DE" : C.orange, marginBottom: 4 }}>{names[line.who]}</div>
        <div style={{ fontSize: 18, lineHeight: 1.35, color: C.ink }}>{line.text.slice(0, st.n)}</div>
        <div style={{ position: "absolute", right: 12, bottom: 6, fontSize: 13, color: C.grey }}>{full ? (st.i < lines.length - 1 ? "Touchez ▸" : "Touchez pour commencer ▸") : ""}</div>
        <div style={{ position: "absolute", bottom: -14, left: line.who === speakers[0] ? 50 : "auto", right: line.who === speakers[0] ? "auto" : 50, width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: `14px solid ${C.dark}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: speakers.length > 1 ? "space-between" : "flex-start", alignItems: "flex-end", padding: "0 10px" }}>
        {speakers.map((w) => (
          <div key={w} style={{ transition: "transform .25s, opacity .25s", transform: line.who === w ? "scale(1.08)" : "scale(.92)", opacity: line.who === w ? 1 : 0.6 }}>
            <Worker who={w} gender={profile && profile.gender} epi={w === "player" ? profile && profile.epi : undefined} size={speakers.length > 2 ? 120 : 150} mood={line.who === w ? line.mood || "ok" : w === "carlos" ? "angry" : "happy"} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Quiz générique ----------
function Quiz({ questions, onDone, timer = 0, lives = 0, figure }) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [good, setGood] = useState(0);
  const [left, setLeft] = useState(lives);
  const [t, setT] = useState(timer);
  const q = questions[i];
  function choose(k) {
    if (pick !== null) return;
    setPick(k);
    const ok = k === q.a;
    sfx(ok ? "ok" : "ko");
    if (ok) setGood((g) => g + 1); else if (lives) setLeft((l) => l - 1);
  }
  useEffect(() => {
    if (!timer || pick !== null) return undefined;
    if (t <= 0) { choose(-1); return undefined; }
    const id = setTimeout(() => setT((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [t, pick, timer]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => {
    sfx("tap");
    if (i + 1 >= questions.length || (lives && left <= 0)) onDone({ good, total: questions.length, out: lives && left <= 0 });
    else { setI(i + 1); setPick(null); setT(timer); }
  };
  return (
    <div>
      {figure}
      <div style={{ display: "flex", justifyContent: "space-between", color: C.ink, fontWeight: 800, margin: "8px 2px" }}>
        <span>Question {i + 1}/{questions.length}</span>
        {lives ? <span>{"❤️".repeat(Math.max(0, left))}{"🤍".repeat(Math.max(0, lives - left))}</span> : null}
        {timer ? <span style={{ color: t <= 5 ? C.red : C.ink }}>⏱ {t}s</span> : null}
      </div>
      <div style={{ ...card, marginBottom: 10 }}><div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>{q.q}</div></div>
      <div style={{ display: "grid", gap: 8 }}>
        {q.opts.map((o, k) => {
          let bg = "#fff";
          if (pick !== null && k === q.a) bg = "#D5F5E3";
          else if (pick === k) bg = "#FADBD8";
          return (
            <button key={k} onClick={() => choose(k)} style={{ ...btn(bg, C.ink), textAlign: "left", border: `2px solid ${pick !== null && k === q.a ? C.green : "#ddd"}` }}>{o}</button>
          );
        })}
      </div>
      {pick !== null && (
        <div className="mh-pop" style={{ ...card, marginTop: 10, background: pick === q.a ? "#EAFAF1" : "#FDEDEC" }}>
          <b>{pick === q.a ? "✅ Exact !" : pick === -1 ? "⏱ Temps écoulé." : "❌ Non."}</b> {q.why}
          <div style={{ marginTop: 10 }}><button style={btn()} onClick={next}>Suivant ▸</button></div>
        </div>
      )}
    </div>
  );
}

// ---------- Composants de niveau : petits outils ----------
function Coach({ who, text, mood }) {
  useEffect(() => { if (who === "carlos") speakCarlos(text); }, [who, text]);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "8px 0" }}>
      <Worker who={who} size={84} mood={mood} />
      <div className="mh-pop" key={text} style={{ ...card, flex: 1, padding: 10, fontSize: 15, border: `2px solid ${who === "carlos" ? "#C0392B" : "#2E86DE"}` }}>{text}</div>
    </div>
  );
}
function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div style={{ ...card, padding: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: C.ink }}><span>{label}</span><span style={{ color: C.orange }}>{fr(value, step < 1 ? (step < 0.1 ? 2 : 1) : 0)} {unit}</span></div>
      <input className="mh-range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
function Stepper({ label, value, step, onChange, color, unit = "seau(x)", noMinus = false }) {
  return (
    <div style={{ ...card, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, borderLeft: `8px solid ${color}` }}>
      <span style={{ fontWeight: 800 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!noMinus && <button style={{ ...btn("#eee", C.ink), padding: "6px 14px" }} onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}>−</button>}
        <b style={{ minWidth: 54, textAlign: "center" }}>{fmtSeau(value)} <small style={{ color: C.grey }}>{unit}</small></b>
        <button style={{ ...btn(color), padding: "6px 14px" }} onClick={() => { sfx("pose"); onChange(+(value + step).toFixed(2)); }}>+</button>
      </span>
    </div>
  );
}

// ---------- Niveau 1 : bétonnière ----------
function LvlMortier({ onFinish }) {
  const k = useMemo(() => (Math.random() < 0.5 ? 1 : 2), []);
  const [q, setQ] = useState({ eau: 0, sable: 0, ciment: 0 });
  const [order, setOrder] = useState([]);
  const [layers, setLayers] = useState([]);
  const [errors, setErrors] = useState(0);
  const [hint, setHint] = useState(false);
  const [mixing, setMixing] = useState(false);
  const [msg, setMsg] = useState({ who: "carlos", text: `Prépare le mortier avec ${k} seau${k > 1 ? "x" : ""} de ciment. Charge dans le bon ordre, puis malaxe.` });
  const [shake, setShake] = useState(0);
  const add = (ing, v) => {
    if (mixing) return;
    sfx("pose");
    setQ((p) => ({ ...p, [ing]: +(p[ing] + v).toFixed(2) }));
    setOrder((o) => (o.includes(ing) ? o : [...o, ing]));
    setLayers((l) => [...l, { ing, v }]);
  };
  const vider = () => { setQ({ eau: 0, sable: 0, ciment: 0 }); setOrder([]); setLayers([]); };
  const malaxer = () => {
    const pb = [];
    const want = { eau: 0.5 * k, sable: 3 * k, ciment: k };
    ["ciment", "sable", "eau"].forEach((ing) => {
      if (q[ing] < want[ing]) pb.push(`pas assez ${ing === "eau" ? "d'eau" : `de ${ing}`}`);
      if (q[ing] > want[ing]) pb.push(`trop ${ing === "eau" ? "d'eau" : `de ${ing}`}`);
    });
    const goodOrder = order.join(",") === "eau,sable,ciment";
    if (!goodOrder && pb.length === 0) pb.push("l'ordre de chargement n'est pas le bon (eau, puis sable, puis ciment)");
    if (pb.length) {
      sfx("ko"); setErrors((e) => e + 1); setShake((s) => s + 1);
      setMsg({ who: "carlos", mood: "angry", text: `Stop ! Il y a ${pb.join(", ")}. On vide et on recommence.` });
      vider();
      return;
    }
    setMixing(true); sfx("ok");
    setMsg({ who: "miguel", mood: "happy", text: "Ça tourne ! Belle pâte, ni trop sèche ni trop liquide. Muito bem !" });
    setTimeout(() => onFinish({ score: clamp(100 - errors * 20 - (hint ? 10 : 0), 0, 100), errors, details: `${k} seau(x) de ciment, indice ${hint ? "oui" : "non"}` }), 2200);
  };
  const total = q.eau + q.sable + q.ciment;
  const maxT = 4.5 * 2 + 3;
  const colors = { eau: C.water, sable: C.sand, ciment: C.concrete };
  let acc = 0;
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      <div key={shake} className={shake ? "mh-shake" : ""} style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 220 170" width="100%" style={{ maxWidth: 300 }}>
          <rect x="40" y="140" width="140" height="10" rx="4" fill="#555" />
          <circle cx="60" cy="155" r="12" fill="#333" /><circle cx="160" cy="155" r="12" fill="#333" />
          <line x1="110" y1="140" x2="110" y2="110" stroke="#555" strokeWidth="8" />
          <g style={{ transformOrigin: "110px 80px", animation: mixing ? "mh-spin .6s linear infinite" : "none" }}>
            <g transform="rotate(-25 110 80)">
              <rect x="60" y="40" width="100" height="80" rx="30" fill={C.orange} stroke="#B9651A" strokeWidth="4" />
              <rect x="70" y="50" width="80" height="60" rx="18" fill="#3a3a3a" />
              {layers.map((l, idx) => {
                const h = (l.v / maxT) * 60; acc += h;
                return <rect key={idx} x="70" y={110 - acc} width="80" height={h + 0.5} fill={mixing ? "#A8A39A" : colors[l.ing]} />;
              })}
              <rect x="60" y="74" width="100" height="6" fill="#B9651A" opacity=".6" />
            </g>
          </g>
        </svg>
      </div>
      <div style={{ textAlign: "center", color: C.grey, fontSize: 13, marginBottom: 6 }}>Chargé : {fmtSeau(total)} seau(x) — ordre : {order.length ? order.join(" → ") : "—"}</div>
      <Stepper label="💧 Eau" value={q.eau} step={0.5} noMinus color={C.water} onChange={(v) => (v > q.eau ? add("eau", v - q.eau) : null)} />
      <Stepper label="🏖 Sable" value={q.sable} step={1} noMinus color="#C9A86A" onChange={(v) => (v > q.sable ? add("sable", v - q.sable) : null)} />
      <Stepper label="🧱 Ciment" value={q.ciment} step={1} noMinus color="#7F8C8D" onChange={(v) => (v > q.ciment ? add("ciment", v - q.ciment) : null)} />
      {hint && <div className="mh-pop" style={{ ...card, background: "#FEF9E7", marginBottom: 8 }}>📒 Carnet : mortier = 1 ciment : 3 sable : 0,5 eau. On charge l'eau, puis le sable, puis le ciment.</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...btn("#7f8c8d"), flex: 1 }} onClick={vider} disabled={mixing}>Vider</button>
        {!hint && <button style={{ ...btn("#F1C40F", C.ink), flex: 1 }} onClick={() => setHint(true)}>📒 Carnet (−10)</button>}
        <button style={{ ...btn(C.green), flex: 1.4 }} onClick={malaxer} disabled={mixing || total === 0}>Malaxer ⚙️</button>
      </div>
    </div>
  );
}

// ---------- Niveau 2 : mur ----------
function WallSVG({ placed, current, mortar, staggered }) {
  const W = 66, H = 30, J = 4;
  const blocks = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const i = r * 4 + c;
    const off = r === 1 && staggered ? W / 2 : 0;
    const x = 10 + c * (W + J) + off; const y = 140 - (r + 1) * (H + J);
    blocks.push({ i, x, y });
  }
  return (
    <svg viewBox="0 0 340 160" width="100%">
      <rect x="0" y="140" width="340" height="20" fill="#8D6E63" />
      <rect x="4" y="136" width="332" height="5" fill="#A1887F" />
      {blocks.map(({ i, x, y }) => {
        const p = placed[i];
        if (p === undefined && i !== current) return <rect key={i} x={x} y={y} width={W} height={H} fill="none" stroke="#ccc" strokeDasharray="4 4" />;
        if (i === current && p === undefined) return (
          <g key={i}>
            {mortar && <rect x={x} y={y + H} width={W} height={J} fill="#d9d2c3" />}
            <rect x={x} y={y} width={W} height={H} fill="none" stroke={C.orange} strokeWidth="2" strokeDasharray="5 3" />
          </g>
        );
        return (
          <g key={i} transform={`rotate(${p} ${x + W / 2} ${y + H})`}>
            <rect x={x} y={y + H} width={W} height={J} fill="#d9d2c3" />
            <rect x={x} y={y} width={W} height={H} rx="2" fill={C.concrete} stroke="#8a8f96" />
            <rect x={x + 8} y={y + 7} width={20} height={H - 14} fill="#9ca1a8" /><rect x={x + W - 28} y={y + 7} width={20} height={H - 14} fill="#9ca1a8" />
          </g>
        );
      })}
    </svg>
  );
}
function LvlMur({ onFinish }) {
  const [phase, setPhase] = useState("joint");
  const [joint, setJoint] = useState(2.5);
  const [placed, setPlaced] = useState({});
  const [mortar, setMortar] = useState(false);
  const [errors, setErrors] = useState(0);
  const [quals, setQuals] = useState([]);
  const [bub, setBub] = useState(0);
  const bubRef = useRef(0);
  const [msg, setMsg] = useState({ who: "miguel", text: "D'abord, règle l'épaisseur du joint horizontal." });
  const n = Object.keys(placed).length;
  const row = Math.floor(n / 4);
  useEffect(() => {
    if (phase !== "pose" || !mortar) return undefined;
    let raf; const t0 = performance.now(); const sp = 1.8 + row * 0.8;
    const loop = (now) => { const v = Math.sin(((now - t0) / 1000) * sp + 1.1); bubRef.current = v; setBub(v); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, mortar, row]);
  const checkJoint = () => {
    if (joint >= 0.8 && joint <= 1.5) { sfx("ok"); setPhase("pose"); setMsg({ who: "miguel", mood: "happy", text: "Parfait, environ 1 cm. Étale le mortier puis pose le bloc quand la bulle est au centre." }); }
    else { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: joint > 1.5 ? "Trop épais ! Le mortier va couler et le mur va tasser." : "Trop fin ! Les blocs ne vont pas tenir." }); }
  };
  const pose = () => {
    const dev = Math.abs(bubRef.current);
    if (dev > 0.45) { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: "De travers ! Reprends ce bloc, au niveau cette fois." }); return; }
    sfx("pose");
    const tilt = (bubRef.current * 4).toFixed(1);
    const np = { ...placed, [n]: Number(tilt) };
    setPlaced(np); setMortar(false);
    setQuals((qs) => [...qs, dev < 0.2 ? 100 : 80]);
    setMsg({ who: "miguel", mood: "happy", text: dev < 0.2 ? "Pile au niveau ! 👌" : "Correct, un poil penché mais dans la tolérance." });
    const nn = n + 1;
    if (nn === 4) setPhase("appareil");
    if (nn === 12) {
      const avg = [...quals, dev < 0.2 ? 100 : 80].reduce((a, b) => a + b, 0) / 12;
      setPhase("done");
      setTimeout(() => onFinish({ score: clamp(Math.round(avg - errors * 6), 0, 100), errors, details: `joint ${fr(joint)} cm` }), 1200);
    }
  };
  const appareil = (dec) => {
    if (dec) { sfx("ok"); setPhase("pose"); setMsg({ who: "miguel", mood: "happy", text: "Oui : on décale d'un demi-bloc. Les charges se répartissent, le mur ne fend pas." }); }
    else { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: "Joints alignés ? Le mur va se fendre en deux à la première charge ! Réfléchis." }); }
  };
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      <div style={{ ...card, padding: 6 }}><WallSVG placed={placed} current={phase === "pose" ? n : -1} mortar={mortar} staggered={phase !== "appareil" && n >= 4} /></div>
      <div style={{ textAlign: "center", color: C.grey, margin: 6 }}>Blocs posés : {n}/12 — rangée {Math.min(3, row + 1)}/3</div>
      {phase === "joint" && (<>
        <Slider label="Épaisseur du joint horizontal" value={joint} min={0.2} max={3} step={0.1} unit="cm" onChange={setJoint} />
        <button style={{ ...btn(), width: "100%" }} onClick={checkJoint}>Valider le joint</button>
      </>)}
      {phase === "appareil" && (
        <div style={card}>
          <b>Comment poser la 2e rangée ?</b>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <button style={btn("#fff", C.ink)} onClick={() => appareil(false)}>Joints verticaux alignés sur la 1re rangée</button>
            <button style={btn("#fff", C.ink)} onClick={() => appareil(true)}>Joints décalés d'un demi-bloc</button>
          </div>
        </div>
      )}
      {phase === "pose" && (
        <div>
          <div style={{ ...card, padding: 10, marginBottom: 8 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Niveau à bulle</div>
            <div style={{ position: "relative", height: 30, background: "#D4EFDF", borderRadius: 15, border: "3px solid #1E8449" }}>
              <div style={{ position: "absolute", left: "calc(50% - 22%)", width: "44%", top: 0, bottom: 0, borderLeft: "2px solid #1E8449", borderRight: "2px solid #1E8449" }} />
              <div style={{ position: "absolute", top: 4, width: 36, height: 16, borderRadius: 10, background: "#F9E79F", border: "2px solid #B7950B", left: `calc(${50 + bub * 45}% - 18px)`, opacity: mortar ? 1 : 0.35 }} />
            </div>
          </div>
          {!mortar
            ? <button style={{ ...btn("#A1887F"), width: "100%" }} onClick={() => { sfx("pose"); setMortar(true); }}>🪣 Étaler le mortier</button>
            : <button style={{ ...btn(C.green), width: "100%" }} onClick={pose}>🧱 Poser le bloc</button>}
        </div>
      )}
    </div>
  );
}

// ---------- Niveau 3 : lecture de plan ----------
function PlanSVG() {
  return (
    <svg viewBox="0 0 320 220" width="100%" style={{ ...card, padding: 4, boxSizing: "border-box" }}>
      <rect x="0" y="0" width="320" height="220" fill="#EAF2F8" />
      {[...Array(16)].map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="220" stroke="#D6EAF8" />)}
      {[...Array(11)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#D6EAF8" />)}
      <rect x="40" y="40" width="240" height="160" fill="none" stroke="#1B4F72" strokeWidth="8" />
      <line x1="112" y1="200" x2="208" y2="200" stroke="#EAF2F8" strokeWidth="10" />
      <path d="M112 200 Q112 168 144 168" fill="none" stroke="#1B4F72" strokeDasharray="4 3" />
      <line x1="280" y1="100" x2="280" y2="140" stroke="#85C1E9" strokeWidth="8" />
      <g fontSize="11" fill="#1B4F72" fontWeight="bold" textAnchor="middle">
        <line x1="40" y1="22" x2="280" y2="22" stroke="#1B4F72" /><text x="160" y="17">6,00 m</text>
        <line x1="22" y1="40" x2="22" y2="200" stroke="#1B4F72" /><text x="14" y="124" transform="rotate(-90 14 124)">4,00 m</text>
        <text x="160" y="214">Porte 2,40 × 2,00</text>
        <text x="300" y="96" transform="rotate(90 300 96)">Fenêtre 1,00 × 1,00</text>
        <text x="160" y="120" fontSize="14">GARAGE — murs h = 2,50 m</text>
      </g>
    </svg>
  );
}
function LvlPlan({ onFinish }) {
  const qs = [
    { q: "Périmètre extérieur du garage ?", opts: ["10 m", "20 m", "24 m", "12 m"], a: 1, why: "2 × (6 + 4) = 20 m." },
    { q: "Surface au sol ?", opts: ["24 m²", "20 m²", "10 m²", "48 m²"], a: 0, why: "6 × 4 = 24 m²." },
    { q: "Surface de murs à monter, ouvertures déduites ?", opts: ["50 m²", "45,2 m²", "44,2 m²", "60 m²"], a: 2, why: "20 × 2,5 = 50 m² − porte 4,8 m² − fenêtre 1 m² = 44,2 m²." },
    { q: "Nombre de parpaings 50 × 20 à commander (+5 % de casse) ?", opts: ["442", "465", "500", "221"], a: 1, why: "44,2 × 10 = 442, + 5 % ≈ 465 blocs." },
    { q: "Volume de mortier à prévoir environ ?", opts: ["0,1 m³", "0,8 m³", "2,5 m³", "5 m³"], a: 1, why: "1 m³ ≈ 55 m² de mur → 44,2 / 55 ≈ 0,8 m³." },
  ];
  return <Quiz questions={qs} figure={<PlanSVG />} onDone={({ good, total }) => onFinish({ score: Math.round((good / total) * 100), errors: total - good, details: `${good}/${total} bonnes réponses` })} />;
}

// ---------- Niveau 4 : béton de fondation ----------
function LvlBeton({ onFinish }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ sable: 0, gravier: 0, eau: 0 });
  const [errors, setErrors] = useState(0);
  const [msg, setMsg] = useState({ who: "miguel", text: "Pour 1 seau de ciment, combien de sable, de gravier et d'eau pour un béton de fondation ?" });
  const check = () => {
    if (d.sable === 2 && d.gravier === 3 && d.eau === 0.5) { sfx("ok"); setStep(1); setMsg({ who: "miguel", mood: "happy", text: "1 : 2 : 3 : 0,5, c'est ça ! Maintenant, le calcul pour la semelle." }); }
    else {
      sfx("ko"); setErrors((e) => e + 1);
      const tips = [];
      if (d.eau > 0.5) tips.push("trop d'eau, le béton perdra sa résistance");
      if (d.eau < 0.5) tips.push("pas assez d'eau, il sera impossible à mettre en œuvre");
      if (d.gravier !== 3) tips.push("le gravier n'est pas bon");
      if (d.sable !== 2) tips.push("le sable n'est pas bon");
      setMsg({ who: "carlos", mood: "angry", text: `Non : ${tips.join(", ")}.` });
    }
  };
  const qs = [
    { q: "Semelle filante de 10 m × 0,50 m × 0,30 m : volume de béton ?", opts: ["15 m³", "1,5 m³", "0,15 m³", "3 m³"], a: 1, why: "10 × 0,5 × 0,3 = 1,5 m³." },
    { q: "En béton structurel dosé à 350 kg/m³, combien de sacs de ciment de 35 kg ?", opts: ["10 sacs", "15 sacs", "35 sacs", "5 sacs"], a: 1, why: "1,5 × 350 = 525 kg → 525 / 35 = 15 sacs." },
    { q: "Avant de couler, on vérifie que :", opts: ["Le coffrage est étanche et bien calé", "Le béton est le plus liquide possible", "Il pleut", "Les aciers touchent le fond"], a: 0, why: "Coffrage étanche, calé et propre ; aciers sur cales." },
  ];
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      {step === 0 ? (<>
        <div style={{ ...card, padding: 10, marginBottom: 8, borderLeft: "8px solid #7F8C8D", fontWeight: 800 }}>🧱 Ciment : 1 seau (fixé)</div>
        <Stepper label="🏖 Sable" value={d.sable} step={1} color="#C9A86A" onChange={(v) => setD({ ...d, sable: Math.min(6, v) })} />
        <Stepper label="🪨 Gravier" value={d.gravier} step={1} color="#7D6608" onChange={(v) => setD({ ...d, gravier: Math.min(6, v) })} />
        <Stepper label="💧 Eau" value={d.eau} step={0.5} color={C.water} onChange={(v) => setD({ ...d, eau: Math.min(3, v) })} />
        <button style={{ ...btn(C.green), width: "100%" }} onClick={check}>Valider le dosage</button>
      </>) : (
        <Quiz questions={qs} onDone={({ good, total }) => onFinish({ score: clamp(Math.round(40 - errors * 12 + (good / total) * 60), 0, 100), errors: errors + total - good, details: `dosage ${errors} erreur(s), calcul ${good}/${total}` })} />
      )}
    </div>
  );
}

// ---------- Niveau 5 : ferraillage ----------
function LvlFer({ onFinish }) {
  const [step, setStep] = useState(0);
  const [e, setE] = useState(1);
  const [errors, setErrors] = useState(0);
  const [msg, setMsg] = useState({ who: "carlos", text: "Règle l'enrobage : la distance entre l'acier et le bord du béton." });
  const check = () => {
    if (e >= 3 && e <= 5) { sfx("ok"); setStep(1); setMsg({ who: "miguel", mood: "happy", text: "Au moins 3 cm, nickel. Passons aux quantités." }); }
    else { sfx("ko"); setErrors((x) => x + 1); setMsg({ who: "carlos", mood: "angry", text: e < 3 ? "Trop près du bord : l'eau atteint l'acier, il rouille et fait éclater le béton." : "Trop loin du bord : l'acier ne travaille plus, la poutre perd en résistance." }); }
  };
  const W = 200, Hh = 120, s = 6; const off = e * s;
  const qs = [
    { q: "Poutre de 0,20 × 0,40 × 5 m (0,4 m³). Masse d'acier probable ?", opts: ["4 kg", "40 kg", "400 kg", "4 tonnes"], a: 1, why: "80 à 120 kg/m³ × 0,4 m³ = 32 à 48 kg." },
    { q: "À quoi sert l'enrobage ?", opts: ["À décorer", "À protéger l'acier de la corrosion et du feu", "À économiser le béton", "À rien"], a: 1, why: "Il protège l'acier et assure l'adhérence acier/béton." },
  ];
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      {step === 0 ? (<>
        <div style={{ ...card, display: "flex", justifyContent: "center", padding: 8 }}>
          <svg viewBox="0 0 240 160" width="100%" style={{ maxWidth: 300 }}>
            <rect x="20" y="20" width={W} height={Hh} fill="#D5D8DC" stroke="#7f8c8d" strokeWidth="3" />
            <rect x={20 + off} y={20 + off} width={W - 2 * off} height={Hh - 2 * off} fill="none" stroke="#A04000" strokeWidth="3" strokeDasharray="6 3" />
            {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => <circle key={i} cx={20 + off + a * (W - 2 * off)} cy={20 + off + b * (Hh - 2 * off)} r="6" fill="#784212" />)}
            <line x1="20" y1="150" x2={20 + off} y2="150" stroke={C.red} strokeWidth="2" />
            <text x={22 + off} y="155" fontSize="11" fill={C.red}>enrobage {fr(e, 1)} cm</text>
          </svg>
        </div>
        <Slider label="Enrobage" value={e} min={0} max={8} step={0.5} unit="cm" onChange={setE} />
        <button style={{ ...btn(C.green), width: "100%" }} onClick={check}>Valider l'enrobage</button>
      </>) : (
        <Quiz questions={qs} onDone={({ good, total }) => onFinish({ score: clamp(Math.round(50 - errors * 15 + (good / total) * 50), 0, 100), errors: errors + total - good, details: `enrobage ${fr(e)} cm` })} />
      )}
    </div>
  );
}

// ---------- Niveau 6 : enduit ----------
const COUCHES = [
  { key: "gobetis", name: "Gobetis", dose: 550, min: 3, max: 5, color: "#7B7D7D" },
  { key: "corps", name: "Corps d'enduit", dose: 450, min: 10, max: 15, color: "#A6ACAF" },
  { key: "finition", name: "Finition", dose: 350, min: 5, max: 7, color: "#E5E7E9" },
];
function LvlEnduit({ onFinish }) {
  const [done, setDone] = useState([]);
  const [sel, setSel] = useState(null);
  const [dose, setDose] = useState(null);
  const [ep, setEp] = useState(8);
  const [errors, setErrors] = useState(0);
  const [msg, setMsg] = useState({ who: "miguel", text: "Quelle couche appliques-tu en premier sur le parpaing ?" });
  const opts = useMemo(() => shuffle(COUCHES), []);
  const target = COUCHES[done.length];
  const pick = (c) => {
    if (c.key === target.key) { sfx("ok"); setSel(c); setDose(null); setEp(8); setMsg({ who: "miguel", text: `${c.name} : choisis le dosage et l'épaisseur.` }); }
    else { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: done.length === 0 ? "Non ! Sans couche d'accroche, tout va se décoller." : "Pas dans cet ordre : on va du plus dosé au moins dosé." }); }
  };
  const valider = () => {
    const pb = [];
    if (dose !== sel.dose) pb.push("le dosage n'est pas le bon");
    if (ep < sel.min) pb.push("c'est trop fin"); if (ep > sel.max) pb.push("c'est trop épais, ça va fissurer");
    if (pb.length) { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: `${sel.name} : ${pb.join(" et ")}.` }); return; }
    sfx("ok");
    const nd = [...done, { ...sel, ep }];
    setDone(nd); setSel(null);
    if (nd.length === 3) { setMsg({ who: "miguel", mood: "happy", text: "Trois couches, dosage dégressif : du travail de pro !" }); setTimeout(() => onFinish({ score: clamp(100 - errors * 12, 0, 100), errors, details: nd.map((c) => `${c.name} ${c.ep} mm`).join(", ") }), 1500); }
    else setMsg({ who: "miguel", mood: "happy", text: "Bien ! Couche suivante ?" });
  };
  let x = 60;
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      <div style={{ ...card, padding: 6 }}>
        <svg viewBox="0 0 300 120" width="100%">
          <rect x="10" y="10" width="50" height="100" fill={C.concrete} /><text x="35" y="64" fontSize="10" textAnchor="middle" fill="#fff" transform="rotate(-90 35 64)">PARPAING</text>
          {done.map((c) => { const w = c.ep * 4; const el = <g key={c.key}><rect x={x} y="10" width={w} height="100" fill={c.color} stroke="#888" /><text x={x + w / 2} y="122" fontSize="8" textAnchor="middle">{c.ep}mm</text></g>; x += w; return el; })}
          {sel && <rect x={x} y="10" width={ep * 4} height="100" fill={sel.color} opacity=".5" stroke={C.orange} strokeDasharray="4 2" />}
        </svg>
      </div>
      {!sel && done.length < 3 && (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {opts.filter((c) => !done.find((d) => d.key === c.key)).map((c) => <button key={c.key} style={btn("#fff", C.ink)} onClick={() => pick(c)}>{c.name}</button>)}
        </div>
      )}
      {sel && (<div style={{ marginTop: 8 }}>
        <div style={{ ...card, padding: 10, marginBottom: 8 }}>
          <b>Dosage en ciment (kg pour 1 000 L de sable)</b>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {[350, 450, 550].map((v) => <button key={v} style={{ ...btn(dose === v ? C.orange : "#eee", dose === v ? "#fff" : C.ink), flex: 1 }} onClick={() => setDose(v)}>{v}</button>)}
          </div>
        </div>
        <Slider label="Épaisseur" value={ep} min={1} max={20} step={1} unit="mm" onChange={setEp} />
        <button style={{ ...btn(C.green), width: "100%" }} disabled={dose === null} onClick={valider}>Appliquer la couche</button>
      </div>)}
    </div>
  );
}

// ---------- Niveau 7 : carrelage ----------
function LvlCarrelage({ onFinish }) {
  const [phase, setPhase] = useState("joint");
  const [joint, setJoint] = useState(6);
  const [errors, setErrors] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [marked, setMarked] = useState({});
  const devs = useMemo(() => {
    const bad = shuffle([...Array(16).keys()]).slice(0, 4);
    return [...Array(16)].map((_, i) => (bad.includes(i) ? (Math.random() < 0.5 ? -1 : 1) * (4 + Math.floor(Math.random() * 3)) : Math.round((Math.random() * 5 - 2.5) * 2) / 2));
  }, []);
  const [msg, setMsg] = useState({ who: "carlos", text: "Règle d'abord la largeur des joints." });
  const checkJoint = () => {
    if (joint >= 2 && joint <= 4) { sfx("ok"); setPhase("plan"); setMsg({ who: "miguel", mood: "happy", text: "Bon joint. Passe la règle de 2 m et repère les dalles hors tolérance." }); }
    else { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: joint > 4 ? "Des joints de cathédrale ! Trop larges." : "Trop serré : la dalle ne pourra pas travailler." }); }
  };
  const valider = () => {
    let fp = 0, miss = 0;
    devs.forEach((d, i) => { const bad = Math.abs(d) > 3; if (bad && !marked[i]) miss++; if (!bad && marked[i]) fp++; });
    if (fp + miss === 0) { sfx("ok"); setMsg({ who: "miguel", mood: "happy", text: "Toutes les dalles hors tolérance repérées. Œil de lynx !" }); setTimeout(() => onFinish({ score: clamp(100 - errors * 12, 0, 100), errors, details: `joint ${joint} mm` }), 1300); }
    else { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: `${miss ? `${miss} dalle(s) hors tolérance oubliée(s)` : ""}${miss && fp ? " et " : ""}${fp ? `${fp} dalle(s) correcte(s) marquée(s) pour rien` : ""}. Tolérance : ±3 mm.` }); }
  };
  const g = joint * 1.2;
  const size = (300 - 5 * g) / 4;
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      <div style={{ ...card, padding: 6, position: "relative", overflow: "hidden" }}>
        <svg viewBox="0 0 300 300" width="100%">
          <rect width="300" height="300" fill="#BDB5A6" />
          {devs.map((d, i) => {
            const r = Math.floor(i / 4), c = i % 4; const x = g + c * (size + g), y = g + r * (size + g);
            const tone = 235 + clamp(d, -6, 6) * 3;
            return (
              <g key={i} onClick={() => { if (phase !== "plan") return; sfx("tap"); setMarked({ ...marked, [i]: !marked[i] }); }} style={{ cursor: phase === "plan" ? "pointer" : "default" }}>
                <rect x={x} y={y} width={size} height={size} fill={`rgb(${tone},${tone - 8},${tone - 20})`} stroke={marked[i] ? C.red : "none"} strokeWidth="5" />
                {reveal && <text x={x + size / 2} y={y + size / 2 + 6} fontSize="16" fontWeight="bold" textAnchor="middle" fill={C.ink}>{d > 0 ? "+" : ""}{fr(d, 1)}</text>}
                {marked[i] && <text x={x + size - 14} y={y + 18} fontSize="16">⚠️</text>}
              </g>
            );
          })}
        </svg>
        {phase === "plan" && reveal && <div key="sweep" style={{ position: "absolute", left: 6, right: 6, top: 6, height: 6, background: "#5D6D7E", borderRadius: 3, animation: "mh-sweep 1.2s ease-in-out 1 both", pointerEvents: "none", opacity: 0.8 }} />}
      </div>
      {phase === "joint" ? (<>
        <Slider label="Largeur des joints" value={joint} min={0} max={10} step={0.5} unit="mm" onChange={setJoint} />
        <button style={{ ...btn(C.green), width: "100%" }} onClick={checkJoint}>Valider les joints</button>
      </>) : (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {!reveal && <button style={{ ...btn("#5D6D7E"), flex: 1 }} onClick={() => { sfx("tap"); setReveal(true); }}>📏 Passer la règle de 2 m</button>}
          {reveal && <button style={{ ...btn(C.green), flex: 1 }} onClick={valider}>Valider ({Object.values(marked).filter(Boolean).length} marquée(s))</button>}
        </div>
      )}
      {phase === "plan" && reveal && <div style={{ textAlign: "center", color: C.grey, marginTop: 6, fontSize: 13 }}>Écarts en mm sous la règle. Touchez les dalles à reprendre.</div>}
    </div>
  );
}

// ---------- Niveau 8 : cloisons ----------
function LvlCloison({ onFinish }) {
  const L = 360; const PX = 300 / L;
  const [m, setM] = useState([]);
  const [errors, setErrors] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [msg, setMsg] = useState({ who: "miguel", text: "Rail de 3,60 m. Touche le rail pour placer (ou retirer) les montants." });
  const svgRef = useRef(null);
  const tap = (ev) => {
    const r = svgRef.current.getBoundingClientRect();
    const xpx = ((ev.clientX - r.left) / r.width) * 340 - 20;
    const cm = clamp(Math.round(xpx / PX / 5) * 5, 0, L);
    sfx("pose"); setWrong([]);
    const near = m.find((v) => Math.abs(v - cm) <= 6);
    setM(near !== undefined ? m.filter((v) => v !== near) : [...m, cm].sort((a, b) => a - b));
  };
  const valider = () => {
    const exp = [0, 60, 120, 180, 240, 300, 360];
    const bad = m.filter((v) => !exp.some((e) => Math.abs(e - v) <= 3));
    const miss = exp.filter((e) => !m.some((v) => Math.abs(e - v) <= 3));
    if (!bad.length && !miss.length) {
      sfx("ok"); setMsg({ who: "miguel", mood: "happy", text: "7 montants, entraxe 60 cm. La plaque sera bien tenue !" });
      setTimeout(() => onFinish({ score: clamp(100 - errors * 15, 0, 100), errors, details: `${m.length} montants` }), 1300);
    } else {
      sfx("ko"); setErrors((e) => e + 1); setWrong(bad);
      setMsg({ who: "carlos", mood: "angry", text: `${bad.length ? `${bad.length} montant(s) mal placé(s) (en rouge)` : ""}${bad.length && miss.length ? ", " : ""}${miss.length ? `${miss.length} montant(s) manquant(s)` : ""}. Entraxe régulier, et un montant à chaque bout !` });
    }
  };
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      <div style={{ ...card, padding: 6 }}>
        <svg ref={svgRef} viewBox="0 0 340 170" width="100%" onClick={tap} style={{ cursor: "crosshair", touchAction: "manipulation" }}>
          <rect x="20" y="20" width="300" height="12" fill="#B3B6B7" /><rect x="20" y="130" width="300" height="12" fill="#B3B6B7" />
          {[...Array(37)].map((_, i) => <line key={i} x1={20 + i * 10 * PX} y1="148" x2={20 + i * 10 * PX} y2={i % 6 === 0 ? 160 : 153} stroke="#666" />)}
          {[0, 60, 120, 180, 240, 300, 360].map((v) => <text key={v} x={20 + v * PX} y="169" fontSize="9" textAnchor="middle" fill="#666">{v}</text>)}
          {m.map((v) => (
            <g key={v}><rect x={20 + v * PX - 3} y="32" width="6" height="98" fill={wrong.includes(v) ? C.red : "#566573"} /><text x={20 + v * PX} y="80" fontSize="8" textAnchor="middle" fill="#fff" transform={`rotate(-90 ${20 + v * PX} 80)`}>{v}</text></g>
          ))}
        </svg>
      </div>
      <div style={{ textAlign: "center", color: C.grey, margin: 6 }}>Montants posés : {m.length} — positions en cm</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...btn("#7f8c8d"), flex: 1 }} onClick={() => { setM([]); setWrong([]); }}>Tout retirer</button>
        <button style={{ ...btn(C.green), flex: 1.5 }} onClick={valider} disabled={!m.length}>Valider</button>
      </div>
    </div>
  );
}

// ---------- Niveau 9 : escalier ----------
function LvlEscalier({ onFinish }) {
  const H = useMemo(() => [252, 270, 288][Math.floor(Math.random() * 3)], []);
  const [n, setN] = useState(12);
  const [g, setG] = useState(22);
  const [hint, setHint] = useState(false);
  const [errors, setErrors] = useState(0);
  const [msg, setMsg] = useState({ who: "carlos", text: `Hauteur à monter : ${fr(H / 100, 2)} m. Choisis le nombre de marches et le giron.` });
  const h = H / n; const b = 2 * h + g;
  const valider = () => {
    const pb = [];
    if (h > 18.5) pb.push("marches trop hautes"); if (h < 15.5) pb.push("marches trop basses");
    if (g < 24) pb.push("giron trop court, le pied ne tient pas"); if (g > 32) pb.push("giron trop long");
    if (b < 60 || b > 64) pb.push(`Blondel non respecté (2h + g = ${fr(b, 1)} cm)`);
    if (pb.length) { sfx("ko"); setErrors((e) => e + 1); setMsg({ who: "carlos", mood: "angry", text: `Non : ${pb.join(", ")}.` }); return; }
    sfx("ok"); setMsg({ who: "miguel", mood: "happy", text: `2h + g = ${fr(b, 1)} cm : un escalier confortable. Monsieur Blondel serait fier !` });
    setTimeout(() => onFinish({ score: clamp(100 - errors * 15 - (hint ? 10 : 0), 0, 100), errors, details: `${n} marches de ${fr(h, 1)} cm, giron ${g} cm` }), 1400);
  };
  const sx = 260 / (n * g), sy = 140 / H; const s = Math.min(sx, sy);
  let path = "M10 150"; for (let i = 0; i < n; i++) path += ` l0 ${-h * s} l${g * s} 0`;
  return (
    <div>
      <Coach who={msg.who} text={msg.text} mood={msg.mood} />
      <div style={{ ...card, padding: 6 }}>
        <svg viewBox="0 0 290 160" width="100%">
          <path d={`${path} L${10 + n * g * s} 150 Z`} fill="#D5DBDB" stroke="#566573" strokeWidth="1.5" />
          <text x="280" y="20" fontSize="11" textAnchor="end" fill={C.ink}>h = {fr(h, 1)} cm · g = {g} cm</text>
        </svg>
      </div>
      <Slider label="Nombre de marches" value={n} min={10} max={20} step={1} unit="" onChange={setN} />
      <Slider label="Giron g (profondeur)" value={g} min={18} max={36} step={1} unit="cm" onChange={setG} />
      {hint && <div className="mh-pop" style={{ ...card, background: "#FEF9E7", marginBottom: 8 }}>📒 Blondel : 2h + g ≈ 63 cm (entre 60 et 64), h entre 16 et 18 cm.</div>}
      <div style={{ display: "flex", gap: 8 }}>
        {!hint && <button style={{ ...btn("#F1C40F", C.ink), flex: 1 }} onClick={() => setHint(true)}>📒 Carnet (−10)</button>}
        <button style={{ ...btn(C.green), flex: 1.5 }} onClick={valider}>Valider l'escalier</button>
      </div>
    </div>
  );
}

// ---------- Niveau 10 : inspection finale ----------
function LvlBoss({ onFinish }) {
  const qs = useMemo(() => shuffle(BANK).slice(0, 8), []);
  return <Quiz questions={qs} timer={20} lives={3} figure={<Coach who="carlos" mood="angry" text="20 secondes par question, 3 erreurs maximum. Montre-moi." />} onDone={({ good, total, out }) => onFinish({ score: out ? Math.min(45, Math.round((good / total) * 100)) : Math.round((good / total) * 100), errors: total - good, details: `${good}/${total}${out ? " (éliminé)" : ""}` })} />;
}

const LEVEL_COMPONENTS = { 1: LvlMortier, 2: LvlMur, 3: LvlPlan, 4: LvlBeton, 5: LvlFer, 6: LvlEnduit, 7: LvlCarrelage, 8: LvlCloison, 9: LvlEscalier, 10: LvlBoss };

// ---------- Écrans ----------
function Shell({ children, title, onBack, right, bg = C.sky, bgImage }) {
  const bgStyle = bgImage ? { backgroundImage: `linear-gradient(rgba(255,255,255,.12), rgba(255,255,255,.12)), url(${asset(bgImage)})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", backgroundColor: typeof bg === "string" && bg.startsWith("#") ? bg : C.sky } : { background: bg };
  return (
    <div className="mh-app" style={{ minHeight: "100vh", ...bgStyle, fontFamily: FONT, color: C.ink }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "10px 14px 30px" }}>
        {(title || onBack) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {onBack && <button style={{ ...btn("#fff", C.ink), padding: "8px 12px" }} onClick={() => { stopVoice(); onBack(); }}>◂</button>}
            <div style={{ flex: 1, fontWeight: 900, fontSize: 20, background: "rgba(255,255,255,.88)", borderRadius: 12, padding: "6px 10px" }}>{title}</div>
            {right}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function MuteBtn() {
  const [m, setM] = useState(muted);
  const [v, setV] = useState(voiceOn);
  return (
    <span style={{ display: "flex", gap: 6 }}>
      <button title="Voix de Carlos" style={{ ...btn("#fff", C.ink), padding: "8px 10px", opacity: v ? 1 : 0.5 }} onClick={() => { voiceOn = !voiceOn; setV(voiceOn); if (!voiceOn) stopVoice(); try { window.localStorage.setItem("mh_voice", voiceOn ? "on" : "off"); } catch (e) { /* rien */ } }}>{v ? "🗣" : "🤐"}</button>
      <button title="Sons" style={{ ...btn("#fff", C.ink), padding: "8px 10px" }} onClick={() => { muted = !muted; setM(muted); }}>{m ? "🔇" : "🔊"}</button>
    </span>
  );
}

function Home({ learner, profile, onStart, onSwitch, onTrainer }) {
  return (
    <Shell bgImage={IMG.bg_home} bg={C.sky}>
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: C.orange, textShadow: "2px 3px 0 #7E3F0C", letterSpacing: 1 }}>MAÇON HERO</div>
        <div style={{ fontWeight: 800, color: C.ink, background: "rgba(255,255,255,.85)", display: "inline-block", padding: "4px 10px", borderRadius: 10 }}>Le chantier-école · 10 étapes · normes DTU</div>
        <div className="mh-float" style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 4, margin: "22px 0 10px" }}>
          <Worker who="carlos" size={170} mood="angry" />
          {profile && <Worker who="player" gender={profile.gender} epi={profile.epi} size={140} mood="happy" />}
          <Worker who="miguel" size={170} mood="happy" />
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <button style={{ ...btn(), fontSize: 22, padding: 16 }} onClick={onStart}>{learner ? `▶ Continuer (${learner})` : "▶ Commencer"}</button>
          {learner && <button style={btn("#fff", C.ink)} onClick={onSwitch}>👷 Nouveau stagiaire</button>}
          <button style={btn(C.dark)} onClick={onTrainer}>📊 Espace formateur</button>
        </div>
        <div style={{ marginTop: 16, color: C.grey, fontSize: 12 }}>BrickMaster {VERSION}</div>
      </div>
    </Shell>
  );
}

const EPI_ITEMS = [
  { key: "casque", label: "Casque", icon: "⛑️", why: "Protège des chutes d'objets." },
  { key: "gants", label: "Gants", icon: "🧤", why: "Le ciment brûle la peau (il est très basique)." },
  { key: "bottes", label: "Chaussures de sécurité", icon: "🥾", why: "Coque contre les blocs qui tombent, semelle anti-clous." },
];
function Profile({ initial, onDone, onBack }) {
  const [name, setName] = useState((initial && initial.name) || "");
  const [gender, setGender] = useState((initial && initial.gender) || "h");
  const [epi, setEpi] = useState(() => { const e = (initial && initial.epi) || {}; return { casque: !!e.casque, gants: !!e.gants, bottes: !!e.bottes }; });
  const [warn, setWarn] = useState("");
  const all = EPI_ITEMS.every((it) => epi[it.key]);
  const go = () => {
    if (!name.trim()) { setWarn("Indique ton prénom pour que ton formateur suive ta progression."); sfx("ko"); return; }
    if (!all) { setWarn("Pas de casque, pas de gants, pas de chaussures de sécurité ? Pas de chantier !"); sfx("ko"); return; }
    sfx("ok"); onDone({ name: name.trim(), gender, epi });
  };
  return (
    <Shell title="Vestiaire" onBack={onBack}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ ...card, flex: 1 }}>
          <label style={{ fontWeight: 800 }}>Prénom du stagiaire</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Inès" style={{ width: "100%", boxSizing: "border-box", fontSize: 18, padding: 10, borderRadius: 10, border: "2px solid #ddd", marginTop: 6, fontFamily: FONT }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {[["h", "Homme"], ["f", "Femme"]].map(([k, l]) => <button key={k} style={{ ...btn(gender === k ? C.orange : "#eee", gender === k ? "#fff" : C.ink), flex: 1 }} onClick={() => setGender(k)}>{l}</button>)}
          </div>
        </div>
        <Worker key={`${gender}-${all}`} who="player" gender={gender} epi={epi} size={190} mood={all ? "happy" : "ok"} />
      </div>
      <div style={{ ...card, marginTop: 12, background: "#FBEEE6" }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>🗄 Étagère des EPI — touche chaque équipement pour l'enfiler</div>
        {EPI_ITEMS.map((it) => (
          <button key={it.key} aria-label={it.label} onClick={() => { sfx(epi[it.key] ? "tap" : "ok"); setEpi({ ...epi, [it.key]: !epi[it.key] }); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 8px", marginBottom: 6, borderRadius: 12, border: `2px solid ${epi[it.key] ? C.green : "#ddd"}`, background: epi[it.key] ? "#EAFAF1" : "#fff", cursor: "pointer", fontFamily: FONT }}>
            <span style={{ fontSize: 30, filter: epi[it.key] ? "none" : "grayscale(1)", opacity: epi[it.key] ? 1 : 0.5 }}>{it.icon}</span>
            <span style={{ flex: 1 }}><b>{it.label}</b><br /><small style={{ color: C.grey }}>{it.why}</small></span>
            <b style={{ color: epi[it.key] ? C.green : C.grey }}>{epi[it.key] ? "Porté ✅" : "Enfiler"}</b>
          </button>
        ))}
      </div>
      {warn && <Coach who="carlos" mood="angry" text={warn} />}
      <button style={{ ...btn(all && name.trim() ? C.green : C.grey), width: "100%", marginTop: 12, fontSize: 20 }} onClick={go}>Entrer sur le chantier ▸</button>
    </Shell>
  );
}

const NODES = [[60, 540], [170, 520], [290, 490], [250, 405], [115, 390], [70, 300], [190, 280], [300, 215], [205, 140], [95, 75]];
function MapScreen({ learner, data, onPlay, onHome, autoNext, onCancelAuto }) {
  useEffect(() => { stopVoice(); }, []);
  const stars = (data && data.stars) || {};
  const unlocked = (id) => id === 1 || (stars[id - 1] || 0) >= 1;
  const current = Math.max(1, ...LEVELS.filter((l) => unlocked(l.id)).map((l) => l.id));
  const [pos, setPos] = useState(autoNext && autoNext > 1 ? autoNext - 1 : current);
  useEffect(() => { const t = setTimeout(() => setPos(autoNext || current), 80); return () => clearTimeout(t); }, [autoNext, current]);
  useEffect(() => {
    if (!autoNext) return undefined;
    const t = setTimeout(() => onPlay(autoNext), 2500);
    return () => clearTimeout(t);
  }, [autoNext]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = Object.values(stars).reduce((a, b) => a + b, 0);
  const [px, py] = NODES[pos - 1];
  return (
    <Shell title={`Chantier de ${learner}`} onBack={onHome} right={<span style={{ fontWeight: 900 }}>⭐ {total}/30</span>}>
      {autoNext && (
        <div className="mh-pop" style={{ ...card, display: "flex", alignItems: "center", gap: 8, marginBottom: 8, background: "#FEF5E7" }}>
          <span style={{ flex: 1, fontWeight: 800 }}>Niveau {autoNext} « {LEVELS[autoNext - 1].name} » dans 2,5 s…</span>
          <button style={{ ...btn("#fff", C.ink), padding: "6px 10px" }} onClick={onCancelAuto}>Rester</button>
        </div>
      )}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <svg viewBox="0 0 360 600" width="100%">
          <rect width="360" height="600" fill="#A9CF8E" />
          <image href={asset(IMG.bg_map)} x="0" y="0" width="360" height="600" preserveAspectRatio="xMidYMid slice" />
          <polyline points={NODES.map((n) => n.join(",")).join(" ")} fill="none" stroke="#FDFEFE" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
          <polyline points={NODES.map((n) => n.join(",")).join(" ")} fill="none" stroke="#7E5109" strokeWidth="3" strokeDasharray="8 8" />
          {LEVELS.map((l, i) => {
            const [x, y] = NODES[i]; const u = unlocked(l.id); const s = stars[l.id] || 0;
            return (
              <g key={l.id} onClick={() => { if (u) { sfx("tap"); onPlay(l.id); } else sfx("ko"); }} style={{ cursor: u ? "pointer" : "not-allowed" }}>
                <circle cx={x} cy={y} r="24" fill={s ? C.green : u ? C.orange : "#95A5A6"} stroke="#fff" strokeWidth="4" />
                <text x={x} y={y + 7} fontSize="20" fontWeight="900" textAnchor="middle" fill="#fff">{u ? l.id : "🔒"}</text>
                <text x={x} y={y + 40} fontSize="11" fontWeight="900" textAnchor="middle" fill={C.dark} stroke="#fff" strokeWidth="3" paintOrder="stroke">{l.name}</text>
                {s > 0 && <text x={x} y={y - 28} fontSize="12" textAnchor="middle">{"⭐".repeat(s)}</text>}
              </g>
            );
          })}
          <g style={{ transform: `translate(${px - 22}px, ${py - 92}px)`, transition: "transform 1.4s ease-in-out", pointerEvents: "none" }}>
            <ellipse cx="22" cy="66" rx="14" ry="4" fill="rgba(0,0,0,.25)" />
            <image href={asset(IMG[`player_${data && data.gender === "f" ? "f" : "h"}_epi`])} x="0" y="0" width="44" height="68" preserveAspectRatio="xMidYMax meet" />
          </g>
        </svg>
      </div>
    </Shell>
  );
}

function LevelScreen({ level, profile, onFinish, onBack }) {
  const [briefed, setBriefed] = useState(false);
  const t0 = useRef(Date.now());
  const Comp = LEVEL_COMPONENTS[level.id];
  const other = level.coach === "carlos" ? "miguel" : "carlos";
  const lines = [{ who: level.coach, text: level.intro, mood: level.coach === "carlos" ? "angry" : "happy" }];
  if (level.id === 1) lines.push({ who: other, text: "Ne l'écoute pas trop. Respire, lis bien la consigne, et tout ira bem.", mood: "happy" });
  lines.push({ who: "player", text: level.id === 10 ? "Je suis prêt" + (profile.gender === "f" ? "e" : "") + ". Allons-y, chef !" : "Compris. Je m'y mets !", mood: "happy" });
  return (
    <Shell title={`${level.id}. ${level.name}`} onBack={onBack} right={<MuteBtn />} bgImage={BG_LEVEL[level.id]}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -2, marginBottom: 6 }}>
        <span style={{ color: C.ink, fontWeight: 800, background: "rgba(255,255,255,.85)", borderRadius: 8, padding: "2px 8px", flex: 1 }}>{level.skill}</span>
        {briefed && <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.85)", borderRadius: 10, padding: "2px 8px 2px 2px", fontWeight: 800 }}><Worker who="player" gender={profile.gender} epi={profile.epi} size={44} />{profile.name}</span>}
      </div>
      {!briefed
        ? <Dialogue lines={lines} profile={profile} onDone={() => { t0.current = Date.now(); setBriefed(true); }} />
        : <Comp onFinish={(r) => onFinish({ ...r, durationSec: Math.round((Date.now() - t0.current) / 1000) })} />}
    </Shell>
  );
}

function Result({ level, result, profile, onRetry, onNext, onMap }) {
  const s = starsFor(result.score);
  useEffect(() => { sfx(s ? "win" : "ko"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const nv = profile && profile.gender === "f" ? "la nouvelle" : "le nouveau";
  const carlosLine = s === 3 ? `Hmpf… pas mal. Mais ne prends pas la grosse tête, ${nv}.` : s ? "Ça passe. Tout juste." : "Insuffisant. Sur mon chantier, on recommence jusqu'à ce que ce soit bon.";
  return (
    <Shell title={`${level.id}. ${level.name}`} bgImage={BG_LEVEL[level.id]}>
      <div className="mh-pop" style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 46 }}>{[1, 2, 3].map((i) => <span key={i} style={{ opacity: i <= s ? 1 : 0.2 }}>⭐</span>)}</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: s ? C.green : C.red }}>{result.score} / 100</div>
        <div style={{ color: C.grey }}>{result.errors} erreur(s) · {result.durationSec} s</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}><Worker who="player" gender={profile && profile.gender} epi={profile && profile.epi} size={130} mood={s ? "happy" : "ok"} /></div>
      <Coach who="carlos" mood={s === 3 ? "ok" : "angry"} text={carlosLine} />
      <div style={{ ...card, background: "#FEF9E7" }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>📒 Fiche mémo</div>
        {level.memo.map((m) => <div key={m} style={{ padding: "3px 0" }}>• {m}</div>)}
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {s > 0 && level.id < 10 && <button style={{ ...btn(C.green), fontSize: 20 }} onClick={onNext}>Niveau suivant ▸</button>}
        <button style={btn()} onClick={onRetry}>↻ Rejouer</button>
        <button style={btn("#fff", C.ink)} onClick={onMap}>🗺 Carte du chantier</button>
      </div>
    </Shell>
  );
}

function Trainer({ sessions, onBack, onClear }) {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);
  const [who, setWho] = useState("Tous");
  const [confirm, setConfirm] = useState(false);
  if (!ok) {
    return (
      <Shell title="Espace formateur" onBack={onBack}>
        <div style={card}>
          <div style={{ fontWeight: 800 }}>Code formateur</div>
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} style={{ width: "100%", boxSizing: "border-box", fontSize: 22, padding: 10, marginTop: 8, borderRadius: 10, border: "2px solid #ddd" }} />
          <button style={{ ...btn(C.dark), width: "100%", marginTop: 10 }} onClick={() => (pin === "1234" ? setOk(true) : sfx("ko"))}>Entrer</button>
          <div style={{ color: C.grey, fontSize: 12, marginTop: 8 }}>Code par défaut : 1234</div>
        </div>
      </Shell>
    );
  }
  const names = ["Tous", ...new Set(sessions.map((s) => s.learner))];
  const list = who === "Tous" ? sessions : sessions.filter((s) => s.learner === who);
  const avg = list.length ? Math.round(list.reduce((a, s) => a + s.score, 0) / list.length) : 0;
  const per = LEVELS.map((l) => {
    const ss = list.filter((s) => s.levelId === l.id);
    return { l, n: ss.length, avg: ss.length ? Math.round(ss.reduce((a, s) => a + s.score, 0) / ss.length) : 0, ok: ss.filter((s) => s.stars > 0).length };
  });
  const exportCsv = () => {
    const head = "date;stagiaire;niveau;nom_niveau;score;etoiles;erreurs;duree_s;details";
    const rows = list.map((s) => [s.date, s.learner, s.levelId, s.levelName, s.score, s.stars, s.errors, s.durationSec, `"${String(s.details || "").replace(/"/g, "'")}"`].join(";"));
    const blob = new Blob(["﻿" + [head, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `macon-hero-sessions-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  return (
    <Shell title="Tableau de bord formateur" onBack={onBack} bg="#F4F6F7">
      <select value={who} onChange={(e) => setWho(e.target.value)} style={{ width: "100%", fontSize: 17, padding: 10, borderRadius: 10, marginBottom: 10, fontFamily: FONT }}>
        {names.map((n) => <option key={n}>{n}</option>)}
      </select>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["Sessions", list.length], ["Stagiaires", names.length - 1], ["Score moyen", list.length ? `${avg}` : "—"]].map(([k, v]) => (
          <div key={k} style={{ ...card, textAlign: "center", padding: 10 }}><div style={{ fontSize: 24, fontWeight: 900 }}>{v}</div><div style={{ fontSize: 12, color: C.grey }}>{k}</div></div>
        ))}
      </div>
      <div style={{ ...card, marginTop: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Score moyen par niveau</div>
        {per.map(({ l, n, avg: a, ok: k }) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, margin: "4px 0" }}>
            <span style={{ width: 118, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.id}. {l.name}</span>
            <div style={{ flex: 1, background: "#EAECEE", borderRadius: 4, height: 14 }}><div style={{ width: `${a}%`, height: 14, borderRadius: 4, background: a >= 70 ? C.green : a >= 50 ? C.orange : C.red }} /></div>
            <span style={{ width: 70, textAlign: "right", color: C.grey }}>{n ? `${a} · ${k}/${n}✓` : "—"}</span>
          </div>
        ))}
      </div>
      <div style={{ ...card, marginTop: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Dernières sessions</div>
        {list.length === 0 && <div style={{ color: C.grey }}>Aucune session enregistrée pour l'instant.</div>}
        {list.slice(-30).reverse().map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #eee" }}>
            <span><b>{s.learner}</b> · {s.levelId}. {s.levelName}<br /><span style={{ color: C.grey }}>{new Date(s.date).toLocaleString("fr-FR")} · {s.details}</span></span>
            <span style={{ textAlign: "right", fontWeight: 800 }}>{s.score}<br />{"⭐".repeat(s.stars)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={{ ...btn(C.blue), flex: 1 }} onClick={exportCsv} disabled={!list.length}>⬇ Export CSV</button>
        <button style={{ ...btn(confirm ? C.red : "#fff", confirm ? "#fff" : C.red), flex: 1 }} onClick={() => { if (confirm) { onClear(); setConfirm(false); } else setConfirm(true); }}>{confirm ? "Confirmer l'effacement" : "Effacer les données"}</button>
      </div>
    </Shell>
  );
}

// ---------- Application ----------
export default function BrickMasterV19() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home");
  const [learners, setLearners] = useState({});
  const [current, setCurrent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [levelId, setLevelId] = useState(1);
  const [result, setResult] = useState(null);
  const [autoNext, setAutoNext] = useState(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    (async () => {
      const [l, c, s] = await Promise.all([store.get("mh_learners"), store.get("mh_current"), store.get("mh_sessions")]);
      setLearners(l || {}); setCurrent(c || null); setSessions(s || []); setLoaded(true);
    })();
  }, []);

  const profile = current ? learners[current] : null;

  const saveProfile = (p) => {
    const prev = learners[p.name] || { stars: {}, best: {} };
    const nl = { ...learners, [p.name]: { ...prev, ...p } };
    setLearners(nl); setCurrent(p.name); store.set("mh_learners", nl); store.set("mh_current", p.name);
    setScreen(Object.keys(prev.stars || {}).length ? "map" : "intro");
  };

  const saveSession = (lvl, r) => {
    const st = starsFor(r.score);
    const sess = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date: new Date().toISOString(), learner: current, levelId: lvl.id, levelName: lvl.name, score: r.score, stars: st, errors: r.errors, durationSec: r.durationSec, details: r.details || "" };
    const ns = [...sessions, sess].slice(-2000);
    setSessions(ns); store.set("mh_sessions", ns);
    const p = learners[current] || { stars: {}, best: {} };
    const np = { ...p, stars: { ...(p.stars || {}), [lvl.id]: Math.max(st, (p.stars || {})[lvl.id] || 0) }, best: { ...(p.best || {}), [lvl.id]: Math.max(r.score, (p.best || {})[lvl.id] || 0) } };
    const nl = { ...learners, [current]: np };
    setLearners(nl); store.set("mh_learners", nl);
  };

  const play = (id) => { setAutoNext(null); setLevelId(id); setRun((r) => r + 1); setScreen("level"); };

  if (!loaded) return <Shell><div style={{ textAlign: "center", marginTop: 80, fontWeight: 900 }}>Chargement du chantier…</div></Shell>;

  const level = LEVELS[levelId - 1];
  return (
    <>
      <GlobalStyle />
      {screen === "home" && <Home learner={current} profile={profile} onStart={() => setScreen(profile ? "map" : "profile")} onSwitch={() => { setCurrent(null); setScreen("profile"); }} onTrainer={() => setScreen("trainer")} />}
      {screen === "profile" && <Profile initial={profile} onDone={saveProfile} onBack={() => setScreen("home")} />}
      {screen === "intro" && (
        <Shell title="Premier jour" right={<MuteBtn />} bgImage={IMG.bg_home}>
          <Dialogue profile={profile} onDone={() => { setAutoNext(1); setScreen("map"); }} lines={[
            { who: "carlos", text: `Alors c'est toi, ${profile && profile.gender === "f" ? "la nouvelle" : "le nouveau"} ? Moi c'est Carlos, chef de chantier depuis vingt ans. Ici, on ne rigole pas.`, mood: "angry" },
            { who: "miguel", text: `Bem-vindo, ${profile ? profile.name : ""} ! Moi c'est Miguel. Carlos aboie, mais il ne mord pas… enfin, presque.`, mood: "happy" },
            { who: "player", text: `Bonjour ! Je suis ${profile ? profile.name : ""}, ${profile && profile.gender === "f" ? "la nouvelle apprentie" : "le nouvel apprenti"}. J'ai hâte de commencer !`, mood: "happy" },
            { who: "carlos", text: "Je vois que tu as mis tes EPI. Bien. Sans casque, gants et chaussures, tu ne mets pas un pied chez moi.", mood: "ok" },
            { who: "miguel", text: "On va te faire passer les 10 étapes d'un vrai chantier. Chaque geste compte, chaque dosage aussi.", mood: "happy" },
            { who: "carlos", text: "Et ne crois pas que tu vas me piquer ma place si vite…", mood: "angry" },
          ]} />
        </Shell>
      )}
      {screen === "map" && profile && <MapScreen learner={current} data={profile} autoNext={autoNext} onCancelAuto={() => setAutoNext(null)} onPlay={play} onHome={() => { setAutoNext(null); setScreen("home"); }} />}
      {screen === "level" && profile && <LevelScreen key={run} level={level} profile={profile} onBack={() => setScreen("map")} onFinish={(r) => { saveSession(level, r); setResult(r); setScreen("result"); }} />}
      {screen === "result" && result && <Result level={level} result={result} profile={profile} onRetry={() => play(level.id)} onMap={() => { setAutoNext(null); setScreen("map"); }} onNext={() => { setAutoNext(level.id + 1); setScreen("map"); }} />}
      {screen === "trainer" && <Trainer sessions={sessions} onBack={() => setScreen("home")} onClear={() => { setSessions([]); setLearners({}); setCurrent(null); store.set("mh_sessions", []); store.set("mh_learners", {}); store.set("mh_current", null); }} />}
    </>
  );
}
