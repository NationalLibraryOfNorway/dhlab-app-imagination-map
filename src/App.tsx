import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { StatsHUD } from './components/StatsHUD'
import { CorpusBuilderCard } from './components/CorpusBuilderCard'
import { MapMarkers } from './components/MapMarkers'
import { PlaceSummaryCard } from './components/PlaceSummaryCard'
import { CorpusBrowseTable } from './components/CorpusBrowseTable'
import './index.css'

function App() {
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map layer */}
      <MapContainer center={[60.472, 8.468]} zoom={6} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarkers onSelectPlace={setSelectedPlace} />
      </MapContainer>

      {/* Floating UI Elements */}
      <StatsHUD />
      <CorpusBuilderCard />
      <CorpusBrowseTable />
      <PlaceSummaryCard token={selectedPlace} onClose={() => setSelectedPlace(null)} />

    </div>
  )
}

export default App
