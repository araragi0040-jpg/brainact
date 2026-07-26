from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["version"] == "v015"
    assert "brian2" in payload


def test_diagnostics() -> None:
    response = client.get("/api/v1/diagnostics")
    assert response.status_code == 200
    assert response.json()["version"] == "v015"


def test_engine_adapters() -> None:
    response = client.get("/api/v1/engines")
    assert response.status_code == 200
    items = {item["id"]: item for item in response.json()["engines"]}
    assert {"native", "brian2", "nest", "tvb"}.issubset(items)
    assert items["brian2"]["execution_implemented"] is True


def test_native_self_test() -> None:
    response = client.post("/api/v1/engines/native/self-test", json={})
    assert response.status_code == 200
    assert response.json()["engineId"] == "native"


def test_native_simulation() -> None:
    request = {
        "version": "v015",
        "engine_id": "native",
        "steps": 2,
        "dt": 0.02,
        "rng_state": 42,
        "nodes": [
            {
                "id": 0,
                "regionId": "A",
                "type": "excitatory",
                "subtype": "regular",
                "voltage": 1.2,
                "baseThreshold": 1.0,
                "leak": 0.88,
                "refractory": 0,
                "refractoryBase": 2,
                "fatigue": 0,
                "fatigueRecovery": 0.018,
                "fatigueGain": 0.025,
                "adaptation": 0,
                "adaptationRecovery": 0.055,
                "adaptationGain": 0.018,
                "homeostaticOffset": 0,
                "homeostaticTarget": 0.045,
            },
            {
                "id": 1,
                "regionId": "B",
                "type": "excitatory",
                "subtype": "regular",
                "voltage": 0,
                "baseThreshold": 1.0,
                "leak": 0.88,
                "refractory": 0,
                "refractoryBase": 2,
                "fatigue": 0,
                "fatigueRecovery": 0.018,
                "fatigueGain": 0.025,
                "adaptation": 0,
                "adaptationRecovery": 0.055,
                "adaptationGain": 0.018,
                "homeostaticOffset": 0,
                "homeostaticTarget": 0.045,
            },
        ],
        "edges": [
            {
                "id": 0,
                "source": 0,
                "target": 1,
                "sourceRegionId": "A",
                "targetRegionId": "B",
                "weight": 0.4,
                "baseWeight": 0.4,
                "delay": 1,
            }
        ],
        "regions": ["A", "B"],
        "config": {"noise": False, "plasticity": False},
    }
    response = client.post("/api/v1/simulate", json=request)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["engineId"] == "native"
    assert len(payload["frames"]) == 2


def test_brian2_self_test_reports_missing_package_when_unavailable() -> None:
    response = client.post("/api/v1/engines/brian2/self-test", json={})
    if response.status_code == 200:
        assert response.json()["engineId"] == "brian2-lif-stdp-v1"
    else:
        assert response.status_code == 409
        assert "Brian2" in response.json()["detail"]
