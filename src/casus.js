// ===== Casustrainer: grote opgaven in stappen =====
// Een casus is één bedrijf met 6 tot 12 stappen die op elkaar voortbouwen, zoals een examenopgave.
// Elke keer nieuwe getallen. Een stap is een gewone vraag (reken, mc of schema), dus nakijken en registreren werken zoals overal.
// Bij een fout antwoord ziet de leerling het juiste tussenantwoord, zodat de volgende stap nog lukt.
// Opbouw naar het voorbeeld van de grote opgaven in Cumulus; bedrijven, getallen en teksten zijn eigen werk.

const MND=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const mnd = m => MND[((m-1)%12+12)%12];
// stap-helpers. tol: bij bedragen vanaf € 1.000 mag de leerling een euro afwijken door tussentijds afronden.
function R(q,a,eh,u,x){ const tol=eh==='€'?(Math.abs(a)>=1000?1:0.02):(eh==='%'?0.11:0.011); return Object.assign({t:'reken',q,a,eh,u,tol},x||{}) }
function M(q,goed,fout,u,x){ return Object.assign({t:'mc',q,o:[goed].concat(fout),a:0,u},x||{}) }
const vn = x => x>=0?'voordelig':'nadelig';

// ---------- tijdlijn (ook los te oefenen in de Werkplaats) ----------
// pm = maanden met een betaling op de 1e, s(m) = schuld in maand m
function tijdlijnSvg(jaar,pm,label){
  const x=m=>24+(m-1)*46, W=600;
  let g=`<line x1="${x(1)}" y1="60" x2="${x(13)}" y2="60" class="olijn" stroke-width="2"/>`;
  for(let m=1;m<=13;m++) g+=`<line x1="${x(m)}" y1="54" x2="${x(m)}" y2="66" class="olijn"/>`+(m<13?`<text x="${x(m)+23}" y="84" text-anchor="middle" font-size="11">${MND[m-1].slice(0,3)}</text>`:'');
  pm.forEach(m=>{ g+=`<line x1="${x(m)}" y1="20" x2="${x(m)}" y2="52" stroke="var(--acc)" stroke-width="2.5"/><polygon points="${x(m)-5},46 ${x(m)+5},46 ${x(m)},54" fill="var(--acc)"/><text x="${x(m)}" y="14" text-anchor="middle" font-size="11" font-weight="700">${label}</text>` });
  return `<svg viewBox="0 0 ${W} 96" class="organo" role="img" aria-label="Tijdlijn ${jaar}"><text x="${x(1)}" y="100" font-size="0">${jaar}</text>${g}</svg><p class="zacht" style="font-size:13px;margin:4px 0 0">Tijdlijn ${jaar}. De pijlen zijn de betaalmomenten (steeds op de 1e van de maand).</p>`;
}
function leningData(){
  const S0=pick([240,300,360,480,600])*1000, i=pick([3.6,4.8,6]), P=pick([3,6]), A=pick([10,15,20])*1000, vooruit=Math.random()<.5;
  const m0=P===6?pick([1,3,4,5]):pick([1,2,3]); const pm=[]; for(let m=m0;m<=12;m+=P) pm.push(m);
  const s=m=>S0-A*pm.filter(x=>x<=m).length;                // schuld in maand m (na aflossing op de 1e)
  const r=i/100*P/12, im=i/1200;
  const intOp=k=>vooruit? r*(S0-A*(k+1)) : r*(S0-A*k);      // interest betaald op betaalmoment k
  const per=m=>{ const st=pm.filter(x=>x<=m).pop()??(m0-P); return [st,st+P-1] };
  const J=pick([2026,2027,2028]);
  const tekst=`Op 31 december ${J-1} is de schuld van een lineaire lening ${eur(S0)}. De interest is ${pc(i)}% per jaar en wordt per ${P===6?'halfjaar':'kwartaal'} ${vooruit?'vooruit':'achteraf'}betaald op ${pm.map(m=>'1 '+mnd(m)).join(', ')} (en zo verder in de volgende jaren). Op dezelfde dagen wordt steeds ${eur(A)} afgelost.`;
  return {S0,i,P,A,vooruit,pm,s,r,im,intOp,per,J,tekst};
}
function tijdlijnStap(L){
  const grens=[1].concat(L.pm.filter(m=>m>1)).concat([13]); const rij=[];
  for(let k=0;k<grens.length-1;k++){ const a=grens[k], b=grens[k+1]; rij.push({l:a===b-1?mnd(a):`${mnd(a)} t/m ${mnd(b-1)}`,c:[{n:L.s(a)}]}) }
  return {t:'schema', pre:tijdlijnSvg(L.J,L.pm,'A + I'), q:`Zet de betaalmomenten op een tijdlijn en bepaal de schuld in elke periode van ${L.J}. Let op: op een betaalmoment wordt eerst afgelost.`, kop:['Maanden','Schuld (€)'], rij,
    tip:'Schuld in een periode = schuld op 31 december − aantal aflossingen tot en met het begin van die periode × aflossing.',
    u:`Op elk betaalmoment daalt de schuld met € ${gt(L.A)}: ${rij.map(r=>gt(r.c[0].n)).join(' → ')}.`, hint:'Begin met de schuld op 31 december. Bij elke pijl gaat er één aflossing af.'};
}

// ---------- de casussen ----------
const CASUSSEN=[
 {id:'lening',ic:'⏳',titel:'Lening op een tijdlijn',sub:'Interest vooruit of achteraf: uitgaven, kosten en de balanspost',prio:1,niv:'',e:'F.perio',top:['vreemdvermogen','periodisering'],
  maak(){ const L=leningData(); const {J,pm,A,im,s}=L; const k1=pm.length>1?1:0;
    const totU=pm.reduce((a,_,k)=>a+A+L.intOp(k),0); let kosten=0; for(let m=1;m<=12;m++) kosten+=im*s(m);
    const X=pick([2,5,8,11]); let Y; do{ Y=1+Math.floor(Math.random()*12) }while(L.per(Y)[1]===Y);
    const [st,ei]=L.per(Y); const bal=L.vooruit? im*s(Y)*(ei-Y) : im*s(Y)*(Y-st+1);
    const post=L.vooruit?'Vooruitbetaalde interest (vlottende activa)':'Nog te betalen interest (kort vreemd vermogen)';
    return {intro:L.tekst, stappen:[
      tijdlijnStap(L),
      R(`Bereken de interestuitgave op 1 ${mnd(pm[k1])} ${J}.`, r2(L.intOp(k1)),'€', L.vooruit?`Vooruit: eerst aflossen, dan interest over de nieuwe schuld voor de komende ${L.P} maanden: ${pc(r2(L.r*100))}% × ${gt(s(pm[k1]))} = ${eur(L.intOp(k1))}.`:`Achteraf: interest over de afgelopen ${L.P} maanden, dus over de schuld vóór de aflossing van vandaag: ${pc(r2(L.r*100))}% × ${gt(s(pm[k1])+A)} = ${eur(L.intOp(k1))}.`,
        {hint:L.vooruit?'Vooruit betalen = interest over de periode die nu begint. Welke schuld hoort daarbij?':'Achteraf betalen = interest over de periode die nu eindigt. Welke schuld hoorde daarbij?'}),
      R(`Bereken de totale uitgaven (interest en aflossing) voor deze lening in ${J}.`, r2(totU),'€', `${pm.length} keer aflossing = ${eur(pm.length*A)}. Interest: ${pm.map((_,k)=>gt(r2(L.intOp(k)))).join(' + ')} = ${eur(totU-pm.length*A)}. Samen ${eur(totU)}.`,{hint:'Uitgaven = alles wat er in dit jaar echt betaald wordt: aflossing én interest.'}),
      R(`Bereken de interestkosten over ${J}.`, r2(kosten),'€', `Kosten horen bij de periode, los van het moment van betalen. Per maand ${pc(r2(L.i/12))}% van de schuld in die maand; opgeteld over 12 maanden = ${eur(kosten)}.`,{hint:'Reken per periode: maanden × '+pc(r2(L.i/12))+'% × schuld in die periode. Aflossing is geen kostenpost.'}),
      R(`Bereken de interestkosten in ${mnd(X)} ${J}.`, r2(im*s(X)),'€', `${pc(r2(L.i/12))}% × ${gt(s(X))} = ${eur(im*s(X))}.`),
      {t:'schema', q:`Welk bedrag staat op de balans van 31 ${mnd(Y)} ${J} in verband met de interest van deze lening, en onder welke post?`, kop:['','Antwoord'],
        rij:[{l:'Bedrag (€)',c:[{n:r2(bal),tol:1}]},{l:'Balanspost',c:[{s:['Vooruitbetaalde interest (vlottende activa)','Nog te betalen interest (kort vreemd vermogen)'],a:post}]}],
        u:L.vooruit?`Op 1 ${mnd(st<1?st+12:st)} is vooruitbetaald tot en met ${mnd(ei)}. Op 31 ${mnd(Y)} zijn nog ${ei-Y} maand(en) niet verbruikt: ${ei-Y} × ${pc(r2(L.i/12))}% × ${gt(s(Y))} = ${eur(bal)}.`:`De laatste betaling was op 1 ${mnd(st<1?st+12:st)}. Sindsdien zijn ${Y-st+1} maand(en) verstreken zonder betaling: ${Y-st+1} × ${pc(r2(L.i/12))}% × ${gt(s(Y))} = ${eur(bal)}.`,
        hint:L.vooruit?'Je hebt meer betaald dan je tot nu toe hebt verbruikt: dat is een bezit.':'Je hebt de interest al wel verbruikt, maar nog niet betaald: dat is een schuld.'},
      M('Waarom horen de aflossingen niet bij de interestkosten van dit jaar?','Aflossen is een uitgave waardoor de schuld daalt; het eigen vermogen verandert er niet door',['Omdat de aflossing achteraf wordt betaald','Omdat aflossing bij de afschrijvingskosten hoort','Aflossing hoort wel bij de kosten, maar pas aan het einde van de looptijd'],'Kosten verlagen het eigen vermogen. Een aflossing verlaagt de bank en de schuld evenveel: alleen een uitgave.')
    ]} }},

 {id:'annuiteit',ic:'🏦',titel:'Annuïteitenlening',sub:'Aflossingsschema invullen, aflossing later in de looptijd, totale interest',prio:1,niv:'',e:'D.financ',top:['vreemdvermogen','woning'],
  maak(){ const Lb=pick([8,10,12,15,20,25])*1000, i=pick([4,5,6,7.5,8]), n=pick([5,8,10]); const An=r2(Lb*(i/100)/(1-Math.pow(1+i/100,-n)));
    const rij=[]; let s=Lb; const sch=[]; for(let k=0;k<4;k++){ const int=r2(s*i/100), afl=r2(An-int), e=r2(s-afl); sch.push({s,int,afl,e}); s=e }
    const J=pick([2026,2027]); const L2=pick([150,200,250])*1000, i2=pick([3,3.5,4,4.5]), n2=pick([20,25,30]); const A2=r2(L2*(i2/100)/(1-Math.pow(1+i2/100,-n2)));
    return {intro:`Op 1 januari ${J} leent een eenmanszaak ${eur(Lb)} voor een nieuwe bestelbus. De lening wordt in ${n} jaar afgelost met een vaste jaarlijkse annuïteit van ${eur(An)}. De interest is ${pc(i)}% per jaar. De annuïteit wordt elk jaar op 31 december betaald, voor het eerst op 31 december ${J}.`, stappen:[
      {t:'schema', q:'Vul het aflossingsschema in voor de eerste drie jaar. Rond af op hele euro\'s.', kop:['Jaar','Schuld begin','Interest','Aflossing','Schuld eind'],
        rij:sch.slice(0,3).map((x,k)=>({l:String(J+k),c:[k?{n:x.s}:gt(x.s),{n:x.int},{n:x.afl},{n:x.e}]})),
        u:sch.slice(0,3).map((x,k)=>`${J+k}: interest ${pc(i)}% × ${gt(x.s)} = ${gt(x.int)}, aflossing ${gt(An)} − ${gt(x.int)} = ${gt(x.afl)}, schuld ${gt(x.e)}`).join('. ')+'.',
        hint:'Interest = % × schuld aan het begin van het jaar. Aflossing = annuïteit − interest.'},
      R(`Bereken de aflossing in ${J+3}.`, sch[3].afl,'€', `Interest ${J+3} = ${pc(i)}% × ${gt(sch[3].s)} = ${eur(sch[3].int)}. Aflossing = ${eur(An)} − ${eur(sch[3].int)} = ${eur(sch[3].afl)}.`,{tol:1}),
      R('Bereken het totale bedrag aan interest over de hele looptijd.', r2(n*An-Lb),'€', `Totaal betaald = ${n} × ${eur(An)} = ${eur(n*An)}. Daarvan is ${eur(Lb)} aflossing. Interest = ${eur(n*An-Lb)}.`,{hint:'Alles wat je meer terugbetaalt dan je geleend hebt, is interest.'}),
      R(`Hoeveel procent van de eerste annuïteit is interest?`, r1(sch[0].int/An*100),'%', `${gt(sch[0].int)} / ${gt(An)} × 100% = ${nl1(sch[0].int/An*100)}%.`),
      M('Hoe verloopt de verdeling van de annuïteit tijdens de looptijd?','Het interestdeel daalt en het aflossingsdeel stijgt',['Het interestdeel stijgt en het aflossingsdeel daalt','Interest en aflossing blijven elk jaar gelijk','De annuïteit daalt elk jaar'],'De schuld wordt elk jaar kleiner, dus de interest ook. Omdat de annuïteit gelijk blijft, gaat er steeds meer naar aflossing.'),
      M('Wat is het verschil met een lineaire lening van hetzelfde bedrag?','Bij lineair is de aflossing elk jaar gelijk en dalen de totale jaarlasten',['Bij lineair is het totale bedrag per jaar gelijk','Bij lineair betaal je meer interest in totaal','Bij lineair los je pas aan het eind af'],'Lineair: vaste aflossing, dalende interest, dus dalende jaarlast. Je betaalt in totaal iets minder interest, omdat de schuld sneller daalt.'),
      R(`Een hypotheek van ${eur(L2)} heeft een looptijd van ${n2} jaar en ${pc(i2)}% interest. Bereken de jaarlijkse annuïteit.`, A2,'€', `A = L × i / (1 − (1 + i)⁻ⁿ) = ${gt(L2)} × ${pc(i2/100)} / (1 − ${pc(1+i2/100)}^−${n2}) = ${eur(A2)}.`,{niv:'v',tol:1,hint:'Annuïteit = lening × i / (1 − (1 + i)^−n).'})
    ]} }},

 {id:'pand',ic:'🏭',titel:'Pand met een hypotheek',sub:'Afschrijving, exploitatiebegroting tegenover liquiditeitsbegroting',prio:1,niv:'',e:'F.perio',top:['periodisering','liquiditeitsbegroting','afschrijving'],
  maak(){ const n=pick([25,30,40]), d=pick([10,12,15,16])*1000, R0=pick([40,60,80,100])*1000, B=pick([20,30,40])*1000; const tot=d*n+R0, K=tot-B; const ms=pick([3,4,5,6]), J=pick([2026,2027]);
    const T=pick([15,20]), a=pick([6,8,10])*1000, H=a*T, i=pick([4,5,6]); const bedr=pick(['Drukkerij Vonk bv','Bakkerij Korenaar bv','Fietsfabriek Trapper bv','Installatiebedrijf Spanning bv']);
    const maxL=Math.min(d,1e12)*pick([15,20,25]), Tm=maxL/d;
    const kostenJ1=r2(i/100*((ms-1)/12*H+(13-ms)/12*(H-a))), uitJ1=r2(i/200*H+a+i/200*(H-a)), ntb=r2(i/1200*(H-a)*(7-ms));
    return {intro:`${bedr} koopt op 1 ${mnd(ms)} ${J} een bedrijfspand voor ${eur(K)} kosten koper. De bijkomende kosten (makelaar en notaris) zijn ${eur(B)}. Beide bedragen worden op 1 ${mnd(ms)} ${J} per bank betaald. De economische levensduur is ${n} jaar en de restwaarde ${eur(R0)}. Er wordt afgeschreven met een vast percentage van de aanschafprijs. Het bedrijf bepaalt het resultaat per maand. De btw blijft buiten beschouwing.`, stappen:[
      R('Bereken de afschrijvingskosten van het pand per jaar.', d,'€', `Aanschafprijs = ${gt(K)} + ${gt(B)} = ${eur(tot)}. Afschrijving = (${gt(tot)} − ${gt(R0)}) / ${n} = ${eur(d)}.`,{hint:'Bijkomende kosten horen bij de aanschafprijs. Trek de restwaarde eraf en deel door de levensduur.'}),
      R(`Bereken de afschrijvingskosten in het vierde kwartaal van ${J}.`, r2(d/4),'€', `3/12 × ${gt(d)} = ${eur(d/4)}.`),
      R(`Bereken de afschrijvingskosten over ${J}.`, r2(d*(13-ms)/12),'€', `Het pand is vanaf 1 ${mnd(ms)} in gebruik: ${13-ms} maanden. ${13-ms}/12 × ${gt(d)} = ${eur(d*(13-ms)/12)}.`),
      R(`Bereken de boekwaarde van het pand op 31 december ${J+2}.`, r2(tot-d*((13-ms)/12+2)),'€', `Afgeschreven: ${13-ms} maanden in ${J} plus 2 hele jaren = ${eur(d*((13-ms)/12+2))}. Boekwaarde = ${gt(tot)} − ${gt(d*((13-ms)/12+2))} = ${eur(tot-d*((13-ms)/12+2))}.`,{hint:'Boekwaarde = aanschafprijs − alle afschrijvingen tot dan toe.'}),
      R(`De bank leent maximaal zoveel dat de jaarlijkse aflossing niet hoger is dan de jaarlijkse afschrijving, met een looptijd van maximaal ${Tm} jaar. Bereken hoeveel eigen middelen het bedrijf dan minimaal nodig heeft.`, tot-maxL,'€', `Maximale lening = ${Tm} × ${gt(d)} = ${eur(maxL)}. Eigen middelen = ${gt(tot)} − ${gt(maxL)} = ${eur(tot-maxL)}.`),
      R(`Het bedrijf sluit op 1 ${mnd(ms)} ${J} een hypothecaire lening af van ${eur(H)}, looptijd ${T} jaar, ${i}% interest per jaar. De interest wordt per halfjaar achteraf betaald op 1 ${mnd(ms)} en 1 ${mnd(ms+6)}, voor het eerst op 1 ${mnd(ms+6)} ${J}. Elk jaar op 1 ${mnd(ms)} wordt ${eur(a)} afgelost, voor het eerst op 1 ${mnd(ms)} ${J+1}.\nBereken het bedrag dat op de exploitatiebegroting (resultatenbegroting) van ${J+1} staat voor deze lening.`, kostenJ1,'€', `Alleen interestkosten. Januari t/m ${mnd(ms-1)}: ${ms-1}/12 × ${i}% × ${gt(H)} = ${eur(i/100*(ms-1)/12*H)}. ${mnd(ms)} t/m december: ${13-ms}/12 × ${i}% × ${gt(H-a)} = ${eur(i/100*(13-ms)/12*(H-a))}. Samen ${eur(kostenJ1)}.`,{hint:'Op de exploitatiebegroting staan kosten. Is aflossing een kostenpost?'}),
      R(`Bereken het bedrag dat op de liquiditeitsbegroting van ${J+1} staat voor deze lening.`, uitJ1,'€', `1 ${mnd(ms)}: interest over het afgelopen halfjaar ${i/2}% × ${gt(H)} = ${eur(i/200*H)} plus aflossing ${eur(a)}. 1 ${mnd(ms+6)}: ${i/2}% × ${gt(H-a)} = ${eur(i/200*(H-a))}. Samen ${eur(uitJ1)}.`,{hint:'Op de liquiditeitsbegroting staan uitgaven: interest én aflossing, op het moment van betalen.'}),
      R(`Bereken de nog te betalen interest op de balans van 31 december ${J+1}.`, ntb,'€', `Sinds 1 ${mnd(ms+6)} is ${7-ms} maand(en) interest verbruikt maar nog niet betaald: ${7-ms}/12 × ${i}% × ${gt(H-a)} = ${eur(ntb)}.`),
      M('Waarom verschillen de bedragen op de exploitatiebegroting en de liquiditeitsbegroting?','De aflossing is wel een uitgave maar geen kosten, en interest wordt betaald op een ander moment dan hij als kosten telt',['Op de liquiditeitsbegroting staat de btw erbij','Op de exploitatiebegroting staan ook de afschrijvingen van de lening','Dat is een rekenfout: ze horen gelijk te zijn'],'Kosten horen bij een periode, uitgaven bij een moment. Aflossing is alleen een uitgave.')
    ]} }},

 {id:'nacalc',ic:'⚖️',titel:'Voor- en nacalculatie',sub:'Standaardkostprijs, begroot en werkelijk resultaat en alle deelresultaten',prio:1,niv:'v',e:'F.versch',top:['kostprijs','verschillen'],
  maak(){ const N=pick([20,25,40])*1000, cpu=pick([8,10,12,15]), C=N*cpu, sh=pick([2,2.5,3,4]), sp=pick([3,4,5,6]), su=pick([0.5,0.75,1,1.5]), st=pick([30,36,40,48]);
    const K=sh*sp+su*st+cpu, p=Math.round(K*pick([1.2,1.25,1.3,1.4]));
    const W=rond(N*pick([0.9,0.94,0.96,1.04,1.08]),100), WH=rond(W*sh*pick([0.97,0.98,1.02,1.03,1.04]),100), WP=r2(sp*pick([0.95,0.97,1.03,1.05,1.06])), WU=rond(W*su*pick([0.96,0.98,1.02,1.05]),10), WT=st+pick([-1,1,1.5,2]), WC=C+pick([-6,-3,4,8,12])*1000, WPr=p-pick([0,0,1,2]);
    const begr=N*(p-K), werk=W*WPr-(WH*WP+WU*WT+WC), vk=W*(WPr-K), pg=(sp-WP)*WH, eg=(W*sh-WH)*sp, pa=(st-WT)*WU, ea=(W*su-WU)*st, bz=(W-N)*cpu, bu=C-WC;
    const prod=pick(['tuinstoelen','skateboards','koffiemolens','fietsframes']);
    return {intro:`Een fabriek maakt ${prod}. Voorcalculatie (standaard) per stuk: ${pc(sh)} kg grondstof à ${eur(sp)} per kg en ${pc(su)} arbeidsuur à ${eur(st)}. De constante kosten zijn begroot op ${eur(C)} bij een normale productie van ${gt(N)} stuks. De verkoopprijs is ${eur(p)}. Begrote productie en afzet zijn gelijk aan de normale productie.\nNacalculatie (werkelijk): ${gt(W)} stuks gemaakt en verkocht voor ${eur(WPr)} per stuk. Verbruikt: ${gt(WH)} kg grondstof à ${eur(WP)} en ${gt(WU)} arbeidsuren à ${eur(WT)}. De constante kosten waren ${eur(WC)}.\nNadelige resultaten vul je negatief in.`, stappen:[
      R('Bereken de standaardkostprijs per stuk.', r2(K),'€', `${pc(sh)} × ${nl1(sp)} + ${pc(su)} × ${gt(st)} + ${gt(C)} / ${gt(N)} = ${eur(sh*sp)} + ${eur(su*st)} + ${eur(cpu)} = ${eur(K)}.`,{hint:'Kostprijs = variabele kosten per stuk + C/N.'}),
      R('Bereken het begrote resultaat.', r2(begr),'€', `${gt(N)} × (${nl1(p)} − ${nl1(K)}) = ${eur(begr)}.`),
      R('Bereken het werkelijke resultaat.', r2(werk),'€', `Omzet ${gt(W)} × ${nl1(WPr)} = ${eur(W*WPr)}. Kosten: grondstof ${eur(WH*WP)}, arbeid ${eur(WU*WT)}, constant ${eur(WC)}. Resultaat = ${eur(werk)}.`,{hint:'Werkelijke omzet − alle werkelijke kosten.'}),
      R('Bereken het verkoopresultaat.', r2(vk),'€', `Afzet × (werkelijke verkoopprijs − standaardkostprijs) = ${gt(W)} × (${nl1(WPr)} − ${nl1(K)}) = ${eur(vk)}.`),
      R('Bereken het prijsresultaat op grondstof.', r2(pg),'€', `(SP − WP) × WH = (${nl1(sp)} − ${nl1(WP)}) × ${gt(WH)} = ${eur(pg)} (${vn(pg)}).`,{hint:'(standaardprijs − werkelijke prijs) × werkelijke hoeveelheid.'}),
      R('Bereken het efficiencyresultaat op grondstof.', r2(eg),'€', `SH = ${gt(W)} × ${pc(sh)} = ${gt(W*sh)} kg. (SH − WH) × SP = (${gt(W*sh)} − ${gt(WH)}) × ${nl1(sp)} = ${eur(eg)} (${vn(eg)}).`,{hint:'Standaard toegestane hoeveelheid hoort bij de wérkelijke productie.'}),
      R('Bereken het prijsresultaat (tariefresultaat) op arbeid.', r2(pa),'€', `(${nl1(st)} − ${nl1(WT)}) × ${gt(WU)} = ${eur(pa)} (${vn(pa)}).`),
      R('Bereken het efficiencyresultaat op arbeid.', r2(ea),'€', `Standaard uren = ${gt(W)} × ${pc(su)} = ${gt(W*su)}. (${gt(W*su)} − ${gt(WU)}) × ${gt(st)} = ${eur(ea)} (${vn(ea)}).`),
      R('Bereken het bezettingsresultaat.', r2(bz),'€', `(W − N) × C/N = (${gt(W)} − ${gt(N)}) × ${gt(cpu)} = ${eur(bz)} (${vn(bz)}).`),
      R('Bereken het budgetresultaat op de constante kosten.', r2(bu),'€', `Begroot − werkelijk = ${gt(C)} − ${gt(WC)} = ${eur(bu)} (${vn(bu)}).`),
      R('Tel het verkoopresultaat en alle andere resultaten op. Welk bedrag krijg je?', r2(vk+pg+eg+pa+ea+bz+bu),'€', `${[vk,pg,eg,pa,ea,bz,bu].map(x=>gt(x)).join(' + ')} = ${eur(vk+pg+eg+pa+ea+bz+bu)}. Dat is precies het werkelijke resultaat: de analyse verklaart alles.`),
      M('Welke afdeling is meestal verantwoordelijk voor het prijsresultaat op grondstof?','Inkoop',['Productie','Verkoop','Personeelszaken'],'De inkoopafdeling bepaalt voor welke prijs de grondstof wordt ingekocht. Het efficiencyresultaat hoort bij productie.')
    ]} }},

 {id:'breakeven',ic:'📈',titel:'Break-even en terugrekenen',sub:'Dekkingsbijdrage, veiligheidsmarge, gewenste winst, prijs en variabele kosten terugrekenen',prio:1,niv:'',e:'F.breakeven',top:['breakeven','kostprijs'],
  maak(){ const p=pick([24,30,36,45,60]), db=pick([8,10,12,15]), v=p-db, bea=pick([4,5,6,8,10])*1000, C=db*bea, Q=rond(bea*pick([1.2,1.25,1.4,1.5]),100), Wg=db*pick([5,10,15,20])*100;
    const W2=pick([20,30,40,50])*1000, pNieuw=r2((C+W2)/Q+v), Q2=rond(bea*pick([0.8,0.9]),100), vMax=r2(p-C/Q2);
    const prod=pick(['bidons','powerbanks','yogamatten','tuinlampen']);
    return {intro:`Een bedrijf verkoopt ${prod} voor ${eur(p)} per stuk. De variabele kosten zijn ${eur(v)} per stuk. De constante kosten zijn ${eur(C)} per jaar. De verwachte afzet is ${gt(Q)} stuks. De btw blijft buiten beschouwing.`, stappen:[
      R('Bereken de dekkingsbijdrage per stuk.', db,'€', `${gt(p)} − ${gt(v)} = ${eur(db)}.`),
      R('Bereken de break-evenafzet (in stuks).', bea,'', `${gt(C)} / ${db} = ${gt(bea)} stuks.`,{toon:gt(bea)+' stuks',hint:'Break-evenafzet = constante kosten / dekkingsbijdrage per stuk.'}),
      R('Bereken het verwachte resultaat.', Q*db-C,'€', `${gt(Q)} × ${db} − ${gt(C)} = ${eur(Q*db-C)}.`),
      R('Bereken de veiligheidsmarge in procenten van de verwachte afzet.', r1((Q-bea)/Q*100),'%', `(${gt(Q)} − ${gt(bea)}) / ${gt(Q)} × 100% = ${nl1((Q-bea)/Q*100)}%. Zoveel mag de afzet dalen voordat er verlies is.`,{hint:'(verwachte afzet − break-evenafzet) / verwachte afzet × 100%.'}),
      R(`Hoeveel stuks moet het bedrijf verkopen voor een winst van ${eur(Wg)}?`, (C+Wg)/db,'', `(${gt(C)} + ${gt(Wg)}) / ${db} = ${gt((C+Wg)/db)} stuks.`,{toon:gt((C+Wg)/db)+' stuks',hint:'Tel de gewenste winst bij de constante kosten op.'}),
      R(`Bij de verwachte afzet wil de directie ${eur(W2)} winst. Welke verkoopprijs is daarvoor nodig (2 decimalen)?`, pNieuw,'€', `Nodige dekkingsbijdrage per stuk = (${gt(C)} + ${gt(W2)}) / ${gt(Q)} = ${eur((C+W2)/Q)}. Prijs = ${eur((C+W2)/Q)} + ${eur(v)} = ${eur(pNieuw)}.`,{tol:0.02}),
      R(`Stel dat de afzet maar ${gt(Q2)} stuks is en de prijs ${eur(p)} blijft. Hoe hoog mogen de variabele kosten per stuk maximaal zijn om geen verlies te maken?`, vMax,'€', `De dekkingsbijdrage moet minstens ${gt(C)} / ${gt(Q2)} = ${eur(C/Q2)} zijn. Variabele kosten ≤ ${gt(p)} − ${nl1(C/Q2)} = ${eur(vMax)}.`,{tol:0.02}),
      R('Bereken de dekkingsbijdrage in procenten van de verkoopprijs.', r1(db/p*100),'%', `${db} / ${p} × 100% = ${nl1(db/p*100)}%.`),
      R('Bereken de break-evenomzet.', bea*p,'€', `${gt(C)} / ${pc(r1(db/p*100))}% = ${eur(bea*p)}, of ${gt(bea)} × ${p}.`),
      M('De constante kosten stijgen. Wat gebeurt er met de break-evenafzet?','Die stijgt, want er moeten meer stuks dekkingsbijdrage opleveren',['Die daalt','Die blijft gelijk, want de dekkingsbijdrage verandert niet','Dat hangt af van de verkoopprijs'],'Break-evenafzet = C / dekkingsbijdrage. Hogere C bij dezelfde dekkingsbijdrage geeft een hogere break-evenafzet.')
    ]} }},

 {id:'emissie',ic:'📃',titel:'Emissie van aandelen',sub:'Emissieopbrengst, agio, eigen vermogen en intrinsieke waarde voor en na',prio:2,niv:'',e:'D.financ',top:['aandelen'],
  maak(){ const nom=pick([1,2,5,10]), n0=pick([2,4,5,8])*100000, mk=n0*pick([2,2.5,3])*nom, AR=pick([1,2,3])*n0*nom/2, OR=pick([2,3,4])*n0*nom, n1=pick([1,2,4])*n0/8, ek=nom*pick([3,4,5,6]);
    const EV0=n0*nom+AR+OR, EV1=EV0+n1*ek, iw0=r2(EV0/n0), iw1=r2(EV1/(n0+n1)); const nv=pick(['Volta nv','Galilei nv','Meridiaan nv','Polaris nv']);
    return {intro:`${nv} heeft een maatschappelijk aandelenkapitaal van ${eur(mk)}. Er zijn ${gt(n0)} aandelen geplaatst met een nominale waarde van ${eur(nom)}. De agioreserve is ${eur(AR)} en de overige reserves zijn ${eur(OR)}.\nDe nv geeft ${gt(n1)} nieuwe aandelen uit tegen een emissiekoers van ${eur(ek)}. Alle aandelen worden geplaatst en volgestort.`, stappen:[
      R('Hoeveel aandelen kan de nv nog uitgeven zonder de statuten te wijzigen?', mk/nom-n0,'', `${gt(mk)} / ${nom} = ${gt(mk/nom)} aandelen in totaal; ${gt(n0)} zijn geplaatst. Nog ${gt(mk/nom-n0)}.`,{toon:gt(mk/nom-n0)+' aandelen'}),
      R('Bereken de opbrengst van de emissie.', n1*ek,'€', `${gt(n1)} × ${gt(ek)} = ${eur(n1*ek)}.`),
      R('Bereken de toename van het geplaatst aandelenkapitaal.', n1*nom,'€', `Altijd tegen nominale waarde: ${gt(n1)} × ${nom} = ${eur(n1*nom)}.`),
      R('Bereken de toename van de agioreserve.', n1*(ek-nom),'€', `${gt(n1)} × (${ek} − ${nom}) = ${eur(n1*(ek-nom))}.`,{hint:'Agio = het deel boven de nominale waarde.'}),
      R('Bereken het eigen vermogen na de emissie.', EV1,'€', `Voor: ${gt(n0*nom)} + ${gt(AR)} + ${gt(OR)} = ${eur(EV0)}. Erbij ${eur(n1*ek)}: ${eur(EV1)}.`),
      R('Bereken de intrinsieke waarde per aandeel vóór de emissie.', iw0,'€', `${gt(EV0)} / ${gt(n0)} = ${eur(iw0)}.`),
      R('Bereken de intrinsieke waarde per aandeel na de emissie.', iw1,'€', `${gt(EV1)} / ${gt(n0+n1)} = ${eur(iw1)}.`),
      R('Met hoeveel procent verandert de intrinsieke waarde per aandeel door de emissie?', r1((iw1-iw0)/iw0*100),'%', `(${nl1(iw1)} − ${nl1(iw0)}) / ${nl1(iw0)} × 100% = ${nl1((iw1-iw0)/iw0*100)}%. ${iw1<iw0?'Verwatering: de nieuwe aandelen zijn uitgegeven onder de intrinsieke waarde.':'De emissiekoers ligt boven de intrinsieke waarde.'}`,{niv:'v'}),
      M('Waarom ligt de emissiekoers meestal iets onder de beurskoers?','Zo zijn de nieuwe aandelen aantrekkelijk en worden ze zeker allemaal geplaatst',['Omdat de nominale waarde lager is dan de beurskoers','Omdat de nv dan minder agio hoeft te betalen','Omdat de AFM dat verplicht'],'Kopers moeten een reden hebben om in te schrijven. Een korting op de beurskoers maakt de emissie aantrekkelijk.'),
      M('Welke toezichthouder keurt het prospectus van een openbare emissie goed?','De AFM (Autoriteit Financiële Markten)',['De Nederlandsche Bank','De Belastingdienst','De Kamer van Koophandel'],'De AFM houdt toezicht op de financiële markten en keurt het prospectus goed. DNB houdt toezicht op banken.')
    ]} }},

 {id:'winst',ic:'🍰',titel:'Winstverdeling van een nv',sub:'Vpb, preferent en gewoon dividend, dividendbelasting, reserves',prio:2,niv:'',e:'B.rechtsvorm',top:['winstverdeling','vpb'],
  maak(){ const W=pick([450,600,750,900,1200])*1000, vpb=r2(Math.min(W,200000)*0.19+Math.max(0,W-200000)*0.258), WnB=W-vpb;
    const npf=pick([10,20,40])*1000, nompf=pick([5,10]), pf=pick([5,6,8]), PD=npf*nompf*pf/100, ng=pick([100,200,250])*1000, d=pick([0.6,0.8,1,1.2]), GD=ng*d, res=WnB-PD-GD;
    const x=pick([200,500,1000]), k=pick([10,20,25]), EVna=pick([6,8,10])*1e6; const iw=r2((EVna-npf*nompf)/ng), iw2=r2((EVna-npf*nompf)/(ng+ng/k));
    return {intro:`De winst vóór belasting van een nv is ${eur(W)}. De vennootschapsbelasting is 19% over de eerste € 200.000 en 25,8% over het meerdere.\nDe nv heeft ${gt(npf)} preferente aandelen van ${eur(nompf)} nominaal met een vast dividend van ${pf}%, en ${gt(ng)} gewone aandelen. Op elk gewoon aandeel wordt ${eur(d)} cashdividend uitgekeerd. De rest van de winst gaat naar de overige reserves. De dividendbelasting is 15%.`, stappen:[
      R('Bereken de vennootschapsbelasting.', vpb,'€', `19% × 200.000 = ${eur(38000)}, 25,8% × ${gt(W-200000)} = ${eur(0.258*(W-200000))}. Samen ${eur(vpb)}.`,{hint:'Twee schijven: tot € 200.000 en daarboven.'}),
      R('Bereken de winst na belasting.', WnB,'€', `${gt(W)} − ${gt(vpb)} = ${eur(WnB)}.`),
      R('Bereken het preferent dividend.', PD,'€', `${pf}% × ${gt(npf)} × ${nompf} = ${eur(PD)}. Preferent dividend gaat altijd voor.`),
      R('Bereken het totale dividend op de gewone aandelen.', GD,'€', `${gt(ng)} × ${nl1(d)} = ${eur(GD)}.`),
      R('Bereken de toevoeging aan de overige reserves.', res,'€', `${gt(WnB)} − ${gt(PD)} − ${gt(GD)} = ${eur(res)}.`),
      R(`Een belegger heeft ${gt(x)} gewone aandelen. Hoeveel dividend ontvangt hij netto op zijn bankrekening?`, r2(x*d*0.85),'€', `Bruto ${gt(x)} × ${nl1(d)} = ${eur(x*d)}. De nv houdt 15% dividendbelasting in: netto ${eur(x*d*0.85)}.`,{hint:'De nv houdt de dividendbelasting in en draagt die af aan de Belastingdienst.'}),
      M('Wat is het gevolg van het cashdividend voor de balans van de nv?','Eigen vermogen en liquide middelen dalen allebei',['Alleen het eigen vermogen daalt','Het vreemd vermogen stijgt','Er verandert niets, dividend is een kostenpost'],'Bij uitkering gaat er geld van de bank naar de aandeelhouders. Dividend is winstverdeling, geen kosten.'),
      R(`Het eigen vermogen na de winstverdeling is ${eur(EVna)}. Bereken de intrinsieke waarde per gewoon aandeel (het preferente aandelenkapitaal telt niet mee).`, iw,'€', `(${gt(EVna)} − ${gt(npf*nompf)}) / ${gt(ng)} = ${eur(iw)}.`,{niv:'v'}),
      R(`Stel dat de nv in plaats van een deel van het cashdividend 1 nieuw gewoon aandeel per ${k} aandelen uitkeert als stockdividend, ten laste van de agioreserve. Wat wordt dan de intrinsieke waarde per gewoon aandeel, uitgaande van hetzelfde eigen vermogen?`, iw2,'€', `Er komen ${gt(ng/k)} aandelen bij; het eigen vermogen blijft gelijk (alleen een verschuiving van agioreserve naar aandelenkapitaal). (${gt(EVna)} − ${gt(npf*nompf)}) / ${gt(ng+ng/k)} = ${eur(iw2)}.`,{niv:'v',hint:'Stockdividend verandert het eigen vermogen niet, wel het aantal aandelen.'}),
      M('Waarom kiest een nv soms voor stockdividend in plaats van cashdividend?','Er gaat geen geld de onderneming uit, dus de liquiditeit blijft op peil',['Stockdividend is een aftrekpost voor de vennootschapsbelasting','Het eigen vermogen stijgt erdoor','De aandeelhouders betalen dan nooit belasting'],'Bij stockdividend krijgen aandeelhouders aandelen in plaats van geld. De liquide middelen blijven in het bedrijf.',{niv:'v'})
    ]} }},

 {id:'kengetal',ic:'🔎',titel:'Kengetallen uit de jaarrekening',sub:'RTV, IVV, REV, current ratio, solvabiliteit, hefboom en cashflow',prio:2,niv:'',e:'G.kengetal',top:['kengetallen','cashflow'],
  maak(){ const k=1000; const EV0=pick([400,500,600])*k, EV1=EV0+pick([40,60,80])*k, LV0=pick([300,400,500])*k, LV1=LV0-pick([20,40])*k, KV0=pick([150,200])*k, KV1=KV0+pick([-20,10,30])*k;
    const TV0=EV0+LV0+KV0, TV1=EV1+LV1+KV1, gTV=(TV0+TV1)/2, gEV=(EV0+EV1)/2, gVV=gTV-gEV; const EBIT=rond(gTV*pick([0.08,0.09,0.1,0.12]),1000), INT=rond(gVV*pick([0.04,0.05,0.06]),100), t=0.2, WnB=(EBIT-INT)*(1-t), AF=pick([40,50,60])*k;
    const VLA1=rond(KV1*pick([1.3,1.6,2.1]),1000), VA1=TV1-VLA1, VR1=rond(VLA1*pick([0.3,0.4]),1000);
    const rtv=EBIT/gTV*100, ivv=INT/gVV*100, revv=(EBIT-INT)/gEV*100;
    return {intro:`Gegevens van een bv (bedragen in euro's):\nBalanspost | 1 januari | 31 december\nEigen vermogen | ${gt(EV0)} | ${gt(EV1)}\nLang vreemd vermogen | ${gt(LV0)} | ${gt(LV1)}\nKort vreemd vermogen | ${gt(KV0)} | ${gt(KV1)}\nVlottende activa (incl. liquide middelen) | | ${gt(VLA1)}\nwaarvan voorraad | | ${gt(VR1)}\nUit de resultatenrekening: bedrijfsresultaat (EBIT) ${eur(EBIT)}, interestkosten ${eur(INT)}, afschrijvingskosten ${eur(AF)}. De vennootschapsbelasting is 20% van de winst vóór belasting. Reken met gemiddeld vermogen.`, stappen:[
      R('Bereken het gemiddeld totaal vermogen.', gTV,'€', `Totaal 1-1 = ${gt(TV0)}, 31-12 = ${gt(TV1)}. Gemiddeld (${gt(TV0)} + ${gt(TV1)}) / 2 = ${eur(gTV)}.`,{hint:'Totaal vermogen = eigen vermogen + vreemd vermogen (lang en kort).'}),
      R('Bereken de rentabiliteit van het totaal vermogen (RTV).', r1(rtv),'%', `EBIT / gemiddeld TV = ${gt(EBIT)} / ${gt(gTV)} × 100% = ${nl1(rtv)}%.`),
      R('Bereken het gemiddelde interestpercentage van het vreemd vermogen (IVV).', r1(ivv),'%', `Gemiddeld VV = ${gt(gVV)}. ${gt(INT)} / ${gt(gVV)} × 100% = ${nl1(ivv)}%.`,{hint:'IVV = interestkosten / gemiddeld vreemd vermogen.'}),
      R('Bereken de winst na belasting.', WnB,'€', `(${gt(EBIT)} − ${gt(INT)}) × 0,8 = ${eur(WnB)}.`),
      R('Bereken de rentabiliteit van het eigen vermogen na belasting (REV).', r1(WnB/gEV*100),'%', `Gemiddeld EV = ${gt(gEV)}. ${gt(WnB)} / ${gt(gEV)} × 100% = ${nl1(WnB/gEV*100)}%.`),
      R('Bereken met de hefboomformule de REV vóór belasting.', r1(revv),'%', `REV = RTV + (RTV − IVV) × VV/EV = ${nl1(rtv)} + (${nl1(rtv)} − ${nl1(ivv)}) × ${gt(gVV)} / ${gt(gEV)} = ${nl1(revv)}%. Controle: (${gt(EBIT)} − ${gt(INT)}) / ${gt(gEV)} = ${nl1(revv)}%.`,{niv:'v',hint:'REV = RTV + (RTV − IVV) × VV / EV, met gemiddelde vermogens.'}),
      M('Is het voor de aandeelhouders gunstig om meer vreemd vermogen aan te trekken, als RTV en IVV gelijk blijven?', rtv>ivv?'Ja, want de RTV is hoger dan de IVV: elke geleende euro levert meer op dan hij kost':'Nee, want de IVV is hoger dan de RTV: elke geleende euro kost meer dan hij oplevert',
        [rtv>ivv?'Nee, want de IVV is hoger dan de RTV':'Ja, want de RTV is hoger dan de IVV','Ja, want vreemd vermogen verhoogt altijd de solvabiliteit','Het maakt niet uit: de REV hangt alleen af van de RTV'],`RTV ${nl1(rtv)}% tegenover IVV ${nl1(ivv)}%. Het hefboomeffect is ${rtv>ivv?'positief':'negatief'}.`),
      R('Bereken de current ratio op 31 december (2 decimalen).', r2(VLA1/KV1),'', `${gt(VLA1)} / ${gt(KV1)} = ${pc(r2(VLA1/KV1))}.`,{toon:pc(r2(VLA1/KV1)),tol:0.011}),
      R('Bereken de quick ratio op 31 december (2 decimalen).', r2((VLA1-VR1)/KV1),'', `(${gt(VLA1)} − ${gt(VR1)}) / ${gt(KV1)} = ${pc(r2((VLA1-VR1)/KV1))}.`,{toon:pc(r2((VLA1-VR1)/KV1)),tol:0.011,hint:'Bij de quick ratio laat je de voorraad weg.'}),
      R('Bereken de solvabiliteit op 31 december als eigen vermogen in procenten van het totaal vermogen.', r1(EV1/TV1*100),'%', `${gt(EV1)} / ${gt(TV1)} × 100% = ${nl1(EV1/TV1*100)}%.`),
      R('Bereken de cashflow (winst na belasting + afschrijvingen).', WnB+AF,'€', `${gt(WnB)} + ${gt(AF)} = ${eur(WnB+AF)}. Afschrijvingen zijn kosten, maar geen uitgaven.`)
    ]} }},

 {id:'eindbalans',ic:'📒',titel:'Eindbalans opstellen',sub:'Van beginbalans, resultaten en geldstromen naar de eindbalans, met EBITDA en EBIT',prio:2,niv:'',e:'A.balans',top:['balans','resultaat','verslaggeving'],
  maak(){ const k=1000, P=x=>pick(x)*k;
    const I0=P([40,50,60]), V0=P([30,40,50]), D0=P([10,15,20]), E0=P([60,70,80]), L0=P([40,50]), K0=P([12,15,20]);
    const Omz=P([300,360,420]), IW=Math.round(Omz*pick([0.55,0.6])/1000)*1000, Ink=IW+P([-5,0,5,10]), OD=Omz-P([-4,2,5]), BC=Ink-P([-3,2,4]), Af=P([8,10,12]), OK=P([60,70,80]), Int=Math.round(L0*0.05), Afl=P([5,10]), PO=P([30,40]), NI=P([0,10,15]);
    let B0=E0+L0+K0-I0-V0-D0; const B1t=OD-BC-OK-Int-Afl-PO-NI; const extra=Math.max(0,5000-(B0+B1t),5000-B0); const E0b=E0+extra; B0+=extra;
    const I1=I0+NI-Af, V1=V0+Ink-IW, D1=D0+Omz-OD, B1=B0+B1t, Res=Omz-IW-Af-OK-Int, E1=E0b+Res-PO, L1=L0-Afl, K1=K0+Ink-BC;
    return {intro:`Beginbalans van eenmanszaak Wolters op 1 januari (bedragen in euro's):\nActiva | € | Passiva | €\nInventaris | ${gt(I0)} | Eigen vermogen | ${gt(E0b)}\nVoorraad goederen | ${gt(V0)} | Lening (5%) | ${gt(L0)}\nDebiteuren | ${gt(D0)} | Crediteuren | ${gt(K0)}\nBank | ${gt(B0)} | |\nIn het jaar gebeurde het volgende (alles per bank, tenzij anders vermeld):\n- Goederen op rekening ingekocht ${eur(Ink)}; aan crediteuren betaald ${eur(BC)}.\n- Omzet (alles op rekening) ${eur(Omz)}; inkoopwaarde van de omzet ${eur(IW)}; van debiteuren ontvangen ${eur(OD)}.\n- Overige bedrijfskosten betaald ${eur(OK)}; interest betaald ${eur(Int)}; op de lening afgelost ${eur(Afl)}.\n- Nieuwe inventaris gekocht ${eur(NI)}; afschrijving op inventaris ${eur(Af)}.\n- Privé-opnamen van de eigenaar ${eur(PO)}.`, stappen:[
      R('Bereken de EBITDA.', Omz-IW-OK,'€', `Omzet − inkoopwaarde − overige kosten = ${gt(Omz)} − ${gt(IW)} − ${gt(OK)} = ${eur(Omz-IW-OK)}.`,{hint:'EBITDA = resultaat vóór interest, belasting en afschrijving.'}),
      R('Bereken de EBIT.', Omz-IW-OK-Af,'€', `EBITDA − afschrijving = ${gt(Omz-IW-OK)} − ${gt(Af)} = ${eur(Omz-IW-OK-Af)}.`),
      R('Bereken het resultaat van dit jaar.', Res,'€', `EBIT − interest = ${gt(Omz-IW-OK-Af)} − ${gt(Int)} = ${eur(Res)}.`),
      {t:'schema', q:'Bereken de activa op de eindbalans van 31 december.', kop:['Activa','€'], rij:[{l:'Inventaris',c:[{n:I1}]},{l:'Voorraad goederen',c:[{n:V1}]},{l:'Debiteuren',c:[{n:D1}]},{l:'Bank',c:[{n:B1}]}],
        u:`Inventaris ${gt(I0)} + ${gt(NI)} − ${gt(Af)} = ${gt(I1)}. Voorraad ${gt(V0)} + ${gt(Ink)} − ${gt(IW)} = ${gt(V1)}. Debiteuren ${gt(D0)} + ${gt(Omz)} − ${gt(OD)} = ${gt(D1)}. Bank ${gt(B0)} + ${gt(OD)} − ${gt(BC)} − ${gt(OK)} − ${gt(Int)} − ${gt(Afl)} − ${gt(PO)} − ${gt(NI)} = ${gt(B1)}.`,hint:'Begin bij de beginstand. Tel op wat erbij komt, trek af wat eraf gaat.'},
      {t:'schema', q:'Bereken de passiva op de eindbalans van 31 december.', kop:['Passiva','€'], rij:[{l:'Eigen vermogen',c:[{n:E1}]},{l:'Lening',c:[{n:L1}]},{l:'Crediteuren',c:[{n:K1}]}],
        u:`Eigen vermogen ${gt(E0b)} + resultaat ${gt(Res)} − privé ${gt(PO)} = ${gt(E1)}. Lening ${gt(L0)} − ${gt(Afl)} = ${gt(L1)}. Crediteuren ${gt(K0)} + ${gt(Ink)} − ${gt(BC)} = ${gt(K1)}.`,hint:'Het resultaat komt bij het eigen vermogen, privé-opnamen gaan eraf.'},
      R('Bereken het balanstotaal op 31 december.', I1+V1+D1+B1,'€', `Activa ${gt(I1)} + ${gt(V1)} + ${gt(D1)} + ${gt(B1)} = ${eur(I1+V1+D1+B1)}. Passiva ${gt(E1)} + ${gt(L1)} + ${gt(K1)} = ${eur(E1+L1+K1)}. De balans sluit.`),
      M('Waarom staan de privé-opnamen niet op de resultatenrekening?','Het zijn geen kosten van het bedrijf: de eigenaar haalt vermogen uit de zaak',['Omdat ze al bij de afschrijvingen zitten','Omdat ze pas volgend jaar worden betaald','Omdat ze bij de overige bedrijfskosten horen'],'Privé-opnamen verlagen het eigen vermogen direct, niet via het resultaat.'),
      M('Welke posten zijn wel een uitgave maar geen kosten?','Aflossing en de aankoop van nieuwe inventaris',['Afschrijving en interest','Inkoopwaarde van de omzet en overige kosten','Interest en aflossing'],'Aflossing verlaagt een schuld. Bij de aankoop van inventaris komen de kosten later, via de afschrijving.')
    ]} }},

 {id:'obligatie',ic:'📜',titel:'Obligaties',sub:'Emissie met agio, couponrente, beleggersrendement en converteerbare obligaties',prio:3,niv:'',e:'B.sparen',top:['obligaties','beleggen'],
  maak(){ const n=pick([5,10,20,40])*1000, c=pick([3,3.5,4,5]), ek=pick([100.5,101,101.5,102]), k0=pick([96,98,100,102]), k1=k0+pick([-3,-2,2,3,4]), cp=pick([20,25,40,50]), ka=cp*pick([0.8,0.9,1.2,1.3]);
    return {intro:`Een nv geeft ${gt(n)} obligaties uit van € 1.000 nominaal, met een coupon van ${pc(c)}% per jaar. De emissiekoers is ${pc(ek)}%. Later wordt de obligatie verhandeld op de beurs.`, stappen:[
      R('Bereken de opbrengst van de obligatielening voor de nv.', n*10*ek,'€', `${gt(n)} × ${pc(ek)}% × 1.000 = ${eur(n*10*ek)}.`),
      R('Bereken het agio op de obligatielening.', r2(n*10*(ek-100)),'€', `${gt(n)} × (${pc(ek)}% − 100%) × 1.000 = ${eur(n*10*(ek-100))}.`),
      R('Hoeveel couponrente betaalt de nv per jaar?', n*10*c,'€', `${pc(c)}% × ${gt(n*1000)} nominaal = ${eur(n*10*c)}. De coupon gaat altijd over de nominale waarde.`,{hint:'Couponrente = couponpercentage × nominale waarde.'}),
      R(`Een belegger koopt één obligatie op de beurs voor ${pc(k0)}% en verkoopt hem een jaar later, direct na de couponbetaling, voor ${pc(k1)}%. Bereken het couponrendement (1 decimaal).`, r1(c/k0*100),'%', `${pc(c*10)} / ${gt(k0*10)} × 100% = ${nl1(c/k0*100)}%.`),
      R('Bereken het koersrendement (1 decimaal, negatief kan).', r1((k1-k0)/k0*100),'%', `(${gt(k1*10)} − ${gt(k0*10)}) / ${gt(k0*10)} × 100% = ${nl1((k1-k0)/k0*100)}%.`),
      R('Bereken het totale beleggersrendement (1 decimaal).', r1((c+k1-k0)/k0*100),'%', `Couponrendement + koersrendement = (${pc(c*10)} + ${gt((k1-k0)*10)}) / ${gt(k0*10)} × 100% = ${nl1((c+k1-k0)/k0*100)}%.`,{tol:0.11}),
      M('De marktrente stijgt. Wat gebeurt er met de beurskoers van deze obligatie?','Die daalt, want nieuwe obligaties geven een hogere coupon',['Die stijgt, want de coupon wordt ook hoger','Die blijft gelijk, want de coupon ligt vast','Die stijgt tot de nominale waarde'],'Een vaste coupon wordt minder aantrekkelijk als de marktrente stijgt. De koers daalt tot het rendement weer marktconform is.'),
      R(`Een converteerbare obligatie van € 1.000 kan worden omgezet in aandelen tegen een conversieprijs van ${eur(cp)}. Het aandeel noteert ${eur(ka)}. Bereken de conversiewaarde van één obligatie.`, r2(1000/cp*ka),'€', `1.000 / ${cp} = ${gt(1000/cp)} aandelen × ${nl1(ka)} = ${eur(1000/cp*ka)}. ${ka>cp?'Hoger dan € 1.000: converteren is aantrekkelijk.':'Lager dan € 1.000: converteren loont nu niet.'}`),
      M('Waarom is de coupon van een converteerbare obligatie lager dan van een gewone obligatie?','De belegger krijgt er het recht bij om te converteren in aandelen',['Omdat de looptijd korter is','Omdat de nv dan geen agio hoeft te betalen','Omdat converteerbare obligaties geen risico hebben'],'Het conversierecht heeft waarde. Daarom accepteert de belegger een lagere coupon.')
    ]} }},

 {id:'afschrijving',ic:'🛠️',titel:'Afschrijven op een machine',sub:'Aanschafprijs zonder btw, afschrijvingspercentage, boekwaarde en terugrekenen',prio:3,niv:'',e:'F.perio',top:['afschrijving'],
  maak(){ const n=pick([5,6,8,10]), d=pick([5,6,8,9])*1000, R0=pick([2,4,5,6])*1000, Iex=pick([1,2,3,4])*1000, tot=d*n+R0, Aex=tot-Iex, ms=pick([3,4,7,10]), J=pick([2026,2027]);
    const n2=pick([8,10]), BW=pick([30,45,60])*1000, k2=pick([2,3,4]), A2=BW/(1-k2/n2);
    return {intro:`Een bedrijf koopt op 1 ${mnd(ms)} ${J} een machine voor ${eur(Aex*1.21)} inclusief 21% btw. De installatiekosten zijn ${eur(Iex*1.21)} inclusief 21% btw. De economische levensduur is ${n} jaar en de restwaarde ${eur(R0)} (zonder btw). Er wordt afgeschreven met een vast percentage van de aanschafprijs. Het bedrijf mag de btw terugvragen.`, stappen:[
      R('Bereken de uitgave op 1 '+mnd(ms)+' (de betaling inclusief btw).', r2((Aex+Iex)*1.21),'€', `${eur(Aex*1.21)} + ${eur(Iex*1.21)} = ${eur((Aex+Iex)*1.21)}. Dit bedrag staat op de liquiditeitsbegroting.`),
      R('Bereken de aanschafprijs waarover wordt afgeschreven.', tot,'€', `(${gt(Aex*1.21)} + ${gt(Iex*1.21)}) / 1,21 = ${eur(tot)}. Zonder btw, met installatiekosten.`,{hint:'Btw die je terugkrijgt is geen kostenpost. Installatiekosten horen bij de aanschafprijs.'}),
      R('Bereken de afschrijvingskosten per jaar.', d,'€', `(${gt(tot)} − ${gt(R0)}) / ${n} = ${eur(d)}.`),
      R('Bereken het jaarlijkse afschrijvingspercentage (2 decimalen).', r2(d/tot*100),'%', `${gt(d)} / ${gt(tot)} × 100% = ${pc(r2(d/tot*100))}%.`,{tol:0.011,toon:pc(r2(d/tot*100))+'%'}),
      R(`Bereken de afschrijvingskosten over ${J}.`, r2(d*(13-ms)/12),'€', `${13-ms} maanden: ${13-ms}/12 × ${gt(d)} = ${eur(d*(13-ms)/12)}.`),
      R(`Bereken de boekwaarde op 31 december ${J+2}.`, r2(tot-d*((13-ms)/12+2)),'€', `${gt(tot)} − (${13-ms}/12 + 2) × ${gt(d)} = ${eur(tot-d*((13-ms)/12+2))}.`),
      R(`Een andere machine heeft geen restwaarde en een levensduur van ${n2} jaar. Na precies ${k2} jaar is de boekwaarde ${eur(BW)}. Bereken de aanschafprijs.`, r2(A2),'€', `Na ${k2} van de ${n2} jaar is nog ${n2-k2}/${n2} over. Aanschafprijs = ${gt(BW)} / (${n2-k2}/${n2}) = ${eur(A2)}.`,{hint:'Welk deel van de aanschafprijs is na '+k2+' jaar nog over?'}),
      M('Wat is het verschil tussen de economische en de technische levensduur?','Economisch: zolang gebruik economisch verantwoord is; technisch: tot de machine versleten is',['Economisch: tot de machine versleten is; technisch: zolang hij winst oplevert','Ze zijn altijd gelijk','Technisch is altijd korter dan economisch'],'Een machine kan technisch nog werken, maar door hoge onderhoudskosten of nieuwe techniek economisch niet meer verantwoord zijn.')
    ]} }},

 {id:'krediet',ic:'💳',titel:'Persoonlijke lening',sub:'Interest en aflossing per maand, kredietkosten en effectieve jaarrente',prio:3,niv:'',e:'B.lenen',top:['vreemdvermogen','prive'],
  maak(){ const L=pick([5,8,10,12,15,20])*1000, im=pick([0.6,0.7,0.8,0.9,1]), n=pick([48,60,72]); const T=Math.ceil(L*(im/100)/(1-Math.pow(1+im/100,-n)));
    const i1=r2(L*im/100), a1=r2(T-i1), i2=r2((L-a1)*im/100), a2=r2(T-i2), eff=r2((Math.pow(1+im/100,12)-1)*100);
    return {intro:`Sanne sluit een persoonlijke lening af van ${eur(L)}. Ze betaalt ${n} maanden lang ${eur(T)} per maand. De interest is ${pc(im)}% per maand over de schuld aan het begin van de maand.`, stappen:[
      R('Bereken de interest in de eerste maand.', i1,'€', `${pc(im)}% × ${gt(L)} = ${eur(i1)}.`),
      R('Bereken de aflossing in de eerste maand.', a1,'€', `${eur(T)} − ${eur(i1)} = ${eur(a1)}.`,{hint:'Termijnbedrag = interest + aflossing.'}),
      R('Bereken de aflossing in de tweede maand.', a2,'€', `Schuld = ${eur(L)} − ${eur(a1)} = ${eur(L-a1)}. Interest = ${pc(im)}% × ${nl1(L-a1)} = ${eur(i2)}. Aflossing = ${eur(T)} − ${eur(i2)} = ${eur(a2)}.`),
      R('Bereken de totale kredietkosten.', n*T-L,'€', `${n} × ${gt(T)} − ${gt(L)} = ${eur(n*T-L)}.`),
      R('Bereken de effectieve interest per jaar (2 decimalen).', eff,'%', `(1 + ${pc(im/100)})^12 − 1 = ${pc(eff)}%. Meer dan 12 × ${pc(im)}% door rente op rente.`,{tol:0.011,toon:pc(eff)+'%'}),
      M('Hoe wordt deze lening afgelost?','Met annuïteiten: elke maand hetzelfde bedrag, met een dalend interestdeel',['Lineair: elke maand dezelfde aflossing','In één keer aan het einde van de looptijd','Alleen interest, geen aflossing'],'Het termijnbedrag is elke maand gelijk. Dat is een annuïteitenlening.'),
      M('Waarom is de rente op een persoonlijke lening hoger dan op een hypotheek?','Er is geen onderpand, dus de kredietverstrekker loopt meer risico',['Omdat de looptijd langer is','Omdat de bedragen hoger zijn','Omdat de overheid dat voorschrijft'],'Bij een hypotheek is de woning onderpand. Bij consumptief krediet kan de bank bij wanbetaling niets verkopen.'),
      M('Wat is een gevolg als Sanne later een huis wil kopen?','De lening staat bij het BKR geregistreerd en verlaagt haar maximale hypotheek',['Ze krijgt een lagere hypotheekrente','De lening wordt automatisch omgezet in een hypotheek','Er is geen gevolg, want het is een kleine lening'],'Hypotheekverstrekkers houden rekening met de maandlasten van lopende kredieten (en ook van private lease).')
    ]} }}
];

// ---------- starten, hints en nakijken ----------
const casusVoor = () => CASUSSEN.filter(c=>!c.niv||c.niv===niv());
function startCasus(id){ const c=CASUSSEN.find(x=>x.id===id); if(!c) return; const d=c.maak();
  const st=d.stappen.filter(s=>!s.niv||s.niv===niv());
  const vragen=st.map((s,k)=>Object.assign(s,{id:`gen.casus.${id}.${k+1}`,gen:true,e:s.e||c.e,ctx:d.intro,_casus:id}));
  Q={modus:'casus',casus:id,titel:c.titel,vragen,i:0,res:[],terug:"go('casus')"}; go('quiz') }
const _nakijkenC=nakijken; nakijken=function(v,a){ if(v.t==='reken'&&v.tol!=null){ const x=parseGetal(a); return !isNaN(x)&&Math.abs(x-v.a)<=v.tol+1e-9 } return _nakijkenC(v,a) };
const _juistC=juistTekst; juistTekst=function(v){ return v.toon||_juistC(v) };
const _tekenC=tekenVraag; tekenVraag=function(){ _tekenC(); const v=Q&&Q.vragen[Q.i]; if(!v) return;
  if(Q.modus==='casus'){ const c=$('.vctx'); if(c){ c.classList.add('casusIntro'); if(Q.i>0) c.outerHTML=`<details class="casusIntro" open><summary>Gegevens van de casus</summary>${c.innerHTML}</details>` } }
  if(v.hint&&!Q.geenFb&&Q.modus!=='toets') $('#fb').insertAdjacentHTML('beforebegin',`<p class="hintRij" style="margin:8px 0 0"><button class="knop zacht klein" onclick="casusHint(this)">💡 Hint</button></p>`) };
function casusHint(el){ const v=Q&&Q.vragen[Q.i]; if(!v||!v.hint) return; el.parentNode.innerHTML=`<span class="hint">💡 ${esc(v.hint)}</span>` }
const _afrondenC=afronden; afronden=function(v){ _afrondenC(v); if(Q.modus==='casus'&&!Q.res[Q.res.length-1]&&Q.i<Q.vragen.length-1){ const f=$('#fb .fb'); if(f) f.insertAdjacentHTML('beforeend','<br><b>Reken in de volgende stap verder met het juiste antwoord.</b>') } };
const _klaarC=klaar; klaar=function(){ if(Q.modus!=='casus') return _klaarC(); const id=Q.casus, n=Q.res.filter(Boolean).length, tot=Q.vragen.length;
  S.cs=S.cs||{}; const r=S.cs[id]||{b:0,n:0}; r.n=(r.n||0)+1; r.b=Math.max(r.b||0,Math.round(n/tot*100)); S.cs[id]=r; _klaarC();
  const v=document.querySelector('.kaart.mid .voet'); if(v) v.insertAdjacentHTML('beforeend',`<button class="knop" onclick="startCasus('${id}')">Zelfde casus, nieuwe getallen</button>`) };

// ---------- scherm ----------
FOTO.casus=FOTO.dF||FOTO.dA;
function casusKnop(top){ const c=casusRang().filter(x=>x.top.includes(top)); return c.map(x=>`<button class="knop zacht" style="min-height:36px;padding:4px 12px;font-size:14px" onclick="startCasus('${x.id}')">🧩 Casus: ${esc(x.titel)}</button>`).join('') }
// Volgorde en keuze volgen het eindexamen van het eigen niveau: gewicht = aandeel van de examenpunten (2021-2026) van de onderwerpen van de casus.
// Dekking: welk deel van een examenonderwerp de casus oefent (een breed onderwerp als vreemd vermogen telt maar deels mee).
const CASUS_DEKKING={lening:{vreemdvermogen:.5,periodisering:1},annuiteit:{vreemdvermogen:.3,woning:.5},krediet:{vreemdvermogen:.2,prive:.3},
  pand:{periodisering:.5,liquiditeitsbegroting:.7,afschrijving:1},nacalc:{kostprijs:.5,verschillen:1},breakeven:{breakeven:1,kostprijs:.5},
  emissie:{aandelen:.7},winst:{winstverdeling:1,vpb:.7},kengetal:{kengetallen:1,cashflow:.7},eindbalans:{balans:.7,resultaat:.5,verslaggeving:.3},
  obligatie:{obligaties:1,beleggen:.3},afschrijving:{afschrijving:1}};
function casusGewicht(c){ const t=typeof exTop==='function'?exTop():[]; const dk=CASUS_DEKKING[c.id]||{}; return Math.round(t.filter(o=>c.top.includes(o.id)).reduce((a,o)=>a+o.pct*(dk[o.id]??1),0)*10)/10 }
const casusRang = () => casusVoor().map(c=>Object.assign({},c,{w:casusGewicht(c)})).sort((a,b)=>b.w-a.w);
// Examentraining: kies een casus naar examengewicht, met voorrang voor casussen die je nog niet (goed) gemaakt hebt.
function startCasusExamen(){ const l=casusRang(); const sc=c=>{ const r=(S.cs||{})[c.id]; return Math.max(0.5,c.w)*(r?Math.max(0.25,1-r.b/100):1.5) };
  let x=Math.random()*l.reduce((a,c)=>a+sc(c),0); for(const c of l){ x-=sc(c); if(x<=0) return startCasus(c.id) } startCasus(l[0].id) }
SCHERMEN.casus=function(){
  const l=casusRang(), max=Math.max(1,...l.map(c=>c.w));
  const tegel=c=>{ const r=(S.cs||{})[c.id]; const top=c.top.map(t=>((typeof EX_ONDERWERPEN!=='undefined'&&EX_ONDERWERPEN.find(o=>o.id===t))||{}).naam).filter(Boolean);
    return `<button class="uitdaging" onclick="startCasus('${c.id}')"><span class="thumb" style="background:var(--bg);display:grid;place-items:center;font-size:28px">${c.ic}</span><span style="flex:1"><b>${esc(c.titel)}${c.niv==='v'?' <span class="chip" style="font-size:11px">vwo</span>':''}</b><small>${esc(c.sub)}</small>
      <small><b>oefent ${nl1(c.w)}% van de examenpunten ${NIVEAUS[niv()]}</b>${top.length?` (${esc(top.join(', '))})`:''}${r?` · jouw beste score ${r.b}% (${r.n}×)`:' · nog niet gemaakt'}</small><div class="balk" style="margin-top:6px"><i style="width:${Math.round(c.w/max*100)}%"></i></div></span></button>` };
  const g1=l.slice(0,4), g2=l.slice(4,8), g3=l.slice(8);
  const groep=(x,t)=>x.length?`<div class="sectie">${t}</div><div class="kaart">${x.map(tegel).join('')}</div>`:'';
  return `<div class="wrap" style="max-width:760px">${kop('Casustrainer',"go('leren')")}
   <div class="kaart" style="margin-bottom:6px"><p style="margin:0 0 10px">Een casus is een grote opgave over één bedrijf, in stappen die op elkaar voortbouwen, net als op het examen. Elke keer andere getallen. De casussen staan op volgorde van hoeveel punten hun onderwerpen opleverden in de centrale examens ${NIVEAUS[niv()]} van 2021 tot en met 2026. Weet je het niet? Gebruik de 💡 hint. Heb je een stap fout, dan zie je het juiste antwoord en reken je daarmee verder.</p>
   <button class="knop" onclick="startCasusExamen()">🎯 Examentraining: kies een casus voor mij</button><p class="zacht" style="font-size:13px;margin:6px 0 0">Kiest vaker de casussen met veel examenpunten en de casussen waar jij nog niet goed in bent.</p></div>
   ${groep(g1,'Meeste examenpunten: begin hier')}${groep(g2,'Vaak op het examen')}${groep(g3,'Minder vaak op het examen')}</div>${VOET()}`;
};
const _lerenC=SCHERMEN.leren; SCHERMEN.leren=function(){ return _lerenC().replace('<div class="kaart">',`<div class="kaart"><button class="uitdaging" onclick="go('casus')"><span class="thumb" style="background:var(--bg);display:grid;place-items:center;font-size:28px">🧩</span><span><b>Casustrainer</b><small>Grote opgaven in stappen: lening op een tijdlijn, nacalculatie, winstverdeling, kengetallen en meer</small></span></button>`) };

// ---------- losse oefeningen voor de Werkplaats ----------
const VN_POOL=[
 ['De grondstof is duurder ingekocht dan de standaardprijs','prijsresultaat','nadelig'],
 ['Door een kwantumkorting is de grondstof goedkoper ingekocht dan standaard','prijsresultaat','voordelig'],
 ['Het werkelijke uurloon is lager dan het standaardtarief','prijsresultaat','voordelig'],
 ['Door een nieuwe cao is het uurloon hoger dan het standaardtarief','prijsresultaat','nadelig'],
 ['Er is minder grondstof verbruikt dan standaard is toegestaan','efficiencyresultaat','voordelig'],
 ['Door slecht onderhoud van de machines is er meer uitval van materiaal','efficiencyresultaat','nadelig'],
 ['Er zijn meer arbeidsuren gemaakt dan standaard is toegestaan','efficiencyresultaat','nadelig'],
 ['Door nieuwe software werken de medewerkers sneller dan standaard','efficiencyresultaat','voordelig'],
 ['De werkelijke productie is hoger dan de normale productie','bezettingsresultaat','voordelig'],
 ['Een grote klant bestelt minder, waardoor de productie onder de normale productie ligt','bezettingsresultaat','nadelig'],
 ['De huur van het pand is halverwege het jaar verhoogd','budgetresultaat','nadelig'],
 ['De verzekeringspremie voor het gebouw valt lager uit dan begroot','budgetresultaat','voordelig'],
 ['Er worden meer producten verkocht dan begroot (verkoopprijs hoger dan kostprijs)','verkoopresultaat','voordelig'],
 ['Er worden minder producten verkocht dan begroot (verkoopprijs hoger dan kostprijs)','verkoopresultaat','nadelig']];
const TN_EVT=[
 ['Een crediteur wordt per bank betaald',{liq:-1,kvv:-1}],['Goederen worden op rekening ingekocht',{vrd:1,kvv:1}],['Een debiteur betaalt per bank',{deb:-1,liq:1}],
 ['Er wordt een machine gekocht en per bank betaald',{va:1,liq:-1}],['Er wordt een langlopende lening afgesloten; het geld komt op de bank',{liq:1,lvv:1}],
 ['Er wordt per bank afgelost op een langlopende lening',{liq:-1,lvv:-1}],['Er worden nieuwe aandelen uitgegeven; het geld komt op de bank',{liq:1,ev:1}],
 ['Er wordt een machine gekocht met rekening-courantkrediet',{va:1,kvv:1}],['Er wordt per bank dividend uitgekeerd',{liq:-1,ev:-1}],
 ['Goederen worden contant verkocht tegen de inkoopprijs',{vrd:-1,liq:1}]];
const TN_KG=[['current ratio','vlottende activa','kort vreemd vermogen',b=>b.vrd+b.deb+b.liq,b=>b.kvv],['quick ratio','vlottende activa zonder voorraad','kort vreemd vermogen',b=>b.deb+b.liq,b=>b.kvv],['solvabiliteit (eigen vermogen / totaal vermogen)','eigen vermogen','totaal vermogen',b=>b.ev,b=>b.ev+b.lvv+b.kvv]];
const richting=(a,b)=>Math.abs(a-b)<1e-9?'blijft gelijk':(b>a?'stijgt':'daalt');
Object.assign(GENS,{
  tijdlijnLening(){ const L=leningData(); return Object.assign(tijdlijnStap(L),{e:'F.perio',q:L.tekst+'\n'+tijdlijnStap(L).q}) },
  voordeligNadelig(){ const r=kiesN(VN_POOL,5); return {t:'schema',e:'F.versch',q:'Geef bij elke situatie aan welk resultaat het oplevert en of dat voordelig of nadelig is.',kop:['Situatie','Soort resultaat','Voordelig of nadelig'],
    rij:r.map(([s,k,v])=>({l:s,c:[{s:['prijsresultaat','efficiencyresultaat','bezettingsresultaat','budgetresultaat','verkoopresultaat'],a:k},{s:['voordelig','nadelig'],a:v}]})),tip:'Kies per regel het soort resultaat en voordelig of nadelig.',
    u:r.map(([s,k,v])=>`${s}: ${k}, ${v}`).join('. ')+'.'} },
  tellerNoemer(){ const k=1000; const b={va:pick([300,400,500])*k,vrd:pick([60,80,100])*k,deb:pick([40,50,60])*k,liq:pick([20,30,40])*k,lvv:pick([150,200,250])*k,kvv:pick([60,80,100,140])*k}; b.ev=b.va+b.vrd+b.deb+b.liq-b.lvv-b.kvv;
    const [ev,m]=pick(TN_EVT), kg=pick(TN_KG), B=pick([10,20,30])*k; const n=Object.assign({},b); for(const x in m) n[x]+=m[x]*B;
    const t0=kg[3](b),t1=kg[3](n),n0=kg[4](b),n1=kg[4](n);
    return {t:'schema',e:'G.kengetal',q:`Balans van een bv (× € 1.000): vaste activa ${gt(b.va/k)}, voorraad ${gt(b.vrd/k)}, debiteuren ${gt(b.deb/k)}, liquide middelen ${gt(b.liq/k)} | eigen vermogen ${gt(b.ev/k)}, lang vreemd vermogen ${gt(b.lvv/k)}, kort vreemd vermogen ${gt(b.kvv/k)}.\nGebeurtenis: ${ev} (${eur(B)}).\nWat is het effect op de ${kg[0]}?`,kop:['','Effect'],
      rij:[{l:`Teller (${kg[1]})`,c:[{s:['stijgt','daalt','blijft gelijk'],a:richting(t0,t1)}]},{l:`Noemer (${kg[2]})`,c:[{s:['stijgt','daalt','blijft gelijk'],a:richting(n0,n1)}]},{l:`De ${kg[0]}`,c:[{s:['stijgt','daalt','blijft gelijk'],a:richting(t0/n0,t1/n1)}]}],
      tip:'Bepaal eerst welke balansposten veranderen. Let op: als teller en noemer evenveel dalen, hangt het effect af van of het kengetal boven of onder 1 ligt.',
      u:`Teller ${gt(t0/k)} → ${gt(t1/k)}, noemer ${gt(n0/k)} → ${gt(n1/k)}. Kengetal ${pc(r2(t0/n0))} → ${pc(r2(t1/n1))}.`} }
});
WERKPLAATS.splice(WERKPLAATS.length-1,0,['⏳','Tijdlijn van een lening','Betaalmomenten en de schuld per periode','tijdlijnLening'],['🟢','Voordelig of nadelig?','Welk resultaat, en is het voordelig of nadelig?','voordeligNadelig'],['➗','Teller en noemer','Wat doet een gebeurtenis met een kengetal?','tellerNoemer']);

// ---------- formulekaart: formules bij de casussen ----------
FORMULES.push(
 {d:'D',n:'Interest vooruit of achteraf',f:'interestkosten per maand = interest% per jaar / 12 × schuld in die maand',u:'Kosten horen bij een periode, uitgaven bij een moment. Vooruitbetaalde interest staat bij de vlottende activa, nog te betalen interest bij het kort vreemd vermogen. Aflossing is geen kostenpost.',
  vb:'Lening € 300.000, 6% per jaar, per halfjaar achteraf betaald op 1 april en 1 oktober.\nOp 31 december: 3 maanden nog niet betaald → 3 × 0,5% × 300.000 = € 4.500 nog te betalen interest',in:[['i','Interest % per jaar'],['s','Schuld'],['m','Aantal maanden']],
  r:x=>`${nl1(x.m)} × ${nl1(x.i/12)}% × ${gt(x.s)} = <b>${eur(x.m*x.i/1200*x.s)}</b>`,g:['tijdlijnLening','nogTeBetalenInterest','vooruitbetaald']},
 {d:'D',n:'Aflossing bij een annuïteit',f:'interest = i × schuld begin periode · aflossing = annuïteit − interest',u:'Bij een annuïteitenlening is het termijnbedrag gelijk. Het interestdeel daalt, het aflossingsdeel stijgt. Totale interest = aantal termijnen × annuïteit − lening.',
  vb:'Lening € 10.000, 5%, annuïteit € 2.309,75.\nJaar 1: interest € 500, aflossing € 1.809,75\nJaar 2: interest 5% × 8.190,25 = € 409,51, aflossing € 1.900,24',in:[['s','Schuld begin periode'],['i','Interest %'],['a','Annuïteit']],
  r:x=>`Interest ${eur(x.s*x.i/100)}, aflossing <b>${eur(x.a-x.s*x.i/100)}</b>, nieuwe schuld ${eur(x.s-(x.a-x.s*x.i/100))}`,g:['annuiteit','aflossingstabel']},
 {d:'F',n:'Veiligheidsmarge',f:'(verwachte afzet − break-evenafzet) / verwachte afzet × 100%',u:'Zoveel procent mag de afzet dalen voordat de onderneming verlies lijdt.',
  vb:'Verwachte afzet 12.000, break-evenafzet 9.000.\n(12.000 − 9.000) / 12.000 × 100% = 25%',in:[['q','Verwachte afzet'],['b','Break-evenafzet']],r:x=>`(${gt(x.q)} − ${gt(x.b)}) / ${gt(x.q)} × 100% = <b>${nl1((x.q-x.b)/x.q*100)}%</b>`,g:['breakEven']},
 {d:'F',n:'Verkoopresultaat en nacalculatie',f:'verkoopresultaat = afzet × (verkoopprijs − standaardkostprijs) · werkelijk resultaat = verkoopresultaat + prijs- + efficiency- + bezettings- + budgetresultaat',u:'Met de nacalculatie verklaar je het hele verschil tussen begroot en werkelijk resultaat. Nadelige resultaten tellen negatief.',
  vb:'Afzet 10.000 × (€ 40 − € 32) = € 80.000 verkoopresultaat',in:[['q','Afzet'],['p','Verkoopprijs'],['k','Standaardkostprijs']],r:x=>`${gt(x.q)} × (${nl1(x.p)} − ${nl1(x.k)}) = <b>${eur(x.q*(x.p-x.k))}</b>`,g:['verkoopresultaat','prijsresultaat','efficiencyresultaat','bezettingsresultaat']},
 {d:'D',n:'Agio bij een emissie',f:'agio = aantal nieuwe aandelen × (emissiekoers − nominale waarde)',u:'Het geplaatst aandelenkapitaal stijgt altijd met de nominale waarde; het meerdere gaat naar de agioreserve.',
  vb:'100.000 aandelen van € 5 nominaal tegen € 18.\nAandelenkapitaal + € 500.000, agioreserve + € 1.300.000',in:[['n','Aantal aandelen'],['e','Emissiekoers'],['nw','Nominale waarde']],r:x=>`${gt(x.n)} × (${nl1(x.e)} − ${nl1(x.nw)}) = <b>${eur(x.n*(x.e-x.nw))}</b>`,g:['agio']},
 {d:'D',n:'Intrinsieke waarde per aandeel',f:'eigen vermogen / aantal geplaatste aandelen',u:'Bij preferente aandelen trek je eerst het preferente aandelenkapitaal af. Stockdividend verandert het eigen vermogen niet, wel het aantal aandelen.',
  vb:'Eigen vermogen € 8.000.000, 500.000 aandelen → € 16 per aandeel',in:[['ev','Eigen vermogen'],['n','Aantal aandelen']],r:x=>`${gt(x.ev)} / ${gt(x.n)} = <b>${eur(x.ev/x.n)}</b>`,g:['intrinsiekeWaarde']},
 {d:'G',n:'Hefboomformule',f:'REV = RTV + (RTV − IVV) × VV / EV',u:'Is de RTV hoger dan de IVV, dan verhoogt extra vreemd vermogen de REV (positief hefboomeffect). Reken met gemiddelde vermogens en REV vóór belasting.',
  vb:'RTV 10%, IVV 5%, VV 600.000, EV 400.000\nREV = 10 + (10 − 5) × 1,5 = 17,5%',in:[['rtv','RTV %'],['ivv','IVV %'],['vv','Vreemd vermogen'],['ev','Eigen vermogen']],r:x=>`${nl1(x.rtv)} + (${nl1(x.rtv)} − ${nl1(x.ivv)}) × ${gt(x.vv)} / ${gt(x.ev)} = <b>${nl1(x.rtv+(x.rtv-x.ivv)*x.vv/x.ev)}%</b>`,g:['hefboom','rev','rtv']},
 {d:'B',n:'Beleggersrendement obligatie',f:'(couponrente + koersverschil) / aankoopprijs × 100%',u:'Couponrendement = coupon / aankoopprijs. Koersrendement = (verkoopprijs − aankoopprijs) / aankoopprijs. Samen het beleggersrendement.',
  vb:'Gekocht 98%, verkocht 101%, coupon 4%.\n(40 + 30) / 980 × 100% = 7,1%',in:[['c','Coupon %'],['k0','Aankoopkoers %'],['k1','Verkoopkoers %']],r:x=>`(${nl1(x.c)} + ${nl1(x.k1-x.k0)}) / ${nl1(x.k0)} × 100% = <b>${nl1((x.c+x.k1-x.k0)/x.k0*100)}%</b>`,g:['couponrendement']}
);
