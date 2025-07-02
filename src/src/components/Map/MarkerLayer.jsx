import React, { useState, useMemo, useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 未完了 from '../../assets/未完了.svg';
import 貼り付け完了 from '../../assets/貼り付け完了.svg';
import 破損 from '../../assets/破損.svg';
import { areaMaster } from '../../data/areaMaster';
import { cityWardCenters, regionCenters } from '../../data/groupPinCenters';
import Button from '@mui/material/Button';

// Googleフォームの投票場所フィールドのentry ID（本番用）
const GOOGLE_FORM_BASE_URL = import.meta.env.VITE_GOOGLE_FORM_URL;
const LOCATION_ENTRY_ID = import.meta.env.VITE_GOOGLE_FORM_LOCATION_ENTRY_ID;
const STATUS_ENTRY_ID = import.meta.env.VITE_GOOGLE_FORM_STATUS_ENTRY_ID;

const getFormUrl = (areaNumber) =>
  `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${LOCATION_ENTRY_ID}=${encodeURIComponent(areaNumber)}`;

function getFormStatusValue(status) {
  switch (String(status)) {
    case '0': return '0（未対応）';
    case '1': return '1（貼り付け済）';
    case '2': return '2（破損）';
    default: return '';
  }
}

function getFormUrlWithStatus(areaNumber, status) {
  return `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${LOCATION_ENTRY_ID}=${encodeURIComponent(areaNumber)}&${STATUS_ENTRY_ID}=${encodeURIComponent(getFormStatusValue(status))}`;
}

const getMarkerColor = (status) => {
  switch (status) {
    case '0': return '#ff3333'; // 未実施：赤（目立つ色）
    case '1': return '#0066cc'; // 貼り付け済み：青
    case '2': return '#ff9900'; // 破損：オレンジ
    default:  return '#808080'; // その他：灰色
  }
};

const getStatusText = (status) => {
  switch (status) {
    case '1': return '貼り付け済';
    case '2': return '破損';
    default:  return '未実施';
  }
};

// SVGアイコンをLeafletアイコンとして生成（サイズ可変）
const svgIcon = (svgPath, size = 32) => L.icon({
  iconUrl: svgPath,
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -size],
});

export const MarkerLayer = ({ markers }) => {
  const [activePopup, setActivePopup] = useState(null); // { group, lat, lng, screenPos }
  const map = useMap();
  const [zoom, setZoom] = useState(map ? map.getZoom() : 11);

  // --- ズーム値の監視とstate管理 ---
  useEffect(() => {
    if (!map) return;
    const onZoom = () => {
      setZoom(map.getZoom());
      console.log('現在のズーム値:', map.getZoom());
    };
    map.on('zoomend', onZoom);
    // 初回も反映
    setZoom(map.getZoom());
    return () => map.off('zoomend', onZoom);
  }, [map]);

  // --- ズーム値によるピン粒度の切り替え ---
  let displayMarkers = [];
  let mode = 'individual';
  let iconSize = 32;
  if (zoom <= 11) {
    // region単位（大阪市・堺市・松原市のみ）
    mode = 'region';
    iconSize = 85; // 32*2.4
    displayMarkers = Object.entries(regionCenters)
      .filter(([region]) => region === '大阪市' || region === '堺市' || region === '松原市')
      .map(([region, pos]) => ({
        lat: pos.lat, lng: pos.lng, status: '0', region
      })).filter(m => m.lat && m.lng);
  } else if (zoom <= 12) {
    // city+ward単位（大阪市・堺市・松原市のみ）
    mode = 'cityward';
    iconSize = 64; // 32*1.8
    displayMarkers = areaMaster
      .filter(area => (area.city === '大阪市' || area.city === '堺市') || (area.city === '松原市' && !area.ward))
      .map(area => {
        const key = area.city + '_' + (area.ward || '');
        const pos = cityWardCenters[key];
        return pos ? { lat: pos.lat, lng: pos.lng, status: '0', city: area.city, ward: area.ward } : null;
      }).filter(m => m && m.lat && m.lng);
  } else {
    // 個別ピン
    mode = 'individual';
    iconSize = 48;
    displayMarkers = markers;
  }

  // SVGアイコンをuseMemoでキャッシュ（サイズ依存で再生成）
  const 未完了Icon = useMemo(() => svgIcon(未完了, iconSize), [iconSize]);
  const 貼り付け完了Icon = useMemo(() => svgIcon(貼り付け完了, iconSize), [iconSize]);
  const 破損Icon = useMemo(() => svgIcon(破損, iconSize), [iconSize]);
  const getMarkerIcon = (status) => {
    // グループピンは未完了アイコンで統一
    if (mode === 'individual') {
      switch (status) {
        case '0': return 未完了Icon;
        case '1': return 貼り付け完了Icon;
        case '2': return 破損Icon;
        default:  return 未完了Icon;
      }
    } else {
      return 未完了Icon;
    }
  };

  // 座標ごとにグループ化（個別ピン用）
  const grouped = {};
  displayMarkers.forEach(m => {
    const key = `${m.lat},${m.lng}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });
  const markerGroups = Object.entries(grouped);

  // 地図座標→画面座標変換
  const getScreenPosition = (lat, lng) => {
    if (!map) return { x: 0, y: 0 };
    const point = map.latLngToContainerPoint([lat, lng]);
    return { x: point.x, y: point.y };
  };

  return (
    <>
      {markerGroups.map(([key, group], groupIdx) => {
        const [lat, lng] = key.split(',').map(Number);
        const isIndividual = mode === 'individual' && group.length === 1;
        const groupWithExtras = group.map(marker => ({
          ...marker,
          statusText: isIndividual ? getStatusText(marker.status) : '',
          formUrl: isIndividual ? getFormUrlWithStatus(marker.areaNumber, marker.status) : ''
        }));
        // keyをlat,lng,groupIdxで完全ユニークに
        const markerKey = `${lat},${lng},${groupIdx}`;
        return (
          <Marker
            key={markerKey}
            position={[lat, lng]}
            icon={getMarkerIcon(group[0].status)}
            eventHandlers={{
              click: (e) => {
                if (isIndividual) {
                  const screenPos = map ? map.latLngToContainerPoint([lat, lng]) : { x: 0, y: 0 };
                  setActivePopup({ group: groupWithExtras, lat, lng, screenPos });
                } else {
                  setActivePopup(null);
                }
              }
            }}
          />
        );
      })}
      {/* カスタムパネル（マーカーの上に絶対配置） */}
      {activePopup && mode === 'individual' && activePopup.group.length === 1 && (
        <div
          style={{
            position: 'absolute',
            left: activePopup.screenPos?.x ?? 0,
            top: (activePopup.screenPos?.y ?? 0) - 20,
            zIndex: 2000,
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            minWidth: 260,
            maxWidth: 320,
            padding: 16,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onClick={() => setActivePopup(null)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#888'
            }}
            aria-label="閉じる"
          >×</button>
          {activePopup.group.map((marker, idx) => {
            return (
              <div key={marker.areaNumber} style={{ borderBottom: idx < activePopup.group.length-1 ? '1px solid #eee' : 'none', marginBottom: 8, paddingBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>投票区番号: {marker.areaNumber}</div>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>ステータス: <span style={{ fontWeight: 'normal' }}>{marker.statusText}</span></div>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>住所: <span style={{ fontWeight: 'normal' }}>{marker.address}</span></div>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>備考: <span style={{ fontWeight: 'normal' }}>{marker.note}</span></div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>座標: {marker.lat?.toFixed(4)}, {marker.lng?.toFixed(4)}</div>
                <a
                  href={marker.formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: 8
                  }}
                >
                  📝 フォームに報告
                </a>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
