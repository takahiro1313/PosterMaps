import React, { useState, useEffect, useRef } from 'react';
import { BaseMap } from './Map/BaseMap';
import { LayerControl } from './Map/LayerControl';
import { ProgressControl } from './Map/ProgressControl';
import { MarkerLayer } from './Map/MarkerLayer';
import { TILE_LAYERS, DEFAULT_MAP_CONFIG } from '../utils/mapConfig';
import { useGoogleSheetsData } from '../hooks/useGoogleSheetsData';
import { ClipLoader } from 'react-spinners';
import 未完了 from '../assets/未完了.svg';
import 貼り付け完了 from '../assets/貼り付け完了.svg';
import 破損 from '../assets/破損.svg';
import { useMemo } from 'react';
import BoardDetailDrawer from './Map/BoardDetailDrawer';

// Googleフォームのテスト用URL生成
const GOOGLE_FORM_BASE_URL = import.meta.env.VITE_GOOGLE_FORM_URL;
const LOCATION_ENTRY_ID = import.meta.env.VITE_GOOGLE_FORM_LOCATION_ENTRY_ID;
const getFormUrl = (areaNumber) =>
  `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${LOCATION_ENTRY_ID}=${encodeURIComponent(areaNumber)}`;

export const BoardMap = () => {
  const [currentLayer] = useState('google');
  const { progressData, markers, loading, error, refreshData } = useGoogleSheetsData();
  const [fixedPopupId, setFixedPopupId] = useState(null);
  const mapRef = useRef();
  const [selectedMarkerGroup, setSelectedMarkerGroup] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
      },
      (error) => {
        alert('現在地の取得に失敗しました');
      },
      { enableHighAccuracy: true }
    );
  };

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 左上コントロール */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1300,
        display: 'flex',
        gap: 12
      }}>
        <button
          style={{
            display: 'inline-flex',
            // alignItems: 'center',
            justifyContent: 'center',
            background: '#696969',//#fff
            color: '#ffffff',//#007bff
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 18,
            padding: '8px',
            width: 210,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer'
          }}
          onClick={refreshData}
          disabled={loading}
        >
        地図を更新する ▷
        </button>
      </div>
      <BaseMap 
        tileLayer={currentLayer} 
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        mapRef={mapRef}
      >
        <MarkerLayer
          markers={markers}
          mapRef={mapRef}
        />
      </BaseMap>
      <ProgressControl
        total={progressData.total}
        completed={progressData.completed}
        percentage={progressData.percentage}
        style={{ position: 'absolute', left: 10, top: 60, zIndex: 1200, width: 210}}
      />
      {/* マーカー色の凡例（SVGアイコンで表示） */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        height: 135,
        background: 'white',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: '12px 16px',
        zIndex: 1200,
        fontSize: 13
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>マーカーの意味</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <img src={未完了} alt="未実施" style={{ width: 24, height: 24, marginRight: 8 }} />
          <span>未実施</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <img src={貼り付け完了} alt="貼り付け済み" style={{ width: 24, height: 24, marginRight: 8 }} />
          <span>貼り付け済み</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={破損} alt="破損" style={{ width: 24, height: 24, marginRight: 8 }} />
          <span>破損</span>
        </div>
      </div>
      {/* マーカーだけローディング中インジケータ（スピナー） */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
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
      {/* サイドパネル（詳細Drawer） */}
      <BoardDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        markerGroup={selectedMarkerGroup}
      />
      {activePopup && (
        null
      )}
    </div>
  );
};
