# ImagiNation PWA: Kartografier i Litteratur

## Om Prosjektet
ImagiNation er et verktøy for å visualisere steder i litteratur gjennom tidene. Applikasjonen lar forskere bygge komplekse bokutvalg (korpus) og umiddelbart se deres geografiske avtrykk på et interaktivt kart.

## Teknisk Arkitektur
Prosjektet er organisert som en moderne web-applikasjon med en separat backend:
- **Frontend (Dette repoet):** En React PWA som håndterer interaksjon, kart-rendering (Leaflet) og korpus-bygging.
- **Backend ([sqlite-backend](file:///Users/larsj/Github/sqlite-backend)):** En FastAPI-server som snakker direkte med `imagination.db`.
- **Database:** SQLite med postings-støtte for raske fulltekst- og steds-søk.

## Dokumentasjon
For mer dybdeinformasjon, se den nye dokumentasjons-huben i `docs/`:
- [**Arkitektur Overview**](docs/architecture.md) – Oversikt over teknologivalg og React-struktur.
- [**Prosjekt Manifest**](docs/manifest.md) – Filosofien bak data-pipelinen og de overordnede målene.
- [**Database Modell**](docs/database_model.md) – Detaljer om SQLite-skjemaet og `json_each` mønsteret.
- [**Legacy Dash Guide**](docs/legacy_dash.md) – Referanser til den opprinnelige Plotly/Dash prototypen (`Dash_Imagination`).

## Kom i gang (Utvikling)
1. **Installer avhengigheter:** `npm install`
2. **Kjør frontenden:** `npm run dev`
3. **Kjør backenden:** Gå til `sqlite-backend` repoet og kjør `uv run uvicorn api_imagination:app --port 8080 --reload`.

### Etikettfritt kartgrunnlag

Som standard bruker appen OpenFreeMap Positron uten API-nøkkel. Symbol-lagene
fjernes i klienten, og ImagiNation legger egne land- og havnavn oppå
vektorkartet. Hvis OpenFreeMap ikke kan lastes, brukes OpenStreetMap som fallback.

Følgende Vite-variabler kan brukes for å overstyre standarden:

- `VITE_OPENFREEMAP_STYLE_URL`: alternativ OpenFreeMap-kompatibel stil
- `VITE_BASEMAP_URL`: Leaflet-kompatibel tile-URL med `{z}`, `{x}` og `{y`
- `VITE_BASEMAP_ATTRIBUTION`: påkrevd attribusjon fra kartleverandøren
- `VITE_BASEMAP_MAX_ZOOM`: valgfri maksimal zoom, standard `19`

Hvis `VITE_BASEMAP_URL` settes, brukes rasterflisene i stedet for OpenFreeMap.
En eventuell leverandørnøkkel må være begrenset til appens domene fordi alle
Vite-variabler er synlige i den ferdige frontend-bundlen. Rasterleverandøren må
også tillate CORS for at PNG-eksport av kartet skal fungere.

Land- og havetikettene er en kompakt, generert fil basert på Natural Earth
(CC0), ISO-landkoder og norske marine navn fra Wikidata. Oppdater filen med
`npm run generate:map-labels`.

### CSV-eksport av stedsdata

Visuals-panelet tilbyr to Python- og regnearkvennlige CSV-filer:

- **Alle steder** henter hele det aktive korpuset og følger stedstype- og
  tidsfilter.
- **Synlig kartutsnitt** tar bare markørene som faktisk vises i viewporten, og
  følger i tillegg markørgrensen, stedskonkordans og bokforløpsfokus.

Kartutsnitt-eksporten er tilgjengelig i vanlig kartmodus, ikke i heatmap eller
A/B-sammenligning. Koordinatene er WGS84-desimalgrader. Filene bruker UTF-8
uten BOM, slik at første kolonnenavn leses rent av Python og andre dataverktøy.

CSV-kolonnene er:

- `place_id`, `nb_place_id`
- `historical_name`, `modern_name`
- `latitude`, `longitude`
- `mentions`, `book_count`
- `kind`, `feature_code`, `first_year`

Filen kan for eksempel bearbeides med pandas eller R. En redigert stedsfil kan
foreløpig ikke lastes tilbake i appen; kolonnenavnene er valgt med tanke på en
senere importfunksjon.

## Samarbeid og AI-medutvikler
For trygg samhandling i repoet anbefales denne oppsettet:
- **Tilganger:** Gi `Write`-tilgang til medutviklere og eventuelle bot-/service-kontoer som skal opprette brancher/PR.
- **Branch protection:** Beskytt `main` med krav om Pull Request og minst 1 review før merge.
- **CI-krav:** Krev grønn GitHub Actions-build før merge (for eksempel Pages-build og eventuelle tester/lint).
- **Arbeidsflyt:** Gjør endringer i feature-branch, åpne PR, og unngå direkte push til `main` når flere jobber parallelt.

---
*Utviklet av Nasjonalbiblioteket / DHLab.*
