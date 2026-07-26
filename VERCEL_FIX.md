# Vercelトップ画面が `{"detail":"Not Found"}` になる場合

## 原因

トップURL `/` がFastAPIへ入り、画面用の `index.html` が配信されていませんでした。

## この修正版での変更

- 画面ファイルを `public/` に配置
- `/` を `/index.html` へrewrite
- FastAPIにも `/` のリダイレクトを追加
- APIは従来どおり `/api/...` を使用

## Vercel設定

- Root Directory: 空欄（リポジトリ直下）
- Framework Preset: 自動判定または FastAPI
- Build Command: 空欄
- Output Directory: 空欄
- Install Command: 空欄

設定後、最新commitをRedeployしてください。古い設定を変更した場合は、Redeploy画面でキャッシュを使わず再デプロイしてください。

## 確認URL

- 画面: `https://あなたのドメイン/`
- API: `https://あなたのドメイン/api/health`
- API docs: `https://あなたのドメイン/api/docs`
