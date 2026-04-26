import React from 'react';
import { Rnd } from 'react-rnd';
import { useCorpus } from '../context/CorpusContext';
import { useWindowLayout } from '../utils/windowLayout';
import './VisualsCard.css';

interface SegmentViewCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SegmentViewCard: React.FC<SegmentViewCardProps> = ({ isOpen, onClose }) => {
  const {
    activeWindow,
    setActiveWindow,
    compareSegmentsEnabled,
    setCompareSegmentsEnabled,
    segmentABookIds,
    segmentBBookIds
  } = useCorpus();

  const compareReady = segmentABookIds.length > 0 && segmentBBookIds.length > 0;
  const { layout, onDrag, onDragStop, onResizeStop } = useWindowLayout({
    key: 'segmentView',
    defaultLayout: { x: 360, y: 32, width: 320, height: 240 },
    minWidth: 280,
    minHeight: 220
  });

  if (!isOpen) return null;

  return (
    <Rnd
      size={{ width: layout.width, height: layout.height }}
      position={{ x: layout.x, y: layout.y }}
      minWidth={280}
      minHeight={220}
      cancel=".no-drag"
      dragHandleClassName="drag-handle"
      className="visuals-card"
      style={{ zIndex: activeWindow === 'segmentView' ? 2600 : 1750 }}
      onDragStart={() => setActiveWindow('segmentView')}
      onDrag={onDrag}
      onResizeStart={() => setActiveWindow('segmentView')}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
    >
      <div className="visuals-header drag-handle" onMouseDown={() => setActiveWindow('segmentView')}>
        <div className="visuals-title">
          <i className="fas fa-code-branch"></i> Segmentvisning
        </div>
        <div className="visuals-controls no-drag">
          <button onClick={onClose} title="Lukk segmentvisning">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="visuals-body no-drag">
        <div className="visuals-section">
          <label>Segmentmodus</label>
          <div className="visuals-toggle-row">
            <button
              className={`visuals-toggle ${compareSegmentsEnabled ? 'active' : ''}`}
              onClick={() => setCompareSegmentsEnabled(!compareSegmentsEnabled)}
              disabled={!compareReady}
              title={compareSegmentsEnabled ? 'Slå av sammenligning' : 'Sammenlign segment A og B'}
            >
              {compareSegmentsEnabled ? 'Slå av sammenligning' : 'Sammenlign A/B'}
            </button>
          </div>
          <small className="visuals-help">
            Velg A/B per bok i bøkerlista. Nå: A={segmentABookIds.length}, B={segmentBBookIds.length}. Kartfarger:
            blå = kun A, rød = kun B, lilla = begge.
          </small>
        </div>
      </div>
    </Rnd>
  );
};
