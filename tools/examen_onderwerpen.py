"""Examenonderwerpen: fijnere indeling van de examenvragen dan de domeinen A-G, voor de analyse 'wat komt vaak terug'.

Elk onderwerp: (id, naam, domein, havo-hoofdstuk, vwo-hoofdstuk, trefwoorden als reguliere expressies).
Een vraag krijgt de onderwerpen waarvan een trefwoord in de vraag staat (maximaal twee, de meeste treffers eerst);
staat er niets in de vraag, dan telt het antwoordmodel, en daarna de tekst vlak boven de vraag.
"""
import re

ONDERWERPEN = [
    ('rechtsvorm', 'Rechtsvormen en aansprakelijkheid', 'B', 'h10', 'v11',
     [r'rechtsvorm', r'eenmanszaak', r'\bvof\b', r'vennootschap onder firma', r'aansprakelijk', r'maatschap', r'co[öo]peratie', r'commanditaire', r'\bbv\b.*\bnv\b|\bnv\b.*\bbv\b']),
    ('ib', 'Inkomstenbelasting en ondernemersaftrek', 'B', 'h22', 'v25',
     [r'inkomstenbelasting', r'ondernemersaftrek', r'zelfstandigenaftrek', r'mkb-winstvrijstelling', r'belastbaar inkomen', r'box [123]\b', r'heffingskorting', r'startersaftrek', r'fiscale winst']),
    ('vpb', 'Vennootschaps- en dividendbelasting', 'B', 'h22', 'v25',
     [r'vennootschapsbelasting', r'dividendbelasting', r'\bvpb\b']),
    ('winstverdeling', 'Winstverdeling en dividend', 'D', 'h22', 'v16',
     [r'winstverdeling', r'verdeling van het resultaat', r'resultaatverdeling', r'algemene reserve', r'reserveert', r'dividend', r'winst per aandeel', r'pay-?out', r'stockdividend', r'cashdividend', r'winstbestemming']),
    ('btw', 'Btw', 'B', 'h22', 'v25', [r'\bbtw\b', r'omzetbelasting', r'voorbelasting']),
    ('erven', 'Schenken en erven', 'B', 'hv7', 'v8', [r'\berf', r'schenk', r'testament', r'legitieme', r'nalatenschap']),
    ('prive', 'Persoonlijke financiën: budget, huur, studieschuld, verzekeren', 'B', 'hv3', 'hv3',
     [r'huishoud', r'studievoorschot', r'arbeidsongeschikt', r'uitkering', r'toeslag', r'studieschuld', r'\bduo\b', r'koopkracht', r'verzeker', r'eigen risico', r'premie', r'huurtoeslag', r'nettoloon', r'loonheffing']),
    ('woning', 'Woning en hypotheek', 'B', 'hv6', 'hv6', [r'hypothe', r'kosten koper', r'aankoopkosten', r'overwaarde', r'koopwoning', r'\bwoz\b', r'eigenwoningforfait', r'maandlasten']),
    ('interest', 'Sparen, samengestelde interest en contante waarde', 'A', 'hv5', 'hv5',
     [r'spaarrekening', r'\bsparen', r'spaarbedrag', r'bijgeschreven', r'bijschrijving', r'bijstort', r'storting', r'samengestelde interest', r'contante waarde', r'eindwaarde', r'enkelvoudige interest', r'effectieve interest', r'interestpercentage per']),
    ('beleggen', 'Beleggen en risico', 'D', 'hv4', 'hv4', [r'beleg', r'spreiding', r'beleggersrendement', r'\brisico\w* ']),
    ('starten', 'Ondernemingsplan en zelfstandig ondernemen', 'B', 'h9', 'v10',
     [r'ondernemingsplan', r'starter', r'\bzzp', r'zelfstandig ondernemer', r'franchise', r'kamer van koophandel', r'\bkvk\b', r'ondernemerschap']),
    ('mvo', 'MVO en duurzaamheid', 'B', 'h8', 'v9', [r'maatschappelijk verantwoord', r'\bmvo\b', r'\bp\W?s\b.*mvo|drie p', r'duurza', r'people', r'stakeholder', r'belanghebbende']),
    ('organisatie', 'Organisatie, leiding en communicatie', 'C', 'h11', 'v12',
     [r'organogram', r'organisatiestructuur', r'lijnorganisatie', r'\bstaf', r'leiderschap', r'leidinggev', r'spanwijdte', r'organisatiecultuur', r'communicatie', r'centralisatie', r'decentralisatie', r'matrix', r'bevoegdhed']),
    ('arbeidsrecht', 'Arbeidsrecht: contracten, ontslag, cao, OR', 'C', 'h13', 'v14',
     [r'arbeidsovereenkomst', r'ontslag', r'transitievergoeding', r'\bcao\b', r'ondernemingsraad', r'proeftijd', r'oproepkracht', r'payroll', r'uitzend', r'overeenkomst van opdracht', r'arbeidsrecht', r'concurrentiebeding']),
    ('personeel', 'Personeelsbeleid, loonkosten en beloning', 'C', 'h14', 'v15',
     [r'loonkosten', r'brutoloon', r'brutojaarloon', r'sociale lasten', r'vakantietoeslag', r'vakantiegeld', r'beloning', r'\bbonus', r'provisie', r'\bsars?\b', r'functieprofiel', r'functiewaardering', r'werving', r'selectie', r'personeelsplanning', r'verzuim', r'opleiding', r'motivatie', r'secundaire arbeidsvoorwaarde', r'arbeidsvoorwaarden', r'human capital', r'functieomschrijving', r'cursus', r'personeelskosten']),
    ('investeren', 'Investeringsselectie', 'D', 'h16', 'v18',
     [r'terugverdientijd', r'netto contante waarde', r'investeringsselectie', r'investeringsproject', r'boekhoudkundige rentabiliteit', r'investeringsbeslissing']),
    ('afschrijving', 'Afschrijving en boekwaarde', 'F', 'h20', 'v23', [r'afschrijving', r'boekwaarde', r'restwaarde', r'boekwinst', r'boekverlies']),
    ('vreemdvermogen', 'Financiering met vreemd vermogen: leningen, krediet, lease', 'D', 'h15', 'v17',
     [r'lening', r'aflossing', r'annu[iï]teit', r'crowdfunding', r'\blease', r'rekening-courant', r'leverancierskrediet', r'afnemerskrediet', r'krediet', r'vreemd vermogen', r'financier', r'interestkosten', r'onderpand', r'zekerheid']),
    ('aandelen', 'Eigen vermogen: aandelen, emissie, agio, koers', 'D', 'h15', 'v16',
     [r'\baandeel', r'\baandelen', r'emissie', r'\bagio', r'beurskoers', r'intrinsieke waarde', r'claimrecht', r'\bclaim', r'geplaatst kapitaal', r'aandeelhouder', r'beursgang', r'koers']),
    ('obligaties', 'Obligaties', 'D', 'h15', 'v17', [r'obligatie']),
    ('faillissement', 'Faillissement en surseance', 'B', 'h10', 'v11', [r'faillissement', r'failliet', r'surseance', r'curator', r'boedel']),
    ('marktonderzoek', 'Marktonderzoek en doelgroep', 'E', 'h17', 'v19',
     [r'marktonderzoek', r'steekproef', r'enqu[eê]te', r'doelgroep', r'segment', r'deskresearch', r'fieldresearch', r'kwalitatief', r'kwantitatief', r'representatief', r'betrouwbaarheid']),
    ('marketingmix', 'Marketingmix: product, prijs, plaats, promotie', 'E', 'h18', 'v20',
     [r'marketingmix', r'\bpromotie', r'reclame', r'social media', r'distributie', r'\bmerk', r'propositie', r'positionering', r'productlevenscyclus', r'prijsstrategie', r'prijsbeleid', r'prijsdifferentiatie', r'penetratieprijs', r'afroomprijs', r'klantwaarde', r'influencer', r'sponsor', r'marketing', r'concurrentiegerichte', r'kostengeori[eë]nteerde']),
    ('strategie', 'Strategie: SWOT, KSF en prestatie-indicatoren', 'E', 'h17', 'v19',
     [r'swot', r'\bksf', r'kritische succesfactor', r'prestatie-?indicator', r'\bkpi', r'\bmissie\b', r'\bvisie\b', r'\bacm\b', r'concurrentiepositie', r'marktgegevens', r'prestaties']),
    ('marktaandeel', 'Marktaandeel, afzet en prijselasticiteit', 'E', 'h18', 'v22',
     [r'marktaandeel', r'\bafzet\b', r'omzetdaling', r'elasticiteit', r'marktpotentieel', r'penetratiegraad', r'afzetstijging', r'omzetstijging']),
    ('kostprijs', 'Kostprijs, constante en variabele kosten', 'F', 'h20', 'v23',
     [r'kostprijs', r'normale (productie|bezetting|afzet)', r'bezettingsresultaat', r'bezettingsverschil', r'\bopslag', r'variabele kosten', r'constante kosten', r'vaste kosten', r'kosten per (eenheid|stuk|product)', r'standaardkosten', r'tarief', r'uurtarief', r'totale kosten', r'kosten per (jaar|maand|uur)', r'outsourc']),
    ('breakeven', 'Break-even en dekkingsbijdrage', 'F', 'h21', 'v24', [r'break.?even', r'dekkingsbijdrage', r'veiligheidsmarge', r'winstpunt']),
    ('costing', 'Absorption en direct costing', 'F', 'h20', 'v27', [r'absorption', r'direct costing']),
    ('verschillen', 'Budgettering en verschillenanalyse', 'F', 'h24', 'v30',
     [r'verschillenanalyse', r'prijsverschil', r'effici[eë]ncyverschil', r'hoeveelheidsverschil', r'budget', r'begroot', r'gebudgetteerd', r'standaard']),
    ('liquiditeitsbegroting', 'Liquiditeitsbegroting: ontvangsten en uitgaven', 'F', 'h25', 'v31',
     [r'liquiditeitsbegroting', r'ontvangsten', r'uitgaven', r'saldo liquide middelen', r'liquide middelen per']),
    ('resultaat', 'Resultatenbegroting en resultaatberekening', 'F', 'h25', 'v31',
     [r'resultatenbegroting', r'exploitatiebegroting', r'resultaat', r'\bwinst\b', r'\bverlies\b', r'\bebit', r'brutowinst', r'nettowinst', r'opbrengst']),
    ('periodisering', 'Kosten en uitgaven, periodisering (vooruitbetaald e.d.)', 'G', 'h23', 'v29',
     [r'vooruitbetaald', r'vooruitontvangen', r'vooruit ontvangen', r'nog te betalen', r'nog te ontvangen', r'transitorisch', r'overlopende', r'periodi', r'matching', r'realisatie', r'toerekenen']),
    ('balans', 'Balans en balansmutaties', 'G', 'hv2', 'hv2',
     [r'\bbalans', r'eigen vermogen', r'activa', r'passiva', r'balanspost', r'debet', r'credit', r'beginbalans', r'eindbalans', r'reserve']),
    ('waardering', 'Waarderingsregels en voorzieningen', 'G', 'h27', 'v33',
     [r'waardering', r'waarderen', r'voorziening', r'\bfifo\b', r'\blifo\b', r'historische kostprijs', r'actuele waarde', r'goodwill', r'herwaardering', r'dubieuze debiteuren']),
    ('kengetallen', 'Kengetallen: liquiditeit, solvabiliteit, rentabiliteit', 'G', 'h29', 'v35',
     [r'current ratio', r'quick ratio', r'solvabiliteit', r'debt ratio', r'rentabiliteit', r'\brtv\b', r'\brev\b', r'hefboom', r'kengetal', r'liquiditeit\b', r'omloopsnelheid', r'gemiddelde krediettermijn', r'brutowinstmarge', r'nettowinstmarge']),
    ('cashflow', 'Cashflow en kasstroomoverzicht', 'G', 'h29', 'v35', [r'cashflow', r'kasstroom', r'ebitda']),
    ('verslaggeving', 'Jaarrekening, accountant en verslaggeving', 'G', 'h26', 'v32',
     [r'jaarrekening', r'jaarverslag', r'bestuursverslag', r'accountant', r'controleverklaring', r'deponeren', r'externe verslaggeving', r'\bifrs\b', r'winst-en-verliesrekening']),
]

_RE = [(o[0], [re.compile(p, re.I) for p in o[5]]) for o in ONDERWERPEN]

def _tel(tekst):
    t = tekst or ''
    return {oid: sum(len(p.findall(t)) for p in ps) for oid, ps in _RE}

def onderwerpen(q, model='', ctx=''):
    """-> lijst van maximaal twee onderwerp-ids"""
    for tekst in (q, model, (ctx or '')[-500:]):
        sc = {k: v for k, v in _tel(tekst).items() if v}
        if sc:
            # 'resultaat' en 'balans' zijn brede woorden: alleen als er niets specifiekers is
            breed = {'resultaat', 'balans', 'beleggen'}
            spec = {k: v for k, v in sc.items() if k not in breed}
            kies = spec or sc
            return [k for k, _ in sorted(kies.items(), key=lambda kv: -kv[1])][:2]
    return []
