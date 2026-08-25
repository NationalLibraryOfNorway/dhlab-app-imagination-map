import { useEffect, useState, type FC } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import type { Layer } from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { basemapConfig } from '../config/basemap';

const OPENFREEMAP_ATTRIBUTION = [
  '<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a>',
  '<a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
].join(' | ');

interface OpenFreeMapLayerProps {
  styleUrl: string;
}

export const OpenFreeMapLayer: FC<OpenFreeMapLayerProps> = ({ styleUrl }) => {
  const map = useMap();
  const [fallbackToRaster, setFallbackToRaster] = useState(false);

  useEffect(() => {
    if (fallbackToRaster) return undefined;
    const controller = new AbortController();
    let layer: Layer | null = null;
    let loadTimer: number | null = null;

    const load = async () => {
      const maplibreModule = await import('@maplibre/maplibre-gl-leaflet');
      if (controller.signal.aborted) return;
      const maplibreLayer = maplibreModule.maplibreGL({
        style: styleUrl,
        interactive: false,
        attributionControl: false,
        canvasContextAttributes: {
          preserveDrawingBuffer: true
        }
      });
      layer = maplibreLayer;
      maplibreLayer.addTo(map);
      const maplibreMap = maplibreLayer.getMaplibreMap();
      let mapLoaded = false;
      let labelsRemoved = false;
      const removeSymbolLayers = () => {
        if (labelsRemoved || !maplibreMap.isStyleLoaded()) return;
        labelsRemoved = true;
        maplibreMap.getStyle().layers
          .filter((styleLayer) => styleLayer.type === 'symbol')
          .forEach((styleLayer) => maplibreMap.removeLayer(styleLayer.id));
      };
      maplibreMap.on('styledata', removeSymbolLayers);
      maplibreMap.on('error', (event) => {
        console.error('OpenFreeMap render error', event.error);
        if (!mapLoaded && !controller.signal.aborted) setFallbackToRaster(true);
      });
      maplibreMap.once('load', () => {
        mapLoaded = true;
        removeSymbolLayers();
        const center = map.getCenter();
        maplibreMap.resize();
        maplibreMap.jumpTo({
          center: [center.lng, center.lat],
          zoom: map.getZoom() - 1
        });
        maplibreMap.triggerRepaint();
      });
      loadTimer = window.setTimeout(() => {
        if (!mapLoaded && !controller.signal.aborted) {
          console.error('OpenFreeMap timed out; using raster fallback');
          setFallbackToRaster(true);
        }
      }, 8000);
      map.attributionControl?.addAttribution(OPENFREEMAP_ATTRIBUTION);
    };

    load().catch((error) => {
      if (controller.signal.aborted) return;
      console.error('Could not load OpenFreeMap; using raster fallback', error);
      setFallbackToRaster(true);
    });

    return () => {
      controller.abort();
      if (loadTimer !== null) window.clearTimeout(loadTimer);
      if (layer) map.removeLayer(layer);
      map.attributionControl?.removeAttribution(OPENFREEMAP_ATTRIBUTION);
    };
  }, [fallbackToRaster, map, styleUrl]);

  if (!fallbackToRaster) return null;

  return (
    <TileLayer
      attribution={basemapConfig.attribution}
      url={basemapConfig.url}
      maxZoom={basemapConfig.maxZoom}
      crossOrigin="anonymous"
    />
  );
};
