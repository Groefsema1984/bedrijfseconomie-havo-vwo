// ===== Werkplaats: oefeningen in een schema, zoals op de uitwerkbijlage van het examen =====
// Nieuwe vraagvorm t:'schema'. Een vraag heeft kop (kolomkoppen), rij (rijen met cellen) en eventueel pre (html boven het schema,
// bijvoorbeeld een tijdlijn of organogram). Een cel is tekst, {n:getal, tol} (getal invullen) of {s:[keuzes], a:'juiste keuze'}.
// Alle invulcellen moeten goed zijn. Alle oefeningen zijn generatoren: elke keer nieuwe getallen.

const _cellen = v => v.rij.flatMap(r=>r.c).filter(c=>c&&typeof c==='object');
function schemaHtml(v){
  let k=0; antw=_cellen(v).map(()=> '');
  const cel=c=>{ if(c==null||typeof c!=='object') return `<td>${esc(c==null?'':String(c))}</td>`; const i=k++;
    if(c.s) return `<td><select data-k="${i}" onchange="schemaIn(this)"><option value="">Kies…</option>${c.s.map(o=>`<option>${esc(o)}</option>`).join('')}</select></td>`;
    return `<td><input type="text" inputmode="decimal" autocomplete="off" data-k="${i}" oninput="schemaIn(this)" placeholder="${c.ph||''}"></td>` };
  return `${v.pre?`<div class="schemaPre">${v.pre}</div>`:''}<div class="vtabel schema"><table>${v.kop?`<tr>${v.kop.map(x=>`<th>${esc(x)}</th>`).join('')}</tr>`:''}${v.rij.map(r=>`<tr><th scope="row">${esc(r.l)}</th>${r.c.map(cel).join('')}</tr>`).join('')}</table></div>
   <p class="zacht" style="font-size:14px">${v.tip||'Vul alles in. Bedragen in hele euro\'s, zonder punt of €-teken mag ook.'}</p>`;
}
function schemaIn(el){ antw[+el.dataset.k]=el.value.trim(); $('#ok').disabled=antw.some(x=>x==='') }
function celGoed(c,x){ if(c.s) return x===c.a; const g=parseGetal(x); return !isNaN(g)&&Math.abs(g-c.n)<=(c.tol!=null?c.tol:1.01) }
const celTxt = c => c.s ? c.a : (c.tol==null||c.tol>=1 ? gt(Math.round(c.n)) : String(r2(c.n)).replace('.',','));
const _nakijkenS=nakijken; nakijken=function(v,a){ if(v.t==='schema') return Array.isArray(a)&&_cellen(v).every((c,i)=>celGoed(c,a[i])); return _nakijkenS(v,a) };
const _juistS=juistTekst; juistTekst=function(v){ if(v.t!=='schema') return _juistS(v);
  return v.rij.map(r=>{ const c=r.c.filter(x=>x&&typeof x==='object'); return c.length?`${r.l}: ${c.map(celTxt).join(' / ')}`:'' }).filter(Boolean).join(' · ') };
const _tekenS=tekenVraag; tekenVraag=function(){ _tekenS(); const v=Q.vragen[Q.i];
  if(v.t==='schema'){ $('#fb').insertAdjacentHTML('beforebegin',schemaHtml(v)) } };
const _afrondenS=afronden; afronden=function(v){
  if(v.t==='schema'&&!Q.geenFb&&Q.modus!=='toets'){ const cs=_cellen(v);
    document.querySelectorAll('.schema [data-k]').forEach(el=>{ const c=cs[+el.dataset.k]; const ok=celGoed(c,antw[+el.dataset.k]); el.classList.add(ok?'goed':'fout'); el.disabled=true;
      if(!ok) el.insertAdjacentHTML('afterend',`<small class="juist">${esc(celTxt(c))}</small>`) }) }
  _afrondenS(v) };

// ---------- helpers ----------
const kiesN=(arr,n)=>shuffle(arr.slice()).slice(0,n);
const rond=(x,s)=>Math.round(x/s)*s;

Object.assign(GENS,{
  // 1. Balans invullen: posten indelen en het eigen vermogen berekenen (vierkantscontrole)
  balansInvullen(){
    const A=[['Gebouw','Vaste activa',[150,400]],['Inventaris','Vaste activa',[15,60]],['Machines','Vaste activa',[40,120]],['Bestelbus','Vaste activa',[20,45]],
      ['Voorraad goederen','Vlottende activa',[20,90]],['Debiteuren','Vlottende activa',[8,40]],['Kas','Liquide middelen',[1,5]],['Bank','Liquide middelen',[5,30]]];
    const P=[['Hypothecaire lening','Lang vreemd vermogen',[100,250]],['Onderhandse lening','Lang vreemd vermogen',[20,60]],['Crediteuren','Kort vreemd vermogen',[10,45]],['Rekening-courantkrediet','Kort vreemd vermogen',[5,25]]];
    const keuze=['Vaste activa','Vlottende activa','Liquide middelen','Lang vreemd vermogen','Kort vreemd vermogen'];
    const posten=kiesN(A,5).concat(kiesN(P,2)).map(([n,c,[lo,hi]])=>({n,c,b:rond(lo*1000+Math.random()*(hi-lo)*1000,500)}));
    const act=posten.filter(p=>!p.c.includes('vermogen')).reduce((s,p)=>s+p.b,0), vv=posten.filter(p=>p.c.includes('vermogen')).reduce((s,p)=>s+p.b,0);
    if(act-vv<20000) posten.find(p=>p.c==='Vaste activa').b+=vv-act+rond(40000+Math.random()*60000,1000);
    const totA=posten.filter(p=>!p.c.includes('vermogen')).reduce((s,p)=>s+p.b,0), ev=totA-vv;
    const naam=pick(['Fietsenzaak Trapper','Bakkerij De Korenaar','Webwinkel Boxx','Sportzaak Vlam','Tuincentrum Groenrijk']);
    return {t:'schema', e:'A.balans', q:`Hieronder staan de balansposten van ${naam} op 1 januari. Geef bij elke post aan waar hij op de balans hoort. Bereken daarna het eigen vermogen.`,
      kop:['Post','Bedrag','Plaats op de balans'], rij:shuffle(posten).map(p=>({l:p.n,c:[eur(p.b),{s:keuze,a:p.c}]})).concat([{l:'Eigen vermogen',c:['?',{n:ev,ph:'€'}]},{l:'Balanstotaal',c:['',{n:totA,ph:'€'}]}]),
      u:`Debet: vaste activa, vlottende activa en liquide middelen (samen ${eur(totA)}). Credit: eigen vermogen en vreemd vermogen. Eigen vermogen = ${gt(totA)} − ${gt(vv)} = ${eur(ev)}. Vierkantscontrole: debet = credit = ${eur(totA)}.`} },

  // 2. Balansmutaties: welke posten veranderen er?
  balansMutatie(){
    const P=['Inventaris','Voorraad','Debiteuren','Kas','Bank','Eigen vermogen','Lening','Crediteuren'];
    const b=rond(500+Math.random()*9500,100), b2=rond(b*pick([0.5,0.6,0.7]),10);
    const E=[[`Inkoop van goederen op rekening, ${eur(b)}.`,{Voorraad:'+',Crediteuren:'+'}],[`Betaling aan een leverancier via de bank, ${eur(b)}.`,{Crediteuren:'−',Bank:'−'}],
      [`Een klant betaalt een openstaande factuur via de bank, ${eur(b)}.`,{Debiteuren:'−',Bank:'+'}],[`Er wordt ${eur(b)} contant geld op de bank gestort.`,{Kas:'−',Bank:'+'}],
      [`Aflossing op de lening via de bank, ${eur(b)}.`,{Lening:'−',Bank:'−'}],[`De eigenaar neemt ${eur(b)} contant op voor privé.`,{Kas:'−','Eigen vermogen':'−'}],
      [`Afschrijving op de inventaris, ${eur(b)}.`,{Inventaris:'−','Eigen vermogen':'−'}],[`Het loon van ${eur(b)} wordt via de bank betaald.`,{Bank:'−','Eigen vermogen':'−'}],
      [`Aankoop van een nieuwe toonbank (inventaris) op rekening, ${eur(b)}.`,{Inventaris:'+',Crediteuren:'+'}],[`De interest over de lening, ${eur(b)}, wordt via de bank betaald.`,{Bank:'−','Eigen vermogen':'−'}],
      [`De eigenaar stort ${eur(b)} extra privégeld op de zakelijke bankrekening.`,{Bank:'+','Eigen vermogen':'+'}],
      [`Contante verkoop van goederen voor ${eur(b)}. De inkoopwaarde van deze goederen is ${eur(b2)}.`,{Kas:'+',Voorraad:'−','Eigen vermogen':'+'}],
      [`Verkoop op rekening voor ${eur(b)}. De inkoopwaarde is ${eur(b2)}.`,{Debiteuren:'+',Voorraad:'−','Eigen vermogen':'+'}]];
    const [txt,eff]=pick(E);
    return {t:'schema', e:'A.balans', q:`Gebeurtenis: ${txt}\nGeef bij elke balanspost aan of hij stijgt (+), daalt (−) of gelijk blijft.`, kop:['Balanspost','Verandering'],
      rij:P.map(p=>({l:p,c:[{s:['+','−','gelijk'],a:eff[p]||'gelijk'}]})), tip:'Elke gebeurtenis verandert minstens twee posten. Vraag je af: verandert er iets aan het eigen vermogen (winst, kosten, privé)?',
      u:`Er veranderen: ${Object.entries(eff).map(([k,x])=>k+' '+x).join(', ')}. De balans blijft in evenwicht.`} },

  // 3a. Kosten of uitgave?
  kostenUitgaven(){
    const L=[['Afschrijving op de bestelbus','alleen kosten'],['Aflossing van de banklening','alleen uitgave'],['Loon van december, betaald in december','kosten én uitgave'],
      ['Aankoop van een machine, contant betaald','alleen uitgave'],['Huur voor dit jaar, dit jaar betaald','kosten én uitgave'],['Interest over dit jaar, pas volgend jaar betaald','alleen kosten'],
      ['Verzekeringspremie voor volgend jaar, nu al betaald','alleen uitgave'],['Privé-opname door de eigenaar','geen van beide'],['Inkoop van goederen die nog op voorraad liggen, contant betaald','alleen uitgave'],
      ['Energierekening van dit jaar, dit jaar betaald','kosten én uitgave']];
    const k=kiesN(L,5);
    return {t:'schema', e:'F.perio', q:'Een handelsonderneming maakt de resultatenrekening en het liquiditeitsoverzicht over dit jaar. Geef bij elke post aan of het (voor dit jaar) kosten zijn, een uitgave, allebei of geen van beide.', kop:['Post','Soort'],
      rij:k.map(([l,a])=>({l,c:[{s:['kosten én uitgave','alleen kosten','alleen uitgave','geen van beide'],a}]})), tip:'Kosten = waardeverbruik in de periode. Uitgave = geld gaat de onderneming uit.',
      u:'Afschrijving is kosten maar geen uitgave. Aflossen en investeren zijn uitgaven maar geen kosten. Een privé-opname is geen kosten (en geen bedrijfsuitgave).'} },

  // 3b. Liquiditeitsbegroting invullen
  liquiditeitsbegroting(){
    const mnd=['januari','februari','maart']; const pc=pick([40,50,60]); const om=[0,0,0].map(()=>rond(20000+Math.random()*20000,1000)); const deb=rond(8000+Math.random()*8000,500);
    const ink=pick([50,60]); const vast=rond(6000+Math.random()*4000,500); const begin=rond(2000+Math.random()*6000,500); const aflos=pick([0,0,2000,3000]);
    let s=begin; const rij=[];
    om.forEach((o,i)=>{ const ontv=o*pc/100+(i===0?deb:om[i-1]*(100-pc)/100); const uitg=o*ink/100+vast+(i===1?aflos:0); s=s+ontv-uitg; rij.push({l:mnd[i],c:[eur(o),{n:ontv,ph:'€'},{n:uitg,ph:'€'},{n:s,ph:'€'}]}) });
    return {t:'schema', e:'A.liquid', q:`Stel de liquiditeitsbegroting op voor het eerste kwartaal.\n- Beginsaldo liquide middelen op 1 januari: ${eur(begin)}.\n- ${pc}% van de omzet wordt contant ontvangen, de rest een maand later. Op 1 januari staat er ${eur(deb)} aan debiteuren open, die in januari betalen.\n- De inkopen zijn ${ink}% van de omzet en worden in dezelfde maand betaald.\n- Overige uitgaven: ${eur(vast)} per maand.${aflos?`\n- In februari wordt ${eur(aflos)} afgelost op een lening.`:''}\nEen tekort vul je in met een minteken.`,
      kop:['Maand','Omzet','Ontvangsten','Uitgaven','Eindsaldo'], rij,
      u:`Ontvangsten = contant deel van deze maand + rest van vorige maand. Uitgaven = inkopen + overige uitgaven${aflos?' (+ aflossing in februari)':''}. Eindsaldo = beginsaldo + ontvangsten − uitgaven; het eindsaldo is het beginsaldo van de volgende maand.`} },

  // 3c. Resultatenbegroting invullen
  resultatenbegroting(){
    const q=rond(4000+Math.random()*8000,100), p=pick([25,30,40,45,60]), iw=pick([40,50,55,60]); const om=q*p, ivo=om*iw/100;
    const loon=rond(30000+Math.random()*30000,1000), huur=rond(12000+Math.random()*12000,600); const A=rond(40000+Math.random()*40000,1000), R=rond(A*0.1,1000), n=pick([4,5,8]); const af=(A-R)/n;
    const L=rond(50000+Math.random()*50000,5000), i=pick([4,5,6]); const int=L*i/100; const res=om-ivo-loon-huur-af-int;
    return {t:'schema', e:'A.balans', q:`Maak de resultatenbegroting (paginavorm) voor volgend jaar.\n- Verwachte afzet ${gt(q)} stuks, verkoopprijs ${eur(p)} per stuk.\n- De inkoopwaarde is ${iw}% van de omzet.\n- Loonkosten ${eur(loon)}, huur ${eur(huur)}.\n- Inventaris: aanschafwaarde ${eur(A)}, restwaarde ${eur(R)}, levensduur ${n} jaar (lineair).\n- Lening ${eur(L)} tegen ${i}% interest per jaar.`,
      kop:['Post','Bedrag'], rij:[{l:'Omzet',c:[{n:om}]},{l:'Inkoopwaarde van de omzet',c:[{n:ivo}]},{l:'Brutoresultaat',c:[{n:om-ivo}]},{l:'Afschrijvingskosten',c:[{n:af}]},{l:'Interestkosten',c:[{n:int}]},{l:'Resultaat voor belasting',c:[{n:res}]}],
      u:`Omzet ${gt(q)} × ${p} = ${eur(om)}. IWvO ${iw}% = ${eur(ivo)}. Brutoresultaat ${eur(om-ivo)}. Afschrijving (${gt(A)} − ${gt(R)}) / ${n} = ${eur(af)}. Interest ${eur(int)}. Resultaat = ${gt(om-ivo)} − ${gt(loon)} − ${gt(huur)} − ${gt(af)} − ${gt(int)} = ${eur(res)}.`} },

  // 4. Tijdlijn: contante waarde van losse bedragen (en NCW)
  tijdlijnCW(){
    const i=pick([3,4,5,6,8]), n=pick([3,4]); const ncw=Math.random()<.5; const I=ncw?rond(40000+Math.random()*60000,5000):0;
    const B=Array.from({length:n},()=>rond(ncw?I/n*pick([1.05,1.1,1.2,1.3]):1000+Math.random()*9000,500));
    const cw=B.map((b,t)=>b/Math.pow(1+i/100,t+1)); const tot=cw.reduce((a,b)=>a+b,0);
    const W=520,x=t=>40+t*(W-80)/n; const svg=`<svg viewBox="0 0 ${W} 110" class="tijdlijn" role="img" aria-label="Tijdlijn"><line x1="30" y1="60" x2="${W-20}" y2="60" class="ax"/>${Array.from({length:n+1},(_,t)=>`<line x1="${x(t)}" x2="${x(t)}" y1="52" y2="68" class="ax"/><text x="${x(t)}" y="86" text-anchor="middle" font-size="13" class="as">t = ${t}</text>`).join('')}
      ${ncw?`<text x="${x(0)}" y="40" text-anchor="middle" font-size="13" fill="#b91c1c" font-weight="700">−${gt(I)}</text>`:''}${B.map((b,t)=>`<text x="${x(t+1)}" y="40" text-anchor="middle" font-size="13" fill="#1f9e6e" font-weight="700">+${gt(b)}</text>`).join('')}<text x="${W/2}" y="104" text-anchor="middle" font-size="12" class="as">jaren · interest ${i}% per jaar</text></svg>`;
    const rij=B.map((b,t)=>({l:`${eur(b)} op t = ${t+1}`,c:[`${gt(b)} × ${pc(1+i/100)}^−${t+1}`,{n:cw[t]}]})).concat([{l:'Totale contante waarde',c:['',{n:tot}]}]);
    if(ncw) rij.push({l:'Netto contante waarde',c:[`totaal − ${gt(I)}`,{n:tot-I}]},{l:'Advies',c:['',{s:['investeren','niet investeren'],a:tot-I>0?'investeren':'niet investeren'}]});
    return {t:'schema', e:ncw?'D.invest':'B.interest', pre:svg, q:ncw?`Een onderneming overweegt een investering van ${eur(I)} (op t = 0). De verwachte cashflows staan op de tijdlijn; ze komen aan het eind van elk jaar vrij. De vermogenskostenvoet is ${i}%. Bereken de netto contante waarde en geef een advies.`:`Je ontvangt de bedragen op de tijdlijn aan het eind van elk jaar. De interest is ${i}% per jaar. Bereken van elk bedrag de contante waarde op t = 0 en tel ze op.`,
      kop:['Bedrag','Berekening','Contante waarde'], rij, tip:'Rond af op hele euro\'s. Een negatieve uitkomst vul je in met een minteken.',
      u:`Elk bedrag reken je terug met (1 + i)⁻ᵗ, waarbij t het aantal jaren tot nu is. Totaal ${eur(tot)}${ncw?`; NCW = ${gt(tot)} − ${gt(I)} = ${eur(tot-I)}: ${tot-I>0?'positief, dus investeren':'negatief, dus niet investeren'}`:''}.`} },

  // 5. Aflossingstabel (lineair of annuïteit)
  aflossingstabel(){
    const ann=Math.random()<.4; const L=rond(20000+Math.random()*80000,ann?1000:4000), i=pick([4,5,6]), n=4; const A=ann?r2(L*(i/100)/(1-Math.pow(1+i/100,-n))):0;
    let s=L; const rij=[];
    for(let j=1;j<=n;j++){ const int=r2(s*i/100), afl=ann?r2(A-int):L/n, eind=r2(s-afl); rij.push({l:`Jaar ${j}`,c:[j===1?eur(s):{n:s},{n:int},{n:afl},{n:Math.abs(eind)<1?0:eind}]}); s=eind }
    return {t:'schema', e:ann?'B.wonen':'B.interest', q:ann?`Een lening van ${eur(L)} wordt in ${n} jaar afgelost met een annuïteit van ${eur(A)} per jaar, aan het eind van elk jaar. De interest is ${i}%. Vul de aflossingstabel in.`:`Een lening van ${eur(L)} wordt in ${n} jaar lineair afgelost, aan het eind van elk jaar. De interest is ${i}% per jaar over de schuld aan het begin van het jaar. Vul de aflossingstabel in.`,
      kop:['Jaar','Schuld begin','Interest','Aflossing','Schuld eind'], rij, tip:'Rond af op hele euro\'s.',
      u:ann?'Interest = schuld begin × i. Aflossing = annuïteit − interest. Het aflossingsdeel stijgt elk jaar, het interestdeel daalt.':`Aflossing = ${gt(L)} / ${n} = ${eur(L/n)} per jaar. Interest = ${i}% van de schuld aan het begin van het jaar, dus elk jaar lager.`} },

  // 6. Verschillenanalyse in een schema
  verschillenSchema(){
    const sp=pick([2,2.5,4,5,8]), sh1=pick([3,4,5,6]), W=rond(4000+Math.random()*6000,100); const SH=sh1*W; const WH=rond(SH*pick([0.96,0.98,1.02,1.03,1.05]),10); const WP=r2(sp*pick([0.95,0.97,1.03,1.05,1.08]));
    const C=rond(80000+Math.random()*80000,1000), N=rond(W*pick([0.9,0.95,1.05,1.1]),100);
    const pr=(sp-WP)*WH, ef=(SH-WH)*sp, bz=(W-N)*C/N; const vn=x=>x>=0?'voordelig':'nadelig';
    return {t:'schema', e:'F.versch', q:`Een fabriek maakt tuinstoelen. Per stoel is standaard ${sh1} kg kunststof nodig à ${eur(sp)} per kg (standaardprijs).\nDit jaar zijn ${gt(W)} stoelen gemaakt. Er is ${gt(WH)} kg kunststof verbruikt, gekocht voor ${eur(WP)} per kg.\nDe constante kosten zijn ${eur(C)} bij een normale productie van ${gt(N)} stoelen.\nBereken de resultaten en geef aan of ze voordelig of nadelig zijn.`,
      kop:['Resultaat','Bedrag (positief)','Voordelig of nadelig'], rij:[{l:'Prijsresultaat',c:[{n:Math.abs(pr)},{s:['voordelig','nadelig'],a:vn(pr)}]},{l:'Efficiencyresultaat',c:[{n:Math.abs(ef)},{s:['voordelig','nadelig'],a:vn(ef)}]},{l:'Bezettingsresultaat',c:[{n:Math.abs(bz)},{s:['voordelig','nadelig'],a:vn(bz)}]}],
      tip:'Vul het bedrag zonder minteken in en kies daarna voordelig of nadelig. Rond af op hele euro\'s.',
      u:`Prijsresultaat = (SP − WP) × WH = (${nl1(sp)} − ${nl1(WP)}) × ${gt(WH)} = ${eur(pr)}. Efficiencyresultaat = (SH − WH) × SP = (${gt(SH)} − ${gt(WH)}) × ${nl1(sp)} = ${eur(ef)}. Bezettingsresultaat = (W − N) × C/N = (${gt(W)} − ${gt(N)}) × ${nl1(C/N)} = ${eur(bz)}.`} },

  // 7. Organogram: spanwijdte, spandiepte, lijn en staf
  organogram(){
    const afd=kiesN(['Inkoop','Verkoop','Productie','Logistiek','Marketing','Financiën','ICT'],pick([2,3,4]));
    const staf=pick(['Juridisch adviseur','P&O-adviseur','Secretariaat','Controller']);
    const team=afd.map(()=>pick([2,3,4,5])); const sub=Math.random()<.5?Math.floor(Math.random()*afd.length):-1;
    const W=560, bw=Math.min(120,(W-20)/afd.length-12), y=[20,100,180,250];
    const box=(x,yy,t,st)=>`<rect x="${x-bw/2}" y="${yy}" width="${bw}" height="30" rx="6" class="obox${st?' staf':''}"/><text x="${x}" y="${yy+19}" text-anchor="middle" font-size="11">${esc(t)}</text>`;
    const xs=afd.map((_,k)=>(k+0.5)*W/afd.length);
    let g=box(W/2,y[0],'Directeur')+`<line x1="${W/2+bw/2}" y1="${y[0]+15}" x2="${W-bw-4}" y2="${y[0]+15}" class="olijn" stroke-dasharray="5 4"/>`+box(W-bw/2-4,y[0],staf,true);
    g+=`<line x1="${W/2}" y1="${y[0]+30}" x2="${W/2}" y2="${y[1]-12}" class="olijn"/><line x1="${xs[0]}" y1="${y[1]-12}" x2="${xs[xs.length-1]}" y2="${y[1]-12}" class="olijn"/>`;
    afd.forEach((a,k)=>{ g+=`<line x1="${xs[k]}" y1="${y[1]-12}" x2="${xs[k]}" y2="${y[1]}" class="olijn"/>`+box(xs[k],y[1],'Hoofd '+a.toLowerCase());
      g+=`<line x1="${xs[k]}" y1="${y[1]+30}" x2="${xs[k]}" y2="${y[2]}" class="olijn"/>`+box(xs[k],y[2],`${team[k]} medewerkers`);
      if(k===sub) g+=`<line x1="${xs[k]}" y1="${y[2]+30}" x2="${xs[k]}" y2="${y[3]}" class="olijn"/>`+box(xs[k],y[3],'2 stagiairs'); });
    const svg=`<svg viewBox="0 0 ${W} ${sub>=0?290:220}" class="organo" role="img" aria-label="Organogram">${g}</svg>`;
    const k=Math.floor(Math.random()*afd.length); const diepte=sub>=0?4:3;
    return {t:'schema', e:'C.org', pre:svg, q:`Hieronder staat het organogram van een middelgrote onderneming. De medewerkers in een vakje vallen allemaal direct onder hun hoofd${sub>=0?'; de stagiairs vallen onder één medewerker van die afdeling':''}. Beantwoord de vragen.`,
      kop:['Vraag','Antwoord'], rij:[{l:'Spanwijdte van de directeur (aantal direct ondergeschikten in de lijn)',c:[{n:afd.length,tol:0.01}]},{l:`Spanwijdte van het hoofd ${afd[k].toLowerCase()}`,c:[{n:team[k],tol:0.01}]},{l:'Spandiepte (aantal niveaus in de lijn)',c:[{n:diepte,tol:0.01}]},{l:`De ${staf.toLowerCase()} is een`,c:[{s:['lijnfunctie','staffunctie'],a:'staffunctie'}]},{l:'Organisatievorm',c:[{s:['lijnorganisatie','lijn-staforganisatie'],a:'lijn-staforganisatie'}]}],
      tip:'Spanwijdte = aantal mensen dat direct onder één leidinggevende valt. Spandiepte = aantal hiërarchische niveaus.',
      u:`De directeur heeft ${afd.length} afdelingshoofden direct onder zich. Het hoofd ${afd[k].toLowerCase()} heeft ${team[k]} medewerkers. Er zijn ${diepte} niveaus. De ${staf.toLowerCase()} adviseert zonder bevoegdheid in de lijn (stippellijn): een staffunctie, dus een lijn-staforganisatie.`} }
});

// ---------- Werkplaats-scherm ----------
const WERKPLAATS=[
  ['📒','Balans invullen','Posten indelen en het eigen vermogen berekenen','balansInvullen'],
  ['🔁','Balansmutaties','Welke posten veranderen bij een gebeurtenis?','balansMutatie'],
  ['🧾','Kosten of uitgave?','Kosten, uitgaven, allebei of geen van beide','kostenUitgaven'],
  ['💧','Liquiditeitsbegroting','Ontvangsten, uitgaven en eindsaldo per maand','liquiditeitsbegroting'],
  ['📊','Resultatenbegroting','Van omzet tot resultaat voor belasting','resultatenbegroting'],
  ['⏳','Tijdlijn: contante waarde en NCW','Bedragen op een tijdlijn terugrekenen naar nu','tijdlijnCW'],
  ['🏠','Aflossingstabel','Lineair en annuïtair: interest, aflossing en schuldrest','aflossingstabel'],
  ['⚖️','Verschillenanalyse-schema','Prijs-, efficiency- en bezettingsresultaat','verschillenSchema'],
  ['🏢','Organogram','Spanwijdte, spandiepte, lijn en staf','organogram'],
  ['📈','Break-evengrafiek','Klik op het break-evenpunt, winst- of verliesgebied','grafBreakEven']];
function startWerk(g){ if(g==='grafBreakEven') return startGrafiek(); const v=Array.from({length:4},()=>maakGen(g)); const w=WERKPLAATS.find(x=>x[3]===g);
  Q={modus:'formule',titel:w[1],vragen:v,i:0,res:[],terug:"go('werkplaats')"}; go('quiz') }
FOTO.werkplaats=FOTO.dA;
SCHERMEN.werkplaats=function(){
  return `<div class="wrap" style="max-width:760px">${kop('Werkplaats',"go('leren')")}
   <div class="kaart" style="margin-bottom:6px"><p style="margin:0">Oefenen zoals op de uitwerkbijlage van het examen: schema's invullen, tabellen afmaken en rekenen op een tijdlijn. Elke keer nieuwe getallen. Je krijgt 4 opgaven per ronde.</p></div>
   <div class="kaart">${WERKPLAATS.map(([ic,t,s,g])=>`<button class="uitdaging" onclick="startWerk('${g}')"><span class="thumb" style="background:var(--bg);display:grid;place-items:center;font-size:28px">${ic}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}</div></div>${VOET()}`;
};
const _lerenW=SCHERMEN.leren; SCHERMEN.leren=function(){ return _lerenW().replace('<div class="kaart">',`<div class="kaart"><button class="uitdaging" onclick="go('werkplaats')"><span class="thumb" style="background:var(--bg);display:grid;place-items:center;font-size:28px">🛠️</span><span><b>Werkplaats</b><small>Balans, begrotingen, tijdlijn, aflossingstabel, verschillenanalyse en organogram invullen</small></span></button>`) };
