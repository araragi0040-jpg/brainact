# v018 GitHub／Vercel反映

1. ZIPの中身をGitHubリポジトリ直下へ上書きします。
2. push後、Vercelの再デプロイを待ちます。
3. `/api/health`の`version`が`v018`であることを確認します。
4. 画面を強制再読み込みします。

Vercel標準の`requirements.txt`には重量級エンジンを含めていません。外部エンジンは別サーバーでFastAPIを起動し、画面のAPI URLへそのURLを設定してください。
