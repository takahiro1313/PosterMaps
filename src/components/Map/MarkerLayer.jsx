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
    case '0': return '#0097B2'; // 未完了
    case '1': return '#B3B8B9'; // 完了
    case '2': return '#CF3D0D'; // 破損
    default:  return '#808080'; // その他
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

// グループのstatusからマーカー色を決定
const getGroupMarkerStatus = (group) => {
  // すべて完了
  if (group.every(m => m.status === '1')) return '1';
  // 1つでも破損があれば破損
  if (group.some(m => m.status === '2')) return '2';
  // それ以外は未完了
  return '0';
};

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
          statusText: getStatusText(marker.status),
          formUrl: getFormUrlWithStatus(marker.areaNumber, marker.status)
        }));
        // グループのstatusで色を決定
        const groupStatus = getGroupMarkerStatus(group);
        const markerKey = `${lat},${lng},${groupIdx}`;
        return (
          <Marker
            key={markerKey}
            position={[lat, lng]}
            icon={getMarkerIcon(groupStatus)}
            eventHandlers={{
              click: (e) => {
                console.log('マーカークリック', { lat, lng, groupWithExtras });
                if (isIndividual || group.length >= 1) {
                  const screenPos = map ? map.latLngToContainerPoint([lat, lng]) : { x: 0, y: 0 };
                  const popupData = { group: groupWithExtras, lat, lng, screenPos };
                  console.log('setActivePopupに渡すデータ', popupData);
                  setActivePopup(popupData);
                } else {
                  setActivePopup(null);
                }
              }
            }}
          />
        );
      })}
      {/* カスタムパネル（マーカーの上に絶対配置）複数ある場合にも対応 */}
      {activePopup && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            zIndex: 2000,
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            minWidth: 260,
            maxWidth: 320,
            padding: 16,
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',  
            overflowY: 'auto', 
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
          {activePopup.group.length > 1 && (
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#c00' }}>
              この場所には複数の掲示板があります
            </div>
          )}
          {activePopup.group.map((marker, idx) => {
            // 備考を設置場所のヒントに統合
            const hint = marker.note
              ? marker.address
                ? `${marker.address} ${marker.note}`
                : marker.note
              : marker.address;
            return (
              <div key={marker.areaNumber} style={{ borderBottom: idx < activePopup.group.length-1 ? '1px solid #eee' : 'none', marginBottom: 8, paddingBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{marker.place || marker.name}</div>
                <div style={{ fontSize: 13, marginBottom: 2 }}><strong>投票区番号:</strong> {marker.areaNumber}</div>
                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 2,
                    fontWeight: 'bold',
                    color: getMarkerColor(marker.status)
                  }}
                >
                  <strong>ステータス:</strong> {marker.statusText}
                </div>
                <div style={{ fontSize: 13, marginBottom: 2, marginTop: 8 }}>
                  <strong>💡設置場所のヒント:</strong>
                  <br />
                  {hint}
                </div>
                <div style={{ fontSize: 12, color: '#666',  marginTop: 8,marginBottom: 4 }}>座標: {marker.lat?.toFixed(4)}, {marker.lng?.toFixed(4)}</div>
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
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: 8,
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  📝 フォームに報告
                </a>
                <a
                  href={`https://www.google.com/maps?q=${marker.lat},${marker.lng}`}
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
                    marginTop: 8,
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  🗺️ Googleマップで開く
                </a>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
