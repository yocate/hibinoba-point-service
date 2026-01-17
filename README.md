# Hibinoba Point Service (社内ポイントシステム)

社内コミュニケーション活性化のためのポイント送付アプリ「Hibinoba Point Service」のソースコードリポジトリです。
Androidアプリ、バックエンドAPI、管理者用管理画面で構成されています。

## プロジェクト構成

- **`android-app/`**: Androidアプリ (Kotlin)
    - ユーザー向け機能（ポイント送付、履歴確認、プロフィール）
- **`backend/`**: バックエンドAPI (Go + Gin)
    - REST API、DB接続、認証ロジック
- **`frontend-admin/`**: 管理者用管理画面 (React + Vite + TailwindCSS)
    - ユーザー管理、ポイント付与（管理者権限）、システム設定
- **`db/`**: データベース初期化スクリプト (PostgreSQL)
- **`docker-compose.yml`**: 開発環境用Docker構成

## セットアップ手順

### 1. 開発環境の起動 (Backend & DB)

バックエンドとデータベースはDocker Composeで起動します。

```bash
docker-compose up --build
```

- API Server: `http://localhost:8080`
- Database: PostgreSQL (Port 5432)

### 2. 管理画面の起動 (Frontend Admin)

```bash
cd frontend-admin
npm install
npm run dev
```

- Admin Console: `http://localhost:5173`
- 初期管理者アカウント:
    - Email: `admin@example.com`
    - Password: `admin` (初期設定時)

### 3. Androidアプリのビルド (Android App)

1. Android Studioで `android-app` ディレクトリを開きます。
2. `local.properties` にSDKのパスが設定されていることを確認してください。
3. エミュレータまたは実機を接続し、Runボタン (▶) を押してビルド・インストールします。
   - ※エミュレータからlocalhostに接続するため、APIのエンドポイントは `http://10.0.2.2:8080` に設定されています (`NetworkClient.kt` 参照)。

## 機能概要

### Androidアプリ
- **ログイン**: Email/Passwordによる認証
- **ダッシュボード**: 現在のポイント残高、送付・受取総額の表示
- **ポイント送付**: 他のユーザーを選択し、ポイントに感謝のメッセージを添えて送付（※メッセージ機能は今後実装予定）
- **履歴表示**: 直近の取引履歴（送付・受取）の確認

### 管理画面
- **ユーザー管理**: ユーザーの追加、編集、削除（無効化）
- **ポイント付与**: 管理者権限による特別ポイントの付与（「ボーナス」など）
    - 管理者からの付与として履歴に記録されます。

## 技術スタック

- **Mobile**: Android (Kotlin), Jetpack, Retrofit
- **Backend**: Go (Golang), Gin Framework, PostgreSQL
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Infra**: Docker, Docker Compose

## 開発者向けメモ

- **API仕様**: バックエンドの `routes` および `handlers` を参照。
- **DBスキーマ**: `db/init/` 以下のSQLファイルを参照。
