import React, { useState, useMemo, useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 未完了 from '../../assets/未完了.svg';
import 貼り付け完了 from '../../assets/貼り付け完了.svg';
import 破損 from '../../assets/破損.svg';

// Googleフォームの投票場所フィールドのentry ID（本番用）
const GOOGLE_FORM_BASE_URL = import.meta.env.VITE_GOOGLE_FORM_URL;
const LOCATION_ENTRY_ID = import.meta.env.VITE_GOOGLE_FORM_LOCATION_ENTRY_ID;

const getFormUrl = (areaNumber) =>
  `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${LOCATION_ENTRY_ID}=${encodeURIComponent(areaNumber)}`;

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

// SVGアイコンをLeafletアイコンとして生成
const svgIcon = (svgPath) => L.icon({
  iconUrl: svgPath,
  iconSize: [32, 32], // 必要に応じて調整
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const MarkerLayer = ({ markers }) => {
  const [activePopup, setActivePopup] = useState(null); // { group, lat, lng, screenPos }
  const map = useMap();

  // SVGアイコンをuseMemoでキャッシュ
  const 未完了Icon = useMemo(() => svgIcon(未完了), []);
  const 貼り付け完了Icon = useMemo(() => svgIcon(貼り付け完了), []);
  const 破損Icon = useMemo(() => svgIcon(破損), []);
  const getMarkerIcon = (status) => {
    switch (status) {
      case '0': return 未完了Icon;
      case '1': return 貼り付け完了Icon;
      case '2': return 破損Icon;
      default:  return 未完了Icon;
    }
  };

  // 座標ごとにグループ化
  const grouped = {};
  markers.forEach(m => {
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

  // activePopupの変化を監視してログ出力
  useEffect(() => {
    console.log('activePopup:', activePopup);
  }, [activePopup]);

  return (
    <>
      {markerGroups.map(([key, group], groupIdx) => {
        const [lat, lng] = key.split(',').map(Number);
        const groupWithExtras = group.map(marker => ({
          ...marker,
          statusText: getStatusText(marker.status),
          formUrl: getFormUrl(marker.areaNumber)
        }));
        // keyをlat,lng,areaNumber群,groupIdxで完全ユニークに
        const markerKey = `${lat},${lng},${group.map(m => m.areaNumber).join('-')},${groupIdx}`;
        return (
          <Marker
            key={markerKey}
            position={[lat, lng]}
            icon={getMarkerIcon(group[0].status)}
            eventHandlers={{
              click: (e) => {
                console.log('Marker clicked:', lat, lng, groupWithExtras);
                const screenPos = getScreenPosition(lat, lng);
                console.log('screenPos:', screenPos, 'map:', map);
                setActivePopup({ group: groupWithExtras, lat, lng, screenPos });
              }
            }}
          />
        );
      })}
      {/* カスタムパネル（マーカーの上に絶対配置） */}
      {activePopup && (
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
            transform: 'translate(-50%, -100%)', // 真上中央に補正
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
          {activePopup.group.map((marker, idx) => (
            <div key={marker.areaNumber} style={{ borderBottom: idx < activePopup.group.length-1 ? '1px solid #eee' : 'none', marginBottom: 8, paddingBottom: 8 }}>
              <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{marker.place || marker.name}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}><strong>投票区番号:</strong> {marker.areaNumber}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}><strong>ステータス:</strong> {marker.statusText}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}><strong>住所:</strong> {marker.address}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}><strong>備考:</strong> {marker.note}</div>
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
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                📝 フォームに報告
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
