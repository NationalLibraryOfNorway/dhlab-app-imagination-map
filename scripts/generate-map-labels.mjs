import { mkdir, writeFile } from 'node:fs/promises';

const COUNTRY_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const MARINE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_geography_marine_polys.geojson';

const outputPath = new URL('../src/data/mapLabels.generated.ts', import.meta.url);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'imagination-map-label-generator/1.0' }
  });
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: ${response.status}`);
  }
  return response.json();
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function flattenCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return geometry.coordinates.flat(1);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat(2);
  return [];
}

function geometryCenter(geometry) {
  const coordinates = flattenCoordinates(geometry);
  if (coordinates.length === 0) return { lat: 0, lon: 0 };
  const longitudes = coordinates.map((point) => Number(point[0])).filter(Number.isFinite);
  const latitudes = coordinates.map((point) => Number(point[1])).filter(Number.isFinite);
  return {
    lon: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2
  };
}

async function fetchNorwegianLabels(wikidataIds) {
  const labels = new Map();
  const ids = Array.from(new Set(wikidataIds.filter(Boolean)));
  for (let index = 0; index < ids.length; index += 40) {
    const chunk = ids.slice(index, index + 40);
    const params = new URLSearchParams({
      action: 'wbgetentities',
      ids: chunk.join('|'),
      props: 'labels',
      languages: 'nb|en',
      format: 'json',
      origin: '*'
    });
    const data = await fetchJson(`https://www.wikidata.org/w/api.php?${params.toString()}`);
    Object.entries(data.entities || {}).forEach(([id, entity]) => {
      const label = entity?.labels?.nb?.value || entity?.labels?.en?.value;
      if (label) labels.set(id, label);
    });
  }
  return labels;
}

const marinePositionOverrides = new Map([
  ['Q98:0', { lat: 25, lon: -155 }],
  ['Q98:1', { lat: -27, lon: -140 }],
  ['Q164466:0', { lat: -76, lon: 175 }]
]);
const supplementalMarineLabels = [
  {
    id: 'supplemental-north-sea',
    nameEn: 'North Sea',
    nameNo: 'Nordsjøen',
    lat: 56.3,
    lon: 3.2,
    minZoom: 4,
    maxZoom: 10,
    rank: 3
  },
  {
    id: 'supplemental-skagerrak',
    nameEn: 'Skagerrak',
    nameNo: 'Skagerrak',
    lat: 58,
    lon: 8.5,
    minZoom: 6,
    maxZoom: 11,
    rank: 4
  },
  {
    id: 'supplemental-barents-sea',
    nameEn: 'Barents Sea',
    nameNo: 'Barentshavet',
    lat: 74.5,
    lon: 38,
    minZoom: 3,
    maxZoom: 9,
    rank: 3
  }
];
const countryCodeOverrides = new Map([
  ['NOR', 'NO'],
  ['FRA', 'FR'],
  ['TWN', 'TW'],
  ['KOS', 'XK']
]);

const [countryData, marineData] = await Promise.all([
  fetchJson(COUNTRY_URL),
  fetchJson(MARINE_URL)
]);

const countries = countryData.features
  .map((feature) => {
    const properties = feature.properties || {};
    const lat = finiteNumber(properties.LABEL_Y, Number.NaN);
    const lon = finiteNumber(properties.LABEL_X, Number.NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const countryId = String(properties.ADM0_A3 || properties.ISO_A3 || properties.NAME_EN);
    const isoA2 = [
      properties.ISO_A2,
      properties.ISO_A2_EH,
      properties.WB_A2,
      countryCodeOverrides.get(countryId)
    ].map(String).find((value) => /^[A-Z]{2}$/.test(value)) || null;
    return {
      id: countryId,
      isoA2,
      nameEn: String(properties.NAME_EN || properties.NAME || ''),
      lat,
      lon,
      minZoom: Math.max(1, Math.floor(finiteNumber(properties.MIN_LABEL, 3))),
      rank: finiteNumber(properties.LABELRANK, 9)
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.rank - b.rank || a.nameEn.localeCompare(b.nameEn));

const occurrenceByWikidataId = new Map();
const norwegianMarineLabels = await fetchNorwegianLabels(
  marineData.features.map((feature) => feature.properties?.wikidataid)
);
const marine = marineData.features
  .map((feature, featureIndex) => {
    const properties = feature.properties || {};
    const wikidataId = String(properties.wikidataid || `marine-${featureIndex}`);
    const occurrence = occurrenceByWikidataId.get(wikidataId) || 0;
    occurrenceByWikidataId.set(wikidataId, occurrence + 1);
    const center = marinePositionOverrides.get(`${wikidataId}:${occurrence}`)
      || geometryCenter(feature.geometry);
    return {
      id: `${wikidataId}-${occurrence}`,
      nameEn: String(properties.name_en || properties.name || ''),
      nameNo: norwegianMarineLabels.get(wikidataId)
        || String(properties.name_en || properties.name || ''),
      lat: Number(center.lat.toFixed(5)),
      lon: Number(center.lon.toFixed(5)),
      minZoom: Math.max(1, Math.floor(finiteNumber(properties.min_label, 2))),
      maxZoom: Math.ceil(finiteNumber(properties.max_label, 8)),
      rank: finiteNumber(properties.scalerank, 9)
    };
  })
  .concat(supplementalMarineLabels)
  .sort((a, b) => a.rank - b.rank || a.nameEn.localeCompare(b.nameEn));

const generated = {
  source: 'Natural Earth 1:110m (CC0); Norwegian marine labels from Wikidata',
  countries,
  marine
};

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(
  outputPath,
  `// Generated by scripts/generate-map-labels.mjs. Do not edit manually.\n`
    + `export const mapLabelData = ${JSON.stringify(generated, null, 2)} as const;\n`,
  'utf8'
);

console.log(`Generated ${countries.length} country labels and ${marine.length} marine labels.`);
