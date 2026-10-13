import { useState, useMemo, useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════
   DESIGN SYSTEM — "Automne chaud"
   Parchemin · Terra cotta · Sauge · Encre
   ══════════════════════════════════════════════════════ */
const T = {
  bg:"#F7F3EC", bgAlt:"#EEE8DE", bgDeep:"#E5DDD1",
  card:"#FFFDF9", cardBorder:"#DDD5C8",
  terra:"#C4622D", terraDim:"#C4622D18", terraLight:"#F0D5C5",
  sage:"#5C7A5E", sageDim:"#5C7A5E16",
  ink:"#2C2318", inkSub:"#6B5D4F", inkMuted:"#A8998A",
  gold:"#B8860B", goldDim:"#B8860B18",
  cream:"#FAF6EE", white:"#FFFEFB",
  errorBg:"#FFF0ED", errorBorder:"#F0A080",
};

const MC = [
  {bg:"#D6E8F5",border:"#8BB8D8",text:"#1A4A6B",dot:"#3A7CB8"},
  {bg:"#E8D6F0",border:"#C49FD8",text:"#3A1A5A",dot:"#8B4BBB"},
  {bg:"#D5EED6",border:"#8DC48F",text:"#1A3D1C",dot:"#3D8B40"},
  {bg:"#FCE8D5",border:"#E8AC7A",text:"#5A2A08",dot:"#D4682A"},
  {bg:"#FDFBCC",border:"#D4C84A",text:"#3D3508",dot:"#A89820"},
  {bg:"#FFE0DC",border:"#F0A090",text:"#5A1A10",dot:"#D45040"},
  {bg:"#FFE8C8",border:"#ECA860",text:"#5A2E00",dot:"#D07020"},
  {bg:"#FFF3C0",border:"#E8CC60",text:"#453208",dot:"#B89010"},
  {bg:"#D8EEF0",border:"#80C0C8",text:"#0A3840",dot:"#308898"},
  {bg:"#F5E0CC",border:"#D89060",text:"#4A2008",dot:"#C06018"},
  {bg:"#E8DDF5",border:"#B890E0",text:"#2A0A50",dot:"#8855C8"},
  {bg:"#CCE4F5",border:"#70A8D0",text:"#082840",dot:"#2878B8"},
];

const MOIS    = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MOIS_C  = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const JMAP    = {Lundi:1,Mardi:2,Mercredi:3,Jeudi:4,Vendredi:5,Samedi:6,Dimanche:0};
const WCOLS   = ["Lun","Mar","Mer","Jeu","Ven"];

/* ══════════════════════════════════════════════════════
   DONNÉES
   mapUrl = lien vers la page officielle du plan de
   collecte / découpage par secteur fourni par la ville
   ══════════════════════════════════════════════════════ */
const RAW = [
  // CA CERGY-PONTOISE
  {v:"Boisemont",       q:"",              j:"Lundi",    s:1, com:"CA Cergy-Pontoise",   note:"Sortir la veille à partir de 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Cergy",           q:"Secteur A",     j:"Jeudi",    s:1, com:"CA Cergy-Pontoise",   note:"3 secteurs — vérifiez le vôtre sur la carte interactive. Sortir la veille 20h.",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://geoagglo.cergypontoise.fr/apps/plan-interactif/"},
  {v:"Cergy",           q:"Secteur B",     j:"Jeudi",    s:2, com:"CA Cergy-Pontoise",   note:"3 secteurs — vérifiez le vôtre sur la carte interactive. Sortir la veille 20h.",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://geoagglo.cergypontoise.fr/apps/plan-interactif/"},
  {v:"Cergy",           q:"Secteur C",     j:"Jeudi",    s:3, com:"CA Cergy-Pontoise",   note:"3 secteurs — vérifiez le vôtre sur la carte interactive. Sortir la veille 20h.",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://geoagglo.cergypontoise.fr/apps/plan-interactif/"},
  {v:"Courdimanche",    q:"",              j:"Lundi",    s:2, com:"CA Cergy-Pontoise",   note:"Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Éragny-sur-Oise", q:"",              j:"Mardi",    s:3, com:"CA Cergy-Pontoise",   note:"Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Jouy-le-Moutier", q:"",              j:"Mercredi", s:2, com:"CA Cergy-Pontoise",   note:"Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Maurecourt",      q:"",              j:"Lundi",    s:2, com:"CA Cergy-Pontoise",   note:"2e lundi. Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Menucourt",       q:"",              j:"Lundi",    s:2, com:"CA Cergy-Pontoise",   note:"2e lundi. Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Neuville-sur-Oise",q:"",            j:"Mardi",    s:1, com:"CA Cergy-Pontoise",   note:"1er mardi. Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Osny",            q:"Secteur Nord",  j:"Mardi",    s:2, com:"CA Cergy-Pontoise",   note:"2 secteurs. Nord : 2e mardi. Sortir la veille 20h.",
   planUrl:"https://osny.fr/les-services/environnement/collecte-des-dechets-et-encombrants-calendrier-collecte-2026",
   mapUrl: "https://osny.fr/les-services/environnement/collecte-des-dechets-et-encombrants-calendrier-collecte-2026"},
  {v:"Osny",            q:"Secteur Sud",   j:"Mardi",    s:1, com:"CA Cergy-Pontoise",   note:"2 secteurs. Sud : 1er mardi. Sortir la veille 20h.",
   planUrl:"https://osny.fr/les-services/environnement/collecte-des-dechets-et-encombrants-calendrier-collecte-2026",
   mapUrl: "https://osny.fr/les-services/environnement/collecte-des-dechets-et-encombrants-calendrier-collecte-2026"},
  {v:"Pontoise",        q:"",              j:"Jeudi",    s:1, com:"CA Cergy-Pontoise",   note:"1er jeudi. Encombrants + DEEE. Sortir la veille 20h",
   planUrl:"https://ville-pontoise.fr/du-nouveau-dans-la-collecte-des-dechets",
   mapUrl: "https://ville-pontoise.fr/du-nouveau-dans-la-collecte-des-dechets"},
  {v:"Puiseux-Pontoise",q:"",             j:"Vendredi", s:2, com:"CA Cergy-Pontoise",   note:"2e vendredi. Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Saint-Ouen-l'Aumône",q:"",         j:"Jeudi",    s:3, com:"CA Cergy-Pontoise",   note:"3e jeudi. Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Vauréal",         q:"",              j:"Mercredi", s:1, com:"CA Cergy-Pontoise",   note:"1er mercredi. Sortir la veille 20h",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  {v:"Ennery",          q:"",              j:"Vendredi", s:2, com:"CA Cergy-Pontoise",   note:"2e vendredi",
   planUrl:"https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants",
   mapUrl: "https://www.cergypontoise.fr/la-collecte-de-vos-dechets-et-encombrants"},
  // CA PLAINE VALLÉE
  {v:"Arnouville",             q:"",j:"Vendredi", s:1,com:"CA Plaine Vallée",note:"Mensuel sans RDV",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Attainville",            q:"",j:"Vendredi", s:2,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Baillet-en-France",      q:"",j:"Mardi",    s:1,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Bouffémont",             q:"",j:"Jeudi",    s:2,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Domont",                 q:"",j:"Mercredi", s:1,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Ézanville",              q:"",j:"Lundi",    s:3,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Groslay",                q:"",j:"Mercredi", s:3,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Maffliers",              q:"",j:"Jeudi",    s:1,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Margency",               q:"",j:"Mercredi", s:2,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Moisselles",             q:"",j:"Mardi",    s:3,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Montlignon",             q:"",j:"Lundi",    s:1,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Montmorency",            q:"",j:"Vendredi", s:3,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Saint-Brice-sous-Forêt", q:"",j:"Mardi",    s:2,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Saint-Gratien",          q:"",j:"Jeudi",    s:3,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Saint-Leu-la-Forêt",     q:"",j:"Vendredi", s:2,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Saint-Prix",             q:"",j:"Mercredi", s:4,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Andilly",                q:"",j:"Lundi",    s:2,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Deuil-la-Barre",         q:"",j:"Mercredi", s:1,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Montsoult",              q:"",j:"Lundi",    s:4,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  {v:"Montmagny",              q:"",j:"Jeudi",    s:4,com:"CA Plaine Vallée",note:"Mensuel",planUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/",mapUrl:"https://www.agglo-plainevallee.fr/au-quotidien/dechets/calendriers-de-collecte/"},
  // SIGIDURS
  {v:"Sarcelles",       q:"Secteur Nord",  j:"Lundi",    s:1, com:"SIGIDURS",             note:"2 secteurs. Nord : 1er lundi. Sortir la veille 19h.",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Sarcelles",       q:"Secteur Sud",   j:"Mardi",    s:2, com:"SIGIDURS",             note:"2 secteurs. Sud : 2e mardi. Sortir la veille 19h.",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Garges-lès-Gonesse",q:"",           j:"Jeudi",    s:1, com:"SIGIDURS",             note:"1er jeudi. Sortir la veille 19h",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Gonesse",         q:"",              j:"Mercredi", s:1, com:"SIGIDURS",             note:"1er mercredi. Sortir la veille 19h",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Fosses",          q:"",              j:"Lundi",    s:1, com:"SIGIDURS",             note:"1er lundi. Sortir la veille 19h",
   planUrl:"https://www.sigidurs.fr/wp-content/uploads/2025/12/CALENDRIER-2026-4p-FOSSES.pdf",
   mapUrl: "https://www.sigidurs.fr/wp-content/uploads/2025/12/CALENDRIER-2026-4p-FOSSES.pdf"},
  {v:"Louvres",         q:"",              j:"Mardi",    s:1, com:"SIGIDURS",             note:"1er mardi. Sortir la veille 19h",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Roissy-en-France",q:"",             j:"Vendredi", s:2, com:"SIGIDURS",             note:"2e vendredi",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Goussainville",   q:"",              j:"Mercredi", s:2, com:"SIGIDURS",             note:"2e mercredi. Sortir la veille 19h",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Marly-la-Ville",  q:"",              j:"Vendredi", s:1, com:"SIGIDURS",             note:"1er vendredi",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Puiseux-en-France",q:"",            j:"Mardi",    s:3, com:"SIGIDURS",             note:"3e mardi",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Bonneuil-en-France",q:"",           j:"Jeudi",    s:3, com:"SIGIDURS",             note:"3e jeudi",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Saint-Witz",      q:"",              j:"Mercredi", s:2, com:"SIGIDURS",             note:"2e mercredi",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  {v:"Fontenay-en-Parisis",q:"",          j:"Jeudi",    s:4, com:"SIGIDURS",             note:"4e jeudi",
   planUrl:"https://www.sigidurs.fr",mapUrl:"https://www.sigidurs.fr"},
  // CA VAL ET FORÊT
  {v:"Ermont",          q:"",j:"Lundi",    s:1,com:"CA Val et Forêt",note:"1er lundi",   planUrl:"https://www.ermont.fr",mapUrl:"https://www.ermont.fr"},
  {v:"Eaubonne",        q:"",j:"Mercredi", s:1,com:"CA Val et Forêt",note:"1er mercredi",planUrl:"https://www.eaubonne.fr",mapUrl:"https://www.eaubonne.fr"},
  {v:"Sannois",         q:"",j:"Jeudi",    s:2,com:"CA Val et Forêt",note:"2e jeudi",    planUrl:"https://www.sannois.fr",mapUrl:"https://www.sannois.fr"},
  {v:"Franconville",    q:"",j:"Mardi",    s:1,com:"CA Val et Forêt",note:"1er mardi",   planUrl:"https://www.franconville.fr",mapUrl:"https://www.franconville.fr"},
  {v:"Enghien-les-Bains",q:"",j:"Mercredi",s:3,com:"CA Val et Forêt",note:"3e mercredi",planUrl:"https://www.enghien-les-bains.fr",mapUrl:"https://www.enghien-les-bains.fr"},
  // ARGENTEUIL 3 secteurs
  {v:"Argenteuil",      q:"Secteur Nord",  j:"Lundi",    s:1, com:"Ville d'Argenteuil",  note:"3 secteurs. Nord : 1er lundi. Encombrants + DEEE.",
   planUrl:"https://www.ville-argenteuil.fr",mapUrl:"https://www.ville-argenteuil.fr"},
  {v:"Argenteuil",      q:"Secteur Centre",j:"Mardi",    s:2, com:"Ville d'Argenteuil",  note:"3 secteurs. Centre : 2e mardi. Encombrants + DEEE.",
   planUrl:"https://www.ville-argenteuil.fr",mapUrl:"https://www.ville-argenteuil.fr"},
  {v:"Argenteuil",      q:"Secteur Sud",   j:"Jeudi",    s:3, com:"Ville d'Argenteuil",  note:"3 secteurs. Sud : 3e jeudi. Encombrants + DEEE.",
   planUrl:"https://www.ville-argenteuil.fr",mapUrl:"https://www.ville-argenteuil.fr"},
  // BEZONS 2 secteurs
  {v:"Bezons",          q:"Secteur Est",   j:"Mercredi", s:1, com:"Ville de Bezons",      note:"2 secteurs. Est : 1er mercredi.",
   planUrl:"https://www.bezons.fr",mapUrl:"https://www.bezons.fr"},
  {v:"Bezons",          q:"Secteur Ouest", j:"Mercredi", s:3, com:"Ville de Bezons",      note:"2 secteurs. Ouest : 3e mercredi.",
   planUrl:"https://www.bezons.fr",mapUrl:"https://www.bezons.fr"},
  // HERBLAY 2 secteurs
  {v:"Herblay-sur-Seine",q:"Secteur Nord", j:"Vendredi", s:1, com:"Herblay-sur-Seine",   note:"2 secteurs. Nord : 1er vendredi.",
   planUrl:"https://www.herblay-sur-seine.fr",mapUrl:"https://www.herblay-sur-seine.fr"},
  {v:"Herblay-sur-Seine",q:"Secteur Sud",  j:"Vendredi", s:3, com:"Herblay-sur-Seine",   note:"2 secteurs. Sud : 3e vendredi.",
   planUrl:"https://www.herblay-sur-seine.fr",mapUrl:"https://www.herblay-sur-seine.fr"},
  // COMMUNES DIVERSES
  {v:"Cormeilles-en-Parisis", q:"",j:"Jeudi",    s:1,com:"Ville",note:"1er jeudi",      planUrl:"https://www.cormeilles-en-parisis.fr",mapUrl:"https://www.cormeilles-en-parisis.fr"},
  {v:"Montigny-lès-Cormeilles",q:"",j:"Lundi",   s:3,com:"Ville",note:"3e lundi",       planUrl:"https://www.montigny-les-cormeilles.fr",mapUrl:"https://www.montigny-les-cormeilles.fr"},
  {v:"Le Plessis-Bouchard",   q:"",j:"Mardi",    s:2,com:"Ville",note:"2e mardi",        planUrl:"https://www.leplessisbouchard.fr",mapUrl:"https://www.leplessisbouchard.fr"},
  {v:"Beauchamp",             q:"",j:"Mercredi", s:2,com:"Ville",note:"2e mercredi",     planUrl:"https://www.beauchamp.fr",mapUrl:"https://www.beauchamp.fr"},
  {v:"Pierrelaye",            q:"",j:"Vendredi", s:3,com:"Ville",note:"3e vendredi",     planUrl:"https://www.pierrelaye.fr",mapUrl:"https://www.pierrelaye.fr"},
  {v:"Écouen",                q:"",j:"Jeudi",    s:2,com:"CC Pays de France",note:"2e jeudi",planUrl:"https://www.ecouen.fr",mapUrl:"https://www.ecouen.fr"},
  {v:"L'Isle-Adam",           q:"",j:"Mardi",    s:1,com:"CC Val et Forêts",note:"1er mardi",planUrl:"https://www.lisle-adam.fr",mapUrl:"https://www.lisle-adam.fr"},
  {v:"Persan",                q:"",j:"Vendredi", s:2,com:"CC Carnelle",note:"2e vendredi",planUrl:"https://www.persan.fr",mapUrl:"https://www.persan.fr"},
  {v:"Beaumont-sur-Oise",     q:"",j:"Lundi",    s:2,com:"CC Carnelle",note:"2e lundi",  planUrl:"https://www.beaumont-sur-oise.fr",mapUrl:"https://www.beaumont-sur-oise.fr"},
  {v:"Méry-sur-Oise",         q:"",j:"Jeudi",    s:1,com:"Ville",note:"1er jeudi",       planUrl:"https://www.mery-sur-oise.fr",mapUrl:"https://www.mery-sur-oise.fr"},
  {v:"Luzarches",             q:"",j:"Mercredi", s:1,com:"CC Pays de France",note:"1er mercredi",planUrl:"https://www.luzarches.fr",mapUrl:"https://www.luzarches.fr"},
  {v:"La Frette-sur-Seine",   q:"",j:"Vendredi", s:1,com:"Ville",note:"1er vendredi",    planUrl:"https://www.lafrette.fr",mapUrl:"https://www.lafrette.fr"},
  {v:"Champagne-sur-Oise",    q:"",j:"Vendredi", s:3,com:"CC Carnelle",note:"3e vendredi",planUrl:"https://www.champagne-sur-oise.fr",mapUrl:"https://www.champagne-sur-oise.fr"},
  {v:"Parmain",               q:"",j:"Jeudi",    s:3,com:"CC Val et Forêts",note:"3e jeudi",planUrl:"https://www.parmain.fr",mapUrl:"https://www.parmain.fr"},
  {v:"Bruyères-sur-Oise",     q:"",j:"Jeudi",    s:2,com:"CC Carnelle",note:"2e jeudi",  planUrl:"https://www.bruyeres-sur-oise.fr",mapUrl:"https://www.bruyeres-sur-oise.fr"},
  {v:"Belloy-en-France",      q:"",j:"Vendredi", s:3,com:"CC Pays de France",note:"3e vendredi",planUrl:"https://www.belloy-en-france.fr",mapUrl:"https://www.belloy-en-france.fr"},
  {v:"Bernes-sur-Oise",       q:"",j:"Lundi",    s:3,com:"CC Carnelle",note:"3e lundi",  planUrl:"https://www.bernes-sur-oise.fr",mapUrl:"https://www.bernes-sur-oise.fr"},
  {v:"Mours",                 q:"",j:"Mercredi", s:3,com:"CC Carnelle",note:"3e mercredi",planUrl:"https://www.mours.fr",mapUrl:"https://www.mours.fr"},
  {v:"Chaumontel",            q:"",j:"Mardi",    s:2,com:"CC Pays de France",note:"2e mardi",planUrl:"https://www.chaumontel.fr",mapUrl:"https://www.chaumontel.fr"},
  {v:"Saint-Martin-du-Tertre",q:"",j:"Mardi",    s:4,com:"CC Pays de France",note:"4e mardi",planUrl:"https://www.saint-martin-du-tertre.fr",mapUrl:"https://www.saint-martin-du-tertre.fr"},
  {v:"Presles",               q:"",j:"Jeudi",    s:4,com:"CC Carnelle",note:"4e jeudi",  planUrl:"https://www.presles.fr",mapUrl:"https://www.presles.fr"},
  {v:"Magny-en-Vexin",        q:"",j:"Vendredi", s:1,com:"CC du Vexin",note:"1er vendredi — vérifier mairie",planUrl:"https://www.magny-en-vexin.fr",mapUrl:"https://www.magny-en-vexin.fr"},
  // SMIRTOM DU VEXIN (2×/an)
  {v:"Auvers-sur-Oise",  q:"",j:"Mardi",   s:2,com:"SMIRTOM du Vexin",note:"2×/an (printemps + automne).",planUrl:"https://smirtomduvexin.net",mapUrl:"https://smirtomduvexin.net",x2:true},
  {v:"Bessancourt",      q:"",j:"Samedi",  s:1,com:"SMIRTOM du Vexin",note:"2×/an.",planUrl:"https://smirtomduvexin.net",mapUrl:"https://smirtomduvexin.net",x2:true},
  {v:"Butry-sur-Oise",   q:"",j:"Samedi",  s:2,com:"SMIRTOM du Vexin",note:"2×/an.",planUrl:"https://smirtomduvexin.net",mapUrl:"https://smirtomduvexin.net",x2:true},
  {v:"Mériel",           q:"",j:"Samedi",  s:3,com:"SMIRTOM du Vexin",note:"2×/an.",planUrl:"https://smirtomduvexin.net",mapUrl:"https://smirtomduvexin.net",x2:true},
  {v:"Nesles-la-Vallée", q:"",j:"Samedi",  s:1,com:"SMIRTOM du Vexin",note:"2×/an.",planUrl:"https://smirtomduvexin.net",mapUrl:"https://smirtomduvexin.net",x2:true},
  {v:"Marines",          q:"",j:"Vendredi",s:2,com:"CC du Vexin",note:"2×/an.",planUrl:"https://www.marines.fr",mapUrl:"https://www.marines.fr",x2:true},
  {v:"Chars",            q:"",j:"Samedi",  s:2,com:"CC Vexin",note:"2×/an.",planUrl:"https://www.chars.fr",mapUrl:"https://www.chars.fr",x2:true},
  {v:"Seraincourt",      q:"",j:"Vendredi",s:3,com:"CC Vexin",note:"2×/an.",planUrl:"https://www.seraincourt.fr",mapUrl:"https://www.seraincourt.fr",x2:true},
  {v:"Ableiges",         q:"",j:"Samedi",  s:2,com:"CC Vexin",note:"2×/an.",planUrl:"https://www.ableiges.fr",mapUrl:"https://www.ableiges.fr",x2:true},
];

/* ══════════════════════════════════════════════════════
   GÉNÉRATION DES DATES
   ══════════════════════════════════════════════════════ */
function nthWD(yr,mo,wd,n){
  const t=JMAP[wd]; let c=0;
  for(let d=1;d<=31;d++){const dt=new Date(yr,mo,d);if(dt.getMonth()!==mo)break;if(dt.getDay()===t&&++c===n)return dt;}
  return null;
}
const fmtL = d => d?d.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}):"—";

const ALL_ROWS = (()=>{
  const rows=[];
  for(const c of RAW){
    const label=c.q?`${c.v} — ${c.q}`:c.v;
    if(c.x2){
      for(const mArr of [[2,3],[8,9]]){
        for(const m of mArr){const d=nthWD(2026,m,c.j,c.s);if(d){rows.push({...c,label,dateLong:fmtL(d),dateObj:d,moisIdx:m,day:d.getDate()});break;}}
      }
    } else {
      for(let m=0;m<12;m++){const d=nthWD(2026,m,c.j,c.s);if(d)rows.push({...c,label,dateLong:fmtL(d),dateObj:d,moisIdx:m,day:d.getDate()});}
    }
  }
  return rows.sort((a,b)=>a.dateObj-b.dateObj);
})();

const TODAY=new Date(); TODAY.setHours(0,0,0,0);
const ALL_VILLES=[...new Set(RAW.map(r=>r.v))].sort();

/* ══════════════════════════════════════════════════════
   STOCKAGE COMPTE (localStorage)
   ══════════════════════════════════════════════════════ */
const STORE={
  get:()=>{try{return JSON.parse(localStorage.getItem("encombrants_user")||"null");}catch{return null;}},
  set:(u)=>{try{localStorage.setItem("encombrants_user",JSON.stringify(u));}catch{}},
  clear:()=>{try{localStorage.removeItem("encombrants_user");}catch{}},
};

/* ══════════════════════════════════════════════════════
   TOOLTIP COMPOSANT
   ══════════════════════════════════════════════════════ */
function Tooltip({text,children}){
  const [show,setShow]=useState(false);
  const [pos,setPos]=useState({x:0,y:0});
  return(
    <span style={{position:"relative",display:"block"}}
      onMouseEnter={e=>{setShow(true);const r=e.currentTarget.getBoundingClientRect();setPos({x:r.left,y:r.top});}}
      onMouseLeave={()=>setShow(false)}>
      {children}
      {show&&(
        <span style={{
          position:"fixed",left:pos.x,top:pos.y-34,
          background:T.ink,color:"#fff",fontSize:11,
          padding:"4px 8px",borderRadius:6,whiteSpace:"nowrap",
          zIndex:9999,pointerEvents:"none",
          boxShadow:"0 4px 12px rgba(0,0,0,0.25)",
          fontFamily:"Georgia,serif",
        }}>{text}</span>
      )}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL PLAN OFFICIEL
   ══════════════════════════════════════════════════════ */
function PlanModal({row,onClose}){
  const mc=MC[row.moisIdx];
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,35,24,0.7)",backdropFilter:"blur(8px)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`2px solid ${T.cardBorder}`,borderRadius:18,width:"100%",maxWidth:700,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(44,35,24,0.35)",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",background:`linear-gradient(135deg,${mc.bg},${T.cream})`,borderBottom:`1px solid ${mc.border}`,display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:mc.dot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📦</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:T.ink,lineHeight:1.2}}>{row.label}</div>
            <div style={{fontSize:11,color:T.inkSub,marginTop:2}}>{row.com} · {row.dateLong}</div>
            <div style={{fontSize:11,color:T.inkSub,fontStyle:"italic",marginTop:1}}>{row.note}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(44,35,24,0.1)",border:"none",color:T.inkSub,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        </div>
        <div style={{flex:1,minHeight:320,background:T.bgAlt,position:"relative"}}>
          <iframe
            key={row.mapUrl}
            src={row.mapUrl}
            title={`Plan de collecte — ${row.v}`}
            style={{width:"100%",height:"100%",minHeight:320,border:"none",display:"block"}}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
        <div style={{padding:"10px 18px",background:T.cream,borderTop:`1px solid ${T.cardBorder}`,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:T.inkMuted,flex:1,fontStyle:"italic"}}>Plan de collecte officiel fourni par {row.com}</span>
          <a href={row.planUrl} target="_blank" rel="noopener noreferrer"
            style={{fontSize:12,color:T.terra,textDecoration:"none",fontWeight:600,background:T.terraDim,border:`1px solid ${T.terraLight}`,padding:"6px 12px",borderRadius:8,display:"flex",alignItems:"center",gap:5}}>
            🔗 Ouvrir dans un nouvel onglet
          </a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL COMPTE UTILISATEUR
   ══════════════════════════════════════════════════════ */
function CompteModal({user,onSave,onLogout,onClose}){
  const [step,setStep]=useState(user?"profil":"login");
  const [email,setEmail]=useState(user?.email||"");
  const [nom,setNom]=useState(user?.nom||"");
  const [tel,setTel]=useState(user?.tel||"");
  const [alertEmail,setAlertEmail]=useState(user?.alertEmail??true);
  const [alertSms,setAlertSms]=useState(user?.alertSms??false);
  const [favoris,setFavoris]=useState(user?.favoris||[]);
  const [tab,setTab]=useState("profil");
  const [saved,setSaved]=useState(false);

  const toggleFav=v=>setFavoris(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);

  const handleSave=()=>{
    const u={email,nom,tel,alertEmail,alertSms,favoris,createdAt:user?.createdAt||Date.now()};
    onSave(u); setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const Input=({label,val,setter,type="text",placeholder})=>(
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:T.inkSub,marginBottom:5,fontWeight:600,letterSpacing:.5}}>{label}</div>
      <input value={val} onChange={e=>setter(e.target.value)} type={type} placeholder={placeholder}
        style={{width:"100%",background:T.white,border:`1.5px solid ${T.cardBorder}`,color:T.ink,padding:"9px 12px",borderRadius:9,fontFamily:"Lora,Georgia,serif",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border .2s"}}
        onFocus={e=>e.target.style.borderColor=T.terra}
        onBlur={e=>e.target.style.borderColor=T.cardBorder}/>
    </div>
  );

  if(step==="login") return(
    <Overlay onClose={onClose}>
      <ModalBox>
        <ModalHead title="Créer un compte" sub="Pour recevoir vos rappels et gérer vos favoris" onClose={onClose}/>
        <div style={{padding:"0 20px 20px"}}>
          <Input label="Prénom" val={nom} setter={setNom} placeholder="Votre prénom"/>
          <Input label="Adresse e-mail" val={email} setter={setEmail} type="email" placeholder="votre@email.fr"/>
          <Input label="Téléphone (pour les SMS)" val={tel} setter={setTel} type="tel" placeholder="+33 6 12 34 56 78"/>
          <div style={{fontSize:11,color:T.inkMuted,marginBottom:16,padding:"10px 12px",background:T.bgAlt,borderRadius:8,fontStyle:"italic"}}>
            Vos données restent dans votre navigateur. Aucune donnée n'est envoyée à un serveur.
          </div>
          <button onClick={()=>{handleSave();setStep("profil");}}
            disabled={!email||!nom}
            style={{width:"100%",background:email&&nom?T.terra:"#ccc",color:"#fff",border:"none",padding:"11px",borderRadius:10,cursor:email&&nom?"pointer":"default",fontFamily:"Lora,serif",fontSize:14,fontWeight:700,letterSpacing:.3,transition:"background .2s"}}>
            Créer mon compte
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );

  return(
    <Overlay onClose={onClose}>
      <ModalBox wide>
        <ModalHead title={`Bonjour, ${user?.nom||""}  👋`} sub="Mon espace personnel" onClose={onClose}/>
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.cardBorder}`,padding:"0 20px"}}>
          {[["profil","👤 Profil"],["favoris","⭐ Favoris"],["alertes","🔔 Alertes"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{padding:"10px 16px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===k?T.terra:"transparent"}`,color:tab===k?T.terra:T.inkSub,cursor:"pointer",fontFamily:"Lora,serif",fontSize:13,fontWeight:tab===k?700:400,transition:"all .2s"}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:"18px 20px 20px",overflowY:"auto",maxHeight:"55vh"}}>
          {tab==="profil"&&<>
            <Input label="Prénom" val={nom} setter={setNom} placeholder="Votre prénom"/>
            <Input label="E-mail" val={email} setter={setEmail} type="email" placeholder="votre@email.fr"/>
            <Input label="Téléphone (SMS)" val={tel} setter={setTel} type="tel" placeholder="+33 6 12 34 56 78"/>
            <div style={{fontSize:11,color:T.inkMuted,fontStyle:"italic",marginBottom:16}}>
              Compte local — données stockées uniquement dans votre navigateur.
            </div>
          </>}

          {tab==="favoris"&&<>
            <div style={{fontSize:12,color:T.inkSub,marginBottom:12,fontStyle:"italic"}}>
              Sélectionnez vos communes pour recevoir des rappels ciblés.
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {ALL_VILLES.map(v=>{
                const on=favoris.includes(v);
                return(
                  <button key={v} onClick={()=>toggleFav(v)}
                    style={{padding:"6px 12px",background:on?T.terra:T.white,color:on?"#fff":T.inkSub,border:`1.5px solid ${on?T.terra:T.cardBorder}`,borderRadius:20,cursor:"pointer",fontFamily:"Lora,serif",fontSize:12,fontWeight:on?700:400,transition:"all .2s"}}>
                    {on?"✓ ":""}{v}
                  </button>
                );
              })}
            </div>
          </>}

          {tab==="alertes"&&<>
            <div style={{fontSize:12,color:T.inkSub,marginBottom:14,fontStyle:"italic"}}>
              Vous recevrez un rappel la <strong>veille à 18h</strong> des collectes de vos villes favorites.
            </div>
            <Toggle label="Rappel par e-mail" desc={email||"— renseignez votre e-mail dans Profil"} val={alertEmail} setter={setAlertEmail}/>
            <Toggle label="Rappel par SMS" desc={tel||"— renseignez votre téléphone dans Profil"} val={alertSms} setter={setAlertSms}/>
            {favoris.length===0&&<div style={{marginTop:12,padding:"10px 14px",background:T.bgAlt,borderRadius:8,fontSize:12,color:T.terra,fontStyle:"italic"}}>
              ⚠️ Ajoutez des villes en favoris pour activer les rappels.
            </div>}
            {favoris.length>0&&<div style={{marginTop:12,padding:"10px 14px",background:T.bgAlt,borderRadius:8,fontSize:12,color:T.inkSub}}>
              Rappels configurés pour : <strong style={{color:T.ink}}>{favoris.join(", ")}</strong>
            </div>}
            <div style={{marginTop:12,fontSize:10,color:T.inkMuted,fontStyle:"italic"}}>
              Note : cette démo enregistre vos préférences localement. En production, les envois sont réalisés via SendGrid (email) ou Twilio (SMS).
            </div>
          </>}
        </div>

        <div style={{padding:"12px 20px",borderTop:`1px solid ${T.cardBorder}`,display:"flex",gap:10,background:T.cream}}>
          <button onClick={()=>{onLogout();onClose();}}
            style={{padding:"9px 16px",background:"transparent",border:`1px solid ${T.cardBorder}`,color:T.inkSub,borderRadius:8,cursor:"pointer",fontFamily:"Lora,serif",fontSize:12}}>
            Se déconnecter
          </button>
          <button onClick={handleSave}
            style={{flex:1,padding:"9px",background:T.terra,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"Lora,serif",fontSize:13,fontWeight:700,transition:"background .2s"}}>
            {saved?"✓ Sauvegardé !":"Enregistrer"}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function Overlay({children,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,35,24,0.7)",backdropFilter:"blur(8px)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      {children}
    </div>
  );
}
function ModalBox({children,wide}){
  return(
    <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`2px solid ${T.cardBorder}`,borderRadius:18,width:"100%",maxWidth:wide?520:420,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(44,35,24,0.35)",overflow:"hidden"}}>
      {children}
    </div>
  );
}
function ModalHead({title,sub,onClose}){
  return(
    <div style={{padding:"16px 20px",background:`linear-gradient(135deg,${T.terraLight},${T.cream})`,borderBottom:`1px solid ${T.cardBorder}`,display:"flex",alignItems:"flex-start",gap:12}}>
      <div style={{flex:1}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:T.ink}}>{title}</div>
        {sub&&<div style={{fontSize:11,color:T.inkSub,marginTop:2,fontStyle:"italic"}}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{background:"rgba(44,35,24,0.1)",border:"none",color:T.inkSub,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
    </div>
  );
}
function Toggle({label,desc,val,setter}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"10px 14px",background:T.white,borderRadius:10,border:`1px solid ${T.cardBorder}`}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{label}</div>
        <div style={{fontSize:11,color:T.inkMuted,marginTop:2}}>{desc}</div>
      </div>
      <button onClick={()=>setter(v=>!v)}
        style={{width:44,height:24,borderRadius:12,background:val?T.terra:T.bgDeep,border:"none",cursor:"pointer",position:"relative",transition:"background .25s",flexShrink:0}}>
        <span style={{position:"absolute",top:3,left:val?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .25s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CALENDRIER MENSUEL
   ══════════════════════════════════════════════════════ */
function MonthCalendar({month,allRows,filterVille,favVilles,onCityClick}){
  const yr=2026;
  const mc=MC[month];
  const totalDays=new Date(yr,month+1,0).getDate();
  const todayDay=TODAY.getFullYear()===yr&&TODAY.getMonth()===month?TODAY.getDate():null;

  const byDay=useMemo(()=>{
    const m={};
    allRows.forEach(r=>{
      if(r.moisIdx!==month) return;
      if(filterVille&&!r.v.toLowerCase().includes(filterVille.toLowerCase())) return;
      if(!m[r.day]) m[r.day]=[];
      m[r.day].push(r);
    });
    return m;
  },[allRows,month,filterVille]);

  const totalEvents=Object.values(byDay).reduce((s,a)=>s+a.length,0);

  const weeks=useMemo(()=>{
    const res=[];
    const firstJsDay=new Date(yr,month,1).getDay();
    const dowOffset=firstJsDay===0?6:firstJsDay-1;
    let cursor=1-dowOffset;
    while(cursor<=totalDays){
      const week=[];
      for(let col=0;col<5;col++){
        const d=cursor+col;
        week.push(d>=1&&d<=totalDays?d:null);
      }
      res.push(week);
      cursor+=7;
    }
    return res;
  },[month,totalDays]);

  const trunc=(str,n=7)=>str.length<=n?str:str.slice(0,n)+"…";

  return(
    <div style={{background:T.card,border:`1.5px solid ${mc.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 4px 20px rgba(44,35,24,0.07)"}}>
      <div style={{background:`linear-gradient(135deg,${mc.bg},${T.cream})`,padding:"12px 16px",borderBottom:`1px solid ${mc.border}`,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:9,height:9,borderRadius:"50%",background:mc.dot,boxShadow:`0 0 0 3px ${mc.dot}28`}}/>
        <span style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:mc.text}}>{MOIS[month]} 2026</span>
        {totalEvents>0&&<span style={{marginLeft:"auto",fontSize:10,color:mc.text,background:`${mc.dot}18`,border:`1px solid ${mc.dot}30`,padding:"2px 8px",borderRadius:20,fontWeight:600}}>{totalEvents} collecte{totalEvents>1?"s":""}</span>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:T.bgAlt,borderBottom:`1px solid ${T.cardBorder}`}}>
        {WCOLS.map(j=>(
          <div key={j} style={{padding:"7px 0",textAlign:"center",fontSize:10,color:T.inkMuted,letterSpacing:.8,fontWeight:700,textTransform:"uppercase"}}>{j}</div>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:1,background:T.bgDeep,padding:1}}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:1}}>
            {week.map((d,ci)=>{
              if(!d) return <div key={ci} style={{background:T.bgAlt,minHeight:64}}/>;
              const events=byDay[d]||[];
              const isToday=d===todayDay;
              return(
                <div key={d} style={{
                  background:events.length>0?`linear-gradient(180deg,${mc.bg}90,${T.cream})`:T.white,
                  minHeight:64,
                  padding:"4px 4px 3px 5px",
                  overflow:"hidden",
                  boxSizing:"border-box",
                }}>
                  <div style={{fontSize:10,fontWeight:isToday?800:500,color:isToday?T.terra:T.inkMuted,textAlign:"right",lineHeight:1,marginBottom:3,userSelect:"none"}}>
                    {d}{isToday&&<div style={{height:2,background:T.terra,borderRadius:1,marginTop:1}}/>}
                  </div>
                  {events.map((r,ei)=>{
                    const isFav=favVilles.includes(r.v);
                    const fullName=r.q?`${r.v} — ${r.q}`:r.v;
                    const shortName=trunc(fullName,7);
                    const needsTooltip=fullName.length>7;
                    const btn=(
                      <button onClick={()=>onCityClick(r)}
                        style={{
                          display:"block",
                          width:"100%",
                          boxSizing:"border-box",
                          textAlign:"left",
                          background:isFav?`${T.terra}18`:(r.q?`${mc.dot}20`:`${mc.dot}12`),
                          border:`1px solid ${isFav?T.terra:mc.dot+"44"}`,
                          borderLeft:`3px solid ${isFav?T.terra:mc.dot}`,
                          borderRadius:"0 4px 4px 0",
                          padding:"2px 4px",
                          marginBottom:2,
                          cursor:"pointer",
                          fontFamily:"Georgia,serif",
                          transition:"all .15s",
                          overflow:"hidden",
                          whiteSpace:"nowrap",
                        }}
                        onMouseOver={e=>{e.currentTarget.style.background=`${mc.dot}30`;e.currentTarget.style.transform="translateX(1px)";}}
                        onMouseOut={e=>{e.currentTarget.style.background=isFav?`${T.terra}18`:(r.q?`${mc.dot}20`:`${mc.dot}12`);e.currentTarget.style.transform="none";}}>
                        <span style={{fontSize:10,color:mc.text,fontWeight:700,display:"block",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"clip"}}>
                          {shortName}
                        </span>
                      </button>
                    );
                    return(
                      <div key={ei}>
                        {needsTooltip?<Tooltip text={fullName}>{btn}</Tooltip>:btn}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP PRINCIPALE
   ══════════════════════════════════════════════════════ */
export default function App(){
  const [calMois,setCalMois]=useState(()=>new Date().getMonth());
  const [filterVille,setFilterVille]=useState("");
  const [planRow,setPlanRow]=useState(null);
  const [isMobile,setIsMobile]=useState(window.innerWidth<700);
  const [suggestions,setSuggestions]=useState([]);
  const [user,setUser]=useState(()=>STORE.get());
  const [showCompte,setShowCompte]=useState(false);
  const inputRef=useRef();

  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<700);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  const saveUser=u=>{setUser(u);STORE.set(u);};
  const logout=()=>{setUser(null);STORE.clear();};

  const handleInput=val=>{
    setFilterVille(val);
    if(val.trim().length<1){setSuggestions([]);return;}
    const q=val.toLowerCase();
    setSuggestions(ALL_VILLES.filter(v=>v.toLowerCase().includes(q)).slice(0,7));
  };

  const favVilles=user?.favoris||[];
  const todayMois=new Date().getMonth();

  const monthEvents=useMemo(()=>ALL_ROWS.filter(r=>{
    if(r.moisIdx!==calMois) return false;
    if(filterVille&&!r.v.toLowerCase().includes(filterVille.toLowerCase())) return false;
    return true;
  }).length,[calMois,filterVille]);

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${T.bg};}
        ::selection{background:${T.terraLight};color:${T.ink};}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.bgAlt};}
        ::-webkit-scrollbar-thumb{background:${T.inkMuted};border-radius:3px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .fade-up{animation:fadeUp .3s ease both}
      `}</style>

      <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${T.bg},${T.bgAlt})`,fontFamily:"Lora,Georgia,serif",color:T.ink}}>

        <header style={{background:`linear-gradient(180deg,${T.card},${T.cream})`,borderBottom:`1.5px solid ${T.cardBorder}`,padding:isMobile?"14px 12px":"18px 24px",position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 16px rgba(44,35,24,0.10)"}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:9,letterSpacing:3,color:T.terra,textTransform:"uppercase",marginBottom:4,fontStyle:"italic"}}>Val d'Oise · Département 95 · 2026</div>
                <h1 style={{fontSize:isMobile?18:24,fontFamily:"Lora,Georgia,serif",fontWeight:700,color:T.ink,letterSpacing:-.3,lineHeight:1.1}}>Calendrier des Encombrants</h1>
                <p style={{fontSize:11,color:T.inkSub,marginTop:4,fontStyle:"italic"}}>{ALL_ROWS.length} collectes · {ALL_VILLES.length} communes</p>
              </div>
              <button onClick={()=>setShowCompte(true)}
                style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",background:user?T.terra:T.white,color:user?"#fff":T.inkSub,border:`1.5px solid ${user?T.terra:T.cardBorder}`,borderRadius:10,cursor:"pointer",fontFamily:"Lora,serif",fontSize:12,fontWeight:600,transition:"all .2s",flexShrink:0,boxShadow:user?"0 2px 8px rgba(196,98,45,0.3)":"none"}}>
                {user?`👤 ${user.nom}`:"👤 Se connecter"}
              </button>
            </div>

            <div style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",background:T.white,border:`1.5px solid ${filterVille?T.terra:T.cardBorder}`,borderRadius:10,padding:"0 10px",boxShadow:filterVille?`0 0 0 3px ${T.terraDim}`:"0 1px 3px rgba(44,35,24,0.07)",transition:"all .2s"}}>
                <span style={{color:T.inkMuted,fontSize:14,flexShrink:0}}>🔍</span>
                <input ref={inputRef} value={filterVille} onChange={e=>handleInput(e.target.value)}
                  placeholder="Filtrer par ville… (vide = tout afficher)"
                  style={{flex:1,background:"transparent",border:"none",color:T.ink,padding:"10px 8px",fontFamily:"Lora,serif",fontSize:isMobile?13:14,outline:"none"}}
                  onKeyDown={e=>{if(e.key==="Escape"){setFilterVille("");setSuggestions([]);}}}/>
                {filterVille&&<button onClick={()=>{setFilterVille("");setSuggestions([]);}} style={{background:"none",border:"none",color:T.inkMuted,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1}}>✕</button>}
              </div>
              {suggestions.length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,right:0,background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:10,boxShadow:"0 10px 30px rgba(44,35,24,0.15)",zIndex:300,overflow:"hidden"}}>
                  {suggestions.map((s,i)=>(
                    <button key={i} onClick={()=>{setFilterVille(s);setSuggestions([]);}}
                      style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"transparent",border:"none",borderBottom:i<suggestions.length-1?`1px solid ${T.bgAlt}`:"none",cursor:"pointer",fontFamily:"Lora,serif",textAlign:"left",transition:"background .1s",color:T.ink,fontSize:13}}
                      onMouseOver={e=>e.currentTarget.style.background=T.terraLight+"55"}
                      onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                      <span>📍</span>
                      <span style={{flex:1,fontWeight:600}}>{s}</span>
                      {RAW.filter(r=>r.v===s&&r.q).length>0&&<span style={{fontSize:10,color:T.terra,fontStyle:"italic"}}>multi-secteurs</span>}
                      {favVilles.includes(s)&&<span style={{fontSize:10,color:T.gold}}>⭐</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <nav style={{background:T.cream,borderBottom:`1px solid ${T.cardBorder}`,padding:isMobile?"8px 10px":"10px 24px",position:"sticky",top:isMobile?105:101,zIndex:100,boxShadow:"0 2px 8px rgba(44,35,24,0.05)"}}>
          <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:5}}>
            <button onClick={()=>setCalMois(m=>Math.max(0,m-1))} disabled={calMois===0}
              style={{background:calMois===0?T.bgAlt:T.card,border:`1px solid ${T.cardBorder}`,color:calMois===0?T.inkMuted:T.inkSub,padding:isMobile?"6px 9px":"7px 13px",borderRadius:7,cursor:calMois===0?"default":"pointer",fontFamily:"inherit",fontSize:14,flexShrink:0}}>‹</button>
            <div style={{flex:1,display:"flex",gap:isMobile?2:4,flexWrap:isMobile?"nowrap":"wrap",justifyContent:"center",overflowX:isMobile?"auto":"visible"}}>
              {MOIS.map((m,i)=>{
                const sel=calMois===i;
                return(
                  <button key={i} onClick={()=>setCalMois(i)}
                    style={{padding:isMobile?"4px 7px":"5px 11px",flexShrink:0,background:sel?MC[i].bg:T.white,border:`1.5px solid ${sel?MC[i].border:T.cardBorder}`,color:sel?MC[i].text:T.inkSub,borderRadius:7,cursor:"pointer",fontFamily:"Lora,serif",fontSize:isMobile?10:11,fontWeight:sel?700:400,transition:"all .2s",position:"relative"}}>
                    {isMobile?MOIS_C[i]:m}
                    {i===todayMois&&!sel&&<span style={{position:"absolute",top:2,right:2,width:4,height:4,borderRadius:"50%",background:T.terra}}/>}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>setCalMois(m=>Math.min(11,m+1))} disabled={calMois===11}
              style={{background:calMois===11?T.bgAlt:T.card,border:`1px solid ${T.cardBorder}`,color:calMois===11?T.inkMuted:T.inkSub,padding:isMobile?"6px 9px":"7px 13px",borderRadius:7,cursor:calMois===11?"default":"pointer",fontFamily:"inherit",fontSize:14,flexShrink:0}}>›</button>
          </div>
        </nav>

        <main style={{maxWidth:1100,margin:"0 auto",padding:isMobile?"10px 8px 60px":"18px 24px 60px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:MC[calMois].dot,boxShadow:`0 0 0 3px ${MC[calMois].dot}25`,flexShrink:0}}/>
              <span style={{fontSize:isMobile?13:15,fontWeight:700,fontFamily:"Georgia,serif",color:T.ink}}>{MOIS[calMois]} 2026</span>
              <span style={{fontSize:11,color:T.inkSub,fontStyle:"italic"}}>{monthEvents} collecte{monthEvents!==1?"s":""}{filterVille?` · filtre : "${filterVille}"`:""}</span>
            </div>
            <span style={{fontSize:10,color:T.inkMuted,fontStyle:"italic"}}>Cliquez sur une ville pour le plan officiel</span>
          </div>

          <div className="fade-up" key={calMois}>
            <MonthCalendar month={calMois} allRows={ALL_ROWS} filterVille={filterVille} favVilles={favVilles} onCityClick={r=>setPlanRow(r)}/>
          </div>

          <div style={{marginTop:16,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",padding:"11px 14px",background:T.card,borderRadius:10,border:`1px solid ${T.cardBorder}`,fontSize:11,color:T.inkSub}}>
            <span>💡 <em>Survolez un nom tronqué pour l'afficher en entier · Cliquez pour ouvrir le plan officiel de collecte</em></span>
            {user&&favVilles.length>0&&<span style={{marginLeft:"auto",color:T.terra,fontWeight:600}}>⭐ Favoris : {favVilles.slice(0,3).join(", ")}{favVilles.length>3?`…`:""}</span>}
          </div>

          <div style={{marginTop:12,padding:"12px 16px",background:`linear-gradient(135deg,${T.bgAlt},${T.cream})`,borderRadius:10,border:`1px solid ${T.cardBorder}`,fontSize:10,color:T.inkMuted,lineHeight:1.9,fontStyle:"italic"}}>
            <strong style={{color:T.inkSub,fontStyle:"normal"}}>Sources 2026 :</strong> cergypontoise.fr · agglo-plainevallee.fr · sigidurs.fr · osny.fr · smirtomduvexin.net · Données indicatives — vérifiez auprès de votre commune.
          </div>
        </main>
      </div>

      {planRow&&<PlanModal row={planRow} onClose={()=>setPlanRow(null)}/>}
      {showCompte&&<CompteModal user={user} onSave={saveUser} onLogout={logout} onClose={()=>setShowCompte(false)}/>}
    </>
  );
}
