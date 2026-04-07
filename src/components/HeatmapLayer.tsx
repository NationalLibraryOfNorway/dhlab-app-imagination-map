import { useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useCorpus } from '../context/CorpusContext';
import { mixHex } from '../utils/colors';

interface HeatmapLayerProps {
  useFullDataset?: boolean;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ useFullDataset = false }) => {
  const map = useMap();
  const {
    places,
    totalPlaces,
    activeDhlabids,
    API_URL,
    downlightPercentile,
    downlightColorMode,
    lowFreqGreenStrength
  } = useCorpus();
  const [fullPlaces, setFullPlaces] = useState<typeof places | null>(null);

  useEffect(() => {
    if (!useFullDataset) return;
    if (activeDhlabids.length === 0) {
      setFullPlaces([]);
      return;
    }
    if (totalPlaces <= places.length) {
      setFullPlaces(places);
      return;
    }

    let cancelled = false;
    fetch(`${API_URL}/api/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dhlabids: activeDhlabids,
        maxPlaces: totalPlaces
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch full places set for heatmap');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setFullPlaces(data.places || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setFullPlaces(places);
      });

    return () => {
      cancelled = true;
    };
  }, [useFullDataset, activeDhlabids, totalPlaces, places, API_URL]);

  const sourcePlaces = useFullDataset ? (fullPlaces || places) : places;

  const points = useMemo<[number, number, number][]>(() => {
    if (sourcePlaces.length === 0) return [];

    const frequencies = sourcePlaces.map((place) => place.frequency);
    const sortedFreqs = [...frequencies].sort((a, b) => a - b);
    const thresholdIdx = Math.floor((downlightPercentile / 100) * Math.max(0, sourcePlaces.length - 1));
    const thresholdFreq = downlightPercentile > 0 ? sortedFreqs[thresholdIdx] : 0;
    const maxFreq = Math.max(...frequencies);
    const minFreq = Math.min(...frequencies);
    const logMax = Math.log1p(maxFreq);
    const logMin = Math.log1p(minFreq);

    return sourcePlaces
      .filter((place) => place.frequency > thresholdFreq)
      .map((place) => {
        const norm = logMax > logMin
          ? (Math.log1p(place.frequency) - logMin) / (logMax - logMin)
          : 0.35;
        const intensity = 0.2 + norm * 0.8;
        return [place.lat, place.lon, intensity];
      });
  }, [sourcePlaces, downlightPercentile]);

  useEffect(() => {
    if (points.length === 0) return;

    const greenRatio = lowFreqGreenStrength / 100;
    const baseLow = downlightColorMode === 'red' ? '#fee2e2' : '#dbeafe';
    const baseMid = downlightColorMode === 'red' ? '#f87171' : '#60a5fa';
    const baseHigh = downlightColorMode === 'red' ? '#991b1b' : '#1e3a8a';
    const greenLow = '#bbf7d0';
    const greenMid = '#22c55e';

    const gradient = {
      0.2: mixHex(baseLow, greenLow, greenRatio),
      0.55: mixHex(baseMid, greenMid, greenRatio * 0.8),
      1.0: baseHigh
    };

    const heatLayer = (L as any).heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 9,
      minOpacity: 0.26,
      gradient
    });

    heatLayer.addTo(map);
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, downlightColorMode, lowFreqGreenStrength]);

  return null;
};
