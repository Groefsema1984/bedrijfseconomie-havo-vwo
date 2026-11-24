// ===== Basisgegevens: domeinen (examenprogramma bedrijfseconomie havo/vwo), onderwerpen en werelden =====
// De werelden volgen de hoofdstukken van de methode "Bedrijfseconomie in balans" (havo H1-29, vwo H1-36).
// Stof uit Cumulus (klas 5 en 6) en de oefenbibliotheek staat in het hoofdstuk van In balans waar het hoort.

// Niveau van een leerling volgt uit de eerste letter van de klas: H = havo, V = vwo.
const NIVEAUS = {h:'havo', v:'vwo'};

// Domeinen zoals in Bedrijfseconomie in balans (voor scores, dashboard, examentraining en de indeling van de startpagina)
const DOMEINEN = [
  {id:'A', naam:'Vaardigheden', kleur:'#d64f7a', icoon:'🧮'},
  {id:'B', naam:'Van persoon naar rechtspersoon', kleur:'#e07a2f', icoon:'👤'},
  {id:'C', naam:'Interne organisatie en personeelsbeleid', kleur:'#7a4fd6', icoon:'👥'},
  {id:'D', naam:'Investeren en financieren', kleur:'#2f7de0', icoon:'💡'},
  {id:'E', naam:'Marketing', kleur:'#d9a521', icoon:'📣'},
  {id:'F', naam:'Financieel beleid', kleur:'#1f9e6e', icoon:'📊'},
  {id:'G', naam:'Verslaggeving', kleur:'#c2410c', icoon:'📰'}
];

// Onderwerpen per domein. De code begint altijd met de domeinletter en een punt (de server rekent zo de
// domeinscore uit). Het zijn werktitels, geen officiële syllabuscodes: pas ze gerust aan of voeg er toe.
const EINDTERMEN = {
  'A.reken':{d:'A', t:'Procenten, vergelijkingen en gemiddelden'},
  'A.index':{d:'A', t:'Indexcijfers, tabellen en grafieken'},
  'B.verzeker':{d:'B', t:'Verzekeren'},
  'B.lenen':{d:'B', t:'Studeren en lenen'},
  'B.sparen':{d:'B', t:'Sparen en beleggen'},
  'B.interest':{d:'B', t:'Interest, eindwaarde en contante waarde'},
  'B.wonen':{d:'B', t:'Huren, kopen en hypotheken'},
  'B.familie':{d:'B', t:'Familierecht'},
  'B.rechtsvorm':{d:'B', t:'Ondernemen en rechtsvormen'},
  'B.erven':{d:'B', t:'Schenken en erven'},
  'B.maatsch':{d:'B', t:'Organisaties en maatschappij (MVO)'},
  'C.org':{d:'C', t:'Organisatiestructuur en management'},
  'C.comm':{d:'C', t:'Communicatie'},
  'C.arbeid':{d:'C', t:'Arbeidsrecht'},
  'C.personeel':{d:'C', t:'Personeelsbeleid en arbeidsrecht'},
  'D.invest':{d:'D', t:'Investeringsselectie (terugverdientijd, NCW)'},
  'D.financ':{d:'D', t:'Financieren en vermogen'},
  'E.marketing':{d:'E', t:'Marketing'},
  'A.balans':{d:'A', t:'Balans en winst-en-verliesrekening'},
  'A.liquid':{d:'A', t:'Liquiditeit, kosten en uitgaven'},
  'F.perio':{d:'F', t:'Periodisering en afschrijving'},
  'F.kosten':{d:'F', t:'Kosten en kostprijs'},
  'F.breakeven':{d:'F', t:'Break-evenanalyse'},
  'F.versch':{d:'F', t:'Verschillenanalyse'},
  'F.planning':{d:'F', t:'Interne verslaggeving en financiële planning'},
  'G.extern':{d:'G', t:'Externe verslaggeving en regels'},
  'G.kengetal':{d:'G', t:'Kengetallen'}
};

// De werelden = de hoofdstukken van Bedrijfseconomie in balans. H1 t/m H7 zijn voor havo en vwo gelijk (id hv1..hv7),
// daarna verschilt de nummering: havo h8..h29, vwo v8..v36. d = syllabusdomein (groepering op de startpagina).
const HFD_INBALANS = {
  hv:[[1,'A','Basisrekenvaardigheden','🧮'],[2,'A','Balans, winst-en-verliesrekening en liquiditeit','📒'],[3,'B','Verzekeren, studeren en lenen','🛡️'],
      [4,'B','Sparen en beleggen','📈'],[5,'B','Enkelvoudige en samengestelde interest','⏳'],[6,'B','Woning','🏠'],[7,'B','Familie','👪']],
  h:[[8,'B','Organisatie en maatschappij','🌍'],[9,'B','Eigen onderneming?','🚀'],[10,'B','Keuze rechtsvorm','🏪'],
     [11,'C','Organisaties en management','🏢'],[12,'C','Communicatieproces','💬'],[13,'C','Arbeidsrecht','⚖️'],[14,'C','Personeelsbeleid','👥'],
     [15,'D','Vermogen','🏦'],[16,'D','Investeringsanalyse en financiering','💡'],
     [17,'E','Marketingbeleid','🎯'],[18,'E','Product en prijs','🏷️'],[19,'E','Plaats en promotie','📣'],
     [20,'F','Kostensoorten','🏭'],[21,'F','Break-evenanalyse','⚖️'],[22,'F','Resultaten, belastingen en winstverdeling','🧾'],
     [23,'F','Accrual-accounting en matchingprincipe','🗓️'],[24,'F','Interne verslaggeving','📊'],[25,'F','Financiële planning','🧭'],
     [26,'G','Externe verslaggeving','📰'],[27,'G','Regels balans','📘'],[28,'G','Regels winst-en-verliesrekening','📗'],[29,'G','Kengetallen','🔢']],
  v:[[8,'B','Schenken en erven','🎁'],[9,'B','Organisatie en maatschappij','🌍'],[10,'B','Eigen onderneming?','🚀'],[11,'B','Keuze rechtsvorm','🏪'],
     [12,'C','Organisaties en management','🏢'],[13,'C','Communicatieproces','💬'],[14,'C','Arbeidsrecht','⚖️'],[15,'C','Personeelsbeleid','👥'],
     [16,'D','Eigen vermogen','🏦'],[17,'D','Vreemd vermogen','💳'],[18,'D','Investeringsanalyse en financiering','💡'],
     [19,'E','Marketingbeleid','🎯'],[20,'E','Product en prijs','🏷️'],[21,'E','Plaats en promotie','📣'],[22,'E','Marketingperspectief','🔭'],
     [23,'F','Kostensoorten','🏭'],[24,'F','Break-evenanalyse','⚖️'],[25,'F','Resultaten, belastingen en winstverdeling','🧾'],
     [26,'F','Kosten en resultaten bij dienstverlening','🛎️'],[27,'F','Absorption costing','🧮'],[28,'F','Direct costing','🎚️'],
     [29,'F','Accrual-accounting en matchingprincipe','🗓️'],[30,'F','Interne verslaggeving','📊'],[31,'F','Financiële planning','🧭'],
     [32,'G','Externe verslaggeving','📰'],[33,'G','Regels balans','📘'],[34,'G','Regels winst-en-verliesrekening','📗'],
     [35,'G','Liquiditeit, cashflow en solvabiliteit','💧'],[36,'G','Overige kengetallen','🔢']]
};
const WERELDEN = [];
for(const n of ['hv','h','v']) for(const [nr,d,naam,icoon] of HFD_INBALANS[n]){
  const D=DOMEINEN.find(x=>x.id===d); const w={id:n+nr, nr:String(nr), lab:'Hoofdstuk '+nr, naam, icoon, kleur:D.kleur, d};
  if(n!=='hv') w.niv=n; WERELDEN.push(w) }
// de werelden van het eigen niveau (n leeg = alle)
const wereldenVoor = (n=(typeof niv==='function'&&typeof S!=='undefined'&&S?niv():'')) => WERELDEN.filter(w=>!n||!w.niv||w.niv===n);

// Wordt per wereld gevuld door data-reken.js, data-hoofdstukken.js en data-bibliotheek.js
const LEVELS = {}; const GENS_EXTRA = {};   // wereldId -> [{id, naam, kort, hfd?, niv?, vragen:[...], gens:[...]}]
WERELDEN.forEach(w=>{ LEVELS[w.id]=[] });
