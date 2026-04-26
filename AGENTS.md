# AGENTS

Dette er første stopp for agenter som jobber i dette repoet.

## Les først

1. `agent_les_meg.md`
2. `README.md`
3. `docs/architecture.md`
4. `docs/UI_INTERACTION_CONTRACT.md`

## Kritiske regler

- Ikke regress tidsvisning til gammel logikk. Bruk `POST /api/places/first-year`.
- Ikke bruk `or_query` eller fulltekst/near-logikk for temporal førstegangskartlegging.
- Ett panel skal normalt ha én oppgave. Bevar egne paneler som `PlaceStatsCard` og `PlaceQaCard`.
- Place kind-filter skal kunne stå på til det slås av eksplisitt.
- Geo-konkordans skal ikke sende `Nærhet` over `25`.

## Start i kode

Les disse filene tidlig:

- `src/context/CorpusContext.tsx`
- `src/App.tsx`
- `src/components/MapMarkers.tsx`
- `src/components/HeatmapLayer.tsx`
- `src/components/TemporalCard.tsx`
- `src/utils/temporal.ts`

## Mer detaljert onboarding

Se `agent_les_meg.md` for:

- nylige UI-beslutninger
- relevante backend-endepunkter
- hvilke docs som er verdt å lese
- prosjektspesifikke fallgruver
