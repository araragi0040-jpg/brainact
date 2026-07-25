"""ローカル開発用の互換エントリーポイント。実装本体は api/index.py にあります。"""
from api.index import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.index:app", host="127.0.0.1", port=8765, reload=False)
