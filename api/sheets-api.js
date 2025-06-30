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
    res.status(500).json({ error: err.message });
  }
} 