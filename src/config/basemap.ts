const DEFAULT_BASEMAP_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const configuredUrl = import.meta.env.VITE_BASEMAP_URL?.trim();
const configuredAttribution = import.meta.env.VITE_BASEMAP_ATTRIBUTION?.trim();
const configuredMaxZoom = Number(import.meta.env.VITE_BASEMAP_MAX_ZOOM);
const configuredOpenFreeMapStyle =
  import.meta.env.VITE_OPENFREEMAP_STYLE_URL?.trim()
  || 'https://tiles.openfreemap.org/styles/positron';

export const basemapConfig = {
  provider: configuredUrl ? 'raster' : 'openfreemap',
  url: configuredUrl || DEFAULT_BASEMAP_URL,
  attribution: configuredAttribution || DEFAULT_BASEMAP_ATTRIBUTION,
  openFreeMapStyleUrl: configuredOpenFreeMapStyle,
  maxZoom: Number.isFinite(configuredMaxZoom) && configuredMaxZoom > 0
    ? configuredMaxZoom
    : 19
} as const;
