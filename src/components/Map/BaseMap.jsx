import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CONFIG, TILE_LAYERS } from '../../utils/mapConfig';
import 'leaflet/dist/leaflet.css';
import 現在地 from '../../assets/現在地.svg';

// 現在地マーカーのアイコン
const locationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi44OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyIDhDMTQuMjEgOCAxNiA5Ljc5IDE2IDEyQzE2IDE0LjIxIDE0LjIxIDE2IDEyIDE2QzkuNzkgMTYgOCAxNC4yMSA4IDEyQzggOS43OSA5Ljc5IDggMTIgOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const 現在地Icon = new L.Icon({ iconUrl: 現在地, iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48] });

// 現在地マーカーコンポーネント
const CurrentLocationMarker = ({ location }) => {
  if (!location) return null;

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={現在地Icon}
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

export const BaseMap = ({
  children,
  center = [34.6937, 135.5023],
  zoom = 12,
  tileLayer = 'google',
  mapRef
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
    setTimeout(() => setLocationError(null), 3000);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        whenCreated={mapInstance => { if (mapRef) mapRef.current = mapInstance; }}
      >
        <TileLayer
          url={selectedTileLayer.url}
          attribution={selectedTileLayer.attribution}
        />
        <CurrentLocationMarker location={currentLocation} />
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
