import React from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CONFIG, TILE_LAYERS } from '../../utils/mapConfig';
import 'leaflet/dist/leaflet.css';
import 現在地 from '../../assets/現在地.svg';

// 現在地マーカーのアイコン（SVGファイルを使う）
const CurrentLocationIcon = L.icon({
  iconUrl: 現在地,
  iconSize: [72, 72],
  iconAnchor: [30, 30],
  popupAnchor: [0, -24]
});

// 現在地マーカーコンポーネント
const CurrentLocationMarker = ({ location }) => {
  if (!location) return null;
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={CurrentLocationIcon}
    >
      <Popup>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            📍 現在地
          </h4>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            緯度: {location.lat.toFixed(6)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}>
            経度: {location.lng.toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

// centerが更新されたときに地図の中心を移動するコンポーネント
function CenterUpdater({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && map) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
}

export const BaseMap = ({ mapRef, children, center: _center, zoom = 12, tileLayer = 'google', ...props }) => {
  const selectedTileLayer = TILE_LAYERS[tileLayer];
  const [center, setCenter] = React.useState(_center || DEFAULT_MAP_CONFIG.center);
  const [currentLocation, setCurrentLocation] = React.useState(null);
  const [locationError, setLocationError] = React.useState(null);
  const [heading, setHeading] = React.useState(null);
  const [locationEnabled, setLocationEnabled] = React.useState(false);
  const [showLocationModal, setShowLocationModal] = React.useState(true);

  // 初回のみ現在地取得を試みる
  React.useEffect(() => {
    if (!navigator.geolocation) {
      // 位置情報非対応なら何もしない（デフォルトcenterのまま）
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
      },
      (err) => {
        // 失敗時は何もしない（デフォルトcenterのまま）
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // 現在地の常時取得＆自動追従（許可時のみ）
  React.useEffect(() => {
    if (!locationEnabled) return;
    if (!navigator.geolocation) {
      setLocationError('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        // 地図を現在地に追従
        if (mapRef && mapRef.current) {
          mapRef.current.setView([latitude, longitude]);
        }
      },
      (err) => {
        setLocationError('現在地の取得に失敗しました');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationEnabled, mapRef]);

  // 端末の向き（方角）を取得（許可時のみ）
  React.useEffect(() => {
    if (!locationEnabled) return;
    const handleOrientation = (event) => {
      if (typeof event.alpha === 'number') {
        setHeading(event.alpha);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [locationEnabled]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* 位置情報利用確認モーダル */}
      {showLocationModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: '32px 24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
            textAlign: 'center',
            minWidth: 280,
            width: '80%'
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>位置情報の利用</div>
            <div style={{ fontSize: 15, marginBottom: 24 }}>現在地を地図上に表示するため、位置情報の利用を許可してください。</div>
            <button
              style={{
                background: '#007bff', color: 'white', border: 'none', borderRadius: 4, padding: '10px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginRight: 12
              }}
              onClick={() => { setLocationEnabled(true); setShowLocationModal(false); }}
            >
              許可する
            </button>
            <button
              style={{
                background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '10px 18px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer'
              }}
              onClick={() => { setLocationEnabled(false); setShowLocationModal(false); }}
            >
              許可しない
            </button>
          </div>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        maxZoom={21}
        whenCreated={mapInstance => {
          if (mapRef) {
            mapRef.current = mapInstance;
          }
        }}
        {...props}
      >
        <CenterUpdater center={center} />
        <TileLayer
          url={selectedTileLayer.url}
          attribution={selectedTileLayer.attribution}
          maxZoom={21}
        />
        {/* 許可時のみ現在地マーカーを表示 */}
        {locationEnabled && <CurrentLocationMarker location={currentLocation} />}
        {children}
      </MapContainer>
      {locationError && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {locationError}
        </div>
      )}
    </div>
  );
};
