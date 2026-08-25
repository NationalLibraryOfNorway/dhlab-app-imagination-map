import { useState, type FC } from 'react';
import L from 'leaflet';
import { Marker, Pane, useMap, useMapEvents } from 'react-leaflet';
import { mapLabelData } from '../data/mapLabels.generated';
import type { MapLabelLanguage, MapLabelMode } from '../types/mapLabels';
import './MapLabelsLayer.css';

interface MapLabelsLayerProps {
  language: MapLabelLanguage;
  mode: MapLabelMode;
}

interface LabelCandidate {
  id: string;
  name: string;
  lat: number;
  lon: number;
  rank: number;
  kind: 'country' | 'marine';
}

interface LabelBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const MapLabelsLayer: FC<MapLabelsLayerProps> = ({ language, mode }) => {
  const map = useMap();
  const [, setViewVersion] = useState(0);
  useMapEvents({
    moveend: () => setViewVersion((value) => value + 1),
    zoomend: () => setViewVersion((value) => value + 1),
    resize: () => setViewVersion((value) => value + 1)
  });

  const labels = (() => {
    if (mode === 'none') return [];
    const zoom = map.getZoom();
    const bounds = map.getBounds().pad(0.12);
    const displayNames = language === 'no'
      ? new Intl.DisplayNames(['nb'], { type: 'region' })
      : null;

    const candidates: LabelCandidate[] = mapLabelData.countries
      .filter((label) => zoom >= label.minZoom && bounds.contains([label.lat, label.lon]))
      .map((label) => ({
        id: `country-${label.id}`,
        name: (
          displayNames && label.isoA2
            ? displayNames.of(label.isoA2)
            : label.nameEn
        ) || label.nameEn,
        lat: label.lat,
        lon: label.lon,
        rank: label.rank,
        kind: 'country'
      }));

    if (mode === 'countries-marine') {
      mapLabelData.marine
        .filter((label) => (
          zoom >= label.minZoom
          && zoom <= label.maxZoom
          && bounds.contains([label.lat, label.lon])
        ))
        .forEach((label) => {
          candidates.push({
            id: `marine-${label.id}`,
            name: language === 'no' ? label.nameNo : label.nameEn,
            lat: label.lat,
            lon: label.lon,
            rank: label.rank,
            kind: 'marine'
          });
        });
    }

    candidates.sort((a, b) => (
      a.rank - b.rank
      || (a.kind === b.kind ? 0 : (a.kind === 'country' ? -1 : 1))
      || a.name.localeCompare(b.name, language === 'no' ? 'nb' : 'en')
    ));

    const acceptedBoxes: LabelBox[] = [];
    return candidates.filter((candidate) => {
      const point = map.latLngToContainerPoint([candidate.lat, candidate.lon]);
      const characterWidth = candidate.kind === 'marine' ? 7.5 : 7;
      const width = Math.max(44, Math.min(190, candidate.name.length * characterWidth + 18));
      const height = candidate.kind === 'marine' ? 24 : 22;
      const box = {
        left: point.x - width / 2,
        right: point.x + width / 2,
        top: point.y - height / 2,
        bottom: point.y + height / 2
      };
      if (acceptedBoxes.some((accepted) => boxesOverlap(box, accepted))) return false;
      acceptedBoxes.push(box);
      return true;
    });
  })();

  if (mode === 'none') return null;

  return (
    <Pane name="map-labels" style={{ zIndex: 350, pointerEvents: 'none' }}>
      {labels.map((label) => (
        <Marker
          key={label.id}
          position={[label.lat, label.lon]}
          interactive={false}
          keyboard={false}
          icon={L.divIcon({
            className: 'map-label-icon',
            html: `<span class="map-label map-label--${label.kind}">${escapeHtml(label.name)}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          })}
        />
      ))}
    </Pane>
  );
};
