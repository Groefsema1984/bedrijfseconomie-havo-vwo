"""Zet de complete centrale examens bedrijfseconomie om naar src/data-examen.js, met de pagina's als afbeeldingen.

Invoer (examens/bron/): per examen de tekst van de pdf's, gemaakt met `pdftotext -layout`:
  {ex}-o.txt opgaven, {ex}-b.txt bijlage (informatiebronnen), {ex}-u.txt uitwerkbijlage, {ex}-c.txt correctievoorschrift,
  {ex}-A.txt aanvulling op het correctievoorschrift, {ex}-e.txt erratum bij de opgaven, {ex}-ue.txt erratum bij de uitwerkbijlage.
  ex = h25-1 (havo 2025 tijdvak 1), v22-3, ...
Afbeeldingen (examens/img/{ex}-{o|b|u}-{pagina}.jpg) maak je met: python3 tools/examen_beco.py --img <map met {ex}-{k}.pdf>

Per examenvraag komt er een open vraag met de tekst van de opgave, de vraag, het antwoordmodel met deelscores,
en de bijbehorende informatiebronnen, uitwerkbijlage en examenpagina als afbeelding.
"""
import glob, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from examen_onderwerpen import ONDERWERPEN, onderwerpen
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BRON = os.path.join(ROOT, 'examens', 'bron')
IMG = os.path.join(ROOT, 'examens', 'img')

# indeling naar de domeinen van de app (A-G), op trefwoorden; de vraag telt drie keer zo zwaar als de context
DOMEIN_WOORDEN = [
    ('G', ['balans', 'winst-en-verliesrekening', 'jaarrekening', 'jaarverslag', 'solvabiliteit', 'current ratio', 'quick ratio', 'rentabiliteit',
           'rtv', 'rev', 'kengetal', 'liquiditeit van', 'kasstroom', 'cashflow', 'accountant', 'ebit', 'hefboom', 'debt ratio', 'koers-winst',
           'waardering', 'herwaardering', 'voorziening', 'afschrijvingsmethode', 'boekwaarde', 'dividendrendement', 'pay-out', 'verslaggeving']),
    ('F', ['kostprijs', 'break-even', 'breakeven', 'dekkingsbijdrage', 'vaste kosten', 'variabele kosten', 'normale productie', 'bezettings',
           'absorption', 'direct costing', 'liquiditeitsbegroting', 'resultatenbegroting', 'begroting', 'budget', 'verschillenanalyse',
           'prijsverschil', 'efficiencyverschil', 'standaard', 'opslag', 'calculatie', 'kosten per', 'resultaat', 'omzet', 'winst']),
    ('D', ['investering', 'investeren', 'netto contante waarde', 'contante waarde', 'terugverdientijd', 'lening', 'financier', 'vermogen',
           'interest', 'rente', 'aflossing', 'annuïteit', 'obligatie', 'aandelen', 'emissie', 'agio', 'crowdfunding', 'krediet', 'lease',
           'hypothe', 'dividend', 'koers', 'eindwaarde', 'samengestelde']),
    ('E', ['marketing', 'marktonderzoek', 'doelgroep', 'promotie', 'reclame', 'social media', 'marktaandeel', 'merk', 'klant', 'positionering',
           'segment', 'distributie', 'prijsbeleid', 'prijsstrategie', 'elasticiteit', 'concurrent', 'product', 'propositie', 'afzet']),
    ('C', ['personeel', 'arbeidsovereenkomst', 'ontslag', 'werknemer', 'werkgever', 'loon', 'salaris', 'cao', 'transitievergoeding',
           'organisatie', 'organogram', 'leiding', 'functie', 'motivatie', 'verzuim', 'werving', 'sociale lasten', 'pensioen']),
    ('B', ['rechtsvorm', 'eenmanszaak', 'vof ', 'aansprakelijk', 'faillissement', 'surseance', 'testament', 'erfenis', 'inkomstenbelasting', 'box',
           'ondernemersaftrek', 'zelfstandigenaftrek', 'vennootschapsbelasting', 'ondernemingsplan', 'zelfstandig', 'starter', 'erf', 'schenk',
           'sparen', 'huishoud', 'budget', 'toeslag', 'btw', 'vennoot', 'maatschap', 'franchise']),
]
EX_DOMEIN = {}   # handmatige correcties: 'h25-1.4': 'C'

def domein(q, ctx=''):
    q, c = q.lower(), ctx.lower()
    score = {d: 3 * sum(q.count(w) for w in ws) + sum(c.count(w) for w in ws) for d, ws in DOMEIN_WOORDEN}
    beste = max(score.values())
    if not beste: return 'F'
    return next(d for d, _ in DOMEIN_WOORDEN if score[d] == beste)

VOET = re.compile(r'^\s*(?:(?:HA|VW)-0400-a-\S+.*|.*lees verder\s*\S*\s*|\s*einde\s*\S?\s*|Vraag\s+Antwoord\s+Scores\s*)$')

SYMBOOL = {0xf02d: '-', 0xf06e: '-', 0xf0b7: '-', 0xf028: '(', 0xf029: ')', 0xf02b: '+', 0xf03d: '=', 0xf0e0: '→', 0xf0b4: '×',
           **{c: '' for c in (0xf0e6, 0xf0e7, 0xf0e8, 0xf0f6, 0xf0f7, 0xf0f8)}}

def schone_regel(l):
    l = l.translate(SYMBOOL).replace('\u0336', '').replace('\u25ba', '').replace('\u00ad', '')
    l = re.sub(r'^(\s*)[̶−–](?=\s)', r'\1-', l)
    return l.rstrip()

def paginas(tekst):
    """-> lijst van pagina's, elk een lijst schone regels (zonder voet- en kopregels)"""
    uit = []
    for p in tekst.split('\f'):
        uit.append([schone_regel(l) for l in p.split('\n') if not VOET.match(l)])
    return uit

def cellen(l):
    return [c for c in re.split(r'\s{3,}', l.strip()) if c]

def alinea_tekst(regels):
    """regels van één alinea -> tekst; tabellen worden 'a | b | c', opsommingen '- …', de rest één regel"""
    rr = [r for r in regels if r.strip() and r.strip() not in ('-', '■', '∎')]
    if not rr: return ''
    tab = [r for r in rr if len(cellen(r)) >= 2]
    if len(tab) >= 2 and len(tab) >= len(rr) / 2:
        rows = []
        ins0 = min(len(r) - len(r.lstrip()) for r in rr)
        for r in rr:
            c = cellen(r)
            if len(c) == 1 and rows and not r.lstrip().startswith(('-', '•')):
                if len(r) - len(r.lstrip()) <= ins0 + 2: rows[-1][0] += ' ' + c[0]   # vervolg van de eerste kolom
                else: rows[-1][-1] += ' ' + c[0]   # vervolgregel van de laatste cel
            else:
                rows.append(c)
        return '\n'.join(' | '.join(c) for c in rows)
    uit, cur = [], ''
    for r in rr:
        s = r.strip()
        if re.match(r'^[-•]\s|^[a-eA-F]\s|^\d\.\s', s) and cur:
            uit.append(cur); cur = s
        else:
            cur = (cur + ' ' + s).strip() if cur else s
    uit.append(cur)
    return '\n'.join(re.sub(r'\s{2,}', ' ', x) for x in uit)

VERVOLG = re.compile(r'^(Vul|Ga (uit|als volgt|hierbij)|Houd|Rond|Betrek|Leg (je|daarbij|hierbij|uit)|Licht (je|toe)|Motiveer|Geef (je|daarbij|hierbij|het|in)|'
                     r'Noteer|Gebruik (hierbij|daarbij|de uitwerkbijlage|onder)|Maak (hierbij|daarbij|gebruik)|Neem (aan|hierbij)|Je hoeft|Let op|'
                     r'Doe (het|dit)|Schrijf|Zie |Vermeld|Bereken (daarbij|hierbij|eerst)|Toon|Werk|Ga ervan|Laat|Er hoeft|De belastingen|Neem)')

def opgaven(tekst):
    """-> lijst vragen: {opgave, nr, pnt, q, ctx, intro, pagina, bronnen_opgave}"""
    blokken = []   # (soort, regels, pagina)
    for pi, regels in enumerate(paginas(tekst), 1):
        cur = []
        def af():
            if cur: blokken.append(('tekst', list(cur), pi)); cur.clear()
        for l in regels:
            mo = re.match(r'^\s*Opgave (\d+)\s*$', l)
            mq = re.match(r'^\s{0,8}(\d)p\s+(\d{1,2})\s+(\S.*)$', l)
            if mo: af(); blokken.append(('opgave', int(mo.group(1)), pi))
            elif mq: af(); blokken.append(('vraag', (int(mq.group(1)), int(mq.group(2))), pi)); cur.append(l)
            elif not l.strip(): af()
            else: cur.append(l)
        af()
    # vraagregels staan in het tekstblok direct na de 'vraag'-markering: herstel dat
    vragen, opg, intro, lokaal, bronnen = [], None, [], [], []
    i = 0
    begonnen = False
    while i < len(blokken):
        soort, inh, pi = blokken[i]
        if soort == 'opgave':
            opg, intro, lokaal, bronnen, begonnen = inh, [], [], [], True
            i += 1; continue
        if not begonnen: i += 1; continue
        if soort == 'tekst':
            t = alinea_tekst(inh)
            m = re.search(r'Bij deze opgave horen? de informatiebronnen? (\d+)(?: (?:tot en met|t/m|en) (\d+))?', t)
            if m:
                a, b = int(m.group(1)), int(m.group(2) or m.group(1))
                bronnen = list(range(a, b + 1)) if 't' in m.group(0).split(m.group(1))[1][:5] or not m.group(2) else [a, b]
            lokaal.append(t)
            if not any(v['opgave'] == opg for v in vragen): intro.append(t)
            i += 1; continue
        # soort == 'vraag'
        pnt, nr = inh
        # het tekstblok erna begint met de vraagregel
        regels = blokken[i + 1][1] if i + 1 < len(blokken) and blokken[i + 1][0] == 'tekst' else []
        j = i + 2
        qdelen = [alinea_tekst([re.sub(r'^\s{0,8}\dp\s+\d{1,2}\s+', '', regels[0])] + regels[1:])] if regels else ['']
        # doorlopen zolang de vraag niet af is
        while j < len(blokken) and blokken[j][0] == 'tekst':
            t = alinea_tekst(blokken[j][1])
            vorig = qdelen[-1]
            if re.search(r'(?m)^[A-F] \S', vorig) and re.search(r'(?m)^B \S', vorig): break   # meerkeuzeopties: vraag is af
            volgende_is_vraag = j + 1 < len(blokken) and blokken[j + 1][0] in ('vraag', 'opgave')
            opties = all(re.match(r'^[a-eA-F]\s', r) for r in t.split('\n'))
            if (re.search(r'[:,]\s*$', vorig) or opties or VERVOLG.match(t)
                    or not re.search(r'[.?!)]\s*$', vorig)) and not (volgende_is_vraag and re.match(r'^Gebruik ', t) and not VERVOLG.match(t)):
                qdelen.append(t); j += 1
            else: break
        # 'Gebruik informatiebron 3.' vlak boven de vraag hoort bij de vraag
        if lokaal and re.match(r'^(Gebruik|Maak gebruik)', lokaal[-1]) and len(lokaal[-1]) < 160:
            qdelen.insert(0, lokaal.pop())
            if intro and intro[-1] == qdelen[0]: intro.pop()
        vragen.append({'opgave': opg, 'nr': nr, 'pnt': pnt, 'q': '\n'.join(x for x in qdelen if x), 'ctx': '\n'.join(lokaal),
                       'intro': '\n'.join(intro), 'pagina': pi, 'bronnen_opgave': list(bronnen)})
        lokaal = []
        i = j
    return vragen

def bronpaginas(tekst):
    """bijlage -> {bronnummer: [pagina's]}"""
    uit, laatste = {}, None
    for pi, regels in enumerate(paginas(tekst), 1):
        gevonden = False
        for l in regels:
            m = re.match(r'^\s*[Ii]nformatiebron (\d+)\b', l)
            if m:
                laatste = int(m.group(1)); uit.setdefault(laatste, []).append(pi); gevonden = True
        if not gevonden and laatste and any(l.strip() for l in regels):
            uit[laatste].append(pi)   # bron loopt door op de volgende pagina
    return {k: sorted(set(v)) for k, v in uit.items()}

def uitwerkpaginas(tekst):
    """uitwerkbijlage -> {vraagnummer: pagina}"""
    uit = {}
    for pi, regels in enumerate(paginas(tekst), 1):
        for l in regels:
            m = re.match(r'^\s{0,10}(\d{1,2})\s*$', l)
            if m: uit.setdefault(int(m.group(1)), pi)
    return uit

def model_tekst(regels):
    """antwoordmodel (regels uit het correctievoorschrift) -> tekst voor fmt(): deelscores als '• … (1p)'"""
    rr = [r for r in regels]
    while rr and not rr[-1].strip(): rr.pop()
    while rr and not rr[0].strip(): rr.pop(0)
    if not rr: return ''
    ins = min(len(r) - len(r.lstrip()) for r in rr if r.strip())
    rr = [r[ins:] for r in rr]
    # alinea's
    alineas, cur = [], []
    for r in rr:
        if not r.strip():
            if cur: alineas.append(cur); cur = []
        else: cur.append(r)
    if cur: alineas.append(cur)
    uit = []
    for a in alineas:
        tab = [r for r in a if len(cellen(r)) >= 3 or (len(cellen(r)) == 2 and not re.search(r'\s{3,}\d\s*$', r))]
        if len(tab) >= 2 and len(tab) >= len(a) * 0.6 and not any(r.lstrip().startswith('•') for r in a):
            uit.append(alinea_tekst(a)); continue
        cur = ''
        for r in a:
            s = r.strip()
            score = re.search(r'\s{3,}(\d)\s*$', r)
            if score: s = s[:-1].rstrip()
            if re.match(r'^[•\-]\s*', s) or re.match(r'^(of|en)$', s) or (s.startswith(('Opmerking', 'per juist', 'indien', 'Voorbeeld', 'Een juist', 'Uit het'))):
                if cur: uit.append(cur)
                cur = re.sub(r'^•\s*', '• ', re.sub(r'^-\s*', '- ', s))
            else:
                cur = (cur + ' ' + s).strip() if cur else s
            if score:
                cur += f' ({score.group(1)}p)' if cur.startswith('•') else f' {score.group(1)}'
                uit.append(cur); cur = ''
        if cur: uit.append(cur)
    t = '\n'.join(re.sub(r'\s{2,}', ' ', x) if '|' not in x else x for x in uit)
    return t

def antwoorden(tekst):
    t = tekst
    k = [m.start() for m in re.finditer(r'4 Beoordelingsmodel', t)]
    if k: t = t[k[-1]:]
    t = re.split(r'\n\s*5 (?:Aanleveren|Inzenden) scores|\n\s*\d Bronvermeldingen', t)[0]
    regels = []
    for p in paginas(t):
        regels += [l for l in p if not re.match(r'^\s*(Opgave \d+|4 Beoordelingsmodel)\s*$', l)]
    uit, nr, buf = {}, None, []
    for l in regels:
        m = re.match(r'^\s*(\d{1,2})\s+maximumscore\s+(\d+)()\s*$', l) or re.match(r'^\s*(\d{1,2})\s+([A-F])()\s*$', l)
        if m and m.group(2).isalpha():
            if nr: uit[nr] = buf
            nr, buf = int(m.group(1)), [' ' + m.group(2)]
            uit.setdefault('_max', {})[nr] = 1
        elif m:
            if nr: uit[nr] = buf
            nr, buf = int(m.group(1)), []
            uit.setdefault('_max', {})[nr] = int(m.group(2))
        elif nr: buf.append(l)
    if nr: uit[nr] = buf
    mx = uit.pop('_max', {})
    return {n: (model_tekst(b), mx.get(n)) for n, b in uit.items()}

def mededelingen(tekst):
    """aanvulling of erratum -> {vraagnummer: tekst}"""
    t = '\n'.join(sum(paginas(tekst), []))
    t = re.split(r'\n\s*(?:Namens het College|Ik verzoek)', t)[0]
    uit = {}
    for seg in re.split(r'\n\s*(?=Op pagina \d+)', t):
        m = re.search(r'\bvraag (\d+)', seg)
        if not m or not re.match(r'\s*Op pagina', seg): continue
        s = re.sub(r'\n\s*en\s*$', '', seg.strip())
        uit.setdefault(int(m.group(1)), []).append(s)
    return uit

def vervang_model(model, med):
    """'… moet: <oud> vervangen worden door: <nieuw>' -> nieuw antwoordmodel als het oude stuk het hele model is"""
    m = re.search(r'moet:?\s*\n(.*?)\n\s*(?:vervangen worden door|worden vervangen door):\s*\n(.*?)(?:\n\s*Toelichting:?.*)?$', med, re.S)
    if not m: return None
    oud, nieuw = m.group(1), m.group(2)
    nieuw_t = model_tekst(nieuw.split('\n'))
    oud_t = model_tekst(oud.split('\n'))
    norm = lambda x: re.sub(r'\W+', '', x.lower())
    if norm(oud_t) and norm(oud_t) in norm(model):
        # alleen het genoemde stuk vervangen, op woordniveau
        ow = oud_t.split(); pat = r'\s+'.join(re.escape(w) for w in ow)
        if re.search(pat, model): return re.sub(pat, lambda _: nieuw_t, model, count=1)
        return nieuw_t if len(norm(oud_t)) > 0.6 * len(norm(model)) else None
    return None

def kort(med, erratum=False):
    s = re.sub(r'^\s*Op pagina \d+,?\s*', '', med.strip())
    s = re.sub(r'\n\s*Toelichting:?.*$', '', s, flags=re.S)
    m = re.search(r'(?:vervangen worden door|worden vervangen door):\s*\n(.*)$', s, re.S)
    if m and erratum:
        oud = re.search(r'moet[^\n]*\n(.*?)\n\s*(?:vervangen worden door|worden vervangen door)', s, re.S)
        return (f'„{" ".join(oud.group(1).split())}” is vervangen door: ' if oud else 'de tekst is vervangen door: ') + ' '.join(m.group(1).split())
    if m: return 'het antwoordmodel is aangepast. Nieuw antwoordmodel:\n' + model_tekst(m.group(1).split('\n'))
    m = re.search(r'aangevuld worden met:?\s*\n(.*)$', s, re.S)
    if m: return 'ook goed:\n' + model_tekst(m.group(1).split('\n'))
    m = re.search(r'(?:worden toegevoegd|toegevoegd worden):?\s*\n(.*)$', s, re.S)
    if m: return '\n' + model_tekst(m.group(1).split('\n'))
    return model_tekst(s.split('\n'))

def bron_refs(t):
    uit = []
    for m in re.finditer(r'informatiebron(?:nen)? (\d+)((?:\s*(?:,|en|tot en met|t/m)\s*\d+)*)', t, re.I):
        nums = [int(m.group(1))] + [int(x) for x in re.findall(r'\d+', m.group(2))]
        if re.search(r'tot en met|t/m', m.group(2)) and len(nums) == 2: nums = list(range(nums[0], nums[1] + 1))
        uit += nums
    return list(dict.fromkeys(uit))

def maak_img(pdfmap):
    os.makedirs(IMG, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(pdfmap, '*.pdf'))):
        m = re.match(r'(?:ha|h|vw|v)(\d\d-\d)-(o|b|u|ue)\.pdf$', os.path.basename(f))
        if not m or m.group(2) == 'ue': continue
        niv = 'h' if os.path.basename(f).startswith('h') else 'v'
        ex = niv + m.group(1)
        uit = os.path.join(IMG, f'{ex}-{m.group(2)}')
        subprocess.run(['pdftoppm', '-r', '85', '-jpeg', '-jpegopt', 'quality=62', f, uit], check=True)
        # pdftoppm nummert -01, -1 … : gelijk trekken naar {ex}-{k}-{p}.jpg
        for g in glob.glob(uit + '-*.jpg'):
            p = int(re.search(r'-(\d+)\.jpg$', g).group(1))
            os.replace(g, f'{uit}-{p}.jpg')

def main():
    if len(sys.argv) > 2 and sys.argv[1] == '--img': maak_img(sys.argv[2]); return
    bib = {}
    pad = os.path.join(ROOT, 'src', 'data-bibliotheek.js')
    if os.path.exists(pad):   # domein van examenvragen die al in de oefenbibliotheek staan
        for m in re.finditer(r'"id": "(ex\.[hv]\d\d-\d\.\d+)",[^}]*?"d": "([A-G])"', open(pad, encoding='utf-8').read()):
            bib[m.group(1)] = m.group(2)
    lees = lambda ex, k: open(os.path.join(BRON, f'{ex}-{k}.txt'), encoding='utf-8').read() if os.path.exists(os.path.join(BRON, f'{ex}-{k}.txt')) else ''
    imgs = set(os.path.basename(x)[:-4] for x in glob.glob(os.path.join(IMG, '*.jpg')))
    vragen, rapport = [], []
    for f in sorted(glob.glob(os.path.join(BRON, '*-o.txt'))):
        ex = os.path.basename(f)[:-6]
        niv, jaar, tv = ex[0], 2000 + int(ex[1:3]), int(ex[4])
        ops = opgaven(lees(ex, 'o'))
        cv = antwoorden(lees(ex, 'c'))
        bp = bronpaginas(lees(ex, 'b'))
        up = uitwerkpaginas(lees(ex, 'u'))
        aanv = mededelingen(lees(ex, 'A'))
        for n, m in mededelingen(lees(ex, 'A2')).items(): aanv.setdefault(n, []).extend(m)
        err = mededelingen(lees(ex, 'e'))
        for n, m in mededelingen(lees(ex, 'ue')).items(): err.setdefault(n, []).extend(m)
        mx = re.search(r'maximaal (\d+) punten', lees(ex, 'o'))
        tot = sum(v['pnt'] for v in ops)
        nrs = [v['nr'] for v in ops]
        if nrs != list(range(1, len(nrs) + 1)): rapport.append(f'{ex}: vraagnummers niet doorlopend: {nrs}')
        if mx and int(mx.group(1)) != tot: rapport.append(f'{ex}: {tot} punten gevonden, examen heeft er {mx.group(1)}')
        n_ok = 0
        for v in ops:
            a = cv.get(v['nr'])
            if not a or not a[0]: rapport.append(f'{ex} vraag {v["nr"]}: geen antwoord'); continue
            model, mpnt = a
            if mpnt and mpnt != v['pnt']: rapport.append(f'{ex} vraag {v["nr"]}: {v["pnt"]}p in opgaven, {mpnt} in cv')
            overslaan = False
            for med in aanv.get(v['nr'], []):
                if re.search(r'altijd .*scorepunt|scorepunt.* altijd', med.replace('\n', ' ')):
                    overslaan = True; break
                nieuw = vervang_model(model, med)
                mv = re.search(r'moet:?\s*\n\s*(Voorbeeld|Een juist|Uit het)[^\n]*\n.*?(?:vervangen worden door|worden vervangen door):\s*\n(.*?)(?:\n\s*Toelichting:?.*)?$', med, re.S)
                if not nieuw and mv: nieuw = model_tekst(mv.group(2).split('\n'))
                if nieuw: model = nieuw + '\nAanvulling: het antwoordmodel is aangepast door het CvTE.'
                else: model += '\nAanvulling van het CvTE' + (':' if kort(med).startswith('\n') else ', ') + kort(med)
            if overslaan: rapport.append(f'{ex} vraag {v["nr"]}: altijd scorepunten, overgeslagen'); continue
            q = re.sub(r'\s*Let op: de laatste vra(?:ag|gen) van dit examen sta(?:at|an) op de volgende pagina\.?', '', v['q']).strip()
            for med in err.get(v['nr'], []):
                mo = re.search(r'moet[^\n]*\n(.*?)\n\s*(?:vervangen worden door|worden vervangen door):?\s*\n(.*?)\s*$', med, re.S)
                if mo:   # de fout direct in de tekst verbeteren
                    o_, n_ = ' '.join(mo.group(1).split()), ' '.join(mo.group(2).split())
                    for veld in ('ctx', 'intro'): v[veld] = v[veld].replace(o_, n_)
                    q = q.replace(o_, n_)
                q += '\n\nLet op, correctie op het examen: ' + kort(med, True).replace('\n', ' ')
            # afbeeldingen: informatiebronnen, uitwerkbijlage, examenpagina
            refs = bron_refs(q) or bron_refs(v['ctx']) or v['bronnen_opgave']
            img = []
            for b in refs:
                for p in bp.get(b, []): img.append(f'{ex}-b-{p}')
            if re.search(r'uitwerkbijlage', q, re.I) and v['nr'] in up: img.append(f'{ex}-u-{up[v["nr"]]}')
            img.append(f'{ex}-o-{v["pagina"]}')
            img = [x for x in dict.fromkeys(img) if not imgs or x in imgs]
            ctx = v['ctx']
            if v['intro'] and v['intro'] != ctx and len(v['intro']) < 900:
                ctx = v['intro'] + ('\n…\n' + ctx if ctx else '')
            ctx = re.sub(r'(?m)^Bij deze opgave hor\w+ de informatiebron.*$\n?', '', ctx)
            ctx = re.sub(r'(?m)^Let op: de laatste vra(?:ag|gen) van dit examen sta(?:at|an) op de volgende pagina\.?\n?', '', ctx).strip()
            eid = f'ex.{ex}.{v["nr"]}'
            d = EX_DOMEIN.get(f'{ex}.{v["nr"]}') or bib.get(eid) or domein(q, ctx)
            rec = {'id': eid, 't': 'open', 'niv': niv, 'ex': ex, 'jaar': jaar, 'tv': tv, 'titel': f'Opgave {v["opgave"]}', 'd': d, 'e': 'EX.' + d,
                   'nr': v['nr'], 'ctx': ctx, 'q': q, 'model': model, 'pnt': v['pnt']}
            rec['top'] = onderwerpen(q, model, v['ctx'])
            if img: rec['img'] = img
            mc = re.fullmatch(r'\s*([A-F])\s*', model)
            if mc:
                mm = re.search(r'^(.*?)\n?A (.+?)\nB (.+?)(?:\nC (.+?))?(?:\nD (.+?))?\s*$', q, re.S)
                if mm:
                    o = [x.strip() for x in mm.groups()[1:] if x]
                    k = 'ABCDEF'.index(mc.group(1))
                    rec.update(t='ex', q=mm.group(1).strip(), o=o, a=k, u=f'Juist is {mc.group(1)}: {o[k]}.'); rec.pop('model'); rec.pop('pnt')
            vragen.append(rec); n_ok += 1
        rapport.append(f'{ex}: {n_ok} van {len(ops)} vragen, {tot} punten')
    kop = ('// ===== Eindexamenvragen havo en vwo =====\n'
           "// Per vraag: {id:'ex.h24-1.5', t:'open'|'ex', niv:'h'|'v', ex:'h24-1', jaar, tv, nr, titel, d, e:'EX.F', ctx, q, model, pnt, img:[...]}\n"
           '// AUTOMATISCH GEMAAKT door tools/examen_beco.py uit de complete centrale examens (examens/bron). Niet met de hand wijzigen.\n')
    ow = [{'id': o[0], 'naam': o[1], 'd': o[2], 'h': o[3], 'v': o[4]} for o in ONDERWERPEN]
    out = kop + 'const EX_ONDERWERPEN = ' + json.dumps(ow, ensure_ascii=False) + ';\nconst EXAMEN = {vragen:[]};\n' + f'EXAMEN.vragen.push(...{json.dumps(vragen, ensure_ascii=False, indent=0)});\n'
    open(os.path.join(ROOT, 'src', 'data-examen.js'), 'w', encoding='utf-8').write(out)
    print('\n'.join(rapport)); print(len(vragen), 'examenvragen')

if __name__ == '__main__': sys.exit(main())
