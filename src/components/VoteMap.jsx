import React, { useState } from 'react';
import { BaseMap } from './Map/BaseMap';
import { LayerControl } from './Map/LayerControl';
import { TILE_LAYERS } from '../utils/mapConfig';
import { useGoogleSheetsData } from '../hooks/useGoogleSheetsData';

export const VoteMap = () => {
  const [currentLayer, setCurrentLayer] = useState('osm');
  const { voteVenues, loading, error } = useGoogleSheetsData();

  if (loading) {
    return (
      <div className="vote-map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">データの読み込みに失敗しました: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-map">
      <BaseMap tileLayer={currentLayer}>
      </BaseMap>
      
      <LayerControl
        currentLayer={currentLayer}
        onLayerChange={setCurrentLayer}
      />
      
      <div className="vote-info">
        <div className="vote-title">期日前投票所</div>
        <div className="vote-description">
          期日前投票所の位置を表示します
        </div>
        <div className="vote-venues">
          {voteVenues.map((venue, index) => (
            <div key={index} className="venue-item">
              <h4>{venue.name}</h4>
              <p>{venue.address}</p>
              <p>期間: {venue.period}</p>
              <p>時間: {venue.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
