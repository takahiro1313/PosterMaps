export const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OpenStreetMap'
  },
  google: {
    url: 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    name: 'Google Maps'
  },
  gsi: {
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    name: '国土地理院'
  }
};

export const DEFAULT_MAP_CONFIG = {
  center: [34.6937, 135.5023],
  zoom: 16,
  minZoom: 5,
  maxZoom: 21,
  tileLayer: 'google'
};

export const MAP_BOUNDS = {
  tokyo: {
    north: 35.9,
    south: 35.4,
    east: 140.0,
    west: 139.0
  }
};
