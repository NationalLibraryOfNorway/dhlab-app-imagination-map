import type { PlacePoint } from '../context/CorpusContext';

type PlaceRow = Record<string, unknown>;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toPlacePoint = (value: unknown): PlacePoint | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as PlaceRow;
  const idRaw = row.id ?? row.place_id ?? row.placeId ?? row.mock_id ?? row.nb_place_id;
  const nbPlaceId = toNumber(row.nb_place_id);
  const tokenRaw = row.token ?? row.historical_name ?? row.name ?? row.modern_name;
  const nameRaw = row.name ?? row.modern_name ?? row.canonical_name ?? row.token;
  const lat = toNumber(row.lat ?? row.latitude);
  const lon = toNumber(row.lon ?? row.longitude);
  const frequency = toNumber(row.frequency ?? row.mentions ?? row.count) ?? 0;
  const docCount = toNumber(row.doc_count ?? row.book_count ?? row.docs) ?? 0;
  const featureCodeRaw = row.featureCode ?? row.feature_code ?? null;
  const kindRaw = row.kind ?? null;

  if (lat === null || lon === null) return null;
  const id = String(idRaw ?? '').trim();
  const token = String(tokenRaw ?? '').trim();
  if (!id || !token) return null;

  return {
    id,
    nbPlaceId,
    token,
    name: nameRaw ? String(nameRaw) : null,
    lat,
    lon,
    frequency,
    doc_count: docCount,
    featureCode: featureCodeRaw ? String(featureCodeRaw) : null,
    kind: kindRaw ? String(kindRaw).trim().toLowerCase() : null
  };
};

export const normalizePlaces = (rows: unknown): PlacePoint[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(toPlacePoint)
    .filter((row): row is PlacePoint => row !== null);
};
