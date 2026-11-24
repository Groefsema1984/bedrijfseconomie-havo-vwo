// ===== Instellingen =====
// URL van het Apps Script (web-app, eindigt op /exec). Leeg = alleen opslag op dit apparaat (testmodus).
const DATA_ENDPOINT_URL = "";
const KLASSEN = ['H4','H5','V4','V5','V6'];  // klassen waaruit leerlingen kiezen (eerste letter H = havo, V = vwo)
const KEY = 'becohv-v1';                  // opslagsleutel op het apparaat
const VERSIE = '0.1';
const VRAGEN_PER_LEVEL = 8;
const MEDAIL = [{n:'brons',e:'🥉',min:6,m:5},{n:'zilver',e:'🥈',min:7,m:10},{n:'goud',e:'🥇',min:8,m:20}];
const TOETS_VRAGEN = 15;
const IDLE_MS = 90*1000;                 // na 90 s zonder tikken telt oefentijd niet meer

// ===== Niveau en levels =====
const niveauVan = klas => /^v/i.test(String(klas||'')) ? 'v' : 'h';
const niv = () => niveauVan(S&&S.klas);
const klasLabel = k => { const m=/^([HV])(\d)$/i.exec(k||''); return m ? m[2]+' '+(m[1].toUpperCase()==='V'?'vwo':'havo') : (k||'') };
const vakLabel = () => 'Bedrijfseconomie '+(S&&S.klas?klasLabel(S.klas):'havo/vwo');
const speelbaar = l => l.vragen.length>0 || (l.gens||[]).length>0;
// alle levels van een wereld voor een niveau (n leeg = alle niveaus). Een level of vraag met niv:'v' is alleen voor vwo.
function lvsVoor(w, n=niv()){ return (LEVELS[w]||[]).filter(l=>!n||!l.niv||l.niv===n).map(l=>{ if(!n||!l.vragen.some(v=>v.niv)) return l; return Object.assign({},l,{vragen:l.vragen.filter(v=>!v.niv||v.niv===n)}) }) }

// ===== Hulpfuncties =====
const $ = (s,el=document)=>el.querySelector(s);
// Opmaak van vraag-, context- en antwoordtekst: regels met ' | ' worden een tabel, '- …' / '• …' een lijst, de rest alinea's.
// De opdrachtzin (Bereken…, Leg uit…) wordt vet.
const OPDRACHT=/^(Bereken|Leg|Verklaar|Toon|Geef|Noem|Beargumenteer|Laat|Bepaal|Licht|Onderbouw|Schrijf|Beschrijf|Welke|Wat|Waarom|Hoe|Is |Zal |Zijn |Heeft |Kies|Vul|Teken|Ga |Maak|Vergelijk)/;
const NOOT=/^(Opmerking|Aanvulling|indien )/;
function fmt(t, opdracht){
  if(t==null||t==='') return ''; const L=String(t).split('\n'); let out='', i=0;
  const rij=l=>/\S \| \S/.test(l), item=l=>/^\s*[-•−–]\s+/.test(l);
  while(i<L.length){ const l=L[i];
    if(rij(l)&&i+1<L.length&&rij(L[i+1])){ const rows=[]; while(i<L.length&&rij(L[i])) rows.push(L[i++].split('|').map(c=>c.trim()));
      out+=`<div class="vtabel"><table>${rows.map((r,k)=>`<tr>${r.map(c=>k===0?`<th>${esc(c)}</th>`:`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`; continue }
    if(item(l)){ const it=[]; while(i<L.length&&item(L[i])){ const bol=/^\s*•/.test(L[i]); let x=L[i++].replace(/^\s*[-•−–]\s+/,'');
        // bij '•'-deelscores horen de regels eronder (berekeningen) nog bij hetzelfde punt
        while(bol&&i<L.length&&L[i].trim()&&!item(L[i])&&!NOOT.test(L[i].trim())&&!/\(\dp?\)\s*$/.test(x)) x+=' '+L[i++].trim();
        it.push(x) }
      out+=`<ul class="vlijst">${it.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`; continue }
    const x=l.trim(); i++; if(!x) continue;
    if(/^Tabel\b|^(Doe het als volgt|Puntenverdeling)/.test(x)) out+=`<p class="vkop">${esc(x)}</p>`;
    else if(NOOT.test(x)) out+=`<p class="vnoot">${esc(x)}</p>`;
    else out+=`<p${opdracht&&OPDRACHT.test(x)?' class="vopdracht"':''}>${esc(x)}</p>`;
  }
  return `<div class="vtekst">${out}</div>`;
}
// Deelscores uit het antwoordmodel: '• … (1p)' of '• … (1)'. Alleen bruikbaar als ze samen precies het maximum geven.
function deelscoresVan(v){ const ds=[];
  const L=String(v.model||'').split('\n');
  for(let i=0;i<L.length;i++){ if(!/^\s*•/.test(L[i])) continue; let x=L[i];
    while(!/\(\dp?\)\s*$/.test(x)&&i+1<L.length&&L[i+1].trim()&&!/^\s*[•−–-]\s/.test(L[i+1])&&!NOOT.test(L[i+1].trim())) x+=' '+L[++i].trim();
    const m=x.match(/^\s*•\s*(.+?)\s*\((\d)p?\)\s*$/); if(m) ds.push({t:m[1],p:+m[2]}) }
  return ds.length>1&&ds.reduce((a,b)=>a+b.p,0)===v.pnt?ds:null }
// getal waarop een rekenstap uitkomt (na het laatste '='), om in het antwoord van de leerling te zoeken
const normGetal = x => String(x).replace(/−/g,'-').replace(/(\d)\.(?=\d{3}\b)/g,'$1');
function uitkomstVan(t){ const m=[...normGetal(t).matchAll(/=\s*(?:€|\$)?\s*(-?\d+(?:,\d+)?)/g)]; return m.length?m[m.length-1][1]:null }
function bevatGetal(tekst,g){ if(!g||!tekst) return false; const re=new RegExp('(^|[^\\d,])'+g.replace('-','-?').replace(',','[,.]')+'(?![\\d])'); return re.test(normGetal(tekst)) }

const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = (a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const duiz = s => s.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const eur = x => '€ '+(x<0?'−':'')+(()=>{const [h,d]=Math.abs(x).toFixed(2).split('.'); return duiz(h)+','+d})();
const gt = x => (x<0?'−':'')+duiz(String(Math.round(Math.abs(x))));
const nl1 = x => { const [h,d]=Math.abs(x).toFixed(1).split('.'); return (x<=-0.05?'−':'')+duiz(h)+','+d };
const vandaag = ()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function weekId(d=new Date()){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const dn=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-dn);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return t.getUTCFullYear()+'-W'+String(Math.ceil(((t-y)/864e5+1)/7)).padStart(2,'0')}
const minuten = s => Math.round((s||0)/60);
function parseGetal(s){ if(s==null) return NaN; s=String(s).trim().replace(/[−–]/g,'-').replace(/[€%\s]/g,''); if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s=s.replace(/\./g,''); s=s.replace(',','.'); return s===''?NaN:Number(s) }

// ===== Toestand van de leerling =====
// Alles wat alleen kan groeien (tijd, aantallen, medailles) wordt bij samenvoegen met max/union gecombineerd,
// zodat een oud apparaat nooit nieuwe voortgang kan overschrijven.
function nieuweStaat(){
  return {v:1, id:'', code:'', naam:'', klas:'', upd:0, aangemaakt:Date.now(),
    xp:0, mVerd:0, mUit:0, tijd:0, dag:{}, week:{},
    lv:{}, toets:{}, vr:{}, et:{}, kaarten:[], badges:[], gekocht:['standaard'], thema:'standaard', herhaal:[], hgoed:{}}
}
let S = null;

const UNION = new Set(['kaarten','badges','gekocht']);
function merge(a,b){
  // b is de nieuwste (hoogste upd) bij gelijke velden die niet kunnen groeien
  if(a===undefined||a===null) return b; if(b===undefined||b===null) return a;
  if(typeof a==='number'&&typeof b==='number') return Math.max(a,b);
  if(Array.isArray(a)&&Array.isArray(b)) return b;
  if(typeof a==='object'&&typeof b==='object'){
    const o={}; for(const k of new Set([...Object.keys(a),...Object.keys(b)])){
      if(UNION.has(k)&&Array.isArray(a[k])&&Array.isArray(b[k])) o[k]=[...new Set([...a[k],...b[k]])];
      else if(k==='et') o[k]=mergeEt(a[k],b[k]);
      else o[k]=merge(a[k],b[k]);
    } return o;
  }
  return b;
}
function mergeEt(a,b){ // per eindterm een lijstje recente resultaten; neem de langste/nieuwste
  a=a||{}; b=b||{}; const o={};
  for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const x=a[k]||{n:0,r:[]},y=b[k]||{n:0,r:[]};o[k]=(y.n>=x.n)?y:x}
  return o;
}
function mergeStaat(oud,nieuw){ // oud en nieuw in willekeurige volgorde
  const [x,y] = (oud.upd||0)<=(nieuw.upd||0)?[oud,nieuw]:[nieuw,oud];
  const m = merge(x,y); m.upd=Math.max(x.upd||0,y.upd||0); return m;
}

function laad(){
  try{ const r=localStorage.getItem(KEY); if(r) S=Object.assign(nieuweStaat(),JSON.parse(r)); }catch(e){ S=null }
  if(!S){ try{ const r=localStorage.getItem(KEY+'-reserve'); if(r) S=Object.assign(nieuweStaat(),JSON.parse(r)); }catch(e){} }
}
let vuil=false;
function bewaar(sync=true){
  S.upd=Date.now();
  try{ const oud=localStorage.getItem(KEY); if(oud) localStorage.setItem(KEY+'-reserve',oud); localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
  if(sync){ vuil=true; planSync(); }
}
const munten = ()=>Math.max(0,(S.mVerd||0)-(S.mUit||0));

// ===== Server (Apps Script) =====
const serverModus = ()=>!!DATA_ENDPOINT_URL;
let syncStatus = 'lokaal', syncTimer=null, bezig=false;
async function api(actie, data){
  const r = await fetch(DATA_ENDPOINT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({actie},data))});
  const j = await r.json(); if(!j.ok) throw new Error(j.fout||'Serverfout'); return j;
}
function planSync(ms=4000){ if(!serverModus()||!S||!S.id) return; clearTimeout(syncTimer); syncTimer=setTimeout(sync,ms) }
async function sync(){
  if(!serverModus()||!S||!S.id||bezig) return; bezig=true;
  try{
    const j = await api('sync',{id:S.id, code:S.code, staat:S});
    const terug = j.staat; S = mergeStaat(S, terug); S.id=terug.id||S.id; S.code=S.code||terug.code;
    try{ localStorage.setItem(KEY,JSON.stringify(S)) }catch(e){}
    vuil=false; syncStatus='ok'; syncTijd=Date.now();
  }catch(e){ syncStatus='fout'; syncFout=e.message; planSync(60000) }
  bezig=false; toonSyncStatus && toonSyncStatus();
}
let syncTijd=0, syncFout='';
let toonSyncStatus=null;
window.addEventListener('online',()=>planSync(500));
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&vuil) sync(); });

// ===== Oefentijd =====
let laatsteTik=Date.now(), oefenActief=false;
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>laatsteTik=Date.now(),{passive:true}));
setInterval(()=>{
  if(!S||!oefenActief||document.visibilityState!=='visible'||Date.now()-laatsteTik>IDLE_MS) return;
  S.tijd=(S.tijd||0)+5; const d=vandaag(), w=weekId();
  S.dag[d]=(S.dag[d]||0)+5; S.week[w]=(S.week[w]||0)+5;
  if(S.tijd%60===0) bewaar(); else { try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){} }
},5000);

// ===== Rekengeneratoren (elke keer nieuwe getallen) =====
// Vorm: {t:'reken', e:onderwerp, q:vraag, a:antwoord, eh:'€'|'%'|'', u:uitleg}. Geld op 2 decimalen, de rest op 1 decimaal.
const r1 = x => Math.round(x*10)/10, r2 = x => Math.round(x*100)/100;
const pc = x => String(x).replace('.',',');           // 4.5 -> '4,5'
const GENS = {
  // --- H1 Basisrekenvaardigheden (A) ---
  procentVan(){ const b=pick([240,360,480,750,1200,2500,4800]), p=pick([4,5,8,12.5,15,21,30]); const a=r2(b*p/100); return {t:'reken', e:'A.reken', q:`Een winkel verkoopt een jas voor ${eur(b)}. Hoeveel euro is ${pc(p)}% van dit bedrag?`, a, eh:'€', u:`${pc(p)}% van ${eur(b)} = ${pc(p)} / 100 × ${gt(b)} = ${eur(a)}.`} },
  procVerandering(){ const oud=pick([8,12,15,20,24,40,50,80]), f=pick([1.05,1.08,1.1,1.15,1.2,0.9,0.85,0.95]); const nieuw=r2(oud*f), p=r1((nieuw-oud)/oud*100); const wat=pick(['Een kilo kaas','Een fietsband','Een schoolagenda','Een kapperbeurt']); return {t:'reken', e:'A.reken', q:`${wat} kostte ${eur(oud)} en kost nu ${eur(nieuw)}. Met hoeveel procent is de prijs veranderd? (een daling is negatief)`, a:p, eh:'%', u:`((nieuw − oud) / oud) × 100% = ((${nl1(nieuw)} − ${nl1(oud)}) / ${nl1(oud)}) × 100% = ${nl1(p)}%.`} },
  procentpunt(){ const x=pick([20,25,30,40]), y=x+pick([-5,-4,-2,2,3,5]); const p=r1((y-x)/x*100); return {t:'reken', e:'A.reken', q:`De brutowinstmarge van een winkel gaat van ${x}% naar ${y}% van de omzet. Met hoeveel procent is de marge veranderd? (dus niet in procentpunten, een daling is negatief)`, a:p, eh:'%', u:`Het verschil is ${y-x} procentpunt. In procenten: (${y} − ${x}) / ${x} × 100% = ${nl1(p)}%.`} },
  brutoresultaat(){ const q=pick([800,1200,1500,2400,3000]), p=pick([12,15,18,24,30]), iw=pick([5,6,8,9,10]); const a=q*(p-iw); return {t:'reken', e:'A.reken', q:`Een webwinkel verkoopt ${gt(q)} hoodies voor ${eur(p)} per stuk. De inkoopwaarde is ${eur(iw)} per hoodie. Bereken het brutoresultaat.`, a, eh:'€', u:`Omzet = afzet × prijs = ${gt(q)} × ${p} = ${eur(q*p)}. Inkoopwaarde van de omzet = ${gt(q)} × ${iw} = ${eur(q*iw)}. Brutoresultaat = omzet − IWvO = ${eur(a)}.`} },
  vergelijking(){ const x=pick([4,5,6,8,12,15,20]), a=pick([2,3,4,5,6]), b=pick([10,15,20,35,40]); const c=a*x+b; return {t:'reken', e:'A.reken', q:`Een sportschool rekent ${eur(b)} inschrijfgeld en ${eur(a)} per bezoek. Je hebt in totaal ${eur(c)} betaald. Hoeveel keer heb je gesport? (los op: ${a}x + ${b} = ${c})`, a:x, eh:'', u:`${a}x + ${b} = ${c} → ${a}x = ${c-b} → x = ${x}.`} },
  gewogenGemiddelde(){ const c=[pick([4,5,6]),pick([6,7,8]),pick([5,6,7,8])], w=[1,1,2]; const a=r1((c[0]+c[1]+2*c[2])/4); return {t:'reken', e:'A.reken', q:`Je haalt voor bedrijfseconomie een ${c[0]} en een ${c[1]} (weging 1) en een ${c[2]} voor een toets met weging 2. Bereken je gewogen gemiddelde (1 decimaal).`, a, eh:'', u:`(${c[0]} × 1 + ${c[1]} × 1 + ${c[2]} × 2) / (1 + 1 + 2) = ${c[0]+c[1]+2*c[2]} / 4 = ${nl1(a)}.`} },
  index(){ const b=pick([20,25,40,50,80,200]), f=pick([1.04,1.1,1.12,1.25,0.9,1.3]); const v=r2(b*f), ix=r1(v/b*100); return {t:'reken', e:'A.index', q:`De omzet van een bakkerij was in het basisjaar ${eur(b*1000)} en is nu ${eur(v*1000)}. Wat is het indexcijfer van de omzet nu? (zonder %)`, a:ix, eh:'', u:`Indexcijfer = (nu / basisjaar) × 100 = (${gt(v*1000)} / ${gt(b*1000)}) × 100 = ${nl1(ix)}.`} },
  indexVerschil(){ const i1=pick([104,108,110,112,115,120]), i2=i1+pick([3,5,6,8,10,12]); const p=r1((i2-i1)/i1*100); return {t:'reken', e:'A.index', q:`Het indexcijfer van de afzet (2020 = 100) is in 2023 ${i1} en in 2025 ${i2}. Met hoeveel procent is de afzet gestegen tussen 2023 en 2025?`, a:p, eh:'%', u:`Niet ${i2-i1}%! Reken: (${i2} − ${i1}) / ${i1} × 100% = ${nl1(p)}%.`} },
  // --- H2 Balans, W&V en liquiditeit (F) ---
  eigenVermogen(){ const va=pick([80,120,150,240])*1000, vl=pick([20,35,40,60])*1000, vvl=pick([50,60,90])*1000, vvk=pick([10,15,25])*1000; const a=va+vl-vvl-vvk; return {t:'reken', e:'A.balans', q:`Een bv heeft ${eur(va)} vaste activa en ${eur(vl)} vlottende activa. Het vreemd vermogen lang is ${eur(vvl)} en het vreemd vermogen kort ${eur(vvk)}. Bereken het eigen vermogen.`, a, eh:'€', u:`Totaal activa = ${gt(va)} + ${gt(vl)} = ${eur(va+vl)}. Eigen vermogen = activa − vreemd vermogen = ${gt(va+vl)} − ${gt(vvl+vvk)} = ${eur(a)}.`} },
  nettoresultaat(){ const om=pick([180,240,300,420])*1000, iw=Math.round(om*pick([0.4,0.5,0.55,0.6])), ov=pick([40,55,60,75])*1000, af=pick([8,10,12,15])*1000, int=pick([2,3,4.5,6])*1000; const a=om-iw-ov-af-int; return {t:'reken', e:'A.balans', q:`Gegevens van de W&V-rekening: omzet ${eur(om)}, inkoopwaarde van de omzet ${eur(iw)}, overige bedrijfskosten ${eur(ov)}, afschrijvingskosten ${eur(af)} en interestkosten ${eur(int)}. Bereken het resultaat (verlies is negatief).`, a, eh:'€', u:`Brutoresultaat = ${gt(om)} − ${gt(iw)} = ${eur(om-iw)}. Resultaat = ${gt(om-iw)} − ${gt(ov)} − ${gt(af)} − ${gt(int)} = ${eur(a)}.`} },
  liquiditeit(){ const b=pick([4,6,8,12])*1000, o=pick([30,42,55,60])*1000, u=pick([28,40,50,66])*1000; const a=b+o-u; return {t:'reken', e:'A.liquid', q:`Bij een eenmanszaak staat op 1 januari ${eur(b)} op de bank. In het eerste kwartaal zijn de ontvangsten ${eur(o)} en de uitgaven ${eur(u)}. Bereken het saldo liquide middelen op 31 maart (negatief = rood staan).`, a, eh:'€', u:`Eindsaldo = beginsaldo + ontvangsten − uitgaven = ${gt(b)} + ${gt(o)} − ${gt(u)} = ${eur(a)}.`} },
  // --- H3 Verzekeren, studeren en lenen (B) ---
  verzekeringPremie(){ const p=pick([240,360,480,520,600]), k=pick([5,7.5,10]); const a=r2((p+k)*1.21); return {t:'reken', e:'B.verzeker', q:`De premie van een inboedelverzekering is ${eur(p)} per jaar. De poliskosten zijn ${eur(k)} en de assurantiebelasting is 21%. Bereken het totale bedrag dat je per jaar betaalt.`, a, eh:'€', u:`Assurantiebelasting = 21% × (premie + poliskosten) = 0,21 × ${nl1(p+k)} = ${eur(r2((p+k)*0.21))}. Totaal = ${nl1(p+k)} × 1,21 = ${eur(a)}.`} },
  onderverzekering(){ const w=pick([60,80,100,120])*1000, v=w*pick([0.6,0.75,0.8,0.9]), s=pick([10,15,20,24])*1000; const a=r2(v/w*s); return {t:'reken', e:'B.verzeker', q:`Een inboedel is ${eur(w)} waard, maar is verzekerd voor ${eur(v)}. Er is brandschade van ${eur(s)}. De verzekeraar past de evenredigheidsregel toe. Bereken de uitkering.`, a, eh:'€', u:`Onderverzekering: uitkering = verzekerde waarde / werkelijke waarde × schade = ${gt(v)} / ${gt(w)} × ${gt(s)} = ${eur(a)}.`} },
  bonusMalus(){ const p=pick([600,720,840,960]), k=pick([30,40,50,60,70]); const a=r2(p*(100-k)/100); return {t:'reken', e:'B.verzeker', q:`De basispremie van een autoverzekering is ${eur(p)} per jaar. Op jouw trede van de bonus-malusladder krijg je ${k}% korting. Hoeveel premie betaal je (zonder poliskosten en belasting)?`, a, eh:'€', u:`${100-k}% van ${eur(p)} = ${eur(a)}.`} },
  kredietkosten(){ const L=pick([2000,3000,4500,6000]), n=pick([24,36,48]), t=pick([95,100,110,150,180]); const a=t*n-L; return {t:'reken', e:'B.lenen', q:`Je leent ${eur(L)} met een persoonlijke lening. Je betaalt ${n} maanden lang ${eur(t)} per maand. Bereken de totale kredietkosten.`, a, eh:'€', u:`Totaal betaald = ${n} × ${t} = ${eur(t*n)}. Kredietkosten = ${gt(t*n)} − ${gt(L)} = ${eur(a)}.`} },
  // --- H4 Sparen en beleggen (B) ---
  aankoopAandelen(){ const n=pick([50,80,100,150,200]), k=pick([12.5,18,24,36.4,42]), pr=pick([0.25,0.5,0.75]); const bedr=r2(n*k), a=r2(bedr*(1+pr/100)); return {t:'reken', e:'B.sparen', q:`Je koopt ${n} aandelen tegen een koers van ${eur(k)}. De bank rekent ${pc(pr)}% provisie over het transactiebedrag. Hoeveel betaal je in totaal?`, a, eh:'€', u:`Transactiebedrag = ${n} × ${nl1(k)} = ${eur(bedr)}. Provisie = ${pc(pr)}% = ${eur(r2(bedr*pr/100))}. Totaal = ${eur(a)}.`} },
  rendementAandeel(){ const k0=pick([20,25,40,50,80]), k1=r2(k0*pick([1.04,1.08,1.1,0.95,1.12])), d=pick([0.6,0.8,1,1.5,2]); const a=r1((k1-k0+d)/k0*100); return {t:'reken', e:'B.sparen', q:`Je koopt een aandeel voor ${eur(k0)}. Na een jaar krijg je ${eur(d)} dividend en is de koers ${eur(k1)}. Bereken het totale rendement in procenten (1 decimaal).`, a, eh:'%', u:`Rendement = (koersresultaat + dividend) / aankoopkoers × 100% = (${nl1(k1-k0)} + ${nl1(d)}) / ${k0} × 100% = ${nl1(a)}%.`} },
  couponrendement(){ const nom=1000, c=pick([2,2.5,3,4,5]), k=pick([96,98,102,104,105]); const a=r1(c/k*100); return {t:'reken', e:'B.sparen', q:`Een obligatie van € 1.000 nominaal heeft een coupon van ${pc(c)}%. De beurskoers is ${k}%. Bereken het effectieve (lopende) rendement voor iemand die nu koopt (1 decimaal).`, a, eh:'%', u:`Couponrente = ${pc(c)}% × 1.000 = ${eur(c*10)}. Prijs = ${k}% × 1.000 = ${eur(k*10)}. Rendement = ${nl1(c*10)} / ${gt(k*10)} × 100% = ${nl1(a)}%.`} },
  // --- H5 Interest (B) ---
  enkelvoudigeInterest(){ const K=pick([1000,2500,4000,5000,8000]), i=pick([1.5,2,2.5,3,4]), m=pick([3,6,9,18,24]); const a=r2(K*i/100*m/12); return {t:'reken', e:'B.interest', q:`Je zet ${eur(K)} vast tegen ${pc(i)}% enkelvoudige interest per jaar. Hoeveel interest ontvang je na ${m} maanden?`, a, eh:'€', u:`Interest = K × i × tijd = ${gt(K)} × ${pc(i/100)} × ${m}/12 = ${eur(a)}.`} },
  eindwaarde(){ const K=pick([1000,2000,2500,5000]), r=pick([2,3,4,5]), n=pick([2,3,5,10]); const a=r2(K*Math.pow(1+r/100,n)); return {t:'reken', e:'B.interest', q:`Je zet ${eur(K)} op een spaarrekening met ${r}% samengestelde interest per jaar. Hoeveel staat er na ${n} jaar op de rekening?`, a, eh:'€', u:`Eₙ = K × (1 + i)ⁿ = ${gt(K)} × ${pc(1+r/100)}^${n} = ${eur(a)}.`} },
  contanteWaarde(){ const E=pick([1000,5000,10000,20000]), r=pick([2,3,4,5]), n=pick([2,3,5,10]); const a=r2(E/Math.pow(1+r/100,n)); return {t:'reken', e:'B.interest', q:`Over ${n} jaar ontvang je ${eur(E)}. De interest is ${r}% per jaar (samengesteld). Bereken de contante waarde van dat bedrag nu.`, a, eh:'€', u:`Cₙ = E × (1 + i)⁻ⁿ = ${gt(E)} × ${pc(1+r/100)}^−${n} = ${eur(a)}.`} },
  effectieveInterest(){ const m=pick([[12,'maand'],[4,'kwartaal'],[2,'halfjaar']]), i=pick([0.5,0.75,1,1.25,1.5,2]); const a=r2((Math.pow(1+i/100,m[0])-1)*100); return {t:'reken', e:'B.interest', q:`Een creditcardmaatschappij rekent ${pc(i)}% interest per ${m[1]}. Bereken de effectieve interest per jaar in procenten (2 decimalen).`, a, eh:'%', u:`(1 + ${pc(i/100)})^${m[0]} − 1 = ${pc(r2(Math.pow(1+i/100,m[0])*10000)/10000)} − 1, dus ${pc(a)}% per jaar. Nominaal zou het ${pc(r2(i*m[0]))}% zijn.`} },
  eindwaardeRente(){ const R=pick([500,1000,1200,2000]), i=pick([2,3,4,5]), n=pick([3,4,5]), pre=Math.random()<.5; let a=0; for(let t=1;t<=n;t++) a+=R*Math.pow(1+i/100,pre?t:t-1); a=r2(a); return {t:'reken', e:'B.interest', q:`Je stort ${n} jaar lang aan het ${pre?'begin':'eind'} van elk jaar ${eur(R)} op een spaarrekening met ${i}% samengestelde interest. Hoeveel staat er aan het eind van jaar ${n} op de rekening?`, a, eh:'€', u:`Tel de eindwaarden op: ${Array.from({length:n},(_,k)=>`${gt(R)} × ${pc(1+i/100)}^${pre?n-k:n-k-1}`).join(' + ')} = ${eur(a)}.`} },
  contanteWaardeRente(){ const R=pick([1000,2000,2500,5000]), i=pick([3,4,5,6]), n=pick([3,4,5]); let a=0; for(let t=1;t<=n;t++) a+=R/Math.pow(1+i/100,t); a=r2(a); return {t:'reken', e:'B.interest', q:`Je ontvangt ${n} jaar lang aan het eind van elk jaar ${eur(R)}. De interest is ${i}% per jaar. Bereken de contante waarde van deze reeks bedragen nu.`, a, eh:'€', u:`Tel de contante waarden op: ${Array.from({length:n},(_,k)=>`${gt(R)} × ${pc(1+i/100)}^−${k+1}`).join(' + ')} = ${eur(a)}.`} },
  // --- H6 Wonen (B) ---
  lineaireHypotheek(){ const H=pick([180,240,270,300,360])*1000, i=pick([3,3.5,4,4.5,5]), n=30; const afl=H/n; const a=r2(afl+H*i/100); return {t:'reken', e:'B.wonen', q:`Je sluit een lineaire hypotheek van ${eur(H)} af met een looptijd van ${n} jaar en ${pc(i)}% interest per jaar. Bereken de bruto jaarlast in het eerste jaar (aflossing + interest).`, a, eh:'€', u:`Aflossing = ${gt(H)} / ${n} = ${eur(afl)}. Interest jaar 1 = ${pc(i)}% × ${gt(H)} = ${eur(H*i/100)}. Bruto jaarlast = ${eur(a)}.`} },
  lineaireInterestLater(){ const H=pick([180,240,300,360])*1000, i=pick([3,4,5]), n=30, j=pick([2,3,5,6,11]); const schuld=H-(j-1)*H/n; const a=r2(schuld*i/100); return {t:'reken', e:'B.wonen', q:`Lineaire hypotheek: ${eur(H)}, looptijd ${n} jaar, ${i}% interest. Je lost aan het eind van elk jaar af. Bereken de interest in jaar ${j}.`, a, eh:'€', u:`Na ${j-1} aflossingen van ${eur(H/n)} is de schuld ${eur(schuld)}. Interest jaar ${j} = ${i}% × ${gt(schuld)} = ${eur(a)}.`} },
  annuiteit(){ const H=pick([200,250,300,350])*1000, i=pick([3,4,5]), n=30; const a=r2(H*(i/100)/(1-Math.pow(1+i/100,-n))); return {t:'reken', e:'B.wonen', q:`Bereken de annuïteit (vast jaarbedrag) van een annuïteitenhypotheek van ${eur(H)} met ${i}% interest en een looptijd van ${n} jaar.`, a, eh:'€', u:`A = H × i / (1 − (1 + i)⁻ⁿ) = ${gt(H)} × ${pc(i/100)} / (1 − ${pc(1+i/100)}^−${n}) = ${eur(a)}. In jaar 1 is ${eur(H*i/100)} daarvan interest.`} },
  eigenwoningforfait(){ const w=pick([300,350,400,450])*1000, p=0.35; const a=r2(w*p/100); return {t:'reken', e:'B.wonen', q:`De WOZ-waarde van een woning is ${eur(w)}. Het eigenwoningforfait is ${pc(p)}% van de WOZ-waarde. Bereken het eigenwoningforfait dat bij het inkomen wordt opgeteld.`, a, eh:'€', u:`${pc(p)}% × ${gt(w)} = ${eur(a)}.`} },
  // --- K2 Personeel (C) ---
  loonkosten(){ const b=pick([2600,2800,3000,3200,3600]), v=8, wg=pick([20,22,25,28]); const jaar=b*12*(1+v/100); const a=r2(jaar*(1+wg/100)); return {t:'reken', e:'C.personeel', q:`Een werknemer verdient ${eur(b)} bruto per maand. Het vakantiegeld is ${v}% van het jaarloon. De werkgeverslasten zijn ${wg}% van het brutoloon inclusief vakantiegeld. Bereken de loonkosten per jaar voor de werkgever.`, a, eh:'€', u:`Brutoloon per jaar = 12 × ${gt(b)} × 1,08 = ${eur(jaar)}. Loonkosten = ${gt(jaar)} × ${pc(1+wg/100)} = ${eur(a)}.`} },
  transitievergoeding(){ const s=pick([2400,2700,3000,3300,3900]), j=pick([3,4,6,8,10]), m=pick([0,3,6]); const a=r2(s/3*(j+m/12)); return {t:'reken', e:'C.personeel', q:`Een werknemer met een maandsalaris van ${eur(s)} (inclusief vakantiegeld) wordt na ${j} jaar${m?' en '+m+' maanden':''} ontslagen. De transitievergoeding is 1/3 maandsalaris per dienstjaar (naar rato voor delen van een jaar). Bereken de transitievergoeding.`, a, eh:'€', u:`1/3 × ${gt(s)} × ${nl1(j+m/12).replace(',0','')} jaar = ${eur(a)}.`} },
  // --- K3 Kosten en kostprijs (F) ---
  afschrijving(){ const A=pick([24,36,48,60,90])*1000, R=pick([0,3,4,6,10])*1000, n=pick([4,5,6,8]); const a=r2((A-R)/n); return {t:'reken', e:'F.perio', q:`Een machine kost ${eur(A)}. De verwachte restwaarde is ${eur(R)} en de levensduur ${n} jaar. Bereken de jaarlijkse afschrijving bij lineair afschrijven.`, a, eh:'€', u:`(aanschafwaarde − restwaarde) / levensduur = (${gt(A)} − ${gt(R)}) / ${n} = ${eur(a)}.`} },
  boekwaarde(){ const A=pick([30,40,60,80])*1000, R=pick([0,5,10])*1000, n=pick([5,8,10]), j=pick([2,3,4]); const af=(A-R)/n; const a=r2(A-j*af); return {t:'reken', e:'F.perio', q:`Een bestelbus is gekocht voor ${eur(A)}, restwaarde ${eur(R)}, levensduur ${n} jaar, lineaire afschrijving. Bereken de boekwaarde na ${j} jaar.`, a, eh:'€', u:`Afschrijving per jaar = ${eur(af)}. Boekwaarde = ${gt(A)} − ${j} × ${nl1(af)} = ${eur(a)}.`} },
  integraleKostprijs(){ const C=pick([120,180,240,300])*1000, N=pick([10,12,15,20])*1000, v=pick([6,8,9.5,12]); const a=r2(C/N+v); return {t:'reken', e:'F.kosten', q:`De constante kosten zijn ${eur(C)} per jaar bij een normale productie van ${gt(N)} stuks. De variabele kosten zijn ${eur(v)} per stuk. Bereken de integrale kostprijs.`, a, eh:'€', u:`Kostprijs = C/N + V/W = ${gt(C)} / ${gt(N)} + ${nl1(v)} = ${eur(a)}.`} },
  bezettingsresultaat(){ const C=pick([120,180,240])*1000, N=pick([10,12,15,20])*1000, W=N+pick([-2000,-1500,-1000,1000,1500,2000]); const a=r2((W-N)*C/N); return {t:'reken', e:'F.kosten', q:`Constante kosten ${eur(C)}, normale productie ${gt(N)} stuks, werkelijke productie ${gt(W)} stuks. Bereken het bezettingsresultaat (nadelig = negatief).`, a, eh:'€', u:`Bezettingsresultaat = (W − N) × C/N = (${gt(W)} − ${gt(N)}) × ${nl1(C/N)} = ${eur(a)}. ${a<0?'Onderbezetting: nadelig.':'Overbezetting: voordelig.'}`} },
  // --- K4 Break-even en verschillenanalyse (F) ---
  dekkingsbijdrage(){ const p=pick([24,35,48,65,95]), ink=pick([30,36,40,50]), ov=pick([1.5,2.5,3,4.2]); const a=r2(p-p*ink/100-ov); return {t:'reken', e:'F.breakeven', q:`Verkoopprijs ${eur(p)}. De inkoop is ${ink}% van de verkoopprijs en de overige variabele kosten zijn ${eur(ov)} per stuk. Bereken de dekkingsbijdrage per stuk.`, a, eh:'€', u:`${nl1(p)} − ${pc(ink/100)} × ${p} − ${nl1(ov)} = ${eur(a)}.`} },
  breakEven(){ const p=pick([12,15,20,25,30]), gvk=pick([4,5,6,8,10]); const n=pick([500,800,1000,1200,2000]); const tck=n*(p-gvk); return {t:'reken', e:'F.breakeven', q:`Een bedrijf heeft ${eur(tck)} constante kosten per jaar. De verkoopprijs is ${eur(p)} per stuk en de variabele kosten zijn ${eur(gvk)} per stuk. Bereken de break-evenafzet.`, a:n, eh:'', u:`Dekkingsbijdrage = ${p} − ${gvk} = ${eur(p-gvk)}. Break-evenafzet = ${gt(tck)} / ${p-gvk} = ${gt(n)} stuks.`} },
  breakEvenOmzet(){ const C=pick([60,90,120,150])*1000, v=pick([40,50,60,70]); const a=r2(C/(1-v/100)); return {t:'reken', e:'F.breakeven', q:`De variabele kosten zijn ${v}% van de omzet. De constante kosten zijn ${eur(C)}. Bereken de break-evenomzet.`, a, eh:'€', u:`Dekkingsbijdrage = ${100-v}% van de omzet. Break-evenomzet = ${gt(C)} / ${pc((100-v)/100)} = ${eur(a)}.`} },
  prijsresultaat(){ const sp=pick([20,25,30,40]), wp=sp+pick([-1.5,-1,-0.5,0.5,1,2]), wh=pick([1000,1200,1500,2000]); const a=r2((sp-wp)*wh); return {t:'reken', e:'F.versch', q:`Voor een grondstof is de standaardprijs ${eur(sp)} per kg. De werkelijke prijs was ${eur(wp)}. Er is ${gt(wh)} kg werkelijk verbruikt. Bereken het prijsresultaat (nadelig = negatief).`, a, eh:'€', u:`Prijsresultaat = (SP − WP) × WH = (${nl1(sp)} − ${nl1(wp)}) × ${gt(wh)} = ${eur(a)}.`} },
  efficiencyresultaat(){ const sp=pick([20,25,30,40]), sh=pick([1000,1200,1500,2000]), wh=sh+pick([-100,-50,50,80,120]); const a=r2((sh-wh)*sp); return {t:'reken', e:'F.versch', q:`Voor de werkelijke productie is ${gt(sh)} kg grondstof standaard toegestaan. Werkelijk is ${gt(wh)} kg verbruikt. De standaardprijs is ${eur(sp)} per kg. Bereken het efficiencyresultaat (nadelig = negatief).`, a, eh:'€', u:`Efficiencyresultaat = (SH − WH) × SP = (${gt(sh)} − ${gt(wh)}) × ${sp} = ${eur(a)}.`} },
  // --- K5 Investeren (D) ---
  cashflow(){ const w=pick([20,35,40,60])*1000, af=pick([8,10,12,15])*1000; const a=w+af; return {t:'reken', e:'D.invest', q:`Een investering levert per jaar een nettowinst van ${eur(w)} op. De afschrijvingskosten zijn ${eur(af)} per jaar. Bereken de cashflow per jaar (indirecte methode).`, a, eh:'€', u:`Cashflow = nettowinst + afschrijving = ${gt(w)} + ${gt(af)} = ${eur(a)}. Afschrijving is een kostenpost maar geen uitgave.`} },
  terugverdientijd(){ const cf=pick([20,25,30,40])*1000, I=cf*pick([2.5,3.2,3.5,4.25,2.75]); const a=r1(I/cf); return {t:'reken', e:'D.invest', q:`Een investering van ${eur(I)} levert ieder jaar een gelijke cashflow op van ${eur(cf)}. Bereken de terugverdientijd in jaren (1 decimaal).`, a, eh:'', u:`${gt(I)} / ${gt(cf)} = ${nl1(I/cf)} jaar. In jaren en maanden: ${Math.floor(I/cf)} jaar en ${Math.round((I/cf-Math.floor(I/cf))*12)} maanden.`} },
  ncw(){ const I=pick([50,80,100])*1000, cf=pick([20,25,30,35])*1000, n=pick([3,4,5]), i=pick([5,6,8]); let cw=0; for(let t=1;t<=n;t++) cw+=cf/Math.pow(1+i/100,t); const a=r2(cw-I); return {t:'reken', e:'D.invest', q:`Een investering van ${eur(I)} levert ${n} jaar lang aan het eind van elk jaar een cashflow op van ${eur(cf)}. De vermogenskostenvoet is ${i}%. Er is geen restwaarde. Bereken de netto contante waarde (negatief kan).`, a, eh:'€', u:`Contante waarde cashflows = ${Array.from({length:n},(_, t)=>`${gt(cf)} × ${pc(1+i/100)}^−${t+1}`).join(' + ')} = ${eur(cw)}. NCW = ${nl1(cw)} − ${gt(I)} = ${eur(a)}. ${a>0?'Positief: investeren.':'Negatief: niet investeren.'}`} },
  // --- K6 Periodisering (F) ---
  vooruitbetaald(){ const h=pick([12,18,24,36])*1000, m=pick([3,4,7,9,10]); const mn=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']; const resterend=m-1; const a=r2(h*resterend/12); return {t:'reken', e:'F.perio', q:`Een bedrijf betaalt op 1 ${mn[m-1]} 2025 de huur van ${eur(h)} voor een heel jaar vooruit (tot 1 ${mn[m-1]} 2026). Bereken het bedrag aan vooruitbetaalde huur op de balans van 31 december 2025.`, a, eh:'€', u:`Van 1 januari tot 1 ${mn[m-1]} 2026 zijn ${resterend} maanden nog niet verbruikt: ${resterend}/12 × ${gt(h)} = ${eur(a)} (activa).`} },
  nogTeBetalenInterest(){ const L=pick([50,80,100,120,150])*1000, i=pick([4,5,6]), m=pick([3,4,6,8,9]); const mn=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']; const a=r2(L*i/100*m/12); return {t:'reken', e:'F.perio', q:`Een bedrijf heeft een lening van ${eur(L)} met ${i}% interest per jaar. De interest wordt elk jaar achteraf betaald op 1 ${mn[12-m]}. Bereken de nog te betalen interest op de balans van 31 december.`, a, eh:'€', u:`Sinds 1 ${mn[12-m]} zijn ${m} maanden verstreken: ${i}% × ${gt(L)} × ${m}/12 = ${eur(a)} (kortlopende schuld op de balans).`} }
};
Object.assign(GENS, GENS_EXTRA);
function maakGen(naam){ const v=GENS[naam](); v.id='gen.'+naam; v.gen=true; return v }

// ===== Vragenbank =====
function alleVragen(){ const out=[]; for(const w in LEVELS){ for(const l of LEVELS[w]) for(const v of l.vragen) out.push(Object.assign({w,l:l.id,lniv:l.niv},v)); } if(typeof EXAMEN!=='undefined') for(const v of EXAMEN.vragen) out.push(Object.assign({w:'ex'},v)); return out }
const vrNiv = v => (!v.niv||v.niv===niv()) && (!v.lniv||v.lniv===niv());
let _vmap=null; function vraagById(id){ if(!_vmap){_vmap={}; for(const v of alleVragen()) _vmap[v.id]=v} return _vmap[id] }

function nakijken(v, antw){
  if(v.t==='mc'||v.t==='ex') return antw===v.a;
  if(v.t==='wo') return antw===v.a;
  if(v.t==='open') return antw===true||(!!antw&&antw.max>0&&antw.p>=antw.max);
  if(v.t==='koppel') return v.p.every((p,i)=>antw[i]===p[1]);
  if(v.t==='reken'){ const x=parseGetal(antw); if(isNaN(x)) return false; const tol = v.eh==='€'?0.011:0.051; return Math.abs(x-v.a)<=tol }
  return false;
}
// kaarten die een vraag oplevert: het begrip b, en bij koppelvragen elk begrip uit de paren dat een kaart is
let _alleKaarten=null;
function kaartenVan(v){ if(!_alleKaarten){ _alleKaarten=new Set(); for(const w in LEVELS) Object.keys(LEVELS[w].begrippen||{}).forEach(k=>_alleKaarten.add(k)) }
  const c=[v.b].concat(v.t==='koppel'?v.p.flat():[]); return [...new Set(c.filter(k=>k&&_alleKaarten.has(k)))] }
function registreer(v, goed){
  if(!v.gen){ const r=S.vr[v.id]||{g:0,f:0}; goed?r.g++:r.f++; r.t=Date.now(); S.vr[v.id]=r; }
  else { const k=v.id; const r=S.vr[k]||{g:0,f:0}; goed?r.g++:r.f++; S.vr[k]=r; }
  if(v._pt&&!v.gen){ S.vr[v.id].pt=v._pt.p; S.vr[v.id].max=v._pt.max }
  if(v.e){ const et=S.et[v.e]||{n:0,r:[]}; et.r=et.r.concat(v._pt?Math.round(v._pt.p/v._pt.max*100)/100:(goed?1:0)).slice(-20); et.n++; S.et[v.e]=et; }
  let nieuweKaart=false;
  if(goed){ S.xp+=10; S.mVerd+=1; const nw=kaartenVan(v).filter(k=>!S.kaarten.includes(k)); if(nw.length){ S.kaarten.push(...nw); nieuweKaart=nw } }
  // herhaalronde: foute vragen komen terug, na 2× goed verdwijnen ze
  if(!v.gen){
    if(!goed){ if(!S.herhaal.includes(v.id)) S.herhaal.push(v.id); S.hgoed[v.id]=0; }
    else if(S.herhaal.includes(v.id)){ S.hgoed[v.id]=(S.hgoed[v.id]||0)+1; if(S.hgoed[v.id]>=2){ S.herhaal=S.herhaal.filter(x=>x!==v.id); delete S.hgoed[v.id]; } }
  }
  return nieuweKaart;
}
function etScore(code){ const et=S.et[code]; if(!et||et.r.length<3) return null; let s=0,w=0; et.r.forEach((x,i)=>{const g=i+1; s+=x*g; w+=g}); return Math.round(s/w*100) }
function domeinScore(d){ const sc=Object.keys(EINDTERMEN).filter(k=>EINDTERMEN[k].d===d).map(etScore).filter(x=>x!==null); return sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):null }
function medaille(score){ let m=null; for(const x of MEDAIL) if(score>=x.min) m=x; return m }
