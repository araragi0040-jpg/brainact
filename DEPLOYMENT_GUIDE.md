# GitHub・Vercel公開手順（v013）

## 1. GitHubへ登録

### GitHubの画面から行う場合

1. GitHubで新しい空のリポジトリを作成します。
2. README・ライセンス・`.gitignore`はGitHub側では追加せず、空の状態にします。
3. このフォルダ内のファイルをすべてアップロードします。
4. コミット後、リポジトリ直下に`index.html`、`app.js`、`api/index.py`、`vercel.json`があることを確認します。

### Gitコマンドを使う場合

```bash
git init -b main
git add .
git commit -m "Add Virtual Brain Lab v013"
git remote add origin <GitHubリポジトリURL>
git push -u origin main
```

## 2. Vercelへ接続

1. Vercelへログインします。
2. `Add New` → `Project`を選択します。
3. GitHubのv013リポジトリを`Import`します。
4. Framework Presetは`Other`または自動判定のままで進めます。
5. Root Directoryはリポジトリ直下のままにします。
6. Build Command、Output Directory、Install Commandは空欄または自動設定のままにします。
7. `Deploy`を押します。

公開後、次を確認します。

- トップ画面が表示される
- 計算エンジンがPython APIを選択している
- 「API接続テスト」が成功する
- `https://公開URL/api/health`でJSONが表示される
- 「公開環境診断」が正常になる

## 3. 更新方法

GitHubの`main`ブランチへ更新をpushすると、Vercelで本番デプロイが実行されます。別ブランチやPull RequestではPreview Deploymentを使えます。

```bash
git add .
git commit -m "Update virtual brain"
git push
```

## 4. ローカル動作

```bash
python -m pip install -r requirements.txt
```

Windowsは`start_all.bat`、macOS／Linuxは`./start_all.sh`を実行します。

- 画面：`http://127.0.0.1:8080`
- API：`http://127.0.0.1:8765/api/health`

## 5. 公開時の注意

- 実験結果とシナリオはブラウザの`localStorage`へ保存され、利用端末間では自動共有されません。
- Python APIは計算要求ごとに状態を受け取り、結果を返します。サーバー側へ個人の実験状態を永続保存しません。
- 公開APIには入力件数の上限を設定しています。
- このシステムは概念モデルであり、医療・診断・治療判断には使用できません。
