import React, { useState } from 'react';
import { BaseMap } from './Map/BaseMap';
import { LayerControl } from './Map/LayerControl';
import { TILE_LAYERS } from '../utils/mapConfig';
import { useGoogleSheetsData } from '../hooks/useGoogleSheetsData';

export const SummaryMap = () => {
  const [currentLayer, setCurrentLayer] = useState('osm');
  const { areaData, loading, error } = useGoogleSheetsData();

  if (loading) {
    return (
      <div className="summary-map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">データの読み込みに失敗しました: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-map">
      <BaseMap tileLayer={currentLayer}>
      </BaseMap>
      
      <LayerControl
        currentLayer={currentLayer}
        onLayerChange={setCurrentLayer}
      />
      
      <div className="summary-legend">
        <div className="legend-title">進捗率</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff0000' }}></div>
            <span>0-20%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff8000' }}></div>
            <span>21-40%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffff00' }}></div>
            <span>41-60%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#80ff00' }}></div>
            <span>61-80%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00ff00' }}></div>
            <span>81-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
