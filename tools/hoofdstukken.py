"""Zet de hoofdstukbestanden in hoofdstukken/*.txt om naar src/data-hoofdstukken.js.

Elk bestand is één hoofdstuk van Economie Integraal (havo of vwo). Formaat (zie hoofdstukken/LEESMIJ.txt):

  # HOOFDSTUK h 2 | Consumentengedrag        (h = havo, v = vwo; daarna het hoofdstuknummer en de titel)
  domein: D
  hoofdvraag: ...
  ## § 2.1 | Titel van de paragraaf
  onderwerp: D.vraag                        (code uit EINDTERMEN in src/data-basis.js)
  leerdoelen: ECO-MARKT-05, ECO-MARKT-07    (optioneel: oefenopgaven en examenvragen uit de bibliotheek erbij)
  gens: evenwicht                           (optioneel: rekengeneratoren)
  ook: h 2.1                                (optioneel: neem de meerkeuzevragen en begrippen van een andere paragraaf over)
  ### UITLEG Kopje                           -> tekst
  ### BEGRIPPEN                              -> regels 'Begrip = omschrijving'
  ### MC                                     -> vraagtekst, dan '* juist', '- fout' (3x) en '> uitleg'

Per paragraaf wordt één level gemaakt. De vragen zijn: de eigen meerkeuzevragen, begrippenvragen (koppelen en
'welk begrip hoort hierbij') en een paar oefenopgaven en examenvragen van de gekoppelde leerdoelen.
"""
import glob, json, os, re, sys, random
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bibliotheek as bib

MAX_OEFEN, MAX_EXAMEN = 3, 3

def bibliotheek_vragen():
    """leerdoelcode -> (oefenopgaven, examenvragen) uit bibliotheek/*.txt"""
    uit = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'bibliotheek', '*.txt'))):
        if os.path.basename(f).upper().startswith('LEESMIJ'): continue
        for code, meta, secties in bib.blokken(open(f, encoding='utf-8').read()):
            oef, ex = [], []
            for s in secties:
                kop, vraag, antw = bib.splits_antwoord(s)
                if not antw: continue
                m = re.match(r'OPGAVE\s+(\S+)\s+(\d+)p\s*\|\s*(.*)', kop)
                if m and '### OPTIES' not in vraag:
                    oef.append({'t': 'open', 'titel': m.group(3), 'q': vraag, 'model': antw, 'pnt': int(m.group(2)), 'bron': m.group(1)})
                m = re.match(r'EXAMEN\s+(havo|vwo)\s+(\d{4})-(I{1,3})\s+(\d+)\s+(\d+)p', kop)
                if m:
                    ex.append({'t': 'open', 'niv': m.group(1)[0], 'titel': f'Examen {m.group(1)} {m.group(2)}-{m.group(3)}, vraag {m.group(4)}',
                               'q': f'(Examen {m.group(1)} {m.group(2)}-{m.group(3)}, vraag {m.group(4)})\n' + vraag,
                               'model': antw, 'pnt': int(m.group(5)), 'bron': f'{m.group(1)[0]}{m.group(2)}-{m.group(3)}-{m.group(4)}'})
            uit[code] = (oef, ex)
    return uit

def lees(pad):
    t = open(pad, encoding='utf-8').read()
    m = re.search(r'^# HOOFDSTUK (hv|h|v) (\w+)(?: / v (\w+))? \| (.+)$', t, re.M)
    if not m: raise SystemExit(f'{pad}: geen kop "# HOOFDSTUK h 2 | Titel"')
    h = {'niv': m.group(1), 'nr': m.group(2), 'vnr': m.group(3), 'titel': m.group(4).strip(), 'par': [], 'pad': pad}
    kop, *pars = re.split(r'^## ', t, flags=re.M)
    for r in kop.split('\n'):
        mm = re.match(r'^(\w+):\s*(.*)$', r.strip())
        if mm: h[mm.group(1)] = mm.group(2).strip()
    for p in pars:
        eerste, _, body = p.partition('\n')
        mm = re.match(r'§\s*([\w.-]+)(?:\s*/\s*([\w.-]+))?\s*\|\s*(.+)', eerste.strip())
        if not mm: raise SystemExit(f'{pad}: paragraafkop onleesbaar: {eerste}')
        par = {'nr': mm.group(1), 'vnr': mm.group(2), 'titel': mm.group(3).strip(), 'uitleg': [], 'begrippen': [], 'mc': []}
        meta, *delen = re.split(r'^### ', body, flags=re.M)
        for r in meta.split('\n'):
            mm = re.match(r'^(\w+):\s*(.*)$', r.strip())
            if mm: par[mm.group(1)] = mm.group(2).strip()
        for d in delen:
            k, _, inh = d.partition('\n'); k = k.strip(); inh = inh.strip()
            if k.startswith('UITLEG'):
                par['uitleg'].append({'t': k[6:].strip() or par['titel'], 'x': inh})
            elif k.startswith('BEGRIPPEN'):
                for r in inh.split('\n'):
                    if '=' in r:
                        b, _, o = r.partition('='); par['begrippen'].append((b.strip(), o.strip()))
            elif k.startswith('MC'):
                q, opties, juist, u = [], [], None, ''
                for r in inh.split('\n'):
                    s = r.strip()
                    if s.startswith('* '): juist = len(opties); opties.append(s[2:].strip())
                    elif s.startswith('- '): opties.append(s[2:].strip())
                    elif s.startswith('> '): u += (' ' if u else '') + s[2:].strip()
                    elif s: q.append(s)
                if juist is None or len(opties) < 2: raise SystemExit(f'{pad} §{par["nr"]}: MC zonder juist antwoord: {q[:1]}')
                par['mc'].append({'q': '\n'.join(q), 'o': opties, 'a': juist, 'u': u})
        h['par'].append(par)
    return h

def splits(h):
    """Een gedeeld hoofdstuk '# HOOFDSTUK h 11 / v 12' wordt een havo- en een vwo-hoofdstuk.
    Paragraafkop '§ 11.2 / 12.3 | Titel havo / Titel vwo'; '-' = deze paragraaf bestaat niet op dat niveau."""
    if not h.get('vnr'): return [h]
    w = [x.strip() for x in h.get('wereld', '').split(',')]
    if len(w) != 2: raise SystemExit(f'{h["pad"]}: gedeeld hoofdstuk heeft "wereld: hX, vY" nodig')
    uit = []
    for k, (niv, nr, wid) in enumerate((('h', h['nr'], w[0]), ('v', h['vnr'], w[1]))):
        pars = []
        for p in h['par']:
            pnr = p['nr'] if k == 0 else p['vnr']
            if not pnr or pnr == '-': continue
            t = [x.strip() for x in p['titel'].split(' / ')]
            pars.append(dict(p, nr=pnr, niv=niv, titel=t[min(k, len(t) - 1)]))
        uit.append(dict(h, niv=niv, nr=nr, wereld=wid, par=pars))
    return uit

def main():
    random.seed(7)
    hst = [x for f in sorted(glob.glob(os.path.join(ROOT, 'hoofdstukken', '*.txt'))) if not os.path.basename(f).upper().startswith('LEESMIJ') for x in splits(lees(f))]
    index = {(p.get('niv', h['niv']), p['nr']): p for h in hst for p in h['par']}
    bibv = bibliotheek_vragen()
    core = ''.join(open(os.path.join(ROOT, 'src', f), encoding='utf-8').read() for f in ('core.js', 'extra.js', 'oefen.js', 'reken2.js'))
    gens_ok = set(re.findall(r'^\s+(\w+)\(\)\s*\{', core, re.M))
    levels, begrippen, fouten = {}, {}, []
    for h in sorted(hst, key=lambda x: (x['wereld'], x['niv'])):
        d = h['wereld']; hniv = h['niv']
        hfd = h.get('groep', 'Paragrafen')
        # alle begrippen van het hoofdstuk: afleiders voor de begrippenvragen
        alle_b = []
        for p in h['par']:
            ooks = []
            for o in [x.strip() for x in p.get('ook', '').split(',') if x.strip()]:
                ook = index.get(tuple(o.split()))
                if not ook: fouten.append(f'{h["wereld"]} §{p["nr"]}: "ook: {o}" niet gevonden'); continue
                ooks.append(ook)
            p['_b'] = p['begrippen'] + [b for o in ooks for b in o['begrippen']]
            p['_mc'] = p['mc'] + [m for o in ooks for m in o['mc']]
            p['_uitleg'] = p['uitleg'] + [u for o in ooks for u in o['uitleg'] if u not in p['uitleg']]
            alle_b += p['_b']
        for p in h['par']:
            niv = p.get('niv', hniv)
            e = p.get('onderwerp') or fouten.append(f'{d} §{p["nr"]}: geen onderwerp') or 'A.reken'
            lid = f'{d}.' + ('' if niv == 'hv' else niv) + p['nr'].replace('.', '_')
            vr = []
            for i, m in enumerate(p['_mc'], 1):
                vr.append({'id': f'{lid}.m{i:02d}', 't': 'mc', 'e': e, 'q': m['q'], 'o': m['o'], 'a': m['a'], 'u': m['u']})
            bg = p['_b']
            for b, o in bg: begrippen.setdefault(d, {})[b] = o
            # koppelvragen: per drie begrippen
            for i in range(0, len(bg) - 2, 3):
                trio = bg[i:i + 3]
                vr.append({'id': f'{lid}.k{i // 3 + 1:02d}', 't': 'koppel', 'e': e, 'q': 'Koppel elk begrip aan de juiste omschrijving.',
                           'p': [[b, o] for b, o in trio], 'u': ' '.join(f'{b}: {o}' for b, o in trio)})
            # welk begrip hoort bij deze omschrijving (afleiders uit het hele hoofdstuk)
            for i, (b, o) in enumerate(bg, 1):
                andere = [x for x, _ in alle_b if x != b and x.lower() not in o.lower()]
                if len(andere) < 3: continue
                vr.append({'id': f'{lid}.b{i:02d}', 't': 'mc', 'e': e, 'b': b, 'q': f'Welk begrip hoort bij deze omschrijving?\n"{o}"',
                           'o': [b] + random.sample(sorted(set(andere)), 3), 'a': 0, 'u': f'{b}: {o}'})
            # oefenopgaven en examenvragen van de gekoppelde leerdoelen
            codes = [c.strip() for c in p.get('leerdoelen', '').split(',') if c.strip()]
            oef, ex = [], []
            for c in codes:
                if c not in bibv: fouten.append(f'{d} §{p["nr"]}: leerdoel {c} staat niet in de bibliotheek'); continue
                oef += bibv[c][0]; ex += [x for x in bibv[c][1] if niv == 'hv' or x['niv'] == niv]
            gezien = set()
            exsel = ex[:MAX_EXAMEN] if niv != 'hv' else [x for x in ex if x['niv'] == 'h'][:MAX_EXAMEN] + [x for x in ex if x['niv'] == 'v'][:MAX_EXAMEN]
            for x in oef[:MAX_OEFEN] + exsel:
                if x['bron'] in gezien: continue
                gezien.add(x['bron'])
                v = {k: x[k] for k in ('t', 'titel', 'q', 'model', 'pnt')}
                v.update(id=f'{lid}.{re.sub(r"[^A-Za-z0-9]", "", x["bron"])}', e=e)
                if niv == 'hv' and x.get('niv'): v['niv'] = x['niv']
                vr.append(v)
            lvl = {'id': lid, 'hfd': hfd, 'niv': niv, 'naam': (f'§{p["nr"]} ' if re.match(r'^\d', p['nr']) else '') + p['titel'], 'kort': p.get('kort', h.get('hoofdvraag', '')),
                   'vragen': vr, 'gens': [g.strip() for g in p.get('gens', '').split(',') if g.strip()]}
            if p.get('deelvraag'): lvl['doel'] = p['deelvraag']; lvl['kort'] = p['deelvraag']
            if p['_uitleg']: lvl['uitleg'] = p['_uitleg']
            for g in lvl['gens']:
                if g not in gens_ok: fouten.append(f'{d} §{p["nr"]}: generator {g} bestaat niet')
            if len(vr) < 4: fouten.append(f'{d} §{p["nr"]}: maar {len(vr)} vragen')
            if niv == 'hv': del lvl['niv']
            levels.setdefault(d, []).append(lvl)
    out = ['// AUTOMATISCH GEMAAKT door tools/hoofdstukken.py uit hoofdstukken/*.txt. Niet met de hand wijzigen.',
           '// Hoofdstukken van Bedrijfseconomie in balans (klas 4) en de thema\'s van klas 5 en 6, gemaakt uit de kaderbestanden van de sectie.']
    for d in sorted(levels):
        out.append(f'LEVELS.{d}.push(...{json.dumps(levels[d], ensure_ascii=False, indent=0)});')
    for d in sorted(begrippen):
        out.append(f'LEVELS.{d}.begrippen = Object.assign(LEVELS.{d}.begrippen||{{}}, {json.dumps(begrippen[d], ensure_ascii=False)});')
    open(os.path.join(ROOT, 'src', 'data-hoofdstukken.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    n = sum(len(l['vragen']) for v in levels.values() for l in v)
    print(f'{len(hst)} hoofdstukken, {sum(len(v) for v in levels.values())} paragraaf-levels, {n} vragen, {sum(len(b) for b in begrippen.values())} begrippen')
    for f in fouten: print('LET OP:', f)
    return 1 if fouten else 0

if __name__ == '__main__': sys.exit(main())
