# 仮想神経回路 v013 Vercel修正版

> トップURLで `{"detail":"Not Found"}` が表示される問題を修正し、静的画面を `public/` から配信する構成へ変更しています。詳細は `VERCEL_FIX.md` を参照してください。

v013は、v012のブラウザ／Python分離構成をGitHub・Vercelへそのまま公開できる形に再構成した版です。

- 静的フロントエンド：`index.html`、`app.js`、`styles.css`、`config.js`
- Vercel Python API：`api/index.py`
- ローカル互換起動：`backend/server.py`、`start_all.bat`、`start_all.sh`
- GitHub／Vercel設定：`vercel.json`、`.python-version`、`requirements.txt`

本アプリは仮説検証用の概念モデルです。人間の脳活動の完全再現、診断、治療判断、個人の脳状態推定には使用できません。

## v013の追加内容

- GitHub／Vercelへ直接配置できる1リポジトリ構成
- 公開環境では同一ドメインのPython APIを自動使用
- ローカル・公開・ファイル実行の自動判定
- API接続先の自動初期設定
- 公開環境診断
- API URLコピー
- 推定送信データ量表示
- 32stepバッチ計算
- API入力件数制限
- 接続失敗時のブラウザ計算継続
- v012の保存済み実験・シナリオ・データセットを移行

## Vercel公開

詳しい操作は`DEPLOYMENT_GUIDE.md`を確認してください。

基本的には、フォルダ内をGitHubリポジトリへ登録し、そのリポジトリをVercelでImportするだけです。

公開後の確認URL：

```text
https://あなたのVercel URL/api/health
```

## ローカル起動

```bash
python -m pip install -r requirements.txt
```

Windows：`start_all.bat`

macOS／Linux：

```bash
chmod +x start_all.sh backend/start_server.sh start_frontend.sh
./start_all.sh
```

- UI：`http://127.0.0.1:8080`
- API：`http://127.0.0.1:8765/api/health`

## データ保存

実験、シナリオ、外部データ設定はブラウザの`localStorage`へ保存されます。Vercelサーバーへ自動保存されるものではありません。