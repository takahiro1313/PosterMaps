# Google Sheets API設定ガイド

このプロジェクトでは、Google Sheetsをデータベースとして使用しています。以下の手順で設定してください。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択

### 1.2 Google Sheets APIの有効化
1. 「APIとサービス」→「ライブラリ」に移動
2. 「Google Sheets API」を検索して有効化

### 1.3 サービスアカウントの作成
1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：`poster-map-sheets`）
4. 「キーを作成」→「JSON」を選択してキーファイルをダウンロード

## 2. Google Sheetsの準備

### 2.1 スプレッドシートの作成
新しいGoogle Sheetsを作成し、以下のシートを追加してください：

#### AreaDataシート
| A | B | C | D | E |
|---|---|---|---|---|
| エリア名 | 色 | 総数 | 完了数 | 進捗率 |
| 千代田区 | #ff0000 | 100 | 85 | 85 |
| 中央区 | #00ff00 | 80 | 72 | 90 |
| 港区 | #0000ff | 120 | 60 | 50 |

#### ProgressDataシート
| A | B | C |
|---|---|---|
| 総数 | 完了数 | 進捗率 |
| 300 | 217 | 72.3 |

#### VoteVenuesシート
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| 会場名 | 住所 | 緯度 | 経度 | 期間 | 時間 |
| 千代田区役所 | 千代田区九段南1-2-1 | 35.6939726 | 139.7536284 | 6/21～7/6 | 8:30～20:00 |
| 中央区役所 | 中央区築地1-1-1 | 35.6717 | 139.7717 | 6/21～7/6 | 8:30～20:00 |

#### Markersシート
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| マーカー名 | 緯度 | 経度 | ステータス | 住所 | 備考 |
| 新宿区ポスター掲示板A | 35.6896 | 139.6917 | completed | 新宿区西新宿2-8-1 | ポスター貼り付け完了 |
| 渋谷区ポスター掲示板B | 35.6598 | 139.7006 | damaged | 渋谷区道玄坂1-2-3 | ポスター破損により要修理 |
| 港区ポスター掲示板C | 35.6585 | 139.7454 | pending | 港区六本木6-10-1 | ポスター貼り付け予定 |

### 2.2 スプレッドシートの共有設定
1. スプレッドシートを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`your-service-account@your-project.iam.gserviceaccount.com`）を追加
4. 権限を「編集者」に設定

## 3. 環境変数の設定

### 3.1 .envファイルの作成
プロジェクトのルートディレクトリに`.env`ファイルを作成し、以下の内容を追加：

```env
# Google Sheets API設定
REACT_APP_GOOGLE_SHEETS_ID=your-spreadsheet-id-here

# Google Sheets API認証情報（JSON形式）
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}
```

### 3.2 設定値の取得方法
- **REACT_APP_GOOGLE_SHEETS_ID**: スプレッドシートのURLから取得
  - URL: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`
  - `YOUR_SPREADSHEET_ID`の部分がスプレッドシートID

- **GOOGLE_SHEETS_CREDENTIALS**: ダウンロードしたJSONファイルの内容をそのまま使用

## 4. アプリケーションの起動

環境変数を設定後、アプリケーションを起動してください：

```bash
npm run dev
```

## 5. トラブルシューティング

### 5.1 認証エラー
- サービスアカウントのキーファイルが正しく設定されているか確認
- スプレッドシートがサービスアカウントと共有されているか確認

### 5.2 データが表示されない
- スプレッドシートのシート名が正しいか確認
- データの形式が期待される形式と一致しているか確認

### 5.3 フォールバックデータが表示される
- 環境変数が正しく設定されているか確認
- Google Sheets APIが有効になっているか確認

## 6. セキュリティ注意事項

- `.env`ファイルはGitにコミットしないでください
- サービスアカウントのキーは安全に管理してください
- 本番環境では、環境変数を適切に設定してください 