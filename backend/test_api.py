from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_diagnostics() -> None:
    response = client.get("/api/v1/diagnostics")
    assert response.status_code == 200
    assert response.json()["version"] == "v013"
