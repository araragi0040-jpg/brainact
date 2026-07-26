# v018 アーキテクチャ

```text
public/            ブラウザUI・3D表示・比較ラボ
api/index.py       FastAPI統合ルーター
backend/           Nativeおよび外部エンジンアダプター
/api/v1/simulate   選択エンジン単独計算
/api/v1/compare    同一入力の複数エンジン比較
```

VercelではNative（およびRegional Mass Lite）を標準利用します。Brian2・NEST・TVBはローカルまたは専用計算サーバーへ導入し、同じFastAPIを公開する構成です。
