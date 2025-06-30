// const SHEETS_API_URL = '/api/gas-proxy';
const SHEETS_API_URL = '/api/sheets-api'; // Google Sheets APIサーバーレス関数

// マーカーデータ取得
export const fetchMarkers = async () => {
  // GAS経由
  // const res = await fetch(SHEETS_API_URL);
  // const data = await res.json();
  // return data
  //   .filter(row => row['area-number'] && row.lat && row.long)
  //   .map((row, idx) => ({
  //     id: idx + 1,
  //     areaNumber: row['area-number'],
  //     place: row.place,
  //     address: row.adress,
  //     lat: parseFloat(row.lat),
  //     lng: parseFloat(row.long),
  //     status: String(row.status),
  //     note: row.note,
  //   }));

  // Google Sheets API経由
  const res = await fetch(SHEETS_API_URL);
  const data = await res.json();
  return data
    .filter(row => row['area-number'] && row.lat && row.long)
    .map((row, idx) => ({
      id: idx + 1,
      areaNumber: row['area-number'],
      place: row.place,
      address: row.adress,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.long),
      status: String(row.status),
      note: row.note,
      city: row.city,
      ward: row.ward,
    }));
};

// エリアごとの進捗データ集計
export const fetchAreaData = async () => {
  const markers = await fetchMarkers();
  const areaMap = {};
  markers.forEach(marker => {
    const area = marker.areaNumber;
    if (!areaMap[area]) areaMap[area] = { total: 0, done: 0 };
    areaMap[area].total += 1;
    if (marker.status === '1') areaMap[area].done += 1;
  });
  return Object.entries(areaMap).map(([name, { total, done }], idx) => ({
    id: idx + 1,
    name,
    color: '#00bfff',
    total,
    done,
    progress: total > 0 ? Math.round((done / total) * 100) : 0
  }));
};

// 全体進捗データ集計
export const fetchProgressData = async () => {
  const markers = await fetchMarkers();
  const total = markers.length;
  const completed = markers.filter(m => m.status === '1').length;
  const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  return { total, completed, percentage };
};

// スプレッドシートからデータを取得
export const fetchSheetData = async (spreadsheetId, range) => {
  try {
    const response = await fetch(SHEETS_API_URL);
    const data = await response.json();
    return data.map((row, idx) => ({
      id: idx + 1,
      areaNumber: row['area-number'],
      place: row.place,
      address: row.adress,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.long),
      status: String(row.status),
      note: row.note,
    }));
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
};

// 投票会場データを取得
export const fetchVoteVenues = async (spreadsheetId) => {
  const data = await fetchSheetData(spreadsheetId, 'VoteVenues!A2:F');
  
  return data.map(row => ({
    name: row[0],
    address: row[1],
    lat: row[2],
    long: row[3],
    period: row[4],
    time: row[5]
  }));
};

// 開発用のフォールバックデータ（APIが利用できない場合）
export const getFallbackData = () => {
  return {
    areaData: [
      {
        id: 1,
        name: '千代田区',
        color: '#ff0000',
        total: 100,
        done: 85,
        progress: 85
      },
      {
        id: 2,
        name: '中央区',
        color: '#00ff00',
        total: 80,
        done: 72,
        progress: 90
      },
      {
        id: 3,
        name: '港区',
        color: '#0000ff',
        total: 120,
        done: 60,
        progress: 50
      }
    ],
    progressData: {
      total: 300,
      completed: 217,
      percentage: 72.3
    },
    voteVenues: [
      {
        name: '千代田区役所',
        address: '千代田区九段南1-2-1',
        lat: '35.6939726',
        long: '139.7536284',
        period: '6/21～7/6',
        time: '8:30～20:00'
      },
      {
        name: '中央区役所',
        address: '中央区築地1-1-1',
        lat: '35.6717',
        long: '139.7717',
        period: '6/21～7/6',
        time: '8:30～20:00'
      }
    ],
    markers: [
      {
        id: 1,
        name: '新宿区ポスター掲示板A',
        lat: 35.6896,
        lng: 139.6917,
        status: 'completed',
        address: '新宿区西新宿2-8-1',
        note: 'ポスター貼り付け完了'
      },
      {
        id: 2,
        name: '渋谷区ポスター掲示板B',
        lat: 35.6598,
        lng: 139.7006,
        status: 'damaged',
        address: '渋谷区道玄坂1-2-3',
        note: 'ポスター破損により要修理'
      },
      {
        id: 3,
        name: '港区ポスター掲示板C',
        lat: 35.6585,
        lng: 139.7454,
        status: 'pending',
        address: '港区六本木6-10-1',
        note: 'ポスター貼り付け予定'
      }
    ]
  };
}; 