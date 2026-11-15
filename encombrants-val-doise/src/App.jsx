import { useEffect, useMemo, useRef, useState } from "react";
import { RAW } from "./data.js";
import "./styles.css";

/* ════════════════════════════════════════════════
   Données dérivées
   ════════════════════════════════════════════════ */
const YEAR = 2026;
const JMAP = { Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const MOIS_CAP = MOIS.map(m => m[0].toUpperCase() + m.slice(1));
const JOURS = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven"];

const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, " ");
const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const keyOf = (v, q) => `${v}|${q || ""}`;
const trunc = (s, n = 7) => (s.length <= n ? s : s.slice(0, n) + "…");

function nthWeekday(yr, mo, dayName, n) {
  const target = JMAP[dayName];
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(yr, mo, d);
    if (dt.getMonth() !== mo) break;
    if (dt.getDay() === target && ++count === n) return dt;
  }
  return null;
}

function datesFor(row) {
  const out = [];
  if (row.x2) {
    // deux passages par an : printemps (mars/avril) et automne (septembre/octobre)
    for (const months of [[2, 3], [8, 9]]) {
      for (const m of months) { const d = nthWeekday(YEAR, m, row.j, row.s); if (d) { out.push(d); break; } }
    }
  } else {
    for (let m = 0; m < 12; m++) { const d = nthWeekday(YEAR, m, row.j, row.s); if (d) out.push(d); }
  }
  return out;
}

/* une entrée par secteur */
const SECTORS = RAW.map(r => ({ ...r, key: keyOf(r.v, r.q), dates: datesFor(r) }));

/* une entrée par commune */
const COMMUNES = (() => {
  const map = new Map();
  for (const s of SECTORS) {
    if (!map.has(s.v)) map.set(s.v, { v: s.v, slug: slug(s.v), com: s.com, sectors: [] });
    map.get(s.v).sectors.push(s);
  }
  return [...map.values()].sort((a, b) => a.v.localeCompare(b.v, "fr"));
})();
const BY_SLUG = Object.fromEntries(COMMUNES.map(c => [c.slug, c]));

/* tous les passages, indexés par jour */
const EVENTS = SECTORS.flatMap(s => s.dates.map(d => ({ s, d })));

const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const fmtDay = d => JOURS[d.getDay()];
const fmtDate = d => `${d.getDate() === 1 ? "1er" : d.getDate()} ${MOIS[d.getMonth()]}`;
const sectorShort = q => (q ? q.replace(/^Secteur\s+/i, "") : "");

function daysUntil(d) {
  const diff = Math.round((d - today()) / 86400000);
  if (diff === 0) return "aujourd’hui";
  if (diff === 1) return "demain";
  if (diff < 7) return `dans ${diff} jours`;
  if (diff < 14) return "la semaine prochaine";
  return `dans ${diff} jours`;
}

function eveningTip(sector, date) {
  const eve = new Date(date); eve.setDate(eve.getDate() - 1);
  const h = (sector.note || "").match(/veille[^0-9]*(\d{1,2})\s?h/i);
  return `Sortez vos objets le ${fmtDay(eve)} ${fmtDate(eve)} au soir${h ? `, à partir de ${h[1]} h` : ""}.`;
}

/* ════════════════════════════════════════════════
   Stockage local : mes communes
   ════════════════════════════════════════════════ */
const SAVE_KEY = "enc95_saved";
function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
    // reprise des favoris de l'ancienne version
    const old = JSON.parse(localStorage.getItem("encombrants_user") || "null");
    if (old?.favoris?.length) {
      return old.favoris
        .map(v => COMMUNES.find(c => c.v === v))
        .filter(Boolean)
        .map(c => c.sectors[0].key);
    }
  } catch { /* stockage indisponible */ }
  return [];
}
function storeSaved(list) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch { /* ignore */ } }

/* ════════════════════════════════════════════════
   Agenda (.ics) — rappel la veille à 18 h
   ════════════════════════════════════════════════ */
function downloadIcs(sector) {
  const esc = s => s.replace(/\\/g, "\\\\").replace(/[,;]/g, m => "\\" + m).replace(/\n/g, "\\n");
  const ymd = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const name = sector.q ? `${sector.v} (${sector.q})` : sector.v;
  const upcoming = sector.dates.filter(d => d >= today());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Encombrants 95//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const d of upcoming) {
    const next = new Date(d); next.setDate(next.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:enc95-${slug(sector.key)}-${ymd(d)}@encombrants-val-doise`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      `SUMMARY:${esc(`Encombrants — ${name}`)}`,
      `DESCRIPTION:${esc(eveningTip(sector, d) + " Plan officiel : " + sector.planUrl)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc("Encombrants demain — sortez vos objets ce soir")}`, "TRIGGER:-PT6H", "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `encombrants-${slug(name)}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ════════════════════════════════════════════════
   Navigation par l'adresse (#/osny/secteur-nord)
   ════════════════════════════════════════════════ */
function parseHash() {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "calendrier") return { view: "calendar" };
  if (parts[0] && BY_SLUG[parts[0]]) {
    const c = BY_SLUG[parts[0]];
    const s = parts[1] ? c.sectors.find(x => slug(x.q) === parts[1]) : null;
    return { view: "commune", commune: c, sector: c.sectors.length === 1 ? c.sectors[0] : s || null };
  }
  return { view: "home" };
}
const go = path => { window.location.hash = path; };
const goSector = s => {
  const c = COMMUNES.find(x => x.v === s.v);
  go(c.sectors.length > 1 ? `/${c.slug}/${slug(s.q)}` : `/${c.slug}`);
};

/* ════════════════════════════════════════════════
   Icônes
   ════════════════════════════════════════════════ */
const IconCal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
const IconMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" />
  </svg>
);
const IconPin = ({ on }) => (
  <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 3h12v18l-6-4-6 4V3Z" />
  </svg>
);

/* ════════════════════════════════════════════════
   Accueil : une seule question
   ════════════════════════════════════════════════ */
function Home({ saved }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return [];
    const starts = COMMUNES.filter(c => norm(c.v).startsWith(n));
    const contains = COMMUNES.filter(c => !norm(c.v).startsWith(n) && norm(c.v).includes(n));
    return [...starts, ...contains].slice(0, 6);
  }, [q]);

  const savedSectors = saved.map(k => SECTORS.find(s => s.key === k)).filter(Boolean);

  const onKey = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) go(`/${results[active].slug}`);
  };

  return (
    <section className="home">
      <h1>Quand passent les encombrants chez vous&nbsp;?</h1>
      <p className="home-sub">Indiquez votre commune du Val-d’Oise, on vous donne la prochaine date de collecte.</p>

      <div className="search">
        <label htmlFor="commune" className="sr-only" style={{ position: "absolute", left: -9999 }}>Votre commune</label>
        <input
          id="commune" ref={inputRef} value={q}
          onChange={e => { setQ(e.target.value); setActive(0); }}
          onKeyDown={onKey}
          placeholder="Votre commune, par exemple Osny"
          autoComplete="off" spellCheck="false"
          role="combobox" aria-expanded={results.length > 0} aria-controls="results"
        />
        {q.trim() && (
          <ul className="results" id="results" role="listbox">
            {results.length === 0 && <li className="no-result">Aucune commune trouvée pour « {q} ». Vérifiez l’orthographe.</li>}
            {results.map((c, i) => (
              <li key={c.slug} role="option" aria-selected={i === active}>
                <button className={i === active ? "active" : ""} onMouseEnter={() => setActive(i)} onClick={() => go(`/${c.slug}`)}>
                  <span>{c.v}</span>
                  {c.sectors.length > 1 && <small>{c.sectors.length} secteurs</small>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {savedSectors.length > 0 && !q && (
        <div className="saved">
          <h2>Mes communes</h2>
          <div className="saved-list">
            {savedSectors.map(s => (
              <button key={s.key} className="chip" onClick={() => goSector(s)}>
                {s.v}{s.q && <span> {sectorShort(s.q)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════
   Vue commune : la réponse, en grand
   ════════════════════════════════════════════════ */
function Commune({ commune, sector, saved, toggleSaved }) {
  const [showPast, setShowPast] = useState(false);
  const t = today();
  const multi = commune.sectors.length > 1;

  const next = sector ? sector.dates.find(d => d >= t) : null;
  const isSaved = sector && saved.includes(sector.key);

  return (
    <section style={{ display: "flex", flexDirection: "column" }}>
      <button className="back" onClick={() => go("/")}>Changer de commune</button>

      <h1 className="commune-name">{commune.v}</h1>
      <p className="commune-org">Collecte assurée par {commune.com}</p>

      {multi && (
        <>
          <div className="sectors" role="group" aria-label="Votre secteur">
            {commune.sectors.map(s => (
              <button key={s.key} aria-pressed={sector?.key === s.key} onClick={() => goSector(s)}>{s.q}</button>
            ))}
          </div>
          {!sector && (
            <p className="sectors-help">
              {commune.v} est découpée en {commune.sectors.length} secteurs avec des dates différentes. Choisissez le vôtre,
              ou <a href={commune.sectors[0].planUrl} target="_blank" rel="noopener noreferrer" className="linkish">consultez le plan de la commune</a>.
            </p>
          )}
        </>
      )}

      {sector && next && (
        <div className="next reveal" key={sector.key}>
          <p className="next-label">Prochain passage</p>
          <p className="next-date">
            <span className="day">{fmtDay(next)}</span>
            <span className="mark">{fmtDate(next)}</span>
          </p>
          <p className="next-when">{daysUntil(next)[0].toUpperCase() + daysUntil(next).slice(1)}</p>
          <p className="next-tip">{eveningTip(sector, next)}</p>
          {/DEEE/i.test(sector.note) && <p className="next-extra">Les appareils électriques sont aussi collectés.</p>}
          {sector.x2 && <p className="next-extra">Ici, la collecte n’a lieu que deux fois par an.</p>}
        </div>
      )}

      {sector && !next && (
        <div className="empty-year reveal">
          <strong>Plus de passage prévu en {YEAR}.</strong>
          Le calendrier {YEAR + 1} n’est pas encore publié. En attendant, la déchèterie reste ouverte.
        </div>
      )}

      {sector && (
        <>
          <div className="actions">
            {next && (
              <button className="btn primary" onClick={() => downloadIcs(sector)}>
                <IconCal /> Ajouter à mon agenda
              </button>
            )}
            <a className="btn" href={sector.planUrl} target="_blank" rel="noopener noreferrer">
              <IconMap /> Plan officiel de la commune
            </a>
          </div>
          {next && <p className="sectors-help" style={{ marginTop: 10 }}>Toutes les dates de l’année, avec un rappel la veille à 18 h.</p>}

          <button className="keep" aria-pressed={!!isSaved} onClick={() => toggleSaved(sector.key)}>
            <IconPin on={isSaved} /> {isSaved ? "Commune gardée sur cet appareil" : "Garder cette commune sur cet appareil"}
          </button>

          <div className="dates">
            <div className="dates-head">
              <h2>Les dates en {YEAR}</h2>
              {sector.dates.some(d => d < t) && (
                <button className="linkish" onClick={() => setShowPast(p => !p)}>
                  {showPast ? "Masquer les dates passées" : "Afficher les dates passées"}
                </button>
              )}
            </div>
            <ol>
              {sector.dates.filter(d => showPast || d >= t).map(d => (
                <li key={+d} className={d < t ? "past" : ""}>
                  <span className="wd">{fmtDay(d)}</span>
                  <span>{fmtDate(d)}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════
   Calendrier du département (lundi → vendredi)
   ════════════════════════════════════════════════ */
function Calendar({ saved }) {
  const now = today();
  const initial = now.getFullYear() === YEAR ? now.getMonth() : now.getFullYear() > YEAR ? 11 : 0;
  const [month, setMonth] = useState(initial);
  const [open, setOpen] = useState(null);

  const byDay = useMemo(() => {
    const m = {};
    for (const e of EVENTS) {
      if (e.d.getMonth() !== month) continue;
      (m[e.d.getDate()] ||= []).push(e.s);
    }
    for (const k in m) m[k].sort((a, b) => (saved.includes(b.key) - saved.includes(a.key)) || a.v.localeCompare(b.v, "fr"));
    return m;
  }, [month, saved]);

  const weeks = useMemo(() => {
    const total = new Date(YEAR, month + 1, 0).getDate();
    const first = new Date(YEAR, month, 1).getDay();
    let cursor = 1 - (first === 0 ? 6 : first - 1);
    const res = [];
    while (cursor <= total) {
      const w = [];
      for (let c = 0; c < 5; c++) { const d = cursor + c; w.push(d >= 1 && d <= total ? d : null); }
      if (w.some(Boolean)) res.push(w);
      cursor += 7;
    }
    return res;
  }, [month]);

  const count = Object.entries(byDay).reduce((n, [d, l]) => {
    const wd = new Date(YEAR, month, +d).getDay();
    return wd >= 1 && wd <= 5 ? n + l.length : n;
  }, 0);
  const isTodayMonth = now.getFullYear() === YEAR && now.getMonth() === month;
  const LIMIT = 4;

  return (
    <section>
      <div className="cal-head">
        <h1>{MOIS_CAP[month]} {YEAR}</h1>
        <div className="cal-nav">
          <button aria-label="Mois précédent" disabled={month === 0} onClick={() => { setMonth(m => m - 1); setOpen(null); }}>‹</button>
          <button aria-label="Mois suivant" disabled={month === 11} onClick={() => { setMonth(m => m + 1); setOpen(null); }}>›</button>
        </div>
      </div>
      <p className="cal-sub">{count} passages dans le Val-d’Oise ce mois-ci</p>

      <div className="grid" role="grid">
        <div className="grid-row">{DOW.map(d => <div key={d} className="grid-dow">{d}</div>)}</div>
        {weeks.map((w, wi) => (
          <div className="grid-row" key={wi}>
            {w.map((d, ci) => {
              if (!d) return <div key={ci} className="cell out" />;
              const list = byDay[d] || [];
              const expanded = open === d;
              const shown = expanded ? list : list.slice(0, LIMIT);
              return (
                <div key={ci} className={`cell in${isTodayMonth && d === now.getDate() ? " today" : ""}`}>
                  <div className="cell-num">{d}</div>
                  {shown.map(s => {
                    const full = s.q ? `${s.v} — ${s.q}` : s.v;
                    const label = trunc(s.v) + (s.q ? ` ${sectorShort(s.q)[0]}` : "");
                    return (
                      <button
                        key={s.key}
                        className={`ev${saved.includes(s.key) ? " mine" : ""}`}
                        data-full={label !== full ? full : undefined}
                        aria-label={`${full}, ${d} ${MOIS[month]}`}
                        onClick={() => goSector(s)}
                      >{label}</button>
                    );
                  })}
                  {list.length > LIMIT && (
                    <button className="more" onClick={() => setOpen(expanded ? null : d)}>
                      {expanded ? "réduire" : `+ ${list.length - LIMIT} autre${list.length - LIMIT > 1 ? "s" : ""}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="cal-hint">Survolez un nom pour le lire en entier, touchez-le pour ouvrir la page de la commune.</p>
    </section>
  );
}

/* ════════════════════════════════════════════════
   Application
   ════════════════════════════════════════════════ */
export default function App() {
  const [route, setRoute] = useState(() => {
    // à la première visite sans adresse précise, on rouvre la commune gardée
    if (!window.location.hash) {
      const first = loadSaved()[0];
      const s = first && SECTORS.find(x => x.key === first);
      if (s) {
        const c = COMMUNES.find(x => x.v === s.v);
        window.history.replaceState(null, "", c.sectors.length > 1 ? `#/${c.slug}/${slug(s.q)}` : `#/${c.slug}`);
      }
    }
    return parseHash();
  });
  const [saved, setSaved] = useState(loadSaved);

  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const base = "Encombrants Val-d’Oise";
    document.title = route.view === "commune" ? `${route.commune.v} · ${base}`
      : route.view === "calendar" ? `Calendrier · ${base}` : base;
  }, [route]);

  const toggleSaved = key => setSaved(list => {
    const next = list.includes(key) ? list.filter(k => k !== key) : [key, ...list];
    storeSaved(next);
    return next;
  });

  return (
    <div className={`page${route.view === "calendar" ? " wide" : ""}`}>
      <header className="topbar">
        <a href="#/" className="wordmark"><span className="wordmark-mark">95</span>Encombrants</a>
        {route.view === "calendar"
          ? <a href="#/" className="toplink">Ma commune</a>
          : <a href="#/calendrier" className="toplink">Tout le département</a>}
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {route.view === "home" && <Home saved={saved} />}
        {route.view === "commune" && (
          <Commune commune={route.commune} sector={route.sector} saved={saved} toggleSaved={toggleSaved} />
        )}
        {route.view === "calendar" && <Calendar saved={saved} />}
      </main>

      <p className="footnote">
        Dates indicatives établies à partir des calendriers publiés par les communes et syndicats de collecte.
        En cas de doute, la mairie fait foi.
      </p>
    </div>
  );
}
