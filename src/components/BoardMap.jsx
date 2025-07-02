import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BaseMap } from './Map/BaseMap';
import { LayerControl } from './Map/LayerControl';
import { ProgressControl } from './Map/ProgressControl';
import { MarkerLayer } from './Map/MarkerLayer';
import { TILE_LAYERS, DEFAULT_MAP_CONFIG } from '../utils/mapConfig';
import { useGoogleSheetsDataContext } from '../contexts/GoogleSheetsDataContext';
import { ClipLoader } from 'react-spinners';
import 未完了 from '../assets/未完了.svg';
import 貼り付け完了 from '../assets/貼り付け完了.svg';
import 破損 from '../assets/破損.svg';
import { areaMaster } from '../data/areaMaster';
import BoardDetailDrawer from './Map/BoardDetailDrawer';

// Googleフォームのテスト用URL生成
const GOOGLE_FORM_BASE_URL = import.meta.env.VITE_GOOGLE_FORM_URL;
const LOCATION_ENTRY_ID = import.meta.env.VITE_GOOGLE_FORM_LOCATION_ENTRY_ID;
const getFormUrl = (areaNumber) =>
  `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${LOCATION_ENTRY_ID}=${encodeURIComponent(areaNumber)}`;

export const BoardMap = () => {
  const [currentLayer] = useState('google');
  const { progressSheet, markers, loading, error, refreshData } = useGoogleSheetsDataContext();
  const [fixedPopupId, setFixedPopupId] = useState(null);
  const mapRef = useRef();
  const [selectedMarkerGroup, setSelectedMarkerGroup] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  // フィルタ用state
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // city+wardプルダウン用データ
  const cityWardOptions = useMemo(() => {
    // 大阪市・堺市は区単位、松原市は市単位のみ
    return areaMaster
      .filter(a =>
        (a.city === '大阪市' && a.ward) ||
        (a.city === '堺市' && a.ward) ||
        (a.city === '松原市' && !a.ward)
      )
      .map(a => ({
        value: `${a.city}|${a.ward ?? ''}`,
        label: a.ward ? `${a.city}${a.ward}` : a.city
      }))
      // 重複除去
      .filter((opt, idx, arr) =>
        arr.findIndex(o => o.value === opt.value) === idx
      );
  }, []);
  const [selectedCityWard, setSelectedCityWard] = useState('');

  // markersフィルタリング
  const filteredMarkers = useMemo(() => {
    let result = markers;
    if (showOnlyUnfinished) {
      result = result.filter(m => m.status === '0');
    }
    if (selectedCityWard) {
      const [city, ward] = selectedCityWard.split('|');
      result = result.filter(m => m.city === city && m.ward === ward);
    }
    return result;
  }, [markers, showOnlyUnfinished, selectedCityWard]);

  // --- 進捗率（大阪市・堺市・松原市のみ） ---
  const targetCities = ['大阪市', '堺市', '松原市'];
  const filteredProgress = progressSheet
    ? progressSheet.filter(p => targetCities.includes((p.city || '').trim()))
    : [];
  const total = filteredProgress.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const completed = filteredProgress.reduce((sum, p) => sum + (Number(p.done) || 0), 0);
  const percentage = total > 0 ? (completed / total) * 100 : 0;

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
      {/* 右上フィルタUI */}
      <div style={{
        position: 'absolute',
        width: '45%',
        top: 66,
        right: 10,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 8
      }}>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showOnlyUnfinished ? '#007bff' : '#fff',
            color: showOnlyUnfinished ? '#fff' : '#007bff',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 12,
            padding: '8px 16px',
            width: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            marginBottom: 4
          }}
          onClick={() => setShowOnlyUnfinished(v => !v)}
        >
          {showOnlyUnfinished ? '未実施のみ表示' : '未実施のみ表示'}
        </button>
        <select
          value={selectedCityWard}
          onChange={e => setSelectedCityWard(e.target.value)}
          style={{ width: '100%', marginBottom: 4 }}
        >
          <option value="">市区を選択</option>
          {cityWardOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* 左上：更新ボタン */}
      <div style={{
        position: 'absolute',
        top: 65,
        left: 10,
        zIndex: 1300,
        width: '45%',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 12
      }}>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#696969',
            color: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 12,
            padding: '8px 8px',
            width: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer',
          }}
          onClick={refreshData}
          disabled={loading}
        >
          地図情報を更新する
        </button>
        <ProgressControl
          total={total}
          completed={completed}
          percentage={percentage}
          style={{ position: 'absolute', left: 0, top: 65, zIndex: 1200, width: '100%'}}
        />
      </div>
      <BaseMap 
        tileLayer={currentLayer} 
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        mapRef={mapRef}
      >
        <MarkerLayer
          markers={filteredMarkers}
          mapRef={mapRef}
        />
      </BaseMap>

      {/* 左下：マーカー説明（凡例） */}
      <div style={{
        position: 'absolute',
        left: 10,
        bottom: 66,
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
          top: '50%',
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
