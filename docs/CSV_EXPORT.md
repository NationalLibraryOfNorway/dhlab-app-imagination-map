# CSV-eksport av kartdata

ImagiNation kan eksportere stedsdata fra kartet til CSV for videre analyse,
opprydding og visualisering i Python, R, GIS-verktøy eller regneark.

## Slik laster du ned

Åpne **Visual mode** og gå til **Nedlasting av stedsdata**. Der finnes to valg:

- **Alle steder (CSV)** henter hele stedsettet for det aktive korpuset.
- **Synlig kartutsnitt (CSV)** eksporterer bare markørene som vises i det
  nåværende kartutsnittet.

Begge eksportene følger aktivt stedstypefilter og temporalfilter. Eksport av
synlig kartutsnitt følger i tillegg markørgrensen, viewporten,
stedskonkordansfokus og bokforløpsfokus. Den er bare tilgjengelig i vanlig
kartmodus.

## Kolonner

- `place_id`: stabil steds-ID fra kartdataene
- `nb_place_id`: eventuell ID i Nasjonalbibliotekets stedsregister
- `historical_name`: stedsformen som forekommer i korpuset
- `modern_name`: moderne eller kanonisk navn
- `latitude`, `longitude`: WGS84-koordinater i desimalgrader
- `mentions`: antall forekomster i det aktive korpuset
- `book_count`: antall bøker stedet forekommer i
- `kind`: normalisert stedstype
- `feature_code`: mer detaljert geografisk typekode
- `first_year`: første registrerte forekomst i korpuset når tidsdata er aktivert

Filene bruker UTF-8 uten BOM. Kolonnenavnene er unike, maskinvennlige og uten
parenteser eller andre tegn som ofte skaper problemer i analyseverktøy.

## Eksempel i Python

```python
import pandas as pd

places = pd.read_csv("imagination_places_2026-09-08_59996.csv")
places = places[places["mentions"] >= 5]

ax = places.plot.scatter(
    x="longitude",
    y="latitude",
    s=places["mentions"].clip(upper=100),
)
```

## Store eksporter

Backend tillater maksimalt 20 000 steder per forespørsel. Når korpuset er
større, deler frontenden bokutvalget i mindre grupper og slår resultatene sammen
før filen lages. En full eksport av rundt 60 000 steder kan derfor bruke
omtrent 30–60 sekunder. Knappen viser **Henter alle steder…** mens arbeidet
pågår. Etter en full eksport hurtigbufres resultatet for samme korpus i
nettleserøkten.

Eksport av synlig kartutsnitt bruker allerede lastede kartdata og er normalt
umiddelbar.

## Begrensninger

- Redigerte stedsfiler kan foreløpig ikke importeres tilbake i ImagiNation.
- A/B-sammenligning har ikke en entydig stedsmodell og kan derfor ikke
  eksporteres med disse knappene.
- Synlig kartutsnitt er ikke tilgjengelig i heatmap-modus.
- Google My Maps tillater bare et begrenset antall rader per lag. ImagiNation
  avkorter ikke forskningsdata for å tilpasse seg denne grensen.

Det stabile CSV-formatet er ment å kunne brukes som utgangspunkt for en senere
importfunksjon eller et eget, lettere kartverktøy.
