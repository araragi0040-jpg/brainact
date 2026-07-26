# v013.1 ボタン無反応の修正

## 原因

`app.js`が初期化時に参照する公開環境診断用のHTML要素5件が、`public/index.html`に存在していませんでした。
初期化がその時点で停止したため、すべてのボタンへクリック処理が登録されていない状態でした。

不足していた要素：

- `deploymentEnvironment`
- `payloadEstimate`
- `deploymentCheckBtn`
- `copyApiUrlBtn`
- `deploymentStatus`

また、`config.js`がHTMLから読み込まれていなかったため、公開環境のAPI自動判定も有効になっていませんでした。

## 修正内容

- 不足していた公開環境診断UIを追加
- `config.js`を`app.js`より先に読み込むよう修正
- CSS・JavaScriptにバージョン文字列を追加
- `index.html`、JavaScript、CSSのキャッシュ設定を見直し
- 画面上の版表記をv013.1へ統一
- HTMLとJavaScriptで必要な要素IDが一致することを確認
- 刺激、1step、再生・停止、3D切替などの主要操作を確認

## GitHubへの反映

このフォルダの中身を、GitHubリポジトリ直下へすべて上書きしてください。
特に次のファイルは必ず更新します。

- `public/index.html`
- `public/config.js`
- `vercel.json`

`public/app.js`と`public/styles.css`も同梱版へ揃えてください。

## Vercelでの再デプロイ

GitHubへのpush後、Vercelで新しいDeploymentが完了するまで待ちます。
古い画面が残る場合は、VercelのDeploymentsからRedeployを選び、Build Cacheを使用しない設定で再実行してください。

公開後、ブラウザで強制再読み込みします。

- Windows: `Ctrl + F5`
- Mac: `Command + Shift + R`

画面右上またはヘッダーの版表記が`v013`、内部設定が`v013.1`になっていれば修正版です。
