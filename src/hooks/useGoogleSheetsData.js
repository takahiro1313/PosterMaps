import { useState, useEffect, useRef } from 'react';
import { 
  fetchAreaData, 
  fetchProgressData, 
  fetchMarkers
} from '../services/googleSheetsService';

export const useGoogleSheetsData = () => {
  const [areaData, setAreaData] = useState([]);
  const [progressData, setProgressData] = useState({ total: 0, completed: 0, percentage: 0 });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // インクリメンタル表示用
  const incrementalTimeout = useRef();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      // まず全データ取得
      const allMarkerData = await fetchMarkers();
      // area-numberごとに最新1件だけ残す
      const latestMarkersMap = {};
      allMarkerData.forEach(row => {
        latestMarkersMap[row.areaNumber] = row; // 後勝ちで最新
      });
      const latestMarkers = Object.values(latestMarkersMap);
      // 10件ずつインクリメンタルにsetMarkers（高速化）
      setMarkers([]);
      let i = 0;
      function addBatch() {
        setMarkers(prev => [...prev, ...latestMarkers.slice(i, i+10)]);
        i += 10;
        if (i < latestMarkers.length) {
          incrementalTimeout.current = setTimeout(addBatch, 50); // 50msに短縮
        }
      }
      addBatch();
      // areaData, progressDataも最新のみで再計算
      // areaData
      const areaMap = {};
      latestMarkers.forEach(marker => {
        const area = marker.areaNumber;
        if (!areaMap[area]) areaMap[area] = { total: 0, done: 0 };
        areaMap[area].total += 1;
        if (marker.status === '1') areaMap[area].done += 1;
      });
      setAreaData(Object.entries(areaMap).map(([name, { total, done }], idx) => ({
        id: idx + 1,
        name,
        color: '#00bfff',
        total,
        done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0
      })));
      // progressData
      const total = latestMarkers.length;
      const completed = latestMarkers.filter(m => m.status === '1').length;
      const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
      setProgressData({ total, completed, percentage });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (incrementalTimeout.current) clearTimeout(incrementalTimeout.current);
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
    return () => {
      if (incrementalTimeout.current) clearTimeout(incrementalTimeout.current);
    };
  }, []);

  return {
    areaData,
    progressData,
    markers,
    loading,
    error,
    refreshData
  };
}; 