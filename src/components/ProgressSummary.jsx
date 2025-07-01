import React, { useState } from 'react';
import { useGoogleSheetsDataContext } from '../contexts/GoogleSheetsDataContext';
import { areaMaster } from '../data/areaMaster';

function CircularProgress({ percent, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size}>
      {/* 背景円 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#eee"
        strokeWidth={stroke}
        fill="none"
      />
      {/* 進捗円 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#8fd6ff"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
      {/* 中央のテキスト */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        fontSize={size * 0.28}
        fontWeight="bold"
        fill="#222"
      >
        {percent}%
      </text>
    </svg>
  );
}

export default function ProgressSummary() {
  const { progressSheet } = useGoogleSheetsDataContext();
  const [selectedRegion, setSelectedRegion] = useState('すべて');

  // regionリスト
  const regions = [...new Set(areaMaster.map(a => a.region))];

  // フィルタされたエリア
  const filteredAreas = selectedRegion === 'すべて'
    ? areaMaster
    : areaMaster.filter(a => a.region === selectedRegion);

  // city+wardごとの進捗データをprogressSheetから取得
  let summary = filteredAreas.map(area => {
    const areaProgress = progressSheet.find(p =>
      (p.city || '').trim() === (area.city || '').trim() &&
      (p.ward || '').trim() === (area.ward || '').trim()
    );
    const total = areaProgress ? Number(areaProgress.total) : 0;
    const completed = areaProgress ? Number(areaProgress.done) : 0;
    const progress = areaProgress ? Math.round(Number(areaProgress.progress) * 10) / 10 : 0;
    return {
      ...area,
      total,
      completed,
      progress,
    };
  });
  // 進捗率が高い順にソート
  summary = summary.sort((a, b) => b.progress - a.progress);

  // 全体サマリー
  const total = summary.reduce((sum, a) => sum + a.total, 0);
  const totalCompleted = summary.reduce((sum, a) => sum + a.completed, 0);
  const progress = total > 0 ? Math.round((totalCompleted / total) * 1000) / 10 : 0;

  return (
    <div className="dashboard-container">
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>貼り付け完了数</div>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#222' }}>{totalCompleted.toLocaleString()}<span style={{ fontSize: 18, color: '#888' }}>ヶ所</span></div>
            <div style={{ color: '#aaa', fontSize: 13 }}>/ {total.toLocaleString()} ヶ所中</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>貼り付け完了割合</div>
            <CircularProgress percent={progress} size={120} stroke={10} />
          </div>
        </div>
        <hr style={{ margin: '24px 0' }} />
        {/* regionフィルタボタン 横スクロール */}
        <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: 16, paddingBottom: 8 }}>
          <button
            style={{ display: 'inline-block', marginRight: 8, width:'80px', borderRadius: 4, border: 'none', background: selectedRegion === 'すべて' ? '#007bff' : '#eee', color: selectedRegion === 'すべて' ? '#fff' : '#5E5E5E', cursor: 'pointer', fontSize: 13 ,padding: '8px 8px'}}
            onClick={() => setSelectedRegion('すべて')}
          >すべて</button>
          {regions.map(region => (
            <button
              key={region}
              style={{ display: 'inline-block', marginRight: 8, width:'80px', borderRadius: 4, border: 'none', background: selectedRegion === region ? '#007bff' : '#eee', color: selectedRegion === region ? '#fff' : '#5E5E5E', cursor: 'pointer', fontSize: 13 ,padding: '8px 8px'}}
              onClick={() => setSelectedRegion(region)}
            >{region}</button>
          ))}
        </div>
        {/* city+ward進捗バー */}
        <div>
          {summary.map(area => (
            <div key={area.city + area.ward} style={{ margin: '18px 0', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', marginRight: 12, minWidth: 80 }}>{area.ward ? area.ward : area.city}</div>
              <div style={{ background: '#eee', borderRadius: 8, height: 28, width: '100%', maxWidth: 260, position: 'relative', flex: 1 }}>
                <div style={{
                  width: `${area.progress}%`,
                  background: '#8fd6ff',
                  height: '100%',
                  borderRadius: 8,
                  transition: 'width 0.3s'
                }} />
                <span style={{
                  position: 'absolute', left: '50%', top: 0, fontSize: 15, color: '#333', lineHeight: '28px', transform: 'translateX(-50%)' ,fontWeight: 'bold'
                }}>{area.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 