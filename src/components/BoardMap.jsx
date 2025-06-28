import React, { useState, useEffect, useRef } from 'react';
import { BaseMap } from './Map/BaseMap';
import { LayerControl } from './Map/LayerControl';
import { ProgressControl } from './Map/ProgressControl';
import { MarkerLayer } from './Map/MarkerLayer';
import { TILE_LAYERS, DEFAULT_MAP_CONFIG } from '../utils/mapConfig';
import { useGoogleSheetsData } from '../hooks/useGoogleSheetsData';
import { ClipLoader } from 'react-spinners';

export const BoardMap = () => {
  const [currentLayer, setCurrentLayer] = useState('google');
  const { progressData, markers, loading, error, refreshData } = useGoogleSheetsData();
  const [fixedPopupId, setFixedPopupId] = useState(null);
  const intervalRef = useRef();

  useEffect(() => {
    // 5分ごとに自動更新。ただしポップアップが開いていない場合のみ
    intervalRef.current = setInterval(() => {
      if (!fixedPopupId) {
        refreshData();
      }
    }, 300000); // 5分
    return () => clearInterval(intervalRef.current);
  }, [fixedPopupId, refreshData]);

  if (error) {
    return (
      <div className="board-map">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">データの読み込みに失敗しました: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="board-map">
      <BaseMap 
        tileLayer={currentLayer} 
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
      >
        <MarkerLayer
          key={fixedPopupId || 'nofixed'}
          markers={markers}
          fixedPopupId={fixedPopupId}
          setFixedPopupId={setFixedPopupId}
        />
      </BaseMap>
      
      <LayerControl
        currentLayer={currentLayer}
        onLayerChange={setCurrentLayer}
      />
      
      <ProgressControl
        total={progressData.total}
        completed={progressData.completed}
        percentage={progressData.percentage}
      />
      {/* マーカー色の凡例 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        background: 'white',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: '12px 16px',
        zIndex: 1200,
        fontSize: 13
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>マーカー色の意味</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#ff3333', borderRadius: '50%', marginRight: 8, border: '1px solid #aaa' }}></span>
          <span>未実施</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#0066cc', borderRadius: '50%', marginRight: 8, border: '1px solid #aaa' }}></span>
          <span>貼り付け済み</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#ff9900', borderRadius: '50%', marginRight: 8, border: '1px solid #aaa' }}></span>
          <span>破損</span>
        </div>
      </div>
      {/* マーカーだけローディング中インジケータ（スピナー） */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          padding: '18px 32px',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }}>
          <ClipLoader color="#007bff" size={40} />
          <div style={{ marginTop: 12 }}>マーカー読み込み中...</div>
        </div>
      )}
    </div>
  );
};
