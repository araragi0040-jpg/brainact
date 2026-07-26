# Backend v018

FastAPIによる計算APIです。

## 通常起動

```bash
pip install -r requirements.txt
python -m uvicorn api.index:app --host 127.0.0.1 --port 8765
```

## Brian2対応

```bash
pip install -r requirements-brian2.txt
python -m uvicorn api.index:app --host 127.0.0.1 --port 8765
```

主なAPI:

- `GET /api/health`
- `GET /api/v1/engines`
- `POST /api/v1/engines/{engine_id}/self-test`
- `POST /api/v1/engines/{engine_id}/compatibility`
- `POST /api/v1/engines/{engine_id}/export`
- `POST /api/v1/simulate`
