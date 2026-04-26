import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { StatsHUD } from './components/StatsHUD'
import { CorpusBuilderCard } from './components/CorpusBuilderCard'
import { MapMarkers } from './components/MapMarkers'
import { HeatmapLayer } from './components/HeatmapLayer'
import { SelectedPlaceOverlay } from './components/SelectedPlaceOverlay'
import { PlaceSummaryCard } from './components/PlaceSummaryCard'
import { CorpusBrowseTable } from './components/CorpusBrowseTable'
import { EntityInspectorPanel } from './components/EntityInspectorPanel'
import { Omnibox } from './components/Omnibox'
import { VisualsCard } from './components/VisualsCard'
import { SegmentViewCard } from './components/SegmentViewCard'
import { PlaceStatsCard } from './components/PlaceStatsCard'
import { VisualsLauncherChip } from './components/VisualsLauncherChip'
import { SettingsLauncherChip } from './components/SettingsLauncherChip'
import { SettingsCard } from './components/SettingsCard'
import { PlaceQaCard } from './components/PlaceQaCard'
import { TemporalCard } from './components/TemporalCard'
import { GeoConcordanceCard } from './components/GeoConcordanceCard'
import { BookSequenceCard } from './components/BookSequenceCard'
import { useCorpus } from './context/CorpusContext'
import type { GeoSequenceRow } from './utils/geoApi'
import './index.css'

interface SelectedPlace {
  token: string;
  placeId?: string;
  name?: string | null;
  lat?: number | null;
  lon?: number | null;
}

function App() {
  const {
    setIsBrowseTableOpen,
    isBrowseTableOpen,
    setIsCorpusBuilderOpen,
    isCorpusBuilderOpen,
    setIsVisualsOpen,
    isVisualsOpen,
    setIsSettingsOpen,
    isSettingsOpen,
    setIsGeoConcordanceOpen,
    isGeoConcordanceOpen,
    setMapVisualMode,
    mapVisualMode,
    activeWindow,
    setActiveWindow,
    selectedPlaceKindFilter
  } = useCorpus();
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [isAuthorsListOpen, setIsAuthorsListOpen] = useState(false);
  const [isAuthorsImagesOpen, setIsAuthorsImagesOpen] = useState(false);
  const [isPlacesListOpen, setIsPlacesListOpen] = useState(false);
  const [isPlacesImagesOpen, setIsPlacesImagesOpen] = useState(false);
  const [isTemporalOpen, setIsTemporalOpen] = useState(false);
  const [isBookSequenceOpen, setIsBookSequenceOpen] = useState(false);
  const [sequenceBookId, setSequenceBookId] = useState<number | null>(null);
  const [sequenceRows, setSequenceRows] = useState<GeoSequenceRow[]>([]);
  const [sequenceDimOthers, setSequenceDimOthers] = useState(true);
  const [sequenceShowLine, setSequenceShowLine] = useState(false);
  const [sequenceShortStepsMode, setSequenceShortStepsMode] = useState(true);
  const [sequenceMaxStepKm, setSequenceMaxStepKm] = useState(350);
  const [sequenceProgressPct, setSequenceProgressPct] = useState(0);
  const [geoFocusPlaceIds, setGeoFocusPlaceIds] = useState<string[]>([]);
  const [geoFocusDimOthers, setGeoFocusDimOthers] = useState(true);
  const [geoFocusStyle, setGeoFocusStyle] = useState<'fill' | 'ring'>('ring');
  const [isPlaceStatsOpen, setIsPlaceStatsOpen] = useState(false);
  const [isPlaceQaOpen, setIsPlaceQaOpen] = useState(false);
  const [isSegmentViewOpen, setIsSegmentViewOpen] = useState(false);

  const openBookSequenceForBook = (bookId: number) => {
    setSequenceBookId(bookId);
    setIsBookSequenceOpen(true);
    setActiveWindow('bookSequence');
  };

  const exitBookSequenceMode = () => {
    setIsBookSequenceOpen(false);
    setSequenceRows([]);
    setSequenceBookId(null);
    setSequenceProgressPct(0);
    if (activeWindow === 'bookSequence') setActiveWindow(null);
  };

  return (
    <div className="app-shell">
      {/* Map layer */}
      <MapContainer center={[60.472, 8.468]} zoom={6} className="map-container" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapVisualMode === 'heatmap' || mapVisualMode === 'heatmap-all' ? (
          <HeatmapLayer useFullDataset={mapVisualMode === 'heatmap-all'} />
        ) : (
          <MapMarkers
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              setActiveWindow('summary');
            }}
            bookSequence={{
              rows: sequenceRows,
              dimOthers: sequenceDimOthers,
              showLine: sequenceShowLine,
              shortStepsMode: sequenceShortStepsMode,
              maxStepKm: sequenceMaxStepKm,
              progressPct: sequenceProgressPct
            }}
            geoFocus={{
              placeIds: geoFocusPlaceIds,
              dimOthers: geoFocusDimOthers,
              style: geoFocusStyle
            }}
          />
        )}
        <SelectedPlaceOverlay selectedPlace={selectedPlace} />
      </MapContainer>

      {/* Floating UI Elements */}
      <Omnibox
        onSelectPlace={(place) => {
          setSelectedPlace(place);
          setActiveWindow('summary');
        }}
      />
      <VisualsLauncherChip
        hasActivePlaceKindFilter={selectedPlaceKindFilter !== null}
        onVisualsDefaultClick={() => {
          if (isVisualsOpen && activeWindow === 'visuals') {
            setIsVisualsOpen(false);
            setActiveWindow(null);
          } else {
            setIsVisualsOpen(true);
            setActiveWindow('visuals');
          }
        }}
        onSegmentViewClick={() => {
          if (isSegmentViewOpen && activeWindow === 'segmentView') {
            setIsSegmentViewOpen(false);
            setActiveWindow(null);
          } else {
            setIsSegmentViewOpen(true);
            setActiveWindow('segmentView');
          }
        }}
        onVisualsPlaceStatsClick={() => {
          if (isPlaceStatsOpen && activeWindow === 'placeStats') {
            setIsPlaceStatsOpen(false);
            setActiveWindow(null);
          } else {
            setIsPlaceStatsOpen(true);
            setActiveWindow('placeStats');
          }
        }}
      />
      <SettingsLauncherChip
        onSettingsPanelClick={() => {
          if (isSettingsOpen && activeWindow === 'settings') {
            setIsSettingsOpen(false);
            setActiveWindow(null);
          } else {
            setIsSettingsOpen(true);
            setActiveWindow('settings');
          }
        }}
        onPlaceQaClick={() => {
          if (isPlaceQaOpen && activeWindow === 'placeQa') {
            setIsPlaceQaOpen(false);
            setActiveWindow(null);
          } else {
            setIsPlaceQaOpen(true);
            setActiveWindow('placeQa');
          }
        }}
        onSuggestChangeClick={() => {
          const title = encodeURIComponent('Forslag: ');
          const body = encodeURIComponent([
            '## Forslag',
            'Beskriv ønsket endring her.',
            '',
            '## Hvor i appen',
            'f.eks. Tidsvisning / Geo-konkordans / Steder',
            '',
            '## Hvorfor',
            'Hva blir bedre for brukeren?'
          ].join('\n'));
          window.open(`https://github.com/Yoonsen/imagination-frontend/issues/new?title=${title}&body=${body}`, '_blank', 'noopener,noreferrer');
        }}
      />
      <StatsHUD
        onBooksCorpusBuilderClick={() => {
          if (isCorpusBuilderOpen && activeWindow === 'builder') {
            setIsCorpusBuilderOpen(false);
            setActiveWindow(null);
          } else {
            setIsCorpusBuilderOpen(true);
            setActiveWindow('builder');
          }
        }}
        onBooksTableClick={() => {
          if (isBrowseTableOpen && activeWindow === 'browse') {
            setIsBrowseTableOpen(false);
            setActiveWindow(null);
          } else {
            setIsBrowseTableOpen(true);
            setActiveWindow('browse');
          }
        }}
        onAuthorsListClick={() => {
          if (isAuthorsListOpen && activeWindow === 'entityAuthorsList') {
            setIsAuthorsListOpen(false);
            setActiveWindow(null);
          } else {
            setIsAuthorsListOpen(true);
            setActiveWindow('entityAuthorsList');
          }
        }}
        onAuthorsImagesClick={() => {
          if (isAuthorsImagesOpen && activeWindow === 'entityAuthorsImages') {
            setIsAuthorsImagesOpen(false);
            setActiveWindow(null);
          } else {
            setIsAuthorsImagesOpen(true);
            setActiveWindow('entityAuthorsImages');
          }
        }}
        onPlacesListClick={() => {
          if (isPlacesListOpen && activeWindow === 'entityPlacesList') {
            setIsPlacesListOpen(false);
            setActiveWindow(null);
          } else {
            setIsPlacesListOpen(true);
            setActiveWindow('entityPlacesList');
          }
        }}
        onPlacesImagesClick={() => {
          if (isPlacesImagesOpen && activeWindow === 'entityPlacesImages') {
            setIsPlacesImagesOpen(false);
            setActiveWindow(null);
          } else {
            setIsPlacesImagesOpen(true);
            setActiveWindow('entityPlacesImages');
          }
        }}
        onPlacesGeoConcordanceClick={() => {
          if (isGeoConcordanceOpen && activeWindow === 'geoConcordance') {
            setIsGeoConcordanceOpen(false);
            setActiveWindow(null);
          } else {
            setIsGeoConcordanceOpen(true);
            setActiveWindow('geoConcordance');
          }
        }}
        onPlacesBookSequenceClick={() => {
          if (isBookSequenceOpen && activeWindow === 'bookSequence') {
            exitBookSequenceMode();
          } else {
            setIsBookSequenceOpen(true);
            setActiveWindow('bookSequence');
          }
        }}
        onYearClick={() => {
          if (isTemporalOpen && activeWindow === 'temporal') {
            setIsTemporalOpen(false);
            setActiveWindow(null);
          } else {
            setIsTemporalOpen(true);
            setActiveWindow('temporal');
          }
        }}
      />
      <div className="workspace-zone">
        <CorpusBuilderCard />
        <VisualsCard />
        <SegmentViewCard
          isOpen={isSegmentViewOpen}
          onClose={() => {
            setIsSegmentViewOpen(false);
            if (activeWindow === 'segmentView') setActiveWindow(null);
          }}
        />
        <PlaceStatsCard
          isOpen={isPlaceStatsOpen}
          onClose={() => {
            setIsPlaceStatsOpen(false);
            if (activeWindow === 'placeStats') setActiveWindow(null);
          }}
        />
        <SettingsCard />
        <PlaceQaCard
          isOpen={isPlaceQaOpen}
          onClose={() => {
            setIsPlaceQaOpen(false);
            if (activeWindow === 'placeQa') setActiveWindow(null);
          }}
        />
        <GeoConcordanceCard
          isOpen={isGeoConcordanceOpen}
          onClose={() => {
            setIsGeoConcordanceOpen(false);
            if (activeWindow === 'geoConcordance') setActiveWindow(null);
          }}
          onApplyMapFocus={({ placeIds, dimOthers, style }) => {
            setGeoFocusPlaceIds(placeIds);
            setGeoFocusDimOthers(dimOthers);
            setGeoFocusStyle(style);
            setMapVisualMode('map');
          }}
          onClearMapFocus={() => setGeoFocusPlaceIds([])}
          mapFocusAppliedCount={geoFocusPlaceIds.length}
        />
        <BookSequenceCard
          isOpen={isBookSequenceOpen}
          onClose={exitBookSequenceMode}
          onExitMode={exitBookSequenceMode}
          selectedBookId={sequenceBookId}
          onSelectBookId={setSequenceBookId}
          sequenceRows={sequenceRows}
          onSetSequenceRows={(rows) => {
            setSequenceRows(rows);
            setSequenceProgressPct(0);
          }}
          dimOthers={sequenceDimOthers}
          onSetDimOthers={setSequenceDimOthers}
          showLine={sequenceShowLine}
          onSetShowLine={setSequenceShowLine}
          shortStepsMode={sequenceShortStepsMode}
          onSetShortStepsMode={setSequenceShortStepsMode}
          maxStepKm={sequenceMaxStepKm}
          onSetMaxStepKm={setSequenceMaxStepKm}
          progressPct={sequenceProgressPct}
          onSetProgressPct={setSequenceProgressPct}
        />
        <TemporalCard
          isOpen={isTemporalOpen}
          onClose={() => {
            setIsTemporalOpen(false);
            if (activeWindow === 'temporal') setActiveWindow(null);
          }}
        />
        <CorpusBrowseTable onShowBookSequence={openBookSequenceForBook} />
        {isAuthorsListOpen && (
          <EntityInspectorPanel
            mode="authors"
            windowKey="entityAuthorsList"
            defaultPosition={{ x: 80, y: 24 }}
            initialTab="list"
            onClose={() => {
              setIsAuthorsListOpen(false);
              if (activeWindow === 'entityAuthorsList') setActiveWindow(null);
            }}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              setActiveWindow('summary');
            }}
          />
        )}
        {isAuthorsImagesOpen && (
          <EntityInspectorPanel
            mode="authors"
            windowKey="entityAuthorsImages"
            defaultPosition={{ x: 140, y: 70 }}
            initialTab="images"
            onClose={() => {
              setIsAuthorsImagesOpen(false);
              if (activeWindow === 'entityAuthorsImages') setActiveWindow(null);
            }}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              setActiveWindow('summary');
            }}
          />
        )}
        {isPlacesListOpen && (
          <EntityInspectorPanel
            mode="places"
            windowKey="entityPlacesList"
            defaultPosition={{ x: 180, y: 90 }}
            initialTab="list"
            onClose={() => {
              setIsPlacesListOpen(false);
              if (activeWindow === 'entityPlacesList') setActiveWindow(null);
            }}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              setActiveWindow('summary');
            }}
          />
        )}
        {isPlacesImagesOpen && (
          <EntityInspectorPanel
            mode="places"
            windowKey="entityPlacesImages"
            defaultPosition={{ x: 240, y: 140 }}
            initialTab="images"
            onClose={() => {
              setIsPlacesImagesOpen(false);
              if (activeWindow === 'entityPlacesImages') setActiveWindow(null);
            }}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              setActiveWindow('summary');
            }}
          />
        )}
        <PlaceSummaryCard
          token={selectedPlace?.token || null}
          placeId={selectedPlace?.placeId}
          fallbackName={selectedPlace?.name}
          fallbackLat={selectedPlace?.lat}
          fallbackLon={selectedPlace?.lon}
          onClose={() => setSelectedPlace(null)}
          onShowBookSequence={openBookSequenceForBook}
        />
      </div>

    </div>
  )
}

export default App
