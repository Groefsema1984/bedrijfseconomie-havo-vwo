# Bedrijfseconomie havo/vwo · oefenapp

Interactieve oefenapp voor bedrijfseconomie havo en vwo van het Vellesan College, opgebouwd volgens de methode
**Bedrijfseconomie in balans**: elke wereld is een hoofdstuk (havo H1 t/m H29, vwo H1 t/m H36), gegroepeerd per domein A t/m G.
Werkt hetzelfde als de economie-app: levels met medailles, eindtoets per hoofdstuk, herhaalronde, vaardigheden per onderwerp,
collectie, speler-ID met herstelcode, docentendashboard en eindexamentrainer.

- App: `index.html` (één bestand, wordt gebouwd uit `src/` met `python3 src/build.py`)
- Werelden, domeinen en onderwerpen: `src/data-basis.js`
- Rekengeneratoren (sommen met steeds nieuwe getallen): `GENS` in `src/core.js`
- Flitskaarten, formulekaart, break-evengrafiek, proeftoets en examen op tijd: `src/extra.js`
- Hoofdstukken In balans (uitleg, begrippen, meerkeuze): `hoofdstukken/*.txt` → `tools/hoofdstukken.py`
- Oefenopgaven en examenvragen uit de Oefentool-bibliotheek (Drive, BECO-leerdoelen):
  `tools/drive2bib.py` → `bibliotheek/*.txt` → `tools/bibliotheek.py`
- Server: `server/Code.gs` (Google Apps Script + een eigen Google Sheet)
- Uitleg voor de docent: [HANDLEIDING-DOCENT.md](HANDLEIDING-DOCENT.md)

Na een wijziging in de inhoud:

```
python3 tools/bibliotheek.py && python3 tools/hoofdstukken.py && python3 src/build.py
```

Complete centrale examens (havo en vwo 2021-2026):

```
python3 tools/examen_beco.py            # examens/bron/*.txt -> src/data-examen.js
python3 tools/examen_beco.py --img MAP  # pdf's uit MAP ({ex}-o/b/u.pdf) -> examens/img/*.jpg
```

De tekstbestanden in examens/bron zijn gemaakt met `pdftotext -layout` uit de pdf's in 04_COMPLETE_EINDEXAMENS op de Drive.
