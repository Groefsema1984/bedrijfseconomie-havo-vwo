// ===== Extra leermiddelen =====
// 1 flitskaarten met herhaling op afstand, 2 formulekaart en rekenhulp, 3 break-evengrafiek (klikken in een grafiek),
// 4 proeftoets per hoofdstuk, 6 een heel examen op tijd. (5, het klassenoverzicht, staat in docent.js.)
const DAG=864e5;
Object.assign(FOTO,{fouten:FOTO.herhaal,leren:FOTO.vaardig,flits:FOTO.collectie,flitsen:FOTO.collectie,formules:FOTO.dA,proef:FOTO.herhaal,exvol:FOTO.examen});

// ---------- Leren: overzicht van alle extra's ----------
SCHERMEN.leren = function(){
  const due=fkDue().length, nieuw=fkNieuw().length;
  const exOpen=exVragen().length>0;
  const tegel=(ic,t,s,on)=>`<button class="uitdaging" onclick="${on}"><span class="thumb" style="background:var(--bg);display:grid;place-items:center;font-size:28px">${ic}</span><span><b>${t}</b><small>${s}</small></span></button>`;
  return `<div class="wrap" style="max-width:760px">${kop('Leren en toetsen',"go('home')")}<div class="kaart">
   ${tegel('🃏','Flitskaarten',due?`${due} begrippen om nu te herhalen`:`${nieuw} nieuwe begrippen om te leren`,"go('flits')")}
   ${tegel('📕','Foutenschrift',(()=>{const g=foutGroepen(S.vr,S.herhaal).filter(x=>x.open);return g.length?`${g.reduce((a,x)=>a+x.open,0)} fouten open bij ${g.length} leerdoelen`:'Al je fouten per leerdoel, zodat je weet waar je aan moet werken'})(),"go('fouten')")}
   ${tegel('🧮','Formulekaart en rekenhulp','Alle formules met een uitgewerkt voorbeeld en een rekenhulp',"go('formules')")}
   ${tegel('📈','Break-evengrafiek','Klik in de grafiek: break-evenpunt, winst- en verliesgebied, TO en TK',"startGrafiek()")}
   ${tegel('⏱️','Proeftoets per hoofdstuk','Toets op tijd met een cijfer, zonder hulp tussendoor',"go('proef')")}
   ${exOpen?tegel('🎓','Examen op tijd','Een heel oud examen in 3 uur, daarna nakijken en een cijfer',"exTab='tijd';go('examen')"):''}
  </div></div>${VOET()}`;
};

// ---------- 1. Flitskaarten ----------
// Leitner-systeem: elke kaart zit in een bak (0 t/m 6). Wist je hem, dan gaat hij een bak verder en komt hij later terug.
// S.fk[begrip] = [bak, tijdstip waarop hij weer aan de beurt is] (een array, zodat de server de nieuwste versie houdt)
const FK_INT=[0,1,3,7,14,30,60];
function alleBegrippen(d){ const out=[], gezien=new Set(); wereldenVoor().forEach(w=>{ if(d&&d!==w.id) return; const b=(LEVELS[w.id]||{}).begrippen||{};
  Object.keys(b).forEach(k=>{ if(!gezien.has(k)){ gezien.add(k); out.push({k,def:b[k],w:w.id}) } }) }); return out }
function fkStaat(){ if(!S.fk||Array.isArray(S.fk)) S.fk={}; return S.fk }
function fkDue(d){ const fk=fkStaat(), nu=Date.now(); return alleBegrippen(d).filter(x=>fk[x.k]&&fk[x.k][1]<=nu) }
function fkNieuw(d){ const fk=fkStaat(); return shuffle(alleBegrippen(d).filter(x=>!fk[x.k])).sort((a,b)=>(S.kaarten.includes(b.k)?1:0)-(S.kaarten.includes(a.k)?1:0)) }
let FK=null, fkOm=false;
function startFlits(d){ const due=shuffle(fkDue(d)).slice(0,30); const nw=fkNieuw(d).slice(0,Math.max(0,Math.min(10,30-due.length)));
  const lijst=due.concat(nw); if(!lijst.length){ melding('Hier zijn nu geen kaarten om te oefenen'); return }
  FK={d,lijst,i:0,om:false,ok:0,bijna:0,nee:0}; go('flitsen') }
SCHERMEN.flits = function(){
  const fk=fkStaat();
  const rij=(d,naam,ic)=>{ const al=alleBegrippen(d); if(!al.length) return ''; const due=fkDue(d).length, nw=al.filter(x=>!fk[x.k]).length, vast=al.filter(x=>fk[x.k]&&fk[x.k][0]>=4).length;
    return `<button class="lv" onclick="startFlits(${d?`'${d}'`:''})"><span class="med">${ic}</span><span style="flex:1"><b>${esc(naam)}</b><small>${due?`<b style="color:var(--fout)">${due} om te herhalen</b> · `:''}${nw} nieuw · ${vast} van ${al.length} zitten vast</small><div class="balk" style="margin-top:6px"><i style="width:${Math.round(vast/al.length*100)}%"></i></div></span><span class="zacht">›</span></button>` };
  return `<div class="wrap" style="max-width:760px">${kop('Flitskaarten',"go('leren')")}
   <div class="kaart" style="margin-bottom:14px"><p style="margin:0">Je ziet een begrip. Bedenk de betekenis, draai de kaart om en zeg eerlijk of je hem wist. Kaarten die je weet komen later terug (na 1, 3, 7, 14, 30 en 60 dagen), kaarten die je niet weet komen meteen nog een keer.</p>
   <label class="label" style="margin-top:10px"><input type="checkbox" ${fkOm?'checked':''} onchange="fkOm=this.checked"> Andersom oefenen: je ziet de betekenis en noemt het begrip</label></div>
   <div class="kaart">${rij('','Alle werelden door elkaar','🃏')}${wereldenVoor().filter(w=>Object.keys((LEVELS[w.id]||{}).begrippen||{}).length).map(w=>rij(w.id,w.lab+' · '+w.naam,w.icoon)).join('')}</div></div>${VOET()}`;
};
SCHERMEN.flitsen = function(){
  if(!FK) return SCHERMEN.flits();
  const x=FK.lijst[FK.i]; const voor=fkOm?x.def:x.k, achter=fkOm?x.k:x.def; const W=WERELDEN.find(w=>w.id===x.w)||{};
  return `<div class="wrap" style="max-width:640px"><div class="top" style="display:flex;align-items:center;gap:10px;margin:8px 0 14px"><button class="terug" onclick="fkKlaar()">‹ Stop</button><b style="flex:1">Flitskaarten</b><span class="chip">${FK.i+1} / ${FK.lijst.length}</span></div>
   <button class="flitskaart ${FK.om?'om':''}" style="--k:${W.kleur||'var(--acc)'}" onclick="fkDraai()"><small>${esc(W.icoon||'')} ${esc(W.naam||x.w)} · ${fkOm?'Welk begrip is dit?':'Wat betekent dit begrip?'}</small>
    <span class="voor">${esc(voor)}</span>${FK.om?`<span class="achter">${esc(achter)}</span>`:'<span class="zacht" style="font-size:14px">Tik om de kaart om te draaien</span>'}</button>
   ${FK.om?`<div class="fkknoppen"><button class="knop zacht" onclick="fkAntw(0)">✘ Wist ik niet</button><button class="knop zacht" onclick="fkAntw(1)">≈ Twijfel</button><button class="knop" onclick="fkAntw(2)">✔ Wist ik</button></div>`:''}</div>`;
};
function fkDraai(){ if(!FK||FK.om) return; FK.om=true; go('flitsen') }
function fkAntw(s){
  const x=FK.lijst[FK.i], fk=fkStaat(), r=fk[x.k]||[0,0], nu=Date.now();
  if(s===2){ const b=Math.min(r[0]+1,6); fk[x.k]=[b,nu+FK_INT[b]*DAG]; FK.ok++; S.xp+=2; if(!S.kaarten.includes(x.k)) S.kaarten.push(x.k) }
  else if(s===1){ fk[x.k]=[Math.max(1,r[0]),nu+DAG]; FK.bijna++ }
  else { fk[x.k]=[0,nu]; FK.nee++; x.n=(x.n||0)+1; if(x.n<3) FK.lijst.push(x) }
  FK.i++; FK.om=false; bewaar(false);
  if(FK.i>=FK.lijst.length) fkKlaar(); else go('flitsen');
}
function fkKlaar(){ if(!FK) return go('flits'); const f=FK; FK=null; bewaar(); checkBadges();
  if(!f.ok&&!f.bijna&&!f.nee) return go('flits');
  go('flits'); melding(`Klaar: ${f.ok} gekend, ${f.bijna} twijfel, ${f.nee} nog niet. Morgen weer even herhalen!`,4500) }

// ---------- 2. Formulekaart en rekenhulp ----------
const _g = s => parseGetal(s);
const FORMULES = [
 {d:'A',n:'Procentuele verandering',f:'(nieuw − oud) / oud × 100%',u:'Altijd delen door de oude waarde. Een daling geeft een negatief getal.',
  vb:'De omzet gaat van € 80.000 naar € 92.000.\n(92.000 − 80.000) / 80.000 × 100% = 15%',in:[['oud','Oude waarde'],['nw','Nieuwe waarde']],
  r:x=>`(${nl1(x.nw)} − ${nl1(x.oud)}) / ${nl1(x.oud)} × 100% = <b>${nl1((x.nw-x.oud)/x.oud*100)}%</b>`,g:['procVerandering','procentVan']},
 {d:'A',n:'Procentpunt',f:'nieuw percentage − oud percentage',u:'Gaat de brutowinstmarge van 30% naar 25%, dan daalt hij met 5 procentpunt. In procenten is dat (25 − 30) / 30 × 100% = −16,7%.',
  vb:'Marge van 30% naar 25%:\nverschil = −5 procentpunt\nprocentuele verandering = −16,7%',in:[['oud','Oud percentage'],['nw','Nieuw percentage']],
  r:x=>`Verschil: <b>${nl1(x.nw-x.oud)} procentpunt</b>. Procentuele verandering: <b>${nl1((x.nw-x.oud)/x.oud*100)}%</b>`,g:['procentpunt']},
 {d:'A',n:'Omzet en brutoresultaat',f:'omzet = afzet × verkoopprijs · brutoresultaat = omzet − inkoopwaarde van de omzet',u:'Afzet is een aantal, omzet een bedrag. De inkoopwaarde van de omzet (IWvO) is de inkoopprijs van wat je verkocht hebt.',
  vb:'1.200 stuks à € 25, inkoopprijs € 9.\nOmzet € 30.000, IWvO € 10.800, brutoresultaat € 19.200',in:[['q','Afzet'],['p','Verkoopprijs'],['iw','Inkoopprijs per stuk']],
  r:x=>`Omzet = ${eur(x.q*x.p)} · IWvO = ${eur(x.q*x.iw)} · brutoresultaat = <b>${eur(x.q*(x.p-x.iw))}</b>`,g:['brutoresultaat']},
 {d:'A',n:'Indexcijfer',f:'waarde nu / waarde in het basisjaar × 100',u:'Het basisjaar is 100. Verschil tussen twee indexcijfers in procenten: (115 − 110) / 110 × 100% = 4,5%, dus niet 5%.',
  vb:'Afzet basisjaar 4.000, nu 4.600.\n4.600 / 4.000 × 100 = 115',in:[['b','Waarde basisjaar'],['nu','Waarde nu']],
  r:x=>`${nl1(x.nu)} / ${nl1(x.b)} × 100 = <b>${nl1(x.nu/x.b*100)}</b>`,g:['index','indexVerschil']},
 {d:'A',n:'Gewogen gemiddelde',f:'Σ (waarde × gewicht) / Σ gewichten',u:'Bij een ongewogen gemiddelde tellen alle waarden even zwaar.',
  vb:'Cijfers 6 (×1), 7 (×1), 8 (×2).\n(6 + 7 + 16) / 4 = 7,25',in:[['a','Waarde 1'],['ga','Gewicht 1'],['b','Waarde 2'],['gb','Gewicht 2']],
  r:x=>`(${nl1(x.a)} × ${nl1(x.ga)} + ${nl1(x.b)} × ${nl1(x.gb)}) / ${nl1(x.ga+x.gb)} = <b>${nl1((x.a*x.ga+x.b*x.gb)/(x.ga+x.gb))}</b>`,g:['gewogenGemiddelde']},
 {d:'A',n:'Balans en eigen vermogen',f:'activa = eigen vermogen + vreemd vermogen',u:'Debet (links) staan de bezittingen, credit (rechts) de financiering. Beide kanten zijn altijd even groot.',
  vb:'Activa € 190.000, vreemd vermogen € 115.000.\nEigen vermogen = € 75.000',in:[['a','Totaal activa'],['vv','Vreemd vermogen']],
  r:x=>`${eur(x.a)} − ${eur(x.vv)} = <b>${eur(x.a-x.vv)}</b>`,g:['eigenVermogen']},
 {d:'A',n:'Resultaat (W&V)',f:'resultaat = opbrengsten − kosten',u:'Kosten zijn het waardeverbruik in de periode, uitgaven de betalingen. Afschrijving is wel een kostenpost maar geen uitgave.',
  vb:'Omzet € 300.000, IWvO € 150.000, overige kosten € 110.000.\nResultaat € 40.000',in:[['o','Opbrengsten'],['k','Kosten']],
  r:x=>`${eur(x.o)} − ${eur(x.k)} = <b>${eur(x.o-x.k)}</b>`,g:['nettoresultaat']},
 {d:'A',n:'Liquiditeitsbegroting',f:'eindsaldo = beginsaldo + ontvangsten − uitgaven',u:'In een liquiditeitsbegroting staan ontvangsten en uitgaven, geen kosten en opbrengsten.',
  vb:'Begin € 6.000, ontvangsten € 42.000, uitgaven € 50.000.\nEindsaldo € −2.000 (rood)',in:[['b','Beginsaldo'],['o','Ontvangsten'],['u','Uitgaven']],
  r:x=>`${eur(x.b)} + ${eur(x.o)} − ${eur(x.u)} = <b>${eur(x.b+x.o-x.u)}</b>`,g:['liquiditeit']},
 {d:'B',n:'Verzekeringspremie',f:'te betalen = (premie + poliskosten) × 1,21',u:'Over premie en poliskosten betaal je 21% assurantiebelasting.',
  vb:'Premie € 480, poliskosten € 7,50.\n487,50 × 1,21 = € 589,88',in:[['p','Premie'],['k','Poliskosten']],
  r:x=>`(${nl1(x.p)} + ${nl1(x.k)}) × 1,21 = <b>${eur((x.p+x.k)*1.21)}</b>`,g:['verzekeringPremie','bonusMalus']},
 {d:'B',n:'Onderverzekering',f:'uitkering = verzekerde waarde / werkelijke waarde × schade',u:'Dit heet de evenredigheidsregel. Bij oververzekering keert de verzekeraar nooit meer uit dan de schade.',
  vb:'Waarde € 80.000, verzekerd € 60.000, schade € 20.000.\n60/80 × 20.000 = € 15.000',in:[['v','Verzekerde waarde'],['w','Werkelijke waarde'],['s','Schade']],
  r:x=>`${gt(x.v)} / ${gt(x.w)} × ${gt(x.s)} = <b>${eur(Math.min(x.s,x.v/x.w*x.s))}</b>`,g:['onderverzekering']},
 {d:'B',n:'Kredietkosten',f:'kredietkosten = totaal terugbetaald − geleend bedrag',u:'Vergelijk leningen altijd met het jaarlijkse kostenpercentage (JKP).',
  vb:'Geleend € 3.000, 36 × € 100 terugbetaald.\n3.600 − 3.000 = € 600',in:[['l','Geleend'],['n','Aantal termijnen'],['t','Bedrag per termijn']],
  r:x=>`${gt(x.n)} × ${nl1(x.t)} − ${gt(x.l)} = <b>${eur(x.n*x.t-x.l)}</b>`,g:['kredietkosten']},
 {d:'B',n:'Rendement op aandelen',f:'(dividend + koerswinst) / aankoopkoers × 100%',u:'Koerswinst = verkoopkoers − aankoopkoers. Provisie verlaagt het rendement.',
  vb:'Gekocht € 40, nu € 44, dividend € 1.\n(1 + 4) / 40 × 100% = 12,5%',in:[['k0','Aankoopkoers'],['k1','Koers nu'],['d','Dividend']],
  r:x=>`(${nl1(x.d)} + ${nl1(x.k1-x.k0)}) / ${nl1(x.k0)} × 100% = <b>${nl1((x.d+x.k1-x.k0)/x.k0*100)}%</b>`,g:['rendementAandeel','aankoopAandelen','couponrendement']},
 {d:'B',n:'Enkelvoudige interest',f:'interest = K × i × t (t in jaren)',u:'Bij enkelvoudige interest krijg je geen interest over interest.',
  vb:'€ 5.000, 3% per jaar, 9 maanden.\n5.000 × 0,03 × 9/12 = € 112,50',in:[['k','Kapitaal'],['i','Interest (%)'],['m','Aantal maanden']],
  r:x=>`${gt(x.k)} × ${nl1(x.i/100)} × ${x.m}/12 = <b>${eur(x.k*x.i/100*x.m/12)}</b>`,g:['enkelvoudigeInterest']},
 {d:'B',n:'Eindwaarde',f:'Eₙ = K × (1 + i)ⁿ',u:'Samengestelde interest: je krijgt ook interest over de interest van eerdere perioden.',
  vb:'€ 2.000, 5% per jaar, 5 jaar.\n2.000 × 1,05⁵ = € 2.552,56',in:[['k','Bedrag nu (K)'],['r','Interest (%)'],['n','Aantal perioden']],
  r:x=>`${eur(x.k)} × (1 + ${pc(x.r/100)})^${x.n} = <b>${eur(x.k*Math.pow(1+x.r/100,x.n))}</b>`,g:['eindwaarde']},
 {d:'B',n:'Contante waarde',f:'C = E × (1 + i)⁻ⁿ',u:'Wat is een bedrag in de toekomst nu waard? Je rekent terug met de interest.',
  vb:'€ 5.000 over 10 jaar, 5%.\n5.000 × 1,05⁻¹⁰ = € 3.069,57',in:[['e','Bedrag later (E)'],['r','Interest (%)'],['n','Aantal perioden']],
  r:x=>`${eur(x.e)} × (1 + ${pc(x.r/100)})^−${x.n} = <b>${eur(x.e/Math.pow(1+x.r/100,x.n))}</b>`,g:['contanteWaarde']},
 {d:'B',n:'Effectieve interest',f:'(1 + i per periode)^(perioden per jaar) − 1',u:'1% per maand is niet 12% per jaar, maar 12,68%.',
  vb:'1% per kwartaal.\n1,01⁴ − 1 = 4,06% per jaar',in:[['i','Interest per periode (%)'],['m','Perioden per jaar']],
  r:x=>`(1 + ${pc(x.i/100)})^${x.m} − 1 = <b>${nl1((Math.pow(1+x.i/100,x.m)-1)*100)}%</b>`,g:['effectieveInterest']},
 {d:'B',n:'Lineaire hypotheek',f:'aflossing = H / looptijd · interest = schuldrest × i',u:'De aflossing is elk jaar gelijk, de interest daalt omdat de schuld daalt.',
  vb:'€ 240.000, 30 jaar, 4%.\nAflossing € 8.000, interest jaar 1 € 9.600, bruto € 17.600',in:[['h','Hypotheek'],['n','Looptijd (jaren)'],['i','Interest (%)']],
  r:x=>`Aflossing ${eur(x.h/x.n)} + interest jaar 1 ${eur(x.h*x.i/100)} = <b>${eur(x.h/x.n+x.h*x.i/100)}</b>`,g:['lineaireHypotheek','lineaireInterestLater']},
 {d:'B',n:'Annuïteit',f:'A = H × i / (1 − (1 + i)⁻ⁿ)',u:'Bij een annuïteitenhypotheek betaal je elk jaar hetzelfde bedrag. In het begin is dat vooral interest, later vooral aflossing.',
  vb:'€ 300.000, 4%, 30 jaar.\nA = € 17.349,03',in:[['h','Hypotheek'],['i','Interest (%)'],['n','Looptijd (jaren)']],
  r:x=>`<b>${eur(x.h*(x.i/100)/(1-Math.pow(1+x.i/100,-x.n)))}</b> per jaar`,g:['annuiteit']},
 {d:'C',n:'Loonkosten werkgever',f:'brutoloon × 12 × 1,08 (vakantiegeld) × (1 + werkgeverslasten)',u:'Werkgeverslasten zijn onder meer premies werknemersverzekeringen en pensioen.',
  vb:'€ 3.000 per maand, 25% werkgeverslasten.\n3.000 × 12 × 1,08 × 1,25 = € 48.600',in:[['b','Brutoloon per maand'],['w','Werkgeverslasten (%)']],
  r:x=>`${gt(x.b)} × 12 × 1,08 × ${pc(1+x.w/100)} = <b>${eur(x.b*12*1.08*(1+x.w/100))}</b>`,g:['loonkosten']},
 {d:'C',n:'Transitievergoeding',f:'1/3 maandsalaris × aantal dienstjaren',u:'Delen van een jaar tellen naar rato mee.',
  vb:'Maandsalaris € 3.000, 6 jaar in dienst.\n1/3 × 3.000 × 6 = € 6.000',in:[['s','Maandsalaris'],['j','Dienstjaren']],
  r:x=>`1/3 × ${gt(x.s)} × ${nl1(x.j)} = <b>${eur(x.s/3*x.j)}</b>`,g:['transitievergoeding']},
 {d:'F',n:'Afschrijving (lineair)',f:'(aanschafwaarde − restwaarde) / levensduur',u:'Boekwaarde = aanschafwaarde − totale afschrijving tot nu toe.',
  vb:'€ 60.000, restwaarde € 6.000, 6 jaar.\n54.000 / 6 = € 9.000 per jaar',in:[['a','Aanschafwaarde'],['r','Restwaarde'],['n','Levensduur (jaren)']],
  r:x=>`(${gt(x.a)} − ${gt(x.r)}) / ${nl1(x.n)} = <b>${eur((x.a-x.r)/x.n)}</b> per jaar`,g:['afschrijving','boekwaarde']},
 {d:'F',n:'Integrale kostprijs',f:'kostprijs = C/N + V/W',u:'C = constante kosten, N = normale productie, V = variabele kosten, W = werkelijke productie.',
  vb:'C € 240.000, N 20.000, variabel € 8 per stuk.\n12 + 8 = € 20',in:[['c','Constante kosten (C)'],['n','Normale productie (N)'],['v','Variabele kosten per stuk']],
  r:x=>`${gt(x.c)} / ${gt(x.n)} + ${nl1(x.v)} = <b>${eur(x.c/x.n+x.v)}</b>`,g:['integraleKostprijs']},
 {d:'F',n:'Bezettingsresultaat',f:'(W − N) × C/N',u:'Onderbezetting (W < N) geeft een nadelig bezettingsresultaat.',
  vb:'C € 180.000, N 12.000, W 11.000.\n(11.000 − 12.000) × 15 = € −15.000',in:[['w','Werkelijke productie (W)'],['n','Normale productie (N)'],['c','Constante kosten (C)']],
  r:x=>`(${gt(x.w)} − ${gt(x.n)}) × ${nl1(x.c/x.n)} = <b>${eur((x.w-x.n)*x.c/x.n)}</b>`,g:['bezettingsresultaat']},
 {d:'F',n:'Break-evenafzet',f:'constante kosten / dekkingsbijdrage per stuk',u:'Dekkingsbijdrage = verkoopprijs − variabele kosten per stuk. Rond een aantal naar boven af.',
  vb:'Constante kosten € 9.800, prijs € 28, variabel € 6,50.\n9.800 / 21,50 = 455,8, dus 456 stuks',in:[['c','Constante kosten'],['p','Verkoopprijs'],['v','Variabele kosten per stuk']],
  r:x=>`${gt(x.c)} / (${nl1(x.p)} − ${nl1(x.v)}) = <b>${nl1(x.c/(x.p-x.v))}</b> stuks`,g:['breakEven','dekkingsbijdrage','grafBreakEven']},
 {d:'F',n:'Break-evenomzet',f:'constante kosten / dekkingsbijdrage als deel van de omzet',u:'Zijn de variabele kosten 60% van de omzet, dan is de dekkingsbijdrage 40% van de omzet.',
  vb:'Constante kosten € 120.000, variabel 60%.\n120.000 / 0,40 = € 300.000',in:[['c','Constante kosten'],['v','Variabele kosten (% van omzet)']],
  r:x=>`${gt(x.c)} / ${pc(1-x.v/100)} = <b>${eur(x.c/(1-x.v/100))}</b>`,g:['breakEvenOmzet']},
 {d:'F',n:'Prijs- en efficiencyresultaat',f:'prijsresultaat = (SP − WP) × WH · efficiencyresultaat = (SH − WH) × SP',u:'S = standaard, W = werkelijk, P = prijs, H = hoeveelheid. Positief is voordelig.',
  vb:'SP € 25, WP € 26, WH 1.500, SH 1.450.\nPrijs € −1.500, efficiency € −1.250',in:[['sp','SP'],['wp','WP'],['sh','SH'],['wh','WH']],
  r:x=>`Prijsresultaat <b>${eur((x.sp-x.wp)*x.wh)}</b> · efficiencyresultaat <b>${eur((x.sh-x.wh)*x.sp)}</b>`,g:['prijsresultaat','efficiencyresultaat']},
 {d:'D',n:'Cashflow',f:'cashflow = nettowinst + afschrijvingen',u:'Dit is de indirecte methode. Afschrijvingen zijn kosten, maar geen uitgaven.',
  vb:'Nettowinst € 40.000, afschrijving € 12.000.\nCashflow € 52.000',in:[['w','Nettowinst'],['a','Afschrijvingen']],
  r:x=>`${gt(x.w)} + ${gt(x.a)} = <b>${eur(x.w+x.a)}</b>`,g:['cashflow']},
 {d:'D',n:'Terugverdientijd',f:'investering / cashflow per jaar (bij gelijke cashflows)',u:'Bij ongelijke cashflows tel je de cashflows jaar voor jaar op tot het investeringsbedrag bereikt is.',
  vb:'Investering € 105.000, cashflow € 30.000 per jaar.\n3,5 jaar = 3 jaar en 6 maanden',in:[['i','Investering'],['c','Cashflow per jaar']],
  r:x=>{const t=x.i/x.c; return `${gt(x.i)} / ${gt(x.c)} = <b>${nl1(t)} jaar</b> (${Math.floor(t)} jaar en ${Math.round((t-Math.floor(t))*12)} maanden)`},g:['terugverdientijd']},
 {d:'D',n:'Netto contante waarde',f:'NCW = Σ CF × (1 + i)⁻ᵗ − investering',u:'Tel ook de contante waarde van de restwaarde mee. NCW positief: de investering is aantrekkelijk.',
  vb:'€ 80.000, 3 × € 30.000, 6%.\nCW = 80.190,36, NCW = € 190,36',in:[['i','Investering'],['c','Cashflow per jaar'],['n','Aantal jaren'],['r','Vermogenskostenvoet (%)']],
  r:x=>{let cw=0; for(let t=1;t<=x.n;t++) cw+=x.c/Math.pow(1+x.r/100,t); return `CW cashflows ${eur(cw)} − ${eur(x.i)} = <b>${eur(cw-x.i)}</b>`},g:['ncw']},
 {d:'F',n:'Vooruitbetaalde kosten',f:'nog niet verbruikte maanden / 12 × jaarbedrag',u:'Vooruitbetaalde kosten staan op de balans bij de activa (vlottende activa).',
  vb:'Huur € 24.000 betaald op 1 oktober voor een jaar.\nOp 31-12 nog 9 maanden vooruit: € 18.000',in:[['b','Jaarbedrag'],['m','Nog niet verbruikte maanden']],
  r:x=>`${x.m}/12 × ${gt(x.b)} = <b>${eur(x.m/12*x.b)}</b>`,g:['vooruitbetaald','nogTeBetalenInterest']},
];
let fDom='';
SCHERMEN.formules = function(){
  const doms=DOMEINEN.filter(d=>FORMULES.some(f=>f.d===d.id));
  const chips=[['','Alle']].concat(doms.map(d=>[d.id,d.icoon+' '+d.naam])).map(([k,t])=>`<button class="knop ${fDom===k?'':'zacht'} klein" onclick="fDom='${k}';go('formules')">${esc(t)}</button>`).join('');
  const kaarten=FORMULES.map((f,i)=>[f,i]).filter(([f])=>!fDom||f.d===fDom).map(([f,i])=>`<div class="kaart formule">
    <span class="eyebrow" style="color:var(--zacht)">${esc((DOMEINEN.find(d=>d.id===f.d)||{}).naam||'')}</span><h3 style="margin:2px 0 8px">${esc(f.n)}</h3>
    <div class="fbox">${esc(f.f)}</div><p style="margin:8px 0">${esc(f.u)}</p>
    <details><summary>Uitgewerkt voorbeeld</summary><div class="vb">${esc(f.vb)}</div></details>
    <details><summary>Rekenhulp</summary><div class="rh">${f.in.map(([k,l])=>`<label>${esc(l)}<input type="text" inputmode="decimal" data-k="${k}" oninput="rekenhulp(${i},this)"></label>`).join('')}</div><p class="rhUit zacht" id="rh${i}">Vul alle velden in.</p></details>
    ${f.g.length?`<button class="knop zacht klein" style="margin-top:8px" onclick="startFormule(${i})">Oefen met ${f.g.some(g=>g.startsWith('graf'))?'sommen en grafieken':'6 sommen'}</button>`:''}</div>`).join('');
  return `<div class="wrap">${kop('Formulekaart',"go('leren')")}
   <div class="kaart" style="margin-bottom:12px"><p style="margin:0 0 10px">Alle formules die je voor het examen moet kennen, met een uitgewerkt voorbeeld. Met de rekenhulp controleer je je eigen berekening. Oefen daarna met sommen die steeds andere getallen hebben.</p>
   <div class="voet" style="justify-content:flex-start;flex-wrap:wrap;margin:0">${chips}</div><div class="voet" style="justify-content:flex-start;margin:10px 0 0"><button class="knop" onclick="startFormule(-1)">Oefen 10 sommen door elkaar${fDom?' (dit domein)':''}</button></div></div>
   <div class="formules">${kaarten}</div></div>${VOET()}`;
};
function rekenhulp(i,el){ const f=FORMULES[i]; const box=el.closest('.rh'); const x={}; let ok=true;
  box.querySelectorAll('input').forEach(inp=>{ const g=_g(inp.value); if(isNaN(g)) ok=false; x[inp.dataset.k]=g });
  const uit=$('#rh'+i); if(!ok){ uit.innerHTML='Vul alle velden in.'; return }
  let t; try{ t=f.r(x) }catch(e){ t='' } uit.innerHTML=/NaN|Infinity/.test(t)||!t?'Deze getallen kunnen niet (delen door nul?)':t; uit.classList.remove('zacht') }
function startFormule(i){
  const lijst=i>=0?FORMULES[i].g:FORMULES.filter(f=>!fDom||f.d===fDom).flatMap(f=>f.g);
  const n=i>=0?6:10; const v=[]; for(let k=0;k<n;k++) v.push(maakGen(lijst[k%lijst.length]));
  Q={modus:'formule',titel:i>=0?FORMULES[i].n:'Formules oefenen',vragen:shuffle(v),i:0,res:[],terug:"go('formules')"}; go('quiz') }

// ---------- 3. Grafiekvragen: break-evengrafiek, klik op een punt, lijn of gebied ----------
// TO = p·Q en TK = C + v·Q (Q × 1.000 stuks, bedragen × € 1.000). De leerling klikt; we rekenen in SVG-pixels.
const GR={x0:52,y0:250,w:294,h:226};
function grafBev(){
  const Qe=pick([30,40,50,60]), p=pick([10,12,15,20,25]), db=pick([0.4,0.5,0.6])*p, v=p-db, C=Qe*db;
  const Qmax=Math.ceil(Qe*1.8/10)*10, Ymax=Math.ceil(p*Qmax/50)*50;
  return {Qe,p,v,C,Qmax,Ymax} }
const grafPt=(m,q,y)=>[GR.x0+q/m.Qmax*GR.w, GR.y0-y/m.Ymax*GR.h];
function grafSvg(m,extra,opts){ opts=opts||{};
  const sx=q=>GR.x0+q/m.Qmax*GR.w, sy=y=>GR.y0-y/m.Ymax*GR.h;
  const lijn=(f,kl,lab,stip)=>{ const a=[sx(0),sy(f(0))], b=[sx(m.Qmax),sy(f(m.Qmax))];
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${kl}" stroke-width="3" ${stip?'stroke-dasharray="7 5"':''}/>${lab&&!opts.zonderLabel?`<text x="${b[0]-4}" y="${b[1]-6}" text-anchor="end" font-size="13" font-weight="700" fill="${kl}">${lab}</text>`:''}` };
  const ystap=m.Ymax/5; let raster=''; for(let y=ystap;y<=m.Ymax+0.01;y+=ystap) raster+=`<line x1="${GR.x0}" x2="${GR.x0+GR.w}" y1="${sy(y)}" y2="${sy(y)}" class="rast"/><text x="${GR.x0-6}" y="${sy(y)+4}" text-anchor="end" font-size="11" class="as">${gt(y)}</text>`;
  const stap=m.Qmax>100?20:10; for(let q=stap;q<=m.Qmax;q+=stap) raster+=`<line y1="${GR.y0}" y2="${GR.y0-GR.h}" x1="${sx(q)}" x2="${sx(q)}" class="rast"/><text x="${sx(q)}" y="${GR.y0+15}" text-anchor="middle" font-size="11" class="as">${q}</text>`;
  const lijnen=lijn(q=>m.p*q,'#2f7de0','TO')+lijn(q=>m.C+m.v*q,'#e07a2f','TK')+(opts.ck?lijn(()=>m.C,'#7a4fd6','TCK',true):'');
  return `<svg id="graf" viewBox="0 0 360 280" onclick="grafKlik(event)" role="img" aria-label="Break-evengrafiek">${raster}
   <line x1="${GR.x0}" y1="${GR.y0}" x2="${GR.x0+GR.w+6}" y2="${GR.y0}" class="ax"/><line x1="${GR.x0}" y1="${GR.y0}" x2="${GR.x0}" y2="${GR.y0-GR.h-8}" class="ax"/>
   <text x="${GR.x0+4}" y="${GR.y0-GR.h-10}" font-size="12" class="as">€ (× 1.000)</text><text x="${GR.x0+GR.w}" y="${GR.y0+28}" font-size="12" text-anchor="end" class="as">afzet (× 1.000 stuks)</text>
   ${lijnen}${extra||''}<g id="grafOpl"></g><g id="grafMark"></g></svg>`;
}
function inDriehoek(p,a,b,c){ const s=(p1,p2,p3)=>(p1[0]-p3[0])*(p2[1]-p3[1])-(p2[0]-p3[0])*(p1[1]-p3[1]); const d1=s(p,a,b),d2=s(p,b,c),d3=s(p,c,a); return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0)) }
const dichtbij=(p,q,r)=>Math.hypot(p[0]-q[0],p[1]-q[1])<=(r||16);
const oplPunt=(xy)=>`<circle cx="${xy[0]}" cy="${xy[1]}" r="9" fill="none" stroke="var(--goed)" stroke-width="3"/>`;
const oplVlak=(pts)=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="color-mix(in srgb,var(--goed) 35%,transparent)" stroke="var(--goed)" stroke-width="2"/>`;
const bevTxt=m=>`TO = ${nl1(m.p).replace(/,0$/,'')}Q en TK = ${gt(m.C)} + ${nl1(m.v).replace(/,0$/,'')}Q (bedragen × € 1.000, Q × 1.000 stuks)`;
Object.assign(GENS,{
  grafBreakEven(){ const m=grafBev(); const e=grafPt(m,m.Qe,m.p*m.Qe);
    return {t:'klik',e:'F.breakeven',q:'Hieronder zie je de totale opbrengst (TO) en de totale kosten (TK) van een onderneming. Klik op het break-evenpunt.',svg:grafSvg(m),raak:p=>dichtbij(p,e),opl:oplPunt(e),
      juist:`het snijpunt van TO en TK (afzet ${m.Qe}.000 stuks)`,u:`In het break-evenpunt is TO = TK, dus het resultaat is nul. Hier: ${bevTxt(m)}. Break-evenafzet = ${gt(m.C)} / (${nl1(m.p)} − ${nl1(m.v)}) = ${m.Qe} (× 1.000).`} },
  grafWinst(){ const m=grafBev(); const a=grafPt(m,m.Qe,m.p*m.Qe),b=grafPt(m,m.Qmax,m.p*m.Qmax),c=grafPt(m,m.Qmax,m.C+m.v*m.Qmax);
    return {t:'klik',e:'F.breakeven',q:'Klik in het gebied waar de onderneming winst maakt.',svg:grafSvg(m),raak:p=>inDriehoek(p,a,b,c),opl:oplVlak([a,b,c]),
      juist:'het gebied tussen TO en TK rechts van het break-evenpunt',u:'Rechts van het break-evenpunt ligt TO boven TK: elke extra verkochte eenheid levert de dekkingsbijdrage op, de constante kosten zijn al gedekt.'} },
  grafVerlies(){ const m=grafBev(); const a=grafPt(m,0,0),b=grafPt(m,0,m.C),c=grafPt(m,m.Qe,m.p*m.Qe);
    return {t:'klik',e:'F.breakeven',q:'Klik in het gebied waar de onderneming verlies maakt.',svg:grafSvg(m),raak:p=>inDriehoek(p,a,b,c),opl:oplVlak([a,b,c]),
      juist:'het gebied tussen TK en TO links van het break-evenpunt',u:'Links van het break-evenpunt ligt TK boven TO: de dekkingsbijdragen zijn nog niet genoeg om de constante kosten te dekken.'} },
  grafCK(){ const m=grafBev(); const xy=grafPt(m,0,m.C);
    return {t:'klik',e:'F.kosten',q:'Klik op het punt in de grafiek dat de totale constante kosten aangeeft.',svg:grafSvg(m),raak:p=>dichtbij(p,xy,18),opl:oplPunt(xy),
      juist:`het snijpunt van TK met de verticale as (€ ${gt(m.C)}.000)`,u:'Bij een afzet van 0 zijn er geen variabele kosten. De TK-lijn begint dus op de hoogte van de constante kosten.'} },
  grafLijn(){ const m=grafBev(); const to=Math.random()<.5; const f=to?(q=>m.p*q):(q=>m.C+m.v*q);
    const raak=p=>{ for(let q=0;q<=m.Qmax;q+=m.Qmax/200){ if(dichtbij(p,grafPt(m,q,f(q)),12)) return true } return false };
    const a=grafPt(m,0,f(0)), b=grafPt(m,m.Qmax,f(m.Qmax)); const opl=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--goed)" stroke-width="7" opacity=".5"/>`;
    return {t:'klik',e:'F.breakeven',q:`De namen staan er niet bij. Klik op de lijn van de ${to?'totale opbrengst (TO)':'totale kosten (TK)'}.`,svg:grafSvg(m,'',{zonderLabel:true}),raak,opl,
      juist:to?'de lijn die in de oorsprong begint':'de lijn die boven de oorsprong begint (bij de constante kosten)',u:to?'Zonder verkoop is er geen opbrengst: TO begint in (0, 0) en loopt steiler omhoog.':'Ook zonder productie zijn er constante kosten: TK begint op de hoogte van de constante kosten.'} },
  grafResultaat(){ const m=grafBev(); const q=pick([m.Qe-10,m.Qe+10,m.Qe+20].filter(x=>x>0&&x<=m.Qmax)); const a=r2((m.p-m.v)*q-m.C);
    const xs=grafPt(m,q,0); const st=`<line x1="${xs[0]}" x2="${xs[0]}" y1="${GR.y0}" y2="${GR.y0-GR.h}" stroke="#d64f7a" stroke-width="2" stroke-dasharray="6 5"/>`;
    return {t:'reken',e:'F.breakeven',q:`${bevTxt(m)}. De onderneming verkoopt ${q}.000 stuks. Bereken het resultaat in duizenden euro's (verlies is negatief).`,a,eh:'',
      u:`Resultaat = (${nl1(m.p)} − ${nl1(m.v)}) × ${q} − ${gt(m.C)} = ${nl1(a)} (× € 1.000). Je kunt het ook aflezen: het verschil tussen TO en TK bij ${q}.000 stuks.`} }
});
const GRAF_GENS=['grafBreakEven','grafWinst','grafVerlies','grafCK','grafLijn','grafResultaat'];
function grafKlik(ev){ if(!Q||Q.fase!=='vraag') return; const v=Q.vragen[Q.i]; if(v.t!=='klik') return;
  const svg=$('#graf'); const pt=svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse());
  antw=[p.x,p.y]; $('#grafMark').innerHTML=`<circle cx="${p.x}" cy="${p.y}" r="7" fill="var(--knop)" stroke="#fff" stroke-width="2"/>`; $('#ok').disabled=false }
function startGrafiek(){ const v=shuffle(GRAF_GENS.concat(pick([GRAF_GENS]))).slice(0,8).map(maakGen); Q={modus:'formule',titel:'Grafiektraining',vragen:v,i:0,res:[],terug:"go('leren')"}; go('quiz') }
const _nakijkenG=nakijken; nakijken=function(v,a){ if(v.t==='klik') return !!a&&v.raak(a); return _nakijkenG(v,a) };
const _juistG=juistTekst; juistTekst=function(v){ return v.t==='klik'?v.juist:_juistG(v) };

// ---------- 4. Proeftoets per hoofdstuk ----------
const PROEF_N=15;
function proefGroepen(){ const out=[]; wereldenVoor().forEach(w=>{ const lvs=lvsVoor(w.id).filter(l=>l.hfd&&!l.extra); const hfd=w.lab+' · '+w.naam;
  const n=lvs.reduce((a,l)=>a+l.vragen.filter(autoNakijk).length,0); if(n>=8) out.push({key:w.id,w:w.id,hfd,lvs,n}) }); return out }
function startProef(key){ const g=proefGroepen().find(x=>x.key===key); if(!g){ melding('Deze toets is er niet'); return }
  let pool=shuffle(g.lvs.flatMap(l=>l.vragen.filter(autoNakijk).map(v=>Object.assign({w:g.w,l:l.id},v)))).slice(0,PROEF_N);
  const gens=[...new Set(g.lvs.flatMap(l=>l.gens||[]))]; if(gens.length&&pool.length>=PROEF_N) pool.splice(-2,2,maakGen(pick(gens)),maakGen(pick(gens)));
  pool.forEach(v=>delete v._mix);
  Q={modus:'proef',geenFb:true,titel:'Proeftoets · '+g.hfd,key,w:g.w,vragen:shuffle(pool),i:0,res:[],terug:"go('proef')",start:Date.now(),eind:Date.now()+pool.length*75*1000};
  go('quiz'); startKlok() }
let klokTimer=null;
function startKlok(){ clearInterval(klokTimer); klokTimer=setInterval(()=>{ if(scherm!=='quiz'||!Q||!Q.eind||Q.modus==='sprint'){ clearInterval(klokTimer); return }
  const s=Math.max(0,Math.round((Q.eind-Date.now())/1000)); const el=$('#klok'); if(el){ el.textContent=`⏱️ ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; el.classList.toggle('bijna',s<60) }
  if(s<=0){ clearInterval(klokTimer); Q.tijdOp=true; while(Q.res.length<Q.vragen.length) Q.res.push(false); klaar() } },1000) }
const _tekenVraagX=tekenVraag;
tekenVraag=function(){ _tekenVraagX(); const v=Q.vragen[Q.i];
  if(Q.eind&&Q.modus!=='sprint'){ const t=$('#qz .top .chip'); if(t) t.insertAdjacentHTML('beforebegin','<span class="chip" id="klok">⏱️</span>') }
  if(v.t==='klik'){ $('#fb').insertAdjacentHTML('beforebegin',`<div class="graf">${v.svg}</div><p class="zacht" style="font-size:14px;margin:4px 0 0">Tik of klik in de grafiek. Je kunt je keuze aanpassen tot je op Controleer drukt.</p>`) } };
const _afrondenX=afronden;
afronden=function(v){ const g=v.t==='klik'?$('#grafOpl'):null; _afrondenX(v); if(g&&g.isConnected&&!Q.geenFb) g.innerHTML=v.opl };
const _klaarX=klaar;
klaar=function(){ clearInterval(klokTimer); if(Q&&Q.modus==='proef') return proefUitslag(); return _klaarX() };
const cijferVan=(p,max)=>Math.max(1,Math.min(10,Math.round((1+9*p/Math.max(1,max))*10)/10));
const cijferTxt=c=>c.toFixed(1).replace('.',',');
function proefUitslag(){
  oefenActief=false; const n=Q.res.filter(Boolean).length, tot=Q.vragen.length, c=cijferVan(n,tot);
  if(!S.pt) S.pt={}; const r=S.pt[Q.key]||{b:0,n:0}; r.n++; r.b=Math.max(r.b||0,c); r.l=c; r.t=Date.now(); S.pt[Q.key]=r;
  if(c>=5.5) S.mVerd+=c>=8?10:5; checkBadges(); bewaar(); sync();
  const fout=Q.vragen.filter((v,i)=>!Q.res[i]); const per={}; fout.forEach(v=>{ const k=(EINDTERMEN[v.e]||{}).t||'Overig'; per[k]=(per[k]||0)+1 });
  const min=Math.round((Math.min(Date.now(),Q.eind)-Q.start)/60000);
  app().innerHTML=`<div class="wrap" style="max-width:680px"><div class="kaart mid"><div class="cijfer ${c>=5.5?'vold':'onv'}">${cijferTxt(c)}</div>
    <h2 style="margin:6px 0">${n} van ${tot} goed</h2><p class="zacht">${esc(Q.titel.replace('Proeftoets · ',''))} · ${Q.tijdOp?'de tijd was om':`klaar in ${min} minuten`} · je beste cijfer ${cijferTxt(r.b)}</p>
    ${c>=5.5?'<p>Voldoende! '+(c>=8?'+10':'+5')+' munten</p>':'<p>Nog niet voldoende. Kijk hieronder waar het misging en oefen die onderwerpen.</p>'}
    <div class="voet" style="justify-content:center"><button class="knop zacht" onclick="go('proef')">Terug</button><button class="knop" onclick="startProef('${esc(Q.key)}')">Nieuwe proeftoets</button>${fout.length?`<button class="knop zacht" onclick="startHerhaal()">Oefen je fouten</button>`:''}</div></div>
   ${fout.length?`<div class="sectie">Hier ging het mis</div><div class="kaart">${Object.entries(per).sort((a,b)=>b[1]-a[1]).map(([k,x])=>`<div class="rij"><span style="flex:1">${esc(k)}</span><b>${x} fout</b></div>`).join('')}</div>
   <div class="sectie">Uitleg bij je fouten</div><div class="kaart">${fout.map(v=>`<div class="rij" style="display:block"><b>${esc(v.q)}</b><br>Juist: <b>${esc(juistTekst(v))}</b>${v.u?`<br><span class="zacht">${esc(v.u)}</span>`:''}</div>`).join('')}</div>`:''}</div>`;
  scherm='resultaat'; nav();
}
SCHERMEN.proef = function(){
  const gr=proefGroepen(); const pt=S.pt||{};
  const blok=wereldenVoor().map(w=>{ const l=gr.filter(g=>g.w===w.id); if(!l.length) return '';
    return `<div class="sectie">${w.icoon} ${w.lab} · ${esc(w.naam)}</div><div class="kaart">${l.map(g=>{ const r=pt[g.key];
      return `<button class="lv" onclick="startProef('${esc(g.key)}')"><span class="med">${r?(r.b>=5.5?'✅':'📝'):'⏱️'}</span><span style="flex:1"><b>${esc(g.hfd)}</b><small>${Math.min(PROEF_N,g.n)} vragen · ${Math.round(Math.min(PROEF_N,g.n)*1.25)} minuten${r?` · beste cijfer ${cijferTxt(r.b)} · laatste ${cijferTxt(r.l)} · ${r.n}× gemaakt`:''}</small></span>${r?`<span class="cijfer klein ${r.b>=5.5?'vold':'onv'}">${cijferTxt(r.b)}</span>`:'<span class="zacht">›</span>'}</button>` }).join('')}</div>` }).join('');
  return `<div class="wrap" style="max-width:760px">${kop('Proeftoets per hoofdstuk',"go('leren')")}
   <div class="kaart" style="margin-bottom:6px"><p style="margin:0">Een toets zoals in de klas: ${PROEF_N} vragen uit één hoofdstuk, ongeveer 1 minuut per vraag. Je ziet pas aan het eind wat goed en fout was. Je krijgt een cijfer van 1 tot 10. Foute vragen komen in je herhaalronde.</p></div>
   ${blok||'<div class="kaart"><p class="zacht" style="margin:0">Er zijn nog geen hoofdstukken met genoeg vragen voor jouw niveau.</p></div>'}</div>${VOET()}`;
};

// ---------- 6. Examen op tijd ----------
// Een heel examen op één pagina, met 180 minuten (zoals het echte centraal examen). Daarna kijkt de leerling alles na met het
// antwoordmodel (meerkeuze gaat vanzelf) en krijgt een cijferschatting. S.exvol = het examen dat bezig is, S.exr = uitslagen.
const EX_MIN=180;
const exvVragen = c => exVragen().filter(v=>v.ex===c&&!/\.\d+\.\d+$/.test(v.id)).sort((a,b)=>a.nr-b.nr);
const exvMax = l => l.reduce((a,v)=>a+(v.pnt||1),0);
let exvTimer=null, exvSave=null;
function exTijdLijst(){ const r=S.exr||{};
  return `<div class="kaart" style="margin-bottom:12px"><p style="margin:0">Maak een heel examen onder examenomstandigheden: alle vragen op één pagina en ${EX_MIN} minuten, net als op de echte examendag. Je antwoorden worden steeds bewaard, maar de klok loopt door. Na het inleveren kijk je alles na met het antwoordmodel en krijg je een cijferschatting.</p></div>
   <div class="kaart">${exLijst().map(({c})=>{ const l=exvVragen(c); const x=r[c]; const bezig=S.exvol&&S.exvol.c===c;
     return `<button class="lv" onclick="go('exvol','${c}')"><span class="med">${bezig?'✍️':x?'✅':'🎓'}</span><span style="flex:1"><b>Examen ${exNaam(c)}</b><small>${l.length} vragen · ${exvMax(l)} punten${bezig?' · <b>bezig</b>':''}${x?` · laatste keer ${x.p} van ${x.m} punten, cijfer ± ${cijferTxt(x.cf)}`:''}</small></span>${x?`<span class="cijfer klein ${x.cf>=5.5?'vold':'onv'}">${cijferTxt(x.cf)}</span>`:'<span class="zacht">›</span>'}</button>` }).join('')}</div>`; }
SCHERMEN.exvol = function(c){
  c=c||(S.exvol||{}).c; const l=exvVragen(c||''); if(!l.length) return `<div class="wrap">${kop('Examen op tijd',"go('examen')")}<div class="kaart"><p style="margin:0">Dit examen is niet gevonden.</p></div></div>`;
  const E=S.exvol&&S.exvol.c===c?S.exvol:null;
  if(!E) return `<div class="wrap" style="max-width:680px">${kop('Examen '+exNaam(c),"exTab='tijd';go('examen')")}<div class="kaart">
    <p style="margin-top:0"><b>${l.length} vragen · ${exvMax(l)} punten · ${EX_MIN} minuten</b></p>
    <ul><li>Je ziet alle vragen op één pagina, met de teksten en bronnen erbij.</li><li>Schrijf je antwoorden zoals op het echte examen. Ze worden steeds bewaard, ook als je de app sluit.</li><li>De klok loopt door, ook als je even weggaat. Is de tijd om, dan wordt het examen ingeleverd.</li><li>Daarna kijk je alles na met het antwoordmodel en krijg je een cijferschatting.</li></ul>
    ${S.exvol?`<p class="zacht">Let op: je bent nog bezig met examen ${exNaam(S.exvol.c)}. Als je dit examen start, vervalt dat.</p>`:''}
    <label class="label"><input type="checkbox" id="exvExtra"> Ik heb recht op extra tijd (30 minuten)</label>
    <div class="voet"><button class="knop" onclick="exvStart('${c}')">Start het examen</button></div></div></div>`;
  if(E.fase==='uitslag') return exvUitslag(c,l,E);
  const nakijk=E.fase==='nakijken';
  let vorigeCtx='', vorigeTitel='';
  const blokken=l.map((v,i)=>{ let h='';
    if(v.titel&&v.titel!==vorigeTitel){ h+=`<h2 class="exvOpgave">${esc(v.titel)}</h2>`; vorigeTitel=v.titel }
    if(v.ctx&&v.ctx!==vorigeCtx){ h+=`<div class="exvCtx">${fmt(v.ctx)}</div>`; vorigeCtx=v.ctx }
    const imgs=(v.img||[]).map(s=>`<button class="knop zacht klein" onclick="exvImg(${i},'${s}')">${s.includes('-b-')?'📊 Informatiebron':'📄 Examenpagina'}</button>`).join(' ');
    const a=E.antw[v.id];
    let inv;
    if(v.t==='ex') inv=`<div class="opties">${v.o.map((o,k)=>`<button class="optie ${a===k?'kies':''} ${nakijk?(k===v.a?'goed':a===k?'fout':''):''}" ${nakijk?'disabled':''} onclick="exvMc(${i},${k})"><span class="l">${'ABCDE'[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
    else inv=nakijk?`<div class="exvMijn">${a?esc(a):'<span class="zacht">Geen antwoord gegeven.</span>'}</div>`:`<textarea rows="4" oninput="exvTyp(${i},this.value)" placeholder="Je antwoord">${esc(a||'')}</textarea>`;
    return h+`<div class="kaart exvVraag" id="exv${i}"><div class="exvKop"><b>Vraag ${v.nr}</b><span class="zacht">${v.pnt||1}p</span>${nakijk?`<span class="exvPnt" id="exvP${i}"></span>`:''}</div>
      ${imgs?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${imgs}</div><div id="exvImg${i}"></div>`:''}
      <div class="vraag lang">${fmt(v.q,true)}</div>${inv}${nakijk?exvNakijkBlok(v,i,E):''}</div>`; }).join('');
  const nB=l.filter(v=>E.antw[v.id]!=null&&E.antw[v.id]!=='').length;
  const balk=nakijk?`<div class="exvBalk"><b>Nakijken</b><span id="exvTot"></span><span style="flex:1"></span><button class="knop klein" onclick="exvKlaar('${c}')">Klaar met nakijken</button></div>`
    :`<div class="exvBalk"><b id="exKlok">⏱️</b><span class="zacht" id="exvN">${nB} van ${l.length} beantwoord</span><span style="flex:1"></span><button class="knop zacht klein" onclick="go('home')">Pauze</button><button class="knop klein" onclick="if(confirm('Weet je zeker dat je wilt inleveren?'))exvInleveren()">Inleveren</button></div>`;
  return `<div class="wrap" style="max-width:860px"><div class="exvTitel"><span class="eyebrow">Centraal examen</span><h1>Bedrijfseconomie ${exNaam(c)}</h1>${nakijk?'<p>Kijk elke vraag na met het antwoordmodel. Meerkeuzevragen zijn al nagekeken. Vink per deelscore aan wat er in je antwoord staat, of kies het aantal punten.</p>':''}</div>${balk}${blokken}
   <div class="voet" style="justify-content:center;margin:20px 0">${nakijk?`<button class="knop" onclick="exvKlaar('${c}')">Klaar met nakijken</button>`:`<button class="knop" onclick="if(confirm('Weet je zeker dat je wilt inleveren?'))exvInleveren()">Inleveren</button>`}</div></div>`;
};
SCHERMEN.exvol_na = function(){ const E=S.exvol; clearInterval(exvTimer); if(!E) return;
  if(E.fase==='maken'){ const tik=()=>{ if(scherm!=='exvol'){ clearInterval(exvTimer); return } const s=Math.max(0,Math.round((E.eind-Date.now())/1000)); const el=$('#exKlok');
      if(el){ el.textContent=`⏱️ ${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; el.classList.toggle('bijna',s<600) }
      if(s<=0){ clearInterval(exvTimer); melding('De tijd is om. Je examen is ingeleverd.',4000); exvInleveren() } };
    tik(); exvTimer=setInterval(tik,1000) }
  if(E.fase==='nakijken') exvTel() };
function exvStart(c){ const extra=$('#exvExtra')&&$('#exvExtra').checked; S.exvol={c,start:Date.now(),eind:Date.now()+(EX_MIN+(extra?30:0))*60000,antw:{},pnt:{},fase:'maken'}; bewaar(); go('exvol',c) }
function exvBewaar(){ clearTimeout(exvSave); exvSave=setTimeout(()=>bewaar(false),800) }
function exvTyp(i,t){ const E=S.exvol; const v=exvVragen(E.c)[i]; E.antw[v.id]=t; exvBewaar(); exvTelB() }
function exvMc(i,k){ const E=S.exvol; if(E.fase!=='maken') return; const v=exvVragen(E.c)[i]; E.antw[v.id]=k; document.querySelectorAll(`#exv${i} .optie`).forEach((b,j)=>b.classList.toggle('kies',j===k)); exvBewaar(); exvTelB() }
function exvTelB(){ const E=S.exvol, l=exvVragen(E.c); const el=$('#exvN'); if(el) el.textContent=`${l.filter(v=>E.antw[v.id]!=null&&E.antw[v.id]!=='').length} van ${l.length} beantwoord` }
function exvImg(i,s){ const b=$('#exvImg'+i); if(!b) return; if(b.dataset.s===s){ b.innerHTML=''; b.dataset.s=''; return } b.dataset.s=s;
  b.innerHTML=`<div style="overflow:auto;max-height:70vh;border:1px solid var(--lijn);border-radius:12px;margin-bottom:10px;background:#fff"><img src="${EX_IMG}${s}.jpg" alt="Examenpagina" style="width:100%;display:block"></div>` }
function exvInleveren(){ const E=S.exvol; if(!E) return; clearInterval(exvTimer); E.fase='nakijken'; E.ingeleverd=Date.now();
  exvVragen(E.c).forEach(v=>{ if(v.t==='ex') E.pnt[v.id]=E.antw[v.id]===v.a?(v.pnt||1):0 }); bewaar(); go('exvol',E.c) }
function exvNakijkBlok(v,i,E){
  if(v.t==='ex') return `<div class="fb ${E.antw[v.id]===v.a?'goed':'fout'}"><b>${E.antw[v.id]===v.a?'Goed':'Fout'}.</b> Het juiste antwoord is ${'ABCDE'[v.a]}.</div>`;
  const ds=v.pnt?deelscoresVan(v):null; const tekst=String(E.antw[v.id]||''); const p=E.pnt[v.id];
  let ui;
  if(ds){ const gekozen=E.deel&&E.deel[v.id];
    ui=`<div class="deelscores">${ds.map((d,k)=>{ const g=uitkomstVan(d.t); const auto=bevatGetal(tekst,g); const aan=gekozen?gekozen.includes(k):auto;
      return `<label class="deel"><input type="checkbox" ${aan?'checked':''} onchange="exvDeel(${i})"><span>${esc(d.t.replace(/^(Een juist antwoord bevat|Een juiste (berekening|uitleg|verklaring) is|Uit het antwoord moet blijken)( dat)?:?\s*/i,''))} <b class="zacht">(${d.p}p)</b>${auto?`<br><small class="auto">🤖 De computer vond ${esc(g)} in je antwoord</small>`:''}</span></label>` }).join('')}</div>`;
    if(p==null){ E.pnt[v.id]=ds.reduce((a,d,k)=>a+(bevatGetal(tekst,uitkomstVan(d.t))?d.p:0),0) } }
  else ui=`<div class="voet" style="justify-content:flex-start;flex-wrap:wrap;margin-top:8px">${Array.from({length:(v.pnt||1)+1},(_,k)=>k).map(k=>`<button class="knop klein ${p===k?'':'zacht'}" onclick="exvPunt(${i},${k})">${k} punt${k===1?'':'en'}</button>`).join('')}</div>`;
  return `<details class="exvModel" open><summary>Antwoordmodel</summary><div>${fmt(ds?String(v.model).split(/\n\s*Puntenverdeling:?/)[0]:v.model)}</div></details>${ui}`;
}
function exvDeel(i){ const E=S.exvol, v=exvVragen(E.c)[i]; const ds=deelscoresVan(v); const box=$('#exv'+i); const aan=[...box.querySelectorAll('.deelscores input')].map((x,k)=>x.checked?k:-1).filter(k=>k>=0);
  E.deel=E.deel||{}; E.deel[v.id]=aan; E.pnt[v.id]=aan.reduce((a,k)=>a+ds[k].p,0); exvBewaar(); exvTel() }
function exvPunt(i,k){ const E=S.exvol, v=exvVragen(E.c)[i]; E.pnt[v.id]=k; $('#exv'+i).querySelectorAll('.voet .knop').forEach((b,j)=>b.classList.toggle('zacht',j!==k)); exvBewaar(); exvTel() }
function exvTel(){ const E=S.exvol, l=exvVragen(E.c); let p=0, open=0; l.forEach((v,i)=>{ const x=E.pnt[v.id]; if(x==null) open++; else p+=x; const el=$('#exvP'+i); if(el) el.innerHTML=x==null?'<span class="zacht">nog nakijken</span>':`<b>${x} van ${v.pnt||1}</b>` });
  const t=$('#exvTot'); if(t) t.innerHTML=`${p} van ${exvMax(l)} punten${open?` · nog ${open} vragen nakijken`:''}`; return {p,open} }
function exvKlaar(c){ const E=S.exvol, l=exvVragen(c); const {p,open}=exvTel(); if(open&&!confirm(`Je hebt ${open} vragen nog niet nagekeken. Die tellen als 0 punten. Toch afronden?`)) return;
  const m=exvMax(l), cf=cijferVan(p,m);
  l.forEach(v=>{ const x=E.pnt[v.id]||0, mx=v.pnt||1; const kopie=Object.assign({},v); if(v.t==='open') kopie._pt={p:x,max:mx}; registreer(kopie,x>=mx) });
  if(!S.exr) S.exr={}; const minuten=Math.round(((E.ingeleverd||Date.now())-E.start)/60000);
  S.exr[c]={p,m,cf,t:Date.now(),min:minuten}; E.fase='uitslag'; E.p=p; E.m=m; E.cf=cf; E.min=minuten;
  S.mVerd+=cf>=5.5?25:10; checkBadges(); bewaar(); sync(); go('exvol',c) }
function exvUitslag(c,l,E){
  const perD={}; l.forEach(v=>{ const d=perD[v.d]||(perD[v.d]={p:0,m:0}); d.p+=E.pnt[v.id]||0; d.m+=v.pnt||1 });
  const doms=Object.entries(perD).map(([d,x])=>{ const D=DOMEINEN.find(y=>y.id===d)||{naam:d,icoon:''}; const pc=Math.round(x.p/x.m*100); return `<div class="domein"><span>${D.icoon}</span><div><small>${esc(D.naam)} · ${x.p} van ${x.m}</small><div class="balk"><i style="width:${pc}%;background:${pc>=75?'var(--goed)':pc>=50?'var(--goud)':'var(--fout)'}"></i></div></div><span class="pct">${pc}</span></div>` }).join('');
  return `<div class="wrap" style="max-width:680px">${kop('Examen '+exNaam(c),"exTab='tijd';go('examen')")}<div class="kaart mid"><div class="cijfer ${E.cf>=5.5?'vold':'onv'}">${cijferTxt(E.cf)}</div>
   <h2 style="margin:6px 0">${E.p} van ${E.m} punten</h2><p class="zacht">Gemaakt in ${E.min} minuten. Cijferschatting met normering N = 1,0. De echte normering verschilt per examen, meestal tussen 0,8 en 1,5.</p>
   <div class="voet" style="justify-content:center"><button class="knop zacht" onclick="S.exvol=null;bewaar();exTab='tijd';go('examen')">Terug naar de examens</button><button class="knop" onclick="S.exvol=null;bewaar();startHerhaal()">Oefen je fouten</button></div></div>
   <div class="sectie">Punten per domein</div><div class="kaart">${doms}</div></div>`;
}

// ---------- Foutenschrift ----------
// Alle vragen die de leerling ooit fout had, gegroepeerd per leerdoel (eindterm/onderwerp). 'Open' = nog niet weggewerkt:
// staat nog in de herhaalronde (leerling) of vaker fout dan goed (docent). Rekensommen met wisselende getallen tellen per soort.
function foutGroepen(vr, herhaal){
  const g={};
  Object.entries(vr||{}).forEach(([id,r])=>{ if(!r||!r.f) return; let v;
    if(id.startsWith('gen.')){ try{ v=maakGen(id.slice(4)) }catch(e){ return } } else v=vraagById(id);
    if(!v||!v.e) return; const open=herhaal&&!v.gen?herhaal.includes(id):r.f>(r.g||0);
    (g[v.e]=g[v.e]||{e:v.e,items:[]}).items.push({id,v,r,open}) });
  return Object.values(g).map(x=>{ x.items.sort((a,b)=>(b.open-a.open)||(b.r.f-a.r.f)); x.open=x.items.filter(i=>i.open).length; x.tot=x.items.length; return x })
    .sort((a,b)=>b.open-a.open||b.tot-a.tot);
}
const ldNaam = e => (EINDTERMEN[e]||{}).t||e;
const ldDomein = e => DOMEINEN.find(d=>d.id===(EINDTERMEN[e]||{}).d)||{icoon:'',naam:''};
let fsAlles=false;
SCHERMEN.fouten = function(){
  const gr=foutGroepen(S.vr,S.herhaal).filter(x=>fsAlles||x.open);
  const nOpen=gr.reduce((a,x)=>a+x.open,0);
  const item=i=>{ const v=i.v; const q=v.gen?'Rekensom: '+v.q:v.q;
    return `<div class="rij fsItem" style="display:block"><div style="display:flex;gap:8px;align-items:baseline"><span>${i.open?'🔴':'✅'}</span><span style="flex:1">${esc(q.length>260?q.slice(0,260)+'…':q)}</span></div>
     <div class="zacht" style="font-size:13px;margin:2px 0 0 26px">${i.r.f}× fout${i.r.g?' · '+i.r.g+'× goed':''}${v.w==='ex'&&v.jaar?` · examen ${v.jaar} tijdvak ${v.tv} vraag ${v.nr}`:''}${i.open?'':' · weggewerkt'}</div>
     <div style="margin:4px 0 0 26px;font-size:14px">${v.t==='open'?`<details><summary style="cursor:pointer;color:var(--acc);font-weight:700">Antwoordmodel</summary>${fmt(v.model||'')}</details>`:`Juist: <b>${esc(v.gen?'(steeds andere getallen)':String(juistTekst(v)))}</b>${v.u?`<br><span class="zacht">${esc(v.u)}</span>`:''}`}</div></div>` };
  const blok=gr.map(x=>{ const D=ldDomein(x.e), sc=etScore(x.e);
    const items=x.items.filter(i=>fsAlles||i.open);
    return `<div class="kaart fsLd" style="margin-bottom:12px"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="font-size:26px">${D.icoon}</span>
      <span style="flex:1;min-width:200px"><span class="zacht" style="font-size:13px">${esc(D.naam)} · leerdoel</span><br><b>${esc(ldNaam(x.e))}</b></span>
      <span style="text-align:right"><b style="color:${x.open?'var(--fout)':'var(--goed)'}">${x.open} open</b><br><span class="zacht" style="font-size:13px">${x.tot} ooit fout${sc!=null?' · score '+sc:''}</span></span></div>
      <div class="voet" style="justify-content:flex-start;flex-wrap:wrap;margin:10px 0 4px">${x.open?`<button class="knop klein" onclick="startFoutLd('${x.e}')">Oefen deze foute vragen</button>`:''}<button class="knop zacht klein" onclick="${x.e.startsWith('EX.')?`startExDomein('${x.e.slice(3)}')`:`startEindterm('${x.e}')`}">Nieuwe vragen over dit leerdoel</button></div>
      <details ${gr.length<=3?'open':''}><summary style="cursor:pointer;font-weight:700">Bekijk de ${items.length} vragen</summary>${items.map(item).join('')}</details></div>` }).join('');
  return `<div class="wrap" style="max-width:860px">${kop('Foutenschrift',"go('leren')")}
   <div class="kaart" style="margin-bottom:14px"><p style="margin:0 0 8px">Hier staan alle vragen die je fout had, per leerdoel. Bovenaan staan de leerdoelen waar je nog de meeste fouten open hebt: daar moet je dus specifiek aan werken. Een fout is weggewerkt als je de vraag daarna twee keer goed hebt.</p>
   <p style="margin:0 0 10px"><b>${nOpen}</b> fouten nog open, verdeeld over <b>${gr.filter(x=>x.open).length}</b> leerdoelen.</p>
   <div class="voet" style="justify-content:flex-start;flex-wrap:wrap;margin:0"><label class="label" style="margin:0"><input type="checkbox" ${fsAlles?'checked':''} onchange="fsAlles=this.checked;go('fouten')"> Ook weggewerkte fouten tonen</label><span style="flex:1"></span><button class="knop zacht klein" onclick="document.querySelectorAll('.fsLd details').forEach(d=>d.open=true);window.print()">Afdrukken</button></div></div>
   ${blok||'<div class="kaart"><p class="zacht" style="margin:0">Nog geen fouten. Goed bezig, of nog niet genoeg geoefend!</p></div>'}</div>${VOET()}`;
};
function startFoutLd(e){ const gr=foutGroepen(S.vr,S.herhaal).find(x=>x.e===e); if(!gr) return;
  const v=gr.items.filter(i=>i.open).map(i=>i.v.gen?maakGen(i.id.slice(4)):i.v).slice(0,12).map(x=>{ const c=Object.assign({},x); delete c._mix; return c });
  Q={modus:'herhaal',titel:'Foutenschrift · '+ldNaam(e),vragen:shuffle(v),i:0,res:[],terug:"go('fouten')"}; go('quiz') }
// voor het docentendashboard: compact overzicht per leerdoel
function foutenschriftDocent(s){ const gr=foutGroepen(s.vr); if(!gr.length) return '<p class="zacht" style="margin:0">Nog geen fouten.</p>';
  return gr.slice(0,15).map(x=>{ const D=ldDomein(x.e); const sc=etPct((s.et||{})[x.e]);
    return `<details class="rij" style="display:block"><summary style="cursor:pointer;display:flex;gap:10px;align-items:center"><span>${D.icoon}</span><span style="flex:1;font-size:14px">${esc(ldNaam(x.e))}</span><b style="color:${x.open?'var(--fout)':'var(--goed)'}">${x.open} open</b><span class="zacht" style="font-size:13px;min-width:70px;text-align:right">${x.tot} ooit fout</span>${dc(sc)}</summary>
     ${x.items.slice(0,8).map(i=>`<div style="font-size:13px;margin:4px 0 0 30px">${i.open?'🔴':'✅'} ${esc((i.v.gen?'Rekensom: ':'')+(i.v.q.length>180?i.v.q.slice(0,180)+'…':i.v.q))} <span class="zacht">(${i.r.f}× fout${i.r.g?', '+i.r.g+'× goed':''})</span></div>`).join('')}</details>` }).join('') }
