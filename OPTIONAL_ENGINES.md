# 外部計算エンジン導入メモ v015

## Brian2

v015では直接計算に対応しています。

```bash
pip install -r requirements-brian2.txt
```

導入後、APIを再起動し、画面の「アダプター更新」と「選択エンジン動作確認」を実行してください。

## The Virtual Brain

```bash
pip install tvb-library
```

v015では互換性診断と変換設定書き出しまでです。

## NEST Simulator

NESTはOSや環境に応じた専用導入が必要です。v015では互換性診断と変換設定書き出しまでです。
