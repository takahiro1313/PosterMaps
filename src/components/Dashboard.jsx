import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGoogleSheetsData } from '../hooks/useGoogleSheetsData';
import * as turf from '@turf/turf';
import 未完了 from '../assets/未完了.svg';
import 貼り付け完了 from '../assets/貼り付け完了.svg';
import 破損 from '../assets/破損.svg';
import L from 'leaflet';

const OSAKA_CENTER = [34.6937, 135.5023];

// 進捗率に応じた色（オレンジ系グラデーション、透明度50%）
function getProgressColor(progress) {
  // progress: 0.0〜1.0
  // 0%: #feedde, 25%: #fdbe85, 50%: #fd8d3c, 75%: #e6550d, 100%: #a63603
  const colorStops = [
    { pct: 0.0, color: [254, 237, 222] }, // #feedde
    { pct: 0.25, color: [253, 190, 133] }, // #fdbe85
    { pct: 0.5, color: [253, 141, 60] }, // #fd8d3c
    { pct: 0.75, color: [230, 85, 13] }, // #e6550d
    { pct: 1.0, color: [166, 54, 3] } // #a63603
  ];
  let lower = colorStops[0];
  let upper = colorStops[colorStops.length - 1];
  for (let i = 1; i < colorStops.length; i++) {
    if (progress <= colorStops[i].pct) {
      upper = colorStops[i];
      lower = colorStops[i - 1];
      break;
    }
  }
  const rangePct = (progress - lower.pct) / (upper.pct - lower.pct);
  const r = Math.round(lower.color[0] + rangePct * (upper.color[0] - lower.color[0]));
  const g = Math.round(lower.color[1] + rangePct * (upper.color[1] - lower.color[1]));
  const b = Math.round(lower.color[2] + rangePct * (upper.color[2] - lower.color[2]));
  return `rgba(${r},${g},${b},0.5)`;
}

const statusIcons = {
  '0': new L.Icon({ iconUrl: 未完了, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] }),
  '1': new L.Icon({ iconUrl: 貼り付け完了, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] }),
  '2': new L.Icon({ iconUrl: 破損, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] }),
  'default': new L.Icon({ iconUrl: 未完了, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] })
};

const ColorBar = () => {
  // カラーストップとラベル
  const stops = [0, 0.25, 0.5, 0.75, 1.0];
  return (
    <div style={{
      position: 'absolute',
      right: 20,
      top: 20,
      background: 'white',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      padding: '12px 16px',
      zIndex: 1200,
      fontSize: 13
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>進捗率カラーバー</div>
      <div style={{ display: 'flex', alignItems: 'center', height: 20, marginBottom: 4 }}>
        {stops.map((s, i) => (
          <div key={i} style={{
            width: 40,
            height: '100%',
            background: getProgressColor(s),
            borderTopLeftRadius: i === 0 ? 4 : 0,
            borderBottomLeftRadius: i === 0 ? 4 : 0,
            borderTopRightRadius: i === stops.length - 1 ? 4 : 0,
            borderBottomRightRadius: i === stops.length - 1 ? 4 : 0
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stops.map((s, i) => (
          <span key={i}>{Math.round(s * 100)}%</span>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [geoData, setGeoData] = useState(null);
  const { markers, loading: markersLoading } = useGoogleSheetsData();

  useEffect(() => {
    fetch('/src/assets/N03-20240101_27.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  useEffect(() => {
    if (geoData) {
      console.log('feature properties sample:', geoData.features.slice(0, 10).map(f => f.properties));
    }
  }, [geoData]);

  // 北区のポリゴンだけ抽出
  const kitaFeature = useMemo(() => {
    if (!geoData) return null;
    return geoData.features.find(
      f => f.properties.N03_004 === "大阪市" && f.properties.N03_005 === "北区"
    );
  }, [geoData]);

  // 全feature（市・区・町混在）ごとに進捗率を計算
  const progressByFeature = useMemo(() => {
    if (!geoData || !markers) return {};
    const result = {};
    geoData.features.forEach((feature, idx) => {
      const polygon = feature;
      let total = 0;
      let done = 0;
      let markerIds = [];
      markers.forEach(marker => {
        const pt = turf.point([marker.lng, marker.lat]);
        if (turf.booleanPointInPolygon(pt, polygon)) {
          total += 1;
          markerIds.push(marker.id);
          if (marker.status === '1' || marker.status === 'completed') done += 1;
        }
      });
      // 詳細なconsole.log
      console.log(
        '区分:', feature.properties.N03_003, feature.properties.N03_004,
        '| 掲示板数:', total,
        '| 貼り付け済み:', done,
        '| 進捗率:', total > 0 ? (done / total).toFixed(2) : '0',
        '| 含まれるmarker id:', markerIds
      );
      result[idx] = {
        total,
        done,
        progress: total > 0 ? done / total : 0,
        markerIds
      };
    });
    return result;
  }, [geoData, markers]);

  // 北区の進捗率を計算
  const kitaProgress = useMemo(() => {
    if (!markers) return 0;
    // place列やarea-number列に「北区」が含まれるものを抽出
    const kitaMarkers = markers.filter(m => (m.place && m.place.includes('北区')) || (m['area-number'] && m['area-number'].includes('北区')));
    const total = kitaMarkers.length;
    const done = kitaMarkers.filter(m => m.status === '1' || m.status === 1 || (m.note && m.note.includes('貼り付け済'))).length;
    return total > 0 ? done / total : 0;
  }, [markers]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapContainer center={OSAKA_CENTER} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* 全区分けを境界線で表示し、北区だけ進捗率に応じた色で塗りつぶし */}
        {geoData && (
          <GeoJSON
            data={geoData}
            style={feature => {
              const isKita = feature.properties.N03_004 === "大阪市" && feature.properties.N03_005 === "北区";
              return {
                color: 'black',
                weight: 2,
                fillColor: isKita ? getProgressColor(kitaProgress) : 'rgba(0,0,0,0)',
                fillOpacity: isKita ? 0.7 : 0
              };
            }}
          />
        )}
        {markers && markers.map(marker => {
          const icon = statusIcons[marker.status] || statusIcons['default'];
          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
            >
              <Popup>
                <div>
                  <b>{marker.place || marker.name}</b><br />
                  ステータス: {marker.status}<br />
                  住所: {marker.address}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <ColorBar />
    </div>
  );
};

export default Dashboard; 