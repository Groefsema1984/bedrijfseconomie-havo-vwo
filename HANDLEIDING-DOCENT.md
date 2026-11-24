# Handleiding docent · Bedrijfseconomie havo/vwo oefenapp

## Wat zit erin

- Eén app voor havo 4, havo 5, vwo 4, vwo 5 en vwo 6. De leerling kiest bij de start zijn klas (H4, H5, V4, V5, V6).
  De eerste letter bepaalt het niveau: H = havo, V = vwo. De app toont dan alleen de hoofdstukken en examenvragen van dat niveau.
- De opbouw volgt **Bedrijfseconomie in balans**: elke wereld is een hoofdstuk. Havo ziet H1 t/m H29, vwo H1 t/m H36, gegroepeerd
  per domein zoals in het boek (A Basisvaardigheden, B Van persoon naar rechtspersoon, C Interne organisatie en personeelsbeleid,
  D Investeren en financieren, E Marketing, F Financieel beleid, G Verslaggeving). H1 t/m H7 zijn voor havo en vwo gelijk.
- Gevuld (versie 1, 24 november 2026):
  - **H1 t/m H7**: per paragraaf een level met uitleg, begrippen, meerkeuzevragen, begrippenvragen en rekensommen met steeds nieuwe
    getallen. Gemaakt uit de kaderbestanden op de Drive en door Claude uitgeschreven: lees ze na.
  - **Klas 5/6-stof uit de Oefentool-bibliotheek** (27 BECO-leerdoelen, ruim 100 goedgekeurde oefenopgaven en 137 examenvragen met
    antwoordmodel) staat als "Examentraining" in het juiste hoofdstuk: havo H11, H13, H14, H16, H20 t/m H23 en vwo H12, H14, H15, H18,
    H23 t/m H25 en H29.
  - Hoofdstukken zonder inhoud staan op "Komt binnenkort".
- Alles van de economie-app werkt hier ook: medailles (brons 6/8, zilver 7/8, goud 8/8), eindtoets per hoofdstuk met diploma,
  herhaalronde, vaardigheden per onderwerp (0-100), begrippenkaarten, badges, munten, thema's en het docentendashboard met oefentijd,
  scores per domein, moeilijkste vragen, eindtermentabel, examentrainer en CSV.
- **Eindexamentrainer**: de examenvragen uit de bibliotheek, per examen, per domein, als sprint en om te printen. Open vragen kijkt
  de leerling zelf na met het antwoordmodel. De complete centrale examens volgen in een volgende versie.

- **Adaptief oefenen**:
  - Bij een fout antwoord krijgt de leerling in dezelfde ronde een extra vraag over hetzelfde onderwerp. Dat zijn er maximaal 3 per ronde.
    Dit gebeurt in levels, bij oefenen per onderwerp of domein en in de herhaalronde. Bij domeintoetsen, examens en de sprint gebeurt het niet.
    Deze extra vragen tellen niet mee voor de medaille, maar wel voor de vaardigheidsscore.
  - **Slim oefenen** (op Start en onder Vaardigheden) kiest 10 vragen uit de onderwerpen waar de leerling het zwakst scoort, plus een paar foute vragen uit de herhaalronde.
  - "Oefen dit domein" geeft voorrang aan de zwakste onderwerpen.

- **Leren** (nieuw menu-item) bundelt vijf extra's:
  - **Foutenschrift**: alle vragen die de leerling fout had, per leerdoel (onderwerp/eindterm), met bovenaan de leerdoelen met de
    meeste open fouten. Per leerdoel: de foute vragen opnieuw oefenen of nieuwe vragen over dat leerdoel. Ook af te drukken.
    In het docentendashboard staat bij elke leerling een foutenschrift per leerdoel.
  - **Flitskaarten**: alle begrippen per domein. De leerling draait de kaart om en kiest Wist ik niet, Twijfel of Wist ik.
    Gekende kaarten komen terug na 1, 3, 7, 14, 30 en 60 dagen (herhaling op afstand). Ook andersom te oefenen (betekenis → begrip).
  - **Formulekaart en rekenhulp**: 31 formules per domein (procenten, balans, verzekeren, interest, hypotheken, loonkosten, kostprijs, break-even, verschillenanalyse, investeren) met uitleg, een uitgewerkt voorbeeld, een rekenhulp om de eigen berekening
    te controleren en een knop om te oefenen met sommen die steeds andere getallen krijgen.
  - **Break-evengrafiek**: de leerling klikt in een grafiek met TO en TK op het break-evenpunt, het winst- of verliesgebied, de
    constante kosten of de juiste lijn, en berekent het resultaat bij een gegeven afzet.
  - **Proeftoets per hoofdstuk**: 15 automatisch na te kijken vragen uit één hoofdstuk, ongeveer 75 seconden per vraag, zonder
    tussentijdse feedback. Daarna een cijfer (1 + 9 × score) met uitleg bij de fouten. Foute vragen gaan naar de herhaalronde.
  - **Examen op tijd** (ook onder Eindexamen → Op tijd maken): een heel oud examen op één pagina met 180 minuten (eventueel +30 min extra tijd).
    Antwoorden worden steeds bewaard, de klok loopt door. Na inleveren kijkt de leerling na met het antwoordmodel (meerkeuze gaat vanzelf,
    deelscores met rekenuitkomsten worden alvast aangevinkt) en krijgt een cijferschatting met N = 1,0 en de punten per domein.
- **Docentendashboard → Klassikaal**: per klas de zwakste onderwerpen (met de namen van leerlingen onder de 50), de vragen die de
  meeste leerlingen fout hadden, de gemiddelde proeftoetscijfers per hoofdstuk en de laatst gemaakte examens op tijd.
  Voor de proeftoets- en examencijfers in het dashboard moet de nieuwste `server/Code.gs` in Apps Script staan
  (plakken, opslaan, Implementeren → Implementaties beheren → bewerken → Nieuwe versie). De rest werkt ook zonder.

Let op: de onderwerpen per domein (bijvoorbeeld "F.breakeven Break-evenanalyse") zijn werktitels, geen officiële syllabuscodes.
Ze staan in `src/data-basis.js` en zijn makkelijk aan te passen of uit te breiden.

## Inhoud toevoegen

- **Een hoofdstuk van In balans**: maak een bestand in `hoofdstukken/` (zie `hoofdstukken/LEESMIJ.txt` en de bestaande H1 t/m H7).
  Bovenaan staat `wereld: h21` (havo H21), `v24` (vwo H24) of `hv3` (voor beide). Per paragraaf uitleg, begrippen en meerkeuzevragen.
  Met `niv: h` of `niv: v` bij een paragraaf is die alleen voor havo of vwo.
- **Oefenopgaven en examenvragen uit de bibliotheek**: nieuwe BECO-leerdoelen op de Drive worden met `tools/drive2bib.py` omgezet.
  In die tool staat bij elk leerdoel in welk hoofdstuk het hoort (havo en vwo).
- Daarna: `python3 tools/bibliotheek.py && python3 tools/hoofdstukken.py && python3 src/build.py`.
  Of vraag het aan Claude in dit project.

## Server installeren (eenmalig, ongeveer 10 minuten, gratis)

Dit is een **eigen** Sheet, los van de economie-apps, zodat de leerlingen en het dashboard gescheiden blijven.

1. Ga naar sheets.google.com en maak een nieuwe lege spreadsheet, bijvoorbeeld "Bedrijfseconomie havo/vwo – server". Deel hem met niemand.
2. Kies **Extensies > Apps Script**. Verwijder de voorbeeldcode en plak de inhoud van `server/Code.gs`. Klik op Opslaan.
3. Pas bovenaan `CFG` aan: `DOCENT_CODE` (jouw code voor het docentenscherm, bijvoorbeeld 4 cijfers) en eventueel `KLASSEN`.
   Wil je andere klasnamen (bijvoorbeeld H5A, H5B), zet ze dan ook in `src/core.js` bij `KLASSEN`. Laat ze met H of V beginnen.
4. Kies de functie **setup** en klik op **Uitvoeren**. Geef toestemming (Geavanceerd > Ga naar … > Toestaan).
5. **Implementeren > Nieuwe implementatie > Web-app**. Uitvoeren als: *Ikzelf*. Toegang: *Iedereen*. Kopieer de URL (eindigt op `/exec`).
6. Stuur de URL naar Claude. Die zet hem in de app (`DATA_ENDPOINT_URL`) en zet de nieuwe versie online.

Zonder server-URL draait de app in testmodus: alles staat dan alleen op het apparaat.

## Zo raakt er niets kwijt, op de iPad en privacy

Dit werkt precies zoals bij de economie-app: speler-ID en herstelcode (6 cijfers), direct opslaan op het apparaat, synchroniseren met
de Sheet, nooit een oudere stand over een nieuwere. De app gebruikt een andere opslagsleutel dan de economie-apps, dus de apps
kunnen naast elkaar op dezelfde iPad staan.
