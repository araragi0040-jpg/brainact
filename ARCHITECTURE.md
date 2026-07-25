# v013 アーキテクチャ

## 公開構成

```text
GitHub repository
├─ index.html / app.js / styles.css / config.js
│        ↓ Vercel Static Assets
│   ブラウザUI・2D/3D表示・実験管理・localStorage
│
└─ api/index.py
         ↓ Vercel Python Function / FastAPI
    /api/health
    /api/v1/diagnostics
    /api/v1/validate
    /api/v1/simulate
```

## 状態の扱い

v013はVercelのサーバーレス実行に合わせ、サーバー側に実験セッションを保持しません。

1. ブラウザが現在のニューロン・接続状態を保持します。
2. Python計算時に必要な状態をJSONで送信します。
3. APIが複数stepを計算します。
4. 更新後の状態と分析フレームを返します。
5. ブラウザが2D・3D表示、分析、実験保存へ反映します。

この方式は通信量が増える一方、Vercel Functionが別インスタンスで実行されても計算状態を失いません。

## v013で追加した公開対策

- 実行環境に応じたAPI URL自動判定
- Vercelでは同一オリジンAPIへ接続
- ローカルでは`127.0.0.1:8765`へ接続
- API失敗時のブラウザ計算フォールバック
- 推定JSON送信量の表示
- 公開環境診断
- nodes・edges件数のAPI上限
- GitHub／Vercel用構成ファイル

## 今後

大規模化する際は、全状態送信から外部永続ストレージを利用したセッション管理へ移行します。候補はVercel KV互換ストレージ、PostgreSQL、専用Python計算基盤です。
