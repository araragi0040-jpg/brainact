# v015 システム構成

## 全体

```text
public/
  index.html
  app.js
  styles.css
  config.js
        │
        ├─ ブラウザ内Native計算
        │
        └─ FastAPI /api/v1/simulate
              ├─ Native Python engine
              └─ Brian2 adapter（任意導入）
```

## Brian2アダプター

`backend/brian2_engine.py`が、画面側のノード・接続データをBrian2へ変換します。

### ニューロン

- 次元なしLeaky Integrate-and-Fire
- 個別の膜時定数
- 個別の発火閾値
- 疲労・順応変数
- 概念stepをBrian2内部のミリ秒へ変換

### シナプス

- 興奮性／抑制性
- 個別結合強度
- 個別伝達遅延
- 短期抑圧・短期促通
- 任意のSTDP近似

### 状態の受け渡し

Vercel Functionsや通常のHTTP APIでは、サーバーのメモリ状態を継続利用しない前提です。そのため、各リクエストで以下を送受信します。

- ニューロン状態
- シナプス状態
- RNG状態
- 刺激シーケンス
- 経路集計
- Brian2内部の経過時間

これにより、計算サーバーがステートレスでも継続実行できます。

## 制限

- v015のBrian2計算は初期統合であり、生物学的妥当性を検証したモデルではありません。
- 独自モデルとBrian2モデルは計算式が異なるため、結果は完全一致しません。
- NESTとThe Virtual Brainは引き続き診断・変換マニフェストまでです。
