# 仮想神経回路 v015

人間の脳内活動を概念的に再現し、刺激・伝播・学習・介入・比較を2D／3Dで観察するWebアプリです。

v015では、v014で用意した外部エンジン用アダプターを使い、**Brian2による直接計算の初期統合**を追加しました。Native計算は引き続き利用でき、Brian2が未導入の環境では誤って実行せず、導入方法を表示します。

## v015の主な追加

- Brian2パッケージの自動検出
- Brian2直接計算アダプター
- 次元なしLIFニューロンモデルへの変換
- ニューロンごとの膜時定数・閾値・疲労・順応
- 興奮性／抑制性シナプス
- 接続ごとの伝達遅延
- 短期シナプス可塑性
- 任意のSTDP近似
- 刺激シーケンスと仮想介入の反映
- Brian2の計算結果を既存の2D／3D／分析画面へ反映
- エンジンごとのセルフテスト
- Brian2の内部時間・パッケージバージョン・計算方式をAPI結果へ記録
- v014の実験・シナリオ・データセット・計算設定を移行

## 現在の対応範囲

| エンジン | 直接計算 | 互換性診断 | 変換設定出力 |
|---|---:|---:|---:|
| Virtual Brain Native | 対応 | 対応 | 対応 |
| Brian2 | ローカル任意導入 | 対応 | 対応 |
| NEST Simulator | 未対応 | 対応 | 対応 |
| The Virtual Brain | 未対応 | 対応 | 対応 |

## 通常のローカル起動

初回:

```bash
pip install -r requirements.txt
```

Windows:

```text
start_all.bat
```

macOS／Linux:

```bash
chmod +x start_all.sh
./start_all.sh
```

画面は `http://127.0.0.1:8080`、APIは `http://127.0.0.1:8765` です。

## Brian2を使用する場合

Windows:

```text
install_brian2.bat
```

macOS／Linux:

```bash
./install_brian2.sh
```

手動の場合:

```bash
pip install -r requirements-brian2.txt
```

その後アプリを起動し、次の順番で操作します。

1. 計算エンジンを「Python API計算」にする
2. 「API接続テスト」を押す
3. Python計算アダプターで「Brian2」を選ぶ
4. 「選択エンジン動作確認」を押す
5. 刺激または実験テンプレートを実行する

## GitHub／Vercel

Vercelの標準公開構成では、軽量で安定したNative Python計算を使用します。`requirements.txt`へBrian2を入れていないため、Vercel上ではBrian2は「未導入」と表示されます。

Brian2はNumPy・SciPy等を含むため、まずローカルまたは専用Pythonサーバーで検証する方針です。画面とAPIを別ドメインに分ける場合は、API側の`ALLOWED_ORIGINS`へVercel URLを設定してください。

## 注意

- 本アプリは概念モデルです。
- Brian2への変換も、現在の独自パラメータをLIF／STP／STDPへ近似したものです。
- 人間の脳活動を忠実に再現したものではありません。
- 診断、治療、医療判断には使用できません。
