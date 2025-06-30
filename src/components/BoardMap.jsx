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
    <div className="board-map">
      {/* 左上コントロール */}
      <div style={{
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1300,
        display: 'flex',
        gap: 12
      }}>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#fff',
            color: '#007bff',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            padding: '8px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer'
          }}
          onClick={moveToCurrentLocation}
        >
          📍 現在地
        </button>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#fff',
            color: '#007bff',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            padding: '8px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer'
          }}
          onClick={refreshData}
          disabled={loading}
        >
          🔄 更新
        </button>
      </div>
      <BaseMap 
        tileLayer={currentLayer} 
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        mapRef={mapRef}
      >
        <MarkerLayer
          key={fixedPopupId || 'nofixed'}
          markers={markers}
          fixedPopupId={fixedPopupId}
          setFixedPopupId={setFixedPopupId}
        />
      </BaseMap>
      <ProgressControl
        total={progressData.total}
        completed={progressData.completed}
        percentage={progressData.percentage}
      />
      {/* マーカー色の凡例（SVGアイコンで表示） */}
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
        {/* テスト用Googleフォーム遷移リンク */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a
            href={getFormUrl('1001')}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: '#4285f4',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: 8
            }}
          >
            📝 テスト用フォーム遷移
          </a>
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
