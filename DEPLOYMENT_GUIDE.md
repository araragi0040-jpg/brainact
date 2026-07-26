# GitHub／Vercel公開手順 v015

## GitHub

v015フォルダの中身をリポジトリ直下へ登録します。

```bash
git add .
git commit -m "Update Virtual Brain Lab to v015"
git push
```

## Vercel設定

- Framework Preset: Other
- Root Directory: 空欄
- Build Command: 空欄
- Output Directory: 空欄
- Install Command: 空欄

公開後の確認先:

```text
https://公開URL/
https://公開URL/api/health
https://公開URL/api/v1/engines
```

`/api/health`の`version`が`v015`なら更新済みです。

## Vercel上のBrian2

標準の`requirements.txt`はBrian2を含みません。そのためVercel上では:

- Native Python計算: 利用可能
- Brian2直接計算: 未導入表示
- Brian2互換性診断・変換設定: 利用可能

まずローカルでBrian2を検証し、将来必要になった段階で専用Python計算環境へ分離する構成を推奨します。

## キャッシュ

デプロイ後に旧画面が残る場合:

- Windows: `Ctrl + F5`
- macOS: `Command + Shift + R`

`public/index.html`、`public/app.js`、`public/config.js`の参照番号はv015に更新済みです。
