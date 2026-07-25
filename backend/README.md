# ローカルPython API

実装本体は`../api/index.py`です。Vercelとローカルで同じFastAPIアプリを使用します。

```bash
python -m pip install -r ../requirements.txt
python -m uvicorn api.index:app --host 127.0.0.1 --port 8765
```

確認：`http://127.0.0.1:8765/api/health`
