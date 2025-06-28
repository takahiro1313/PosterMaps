import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CONFIG, TILE_LAYERS } from '../../utils/mapConfig';
import 'leaflet/dist/leaflet.css';

// 現在地マーカーのアイコン
const locationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyIDhDMTQuMjEgOCAxNiA5Ljc5IDE2IDEyQzE2IDE0LjIxIDE0LjIxIDE2IDEyIDE2QzkuNzkgMTYgOCAxNC4yMSA4IDEyQzggOS43OSA5Ljc5IDggMTIgOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// 現在地コントロールコンポーネント
const LocationControl = ({ onLocationFound, onLocationError }) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  const getCurrentLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      onLocationError('お使いのブラウザは位置情報をサポートしていません。');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationFound({ lat: latitude, lng: longitude });
        map.setView([latitude, longitude], 16);
        setIsLoading(false);
        setHasPermission(true);
      },
      (error) => {
        console.error('位置情報の取得に失敗しました:', error);
        let message = '位置情報の取得に失敗しました。';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '位置情報の使用が許可されていません。ブラウザの設定で位置情報を許可してください。';
            setHasPermission(false);
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置情報が利用できません。ネットワーク接続を確認してください。';
            break;
          case error.TIMEOUT:
            message = '位置情報の取得がタイムアウトしました。再度お試しください。';
            break;
          default:
            message = '予期しないエラーが発生しました。';
        }
        onLocationError(message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5分間キャッシュ
      }
    );
  };

  // 初期起動時に現在地の許可を求める
  useEffect(() => {
    if (hasPermission === null) {
      getCurrentLocation();
    }
  }, []);

  useEffect(() => {
    // カスタムコントロールを作成
    const locationControl = L.control({ position: 'topleft' });
    
    locationControl.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      
      let icon = '📍';
      let title = '現在地を表示';
      let disabled = false;
      
      if (isLoading) {
        icon = '⏳';
        title = '位置情報を取得中...';
        disabled = true;
      } else if (hasPermission === false) {
        icon = '❌';
        title = '位置情報が許可されていません';
        disabled = true;
      }
      
      div.innerHTML = `
        <a href="#" title="${title}" style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: white; border: 2px solid rgba(0,0,0,0.2); border-radius: 4px; text-decoration: none; color: #333; ${disabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
          ${icon}
        </a>
      `;
      
      div.onclick = (e) => {
        e.preventDefault();
        if (!disabled) {
          getCurrentLocation();
        }
      };
      
      return div;
    };
    
    locationControl.addTo(map);
    
    return () => {
      map.removeControl(locationControl);
    };
  }, [map, isLoading, hasPermission]);

  return null;
};

// 現在地マーカーコンポーネント
const CurrentLocationMarker = ({ location }) => {
  if (!location) return null;

  return (
    <CircleMarker
      center={[location.lat, location.lng]}
      radius={12}
      pathOptions={{
        color: '#4285f4',
        fillColor: '#4285f4',
        fillOpacity: 0.8,
        weight: 3
      }}
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
    </CircleMarker>
  );
};

export const BaseMap = ({
  children,
  center = [34.6937, 135.5023],
  zoom = 12,
  tileLayer = 'google'
}) => {
  const selectedTileLayer = TILE_LAYERS[tileLayer];
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const handleLocationFound = (location) => {
    setCurrentLocation(location);
    setLocationError(null);
  };

  const handleLocationError = (error) => {
    setLocationError(error);
    // エラーメッセージを3秒後に自動で消す
    setTimeout(() => setLocationError(null), 3000);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url={selectedTileLayer.url}
          attribution={selectedTileLayer.attribution}
        />
        
        <LocationControl 
          onLocationFound={handleLocationFound} 
          onLocationError={handleLocationError}
        />
        <CurrentLocationMarker location={currentLocation} />
        
        {children}
      </MapContainer>
      
      {/* エラーメッセージ表示 */}
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
