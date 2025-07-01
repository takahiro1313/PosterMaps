import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const sheets = google.sheets('v4');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const client = await auth.getClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // クエリでsheet=progressなら進捗率シートを返す
    if (req.query.sheet === 'progress') {
      const range = "進捗率!A2:H";
      const result = await sheets.spreadsheets.values.get({
        auth: client,
        spreadsheetId,
        range,
      });
      const values = result.data.values || [];
      // 日本語カラム名を英語プロパティにマッピング
      const data = values.map(row => {
        // パーセント記号を除去して数値化
        const progressStr = row[7] || '';
        const progress = progressStr.endsWith('%')
          ? parseFloat(progressStr.replace('%', ''))
          : Number(progressStr);
        return {
          pref: row[0] || '',
          region: row[1] || '',
          subregion: row[2] || '',
          city: row[3] || '',
          ward: row[4] || '',
          total: Number(row[5]) || 0, // 数値で返す
          done: Number(row[6]) || 0,  // 数値で返す
          progress: isNaN(progress) ? 0 : progress, // 数値で返す
        };
      });
      return res.status(200).json(data);
    }

    // デフォルトはマスタ_map!A2:I
    const range = "マスタ_map!A2:I"; // シート名を修正
    const result = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId,
      range,
    });

    // カラム名を付与して返す
    const values = result.data.values || [];
    const columns = ['area-number', 'place', 'adress', 'lat', 'long', 'status', 'note', 'city', 'ward'];
    const data = values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx] || '';
      });
      return obj;
    });

    res.status(200).json(data);
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: err.message });
  }
} 
