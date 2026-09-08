import type { BookMetadata, PlacePoint } from '../context/CorpusContext';
import { normalizePlaces } from './placePoints';
import { fetchFirstYearByTokenForCorpus } from './temporal';

export const PLACE_CSV_HEADERS = [
  'place_id',
  'nb_place_id',
  'historical_name',
  'modern_name',
  'latitude',
  'longitude',
  'mentions',
  'book_count',
  'kind',
  'feature_code',
  'first_year'
];

type CsvCell = string | number | null | undefined;

export interface PreparePlaceCsvExportParams {
  apiUrl: string;
  activeDhlabids: number[];
  activeBooksMetadata: BookMetadata[];
  places: PlacePoint[];
  totalPlaces: number;
  selectedPlaceKindFilter: string | null;
  temporalEnabled: boolean;
  temporalCutoffYear: number | null;
  temporalMode: 'color' | 'toggle';
  scope?: 'complete' | 'visible';
  visiblePlaceIds?: string[];
}

export interface PreparedPlaceCsvExport {
  filename: string;
  headers: string[];
  rows: CsvCell[][];
}

const normalizePlaceId = (placeId: string): string => placeId.trim().toLowerCase();
const API_MAX_PLACES = 20000;
const completePlaceCache = new Map<string, PlacePoint[]>();

const mergePlaceSets = (placeSets: PlacePoint[][]): PlacePoint[] => {
  const merged = new Map<string, PlacePoint>();
  placeSets.flat().forEach((place) => {
    const key = normalizePlaceId(place.id);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...place });
      return;
    }
    existing.frequency += place.frequency;
    existing.doc_count += place.doc_count;
    existing.nbPlaceId ??= place.nbPlaceId;
    existing.name ??= place.name;
    existing.featureCode ??= place.featureCode;
    existing.kind ??= place.kind;
  });
  return Array.from(merged.values());
};

const fetchPlacesForBookBatch = async (
  apiUrl: string,
  dhlabids: number[]
): Promise<PlacePoint[]> => {
  const response = await fetch(`${apiUrl}/api/places`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dhlabids,
      maxPlaces: API_MAX_PLACES
    })
  });
  if (!response.ok) {
    throw new Error(`Kunne ikke hente alle steder (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const places = normalizePlaces(data?.places);
  const reportedTotal = Number(data?.total_places ?? data?.totalPlaces) || places.length;
  if (reportedTotal <= places.length) return places;
  if (dhlabids.length <= 1) {
    throw new Error(
      `Én bok inneholder flere enn backendgrensen på ${API_MAX_PLACES} steder. Ingen delvis CSV ble laget.`
    );
  }

  const midpoint = Math.ceil(dhlabids.length / 2);
  const [left, right] = await Promise.all([
    fetchPlacesForBookBatch(apiUrl, dhlabids.slice(0, midpoint)),
    fetchPlacesForBookBatch(apiUrl, dhlabids.slice(midpoint))
  ]);
  return mergePlaceSets([left, right]);
};

const fetchCompletePlaceSet = async ({
  apiUrl,
  activeDhlabids,
  places,
  totalPlaces
}: Pick<
  PreparePlaceCsvExportParams,
  'apiUrl' | 'activeDhlabids' | 'places' | 'totalPlaces'
>): Promise<PlacePoint[]> => {
  if (totalPlaces <= places.length) return places;

  const cacheKey = `${apiUrl}|${[...activeDhlabids].sort((a, b) => a - b).join(',')}`;
  const cached = completePlaceCache.get(cacheKey);
  if (cached && cached.length >= totalPlaces) return cached;

  const completePlaces = await fetchPlacesForBookBatch(apiUrl, activeDhlabids);
  if (completePlaces.length < totalPlaces) {
    throw new Error(
      `Backend returnerte bare ${completePlaces.length} av ${totalPlaces} steder. Ingen delvis CSV ble laget.`
    );
  }
  completePlaceCache.set(cacheKey, completePlaces);
  return completePlaces;
};

const createFilename = (
  rowCount: number,
  scope: 'complete' | 'visible',
  now = new Date()
): string => {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
  const label = scope === 'visible' ? 'viewport_places' : 'places';
  return `imagination_${label}_${date}_${rowCount}.csv`;
};

export async function preparePlaceCsvExport(
  params: PreparePlaceCsvExportParams
): Promise<PreparedPlaceCsvExport> {
  if (params.activeDhlabids.length === 0) {
    throw new Error('Velg et korpus før du laster ned stedsdata.');
  }

  const scope = params.scope || 'complete';
  const visibleIds = new Set(
    (params.visiblePlaceIds || []).map(normalizePlaceId).filter(Boolean)
  );
  const completePlaces = scope === 'visible'
    ? params.places.filter((place) => visibleIds.has(normalizePlaceId(place.id)))
    : await fetchCompletePlaceSet(params);
  const kindFilteredPlaces = params.selectedPlaceKindFilter
    ? completePlaces.filter((place) => place.kind === params.selectedPlaceKindFilter)
    : completePlaces;

  const firstYearByPlaceId = params.temporalEnabled
    ? await fetchFirstYearByTokenForCorpus({
        apiUrl: params.apiUrl,
        activeBooksMetadata: params.activeBooksMetadata,
        targetPlaceIds: kindFilteredPlaces.map((place) => place.id)
      })
    : new Map<string, number>();

  const filteredPlaces = (
    params.temporalEnabled
    && params.temporalMode === 'toggle'
    && params.temporalCutoffYear !== null
  )
    ? kindFilteredPlaces.filter((place) => {
        const firstYear = firstYearByPlaceId.get(normalizePlaceId(place.id));
        return typeof firstYear !== 'number' || firstYear < params.temporalCutoffYear!;
      })
    : kindFilteredPlaces;

  const sortedPlaces = [...filteredPlaces].sort((a, b) => (
    b.frequency - a.frequency
    || a.token.localeCompare(b.token, 'nb')
    || a.id.localeCompare(b.id)
  ));
  const rows = sortedPlaces.map((place): CsvCell[] => [
    place.id,
    place.nbPlaceId,
    place.token,
    place.name,
    place.lat,
    place.lon,
    place.frequency,
    place.doc_count,
    place.kind,
    place.featureCode,
    firstYearByPlaceId.get(normalizePlaceId(place.id))
  ]);

  return {
    filename: createFilename(rows.length, scope),
    headers: PLACE_CSV_HEADERS,
    rows
  };
}
