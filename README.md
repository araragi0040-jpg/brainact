# 仮想神経回路 v018 — 全脳エンジン統合版

v018はv015のGitHub／Vercel公開構成を維持し、複数の計算エンジンを同じ実験条件で検証する版です。

## 対応エンジン

Native / Brian2 / NEST / Regional Mass Lite / The Virtual Brain

## 主な追加

- tvb-libraryのGeneric2dOscillator直接計算アダプター
- ニューロン接続を19領域の接続行列へ集約
- TVB未導入時も全脳操作を確認できるRegional Mass Lite
- 5エンジンの診断・同条件比較・JSON保存
- TVB導入用requirementsとスクリプト

## 起動

標準構成は従来どおりです。

```bash
pip install -r requirements.txt
./start_all.sh
```

Windowsでは`start_all.bat`を使用します。画面は`http://127.0.0.1:8080`、APIは`http://127.0.0.1:8765`です。

## 比較ラボ

右側の「計算エンジン」の下に追加した比較ラボで、エンジンを2件以上選択し「同条件比較を実行」を押します。比較値はモデル間の数値差であり、生物学的な正解率ではありません。

## 注意

TVBとRegional Mass Liteの出力は連続的な領域活動を画面用の「活動相当値」へ変換したもので、ニューロンの実発火数ではありません。

本アプリは概念検証・教育・研究設計補助用です。診断、治療判断、個人の脳活動推定には使用できません。
