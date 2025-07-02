import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGoogleSheetsDataContext } from '../contexts/GoogleSheetsDataContext';
import dayjs from 'dayjs';

const OSAKA_CENTER = [34.6937, 135.5023];

function getProgressColor(progress) {
  const colorStops = [
    { pct: 0.0, color: [254, 237, 222] },
    { pct: 0.25, color: [253, 190, 133] },
    { pct: 0.5, color: [253, 141, 60] },
    { pct: 0.75, color: [230, 85, 13] },
    { pct: 1.0, color: [166, 54, 3] }
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
  return `rgba(${r},${g},${b},0.7)`;
}

const ColorBar = () => {
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

const GEOJSON_PATH = '/N03-20240101_27.geojson';

function Dashboard() {
  const { progressSheet } = useGoogleSheetsDataContext();
  const [geojson, setGeojson] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_PATH)
      .then(res => res.json())
      .then(setGeojson);
  }, []);

  useEffect(() => {
    if (progressSheet && progressSheet.length > 0) {
      setLastUpdated(new Date());
    }
  }, [progressSheet]);

  // city+wardごとの進捗率をprogressSheetから取得
  const getAreaProgress = (city, ward) => {
    const area = progressSheet.find(p =>
      (p.city || '').trim() === (city || '').trim() &&
      (p.ward || '').trim() === (ward || '').trim()
    );
    return area ? Number(area.progress) / 100 : 0;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
      <div style={{ position: 'absolute', top: 8, left: 16, zIndex: 2000, fontSize: 13, color: '#888', background: 'rgba(255,255,255,0.85)', borderRadius: 4, padding: '2px 10px' }}>
        {lastUpdated && `最終更新: ${dayjs(lastUpdated).format('YYYY/MM/DD HH:mm:ss')}`}
      </div>
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapContainer center={OSAKA_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geojson && (
            <GeoJSON
              data={geojson}
              style={feature => {
                const city = feature.properties.N03_004;
                const ward = feature.properties.N03_005;
                let progress = getAreaProgress(city, ward);
                return {
                  color: 'black',
                  weight: 2,
                  fillColor: getProgressColor(progress),
                  fillOpacity: 0.7
                };
              }}
            />
          )}
        </MapContainer>
        <ColorBar />
      </div>
    </div>
  );
}

export default Dashboard; 
