import React, { useState, useRef, useEffect } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';

// フォームURLは固定
const FORM_URL = 'https://example.com/form';

// Googleフォームの投票場所フィールドのentry ID（本番用）
const GOOGLE_FORM_BASE_URL = import.meta.env.VITE_GOOGLE_FORM_URL;
const ENTRY_ID = 'entry.464166363';

const getFormUrl = (areaNumber) =>
  `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${ENTRY_ID}=${encodeURIComponent(areaNumber)}`;

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

export const MarkerLayer = ({ markers, fixedPopupId, setFixedPopupId }) => {
  // 座標ごとにグループ化
  const grouped = {};
  markers.forEach(m => {
    const key = `${m.lat},${m.lng}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });
  const markerGroups = Object.entries(grouped);

  const popupRefs = useRef({});

  // fixedPopupIdの変化に応じてPopupを開閉
  useEffect(() => {
    Object.entries(popupRefs.current).forEach(([key, ref]) => {
      if (!ref) return;
      if (fixedPopupId === key) {
        ref._source.openPopup();
      } else {
        ref._source.closePopup();
      }
    });
  }, [fixedPopupId]);

  console.log('MarkerLayer rendering with markers:', markers);
  console.log('Markers length:', markers ? markers.length : 'undefined');
  
  if (!markers || markers.length === 0) {
    console.log('No markers to render');
    return null;
  }
  
  return (
    <>
      {markerGroups.map(([key, group]) => {
        const [lat, lng] = key.split(',').map(Number);
        const isFixed = fixedPopupId === key;
        return (
          <CircleMarker
            key={key}
            center={[lat, lng]}
            radius={8}
            pathOptions={{
              color: getMarkerColor(group[0].status),
              fillColor: getMarkerColor(group[0].status),
              fillOpacity: 0.8,
              weight: 2
            }}
            eventHandlers={{
              mouseover: (e) => {
                if (!isFixed) e.target.openPopup();
              },
              mouseout: (e) => {
                if (!isFixed) e.target.closePopup();
              },
              click: () => {
                setFixedPopupId(isFixed ? null : key);
              }
            }}
          >
            <Popup
              ref={el => (popupRefs.current[key] = el)}
              closeButton={false}
              autoClose={false}
              closeOnClick={false}
            >
              <div style={{ minWidth: '220px' }}>
                {group.length > 1 && (
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#c00' }}>
                    この場所には複数の掲示板があります
                  </div>
                )}
                {group.map((marker, idx) => (
                  <div key={marker.areaNumber} style={{ borderBottom: idx < group.length-1 ? '1px solid #eee' : 'none', marginBottom: 8, paddingBottom: 8 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{marker.place || marker.name}</h4>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      <strong>投票区番号</strong> {marker.areaNumber}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      <strong>ステータス:</strong>
                      <span style={{
                        color: getMarkerColor(marker.status),
                        fontWeight: 'bold',
                        marginLeft: '4px'
                      }}>
                        {getStatusText(marker.status)}
                      </span>
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      <strong>場所:</strong> {marker.address}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      <strong>備考:</strong> {marker.note}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '11px', color: '#666' }}>
                      座標: {marker.lat?.toFixed(4)}, {marker.lng?.toFixed(4)}
                    </p>
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <a
                        href={getFormUrl(marker.areaNumber)}
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
                          cursor: 'pointer'
                        }}
                      >
                        📝 フォームに報告
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};