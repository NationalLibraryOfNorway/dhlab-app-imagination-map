import React, { useMemo } from 'react';
import { CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { useCorpus } from '../context/CorpusContext';
import { mixHex } from '../utils/colors';

interface MapMarkersProps {
    onSelectPlace: (token: string) => void;
}

const MAP_MARKER_LIMIT = 1800;

export const MapMarkers: React.FC<MapMarkersProps> = ({ onSelectPlace }) => {
    const { places, isPlacesLoading, downlightPercentile, downlightColorMode, lowFreqGreenStrength } = useCorpus();
    const map = useMap();

    // Beregn størrelsene iterativt med np.log1p math ekvivalent for React
    const renderedMarkers = useMemo(() => {
        if (places.length === 0) return [];
        const mapPlaces = [...places]
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, MAP_MARKER_LIMIT);
        
        const frequencies = mapPlaces.map(p => p.frequency);
        const minFreq = Math.min(...frequencies);
        const maxFreq = Math.max(...frequencies);
        const logMin = Math.log1p(minFreq);
        const logMax = Math.log1p(maxFreq);
        
        // Calculate the absolute frequency threshold based on the percentile
        let thresholdFreq = 0;
        if (downlightPercentile > 0) {
           const sortedFreqs = [...frequencies].sort((a,b)=>a-b);
           const pIdx = Math.floor((downlightPercentile / 100) * (mapPlaces.length - 1));
           thresholdFreq = sortedFreqs[pIdx];
        }

        return mapPlaces.map(place => {
            // Normalisert radius
            let radius = 6;
            if (logMax > logMin) {
                const norm = (Math.log1p(place.frequency) - logMin) / (logMax - logMin);
                radius = 6 + norm * 18;
            }
            
            const isDownlighted = place.frequency <= thresholdFreq;
            const baseStroke = downlightColorMode === 'red' ? '#dc2626' : '#1d4ed8';
            const baseFill = downlightColorMode === 'red' ? '#ef4444' : '#3b82f6';
            const greenBase = '#22c55e';
            const greenStrength = lowFreqGreenStrength / 100;
            const lowFreqBias = logMax > logMin
                ? 1 - ((Math.log1p(place.frequency) - logMin) / (logMax - logMin))
                : 1;
            const greenMix = greenStrength * Math.max(0, Math.min(1, lowFreqBias));
            const activeStroke = mixHex(baseStroke, '#15803d', greenMix * 0.9);
            const activeFill = mixHex(baseFill, greenBase, greenMix);
            const dimFill = mixHex(downlightColorMode === 'red' ? '#fca5a5' : '#93c5fd', '#86efac', greenMix);

            return (
                <CircleMarker
                    key={place.id}
                    center={[place.lat, place.lon]}
                    radius={radius}
                    pathOptions={{ 
                        color: isDownlighted ? 'transparent' : activeStroke,
                        fillColor: isDownlighted ? dimFill : activeFill,
                        fillOpacity: isDownlighted ? 0.12 : (downlightColorMode === 'red' ? 0.62 : 0.54),
                        weight: isDownlighted ? 0 : 1.5
                    }}
                    eventHandlers={{
                        click: () => {
                            onSelectPlace(place.token);
                            map.panTo([place.lat, place.lon]);
                        }
                    }}
                >
                    <Tooltip sticky>
                        <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                            <strong>{place.token}</strong> {place.name ? `(${place.name})` : ''}<br />
                            Nevnt: <strong>{place.frequency.toLocaleString()}</strong> ganger<br />
                            Forekommer i: <strong>{place.doc_count.toLocaleString()}</strong> bøker
                        </div>
                    </Tooltip>
                </CircleMarker>
            );
        });
    }, [places, onSelectPlace, map, downlightPercentile, downlightColorMode, lowFreqGreenStrength]);

    if (isPlacesLoading) {
        // En elegant måte å vise kart-loading på kan implementeres
        return null;
    }

    return <>{renderedMarkers}</>;
}
