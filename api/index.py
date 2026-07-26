from __future__ import annotations

import math
import os
import platform
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from backend.brian2_engine import package_available as brian2_available, package_version as brian2_version, self_test as brian2_self_test, simulate_brian2
from backend.engine_adapters import (
    compatibility_report,
    export_manifest,
    get_adapter,
    list_adapters,
)

APP_VERSION = "v015"
ENGINE_VERSION = "engine-adapter-v2"
DT_DEFAULT = 0.01
UINT32_MAX_PLUS_ONE = 4294967296.0

app = FastAPI(
    title="Virtual Brain Lab Python Engine",
    version=APP_VERSION,
    description="仮想神経回路v015用の公開対応計算エンジン。Native計算と任意導入のBrian2直接計算に対応します。",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
def allowed_origins() -> list[str]:
    origins = {
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    }
    for key in ("VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"):
        value = os.getenv(key, "").strip().strip("/")
        if value:
            origins.add(f"https://{value}")
    extra = os.getenv("ALLOWED_ORIGINS", "")
    origins.update(item.strip().rstrip("/") for item in extra.split(",") if item.strip())
    return sorted(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

MAX_NODES = 2500
MAX_EDGES = 30000


class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    version: str = APP_VERSION
    engine_id: str = "native"
    steps: int = Field(default=1, ge=1, le=100)
    dt: float = Field(default=DT_DEFAULT, gt=0, le=1)
    rng_state: int = 1
    step: int = 0
    sim_time: float = 0.0
    total_spikes: int = 0
    peak_spikes: int = 0
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    regions: list[str]
    config: dict[str, Any] = Field(default_factory=dict)
    stimulus_sequence: dict[str, Any] | None = None
    interventions: list[dict[str, Any]] = Field(default_factory=list)
    route_stats: dict[str, dict[str, Any]] = Field(default_factory=dict)
    engine_state: dict[str, Any] = Field(default_factory=dict)


class ValidateRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)


class AdapterInspectRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    config: dict[str, Any] = Field(default_factory=dict)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def rng_uniform(state: int) -> tuple[int, float]:
    # 32bit LCG: serializeしやすく、API呼び出し間でも再現可能。
    next_state = (1664525 * (state & 0xFFFFFFFF) + 1013904223) & 0xFFFFFFFF
    return next_state, next_state / UINT32_MAX_PLUS_ONE


def rng_gaussian(state: int) -> tuple[int, float]:
    state, u = rng_uniform(state)
    state, v = rng_uniform(state)
    u = max(u, 1e-12)
    return state, math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)


def process_stimulus(
    sequence: dict[str, Any] | None,
    nodes: list[dict[str, Any]],
    rng_state: int,
) -> tuple[dict[str, Any] | None, int]:
    if not sequence:
        return None, rng_state

    phase = sequence.get("phase", "active")
    if phase == "active":
        target_regions = set(sequence.get("regions", []))
        region_weights = sequence.get("regionWeights") or {}
        strength = float(sequence.get("strength", 1.0))
        for node in nodes:
            if node.get("regionId") not in target_regions:
                continue
            rng_state, chance = rng_uniform(rng_state)
            if chance >= 0.58:
                continue
            rng_state, spread = rng_uniform(rng_state)
            region_weight = float(region_weights.get(node.get("regionId"), 1.0))
            node["externalInput"] = float(node.get("externalInput", 0.0)) + strength * region_weight * (0.72 + spread * 0.58)

        sequence["remaining"] = int(sequence.get("remaining", sequence.get("duration", 1))) - 1
        if sequence["remaining"] <= 0:
            current_repeat = int(sequence.get("currentRepeat", 1))
            repeats = int(sequence.get("repeats", 1))
            if current_repeat >= repeats:
                return None, rng_state
            sequence["phase"] = "waiting"
            sequence["waitRemaining"] = int(sequence.get("interval", 1))
    else:
        sequence["waitRemaining"] = int(sequence.get("waitRemaining", 1)) - 1
        if sequence["waitRemaining"] <= 0:
            sequence["currentRepeat"] = int(sequence.get("currentRepeat", 1)) + 1
            sequence["phase"] = "active"
            sequence["remaining"] = int(sequence.get("duration", 1))

    return sequence, rng_state


def normalize_interventions(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for item in items:
        region_id = str(item.get("regionId", "")).strip()
        if region_id:
            result[region_id] = item
    return result


def simulate_native(request: SimulationRequest) -> dict[str, Any]:
    adapter = get_adapter(request.engine_id)
    if adapter.id != request.engine_id:
        raise HTTPException(status_code=404, detail=f"未知の計算エンジンです: {request.engine_id}")
    if adapter.id != "native":
        raise HTTPException(status_code=409, detail="Native計算関数へ外部エンジンが渡されました。")
    started = time.perf_counter()
    nodes = [dict(node) for node in request.nodes]
    edges = [dict(edge) for edge in request.edges]
    regions = [str(region_id) for region_id in request.regions]
    if not nodes:
        raise HTTPException(status_code=422, detail="nodesが空です。")
    if not regions:
        raise HTTPException(status_code=422, detail="regionsが空です。")
    if len(nodes) > MAX_NODES:
        raise HTTPException(status_code=413, detail=f"nodesは{MAX_NODES}件以下にしてください。")
    if len(edges) > MAX_EDGES:
        raise HTTPException(status_code=413, detail=f"edgesは{MAX_EDGES}件以下にしてください。")

    config = request.config or {}
    plasticity_enabled = bool(config.get("plasticity", True))
    noise_enabled = bool(config.get("noise", True))
    threshold_scale = float(config.get("thresholdScale", 1.0))
    fatigue_strength = float(config.get("fatigueStrength", 0.45))
    inhibitory_gain = float(config.get("inhibitoryGain", 1.0))
    short_term_enabled = bool(config.get("shortTermPlasticity", True))
    homeostasis_enabled = bool(config.get("homeostasis", True))
    model_preset = str(config.get("modelPreset", "standard"))

    interventions = normalize_interventions(request.interventions)
    route_stats = {key: dict(value) for key, value in request.route_stats.items()}
    stimulus_sequence = dict(request.stimulus_sequence) if request.stimulus_sequence else None
    rng_state = request.rng_state & 0xFFFFFFFF
    current_step = int(request.step)
    sim_time = float(request.sim_time)
    total_spikes = int(request.total_spikes)
    peak_spikes = int(request.peak_spikes)
    frames: list[dict[str, Any]] = []

    outgoing: dict[int, list[dict[str, Any]]] = {int(node.get("id", index)): [] for index, node in enumerate(nodes)}
    for edge in edges:
        edge.setdefault("queue", [])
        edge.setdefault("activity", 0.0)
        edge.setdefault("lastSignal", 0.0)
        edge.setdefault("resource", 1.0)
        edge.setdefault("facilitation", 0.0)
        outgoing.setdefault(int(edge.get("source", -1)), []).append(edge)

    node_by_id = {int(node.get("id", index)): node for index, node in enumerate(nodes)}

    for _ in range(request.steps):
        for node in nodes:
            node["firedLast"] = bool(node.get("fired", False))
            node["fired"] = False
            node["externalInput"] = 0.0
            node["pulse"] = float(node.get("pulse", 0.0)) * 0.82
            node["fatigue"] = max(0.0, float(node.get("fatigue", 0.0)) - float(node.get("fatigueRecovery", 0.018)))
            node["adaptation"] = max(0.0, float(node.get("adaptation", 0.0)) - float(node.get("adaptationRecovery", 0.055)))
            if int(node.get("refractory", 0)) > 0:
                node["refractory"] = int(node.get("refractory", 0)) - 1

        for edge in edges:
            resource_recovery = float(edge.get("resourceRecovery", 0.045))
            edge["resource"] = clamp(float(edge.get("resource", 1.0)) + (1.0 - float(edge.get("resource", 1.0))) * resource_recovery, 0.05, 1.0)
            edge["facilitation"] = max(0.0, float(edge.get("facilitation", 0.0)) * (1.0 - float(edge.get("facilitationDecay", 0.14))))

        stimulus_sequence, rng_state = process_stimulus(stimulus_sequence, nodes, rng_state)

        synaptic_inputs = [0.0] * len(nodes)
        route_signals_this_step: dict[str, dict[str, Any]] = {}
        for edge in edges:
            edge["activity"] = float(edge.get("activity", 0.0)) * 0.84
            edge["lastSignal"] = float(edge.get("lastSignal", 0.0)) * 0.76
            queue = edge.get("queue") or []
            next_queue: list[dict[str, Any]] = []
            for raw_signal in queue:
                signal = dict(raw_signal)
                signal["delay"] = int(signal.get("delay", 1)) - 1
                if signal["delay"] <= 0:
                    target_id = int(edge.get("target", -1))
                    if 0 <= target_id < len(synaptic_inputs):
                        value = float(signal.get("value", 0.0))
                        synaptic_inputs[target_id] += value
                        edge["activity"] = min(1.0, float(edge.get("activity", 0.0)) + abs(value) * 1.7)
                        edge["lastSignal"] = 1 if value >= 0 else -1
                        route_key = f"{edge.get('sourceRegionId')}>{edge.get('targetRegionId')}"
                        step_route = route_signals_this_step.setdefault(route_key, {"count": 0, "excitatory": 0, "inhibitory": 0, "absValue": 0.0, "netValue": 0.0})
                        step_route["count"] += 1
                        step_route["excitatory" if value >= 0 else "inhibitory"] += 1
                        step_route["absValue"] += abs(value)
                        step_route["netValue"] += value
                        cumulative = route_stats.setdefault(route_key, {"count": 0, "excitatory": 0, "inhibitory": 0, "absValue": 0.0, "netValue": 0.0, "lastStep": 0})
                        cumulative["count"] += 1
                        cumulative["excitatory" if value >= 0 else "inhibitory"] += 1
                        cumulative["absValue"] += abs(value)
                        cumulative["netValue"] += value
                        cumulative["lastStep"] = current_step + 1
                else:
                    next_queue.append(signal)
            edge["queue"] = next_queue

        spikes_this_step = 0
        region_counts = {region_id: 0 for region_id in regions}
        region_excitatory_counts = {region_id: 0 for region_id in regions}
        region_inhibitory_counts = {region_id: 0 for region_id in regions}
        hemisphere_counts = {f"{region_id}:left": 0 for region_id in regions}
        hemisphere_counts.update({f"{region_id}:right": 0 for region_id in regions})

        for node in nodes:
            node_id = int(node.get("id", 0))
            region_id = str(node.get("regionId", ""))
            intervention = interventions.get(region_id)
            if intervention and intervention.get("type") == "block":
                node["voltage"] = 0.0
                node["refractory"] = max(int(node.get("refractory", 0)), 1)
                continue
            if int(node.get("refractory", 0)) > 0:
                node["voltage"] = float(node.get("voltage", 0.0)) * 0.45
                continue

            if noise_enabled:
                rng_state, gaussian_value = rng_gaussian(rng_state)
                noise = gaussian_value * 0.018
            else:
                noise = 0.0
            synaptic_input = synaptic_inputs[node_id] if 0 <= node_id < len(synaptic_inputs) else 0.0
            total_input = synaptic_input + float(node.get("externalInput", 0.0)) + noise - float(node.get("adaptation", 0.0)) * fatigue_strength
            effective_threshold = float(node.get("baseThreshold", 1.0)) * threshold_scale * (
                1.0 + float(node.get("fatigue", 0.0)) * fatigue_strength * 0.72 + float(node.get("homeostaticOffset", 0.0))
            )
            if intervention and intervention.get("type") == "suppress":
                strength = float(intervention.get("strength", 0.5))
                total_input *= max(0.04, 1.0 - strength * 0.86)
                node["voltage"] = float(node.get("voltage", 0.0)) * max(0.55, 1.0 - strength * 0.24)
                effective_threshold *= 1.0 + strength * 0.48
            elif intervention and intervention.get("type") == "boost":
                strength = float(intervention.get("strength", 0.5))
                total_input += strength * 0.085
                effective_threshold *= max(0.72, 1.0 - strength * 0.16)

            node["voltage"] = clamp(float(node.get("voltage", 0.0)) * float(node.get("leak", 0.88)) + total_input, -0.58, 1.75)
            if float(node["voltage"]) >= effective_threshold:
                node["fired"] = True
                node["spikeCount"] = int(node.get("spikeCount", 0)) + 1
                node["pulse"] = 1.0
                node["voltage"] = 0.05
                node["refractory"] = int(node.get("refractoryBase", 2))
                node["fatigue"] = clamp(float(node.get("fatigue", 0.0)) + float(node.get("fatigueGain", 0.025)), 0.0, 1.35)
                node["adaptation"] = clamp(float(node.get("adaptation", 0.0)) + float(node.get("adaptationGain", 0.018)), 0.0, 0.85)
                spikes_this_step += 1
                if region_id in region_counts:
                    region_counts[region_id] += 1
                    if node.get("type") == "inhibitory":
                        region_inhibitory_counts[region_id] += 1
                    else:
                        region_excitatory_counts[region_id] += 1
                    hemisphere_counts[f"{region_id}:{node.get('hemisphere', 'left')}"] = hemisphere_counts.get(f"{region_id}:{node.get('hemisphere', 'left')}", 0) + 1

        for node in nodes:
            node["firingEma"] = float(node.get("firingEma", 0.0)) * 0.975 + (1.0 if node.get("fired") else 0.0) * 0.025
            if homeostasis_enabled:
                error = float(node["firingEma"]) - float(node.get("homeostaticTarget", 0.045))
                node["homeostaticOffset"] = clamp(float(node.get("homeostaticOffset", 0.0)) + error * 0.0018, -0.16, 0.28)
            else:
                node["homeostaticOffset"] = float(node.get("homeostaticOffset", 0.0)) * 0.998

        for node in nodes:
            if not node.get("fired"):
                continue
            for edge in outgoing.get(int(node.get("id", -1)), []):
                signal_value = float(edge.get("weight", 0.0))
                if signal_value < 0:
                    signal_value *= inhibitory_gain
                if short_term_enabled:
                    short_term_scale = clamp(float(edge.get("resource", 1.0)) * (1.0 + float(edge.get("facilitation", 0.0))), 0.08, 1.65)
                    signal_value *= short_term_scale
                    edge["resource"] = clamp(float(edge.get("resource", 1.0)) * (1.0 - float(edge.get("depressionRate", 0.12))), 0.05, 1.0)
                    edge["facilitation"] = clamp(float(edge.get("facilitation", 0.0)) + float(edge.get("facilitationRate", 0.055)) * (1.0 - float(edge.get("facilitation", 0.0))), 0.0, 0.8)
                edge.setdefault("queue", []).append({"delay": int(edge.get("delay", 1)), "value": signal_value})
                edge["activity"] = min(1.0, float(edge.get("activity", 0.0)) + abs(signal_value))
                edge["lastSignal"] = 1 if signal_value >= 0 else -1

        if plasticity_enabled:
            for edge in edges:
                pre = node_by_id.get(int(edge.get("source", -1)))
                post = node_by_id.get(int(edge.get("target", -1)))
                if pre is None or post is None:
                    continue
                sign = -1.0 if float(edge.get("weight", 0.0)) < 0 else 1.0
                magnitude = abs(float(edge.get("weight", 0.0)))
                learning_scale = 1.35 if model_preset == "learning" else 1.12 if model_preset == "hyper" else 1.0
                depression_scale = 0.82 if model_preset == "learning" else 1.0
                subtype_scale = 1.12 if pre.get("subtype") == "burst" else 0.92 if pre.get("subtype") == "adaptive" else 1.0
                if pre.get("firedLast") and post.get("fired"):
                    magnitude += 0.0058 * learning_scale * subtype_scale
                elif pre.get("fired") and post.get("firedLast"):
                    magnitude -= 0.0032 * depression_scale
                magnitude += (abs(float(edge.get("baseWeight", magnitude))) - magnitude) * 0.00055
                magnitude = clamp(magnitude, 0.055, 0.82)
                edge["weight"] = sign * magnitude

        current_step += 1
        sim_time = current_step * request.dt
        total_spikes += spikes_this_step
        peak_spikes = max(peak_spikes, spikes_this_step)

        grouped_edge_activity: dict[str, list[float]] = {}
        grouped_synapse_change: dict[str, list[float]] = {}
        for edge in edges:
            if edge.get("sourceRegionId") == edge.get("targetRegionId"):
                continue
            key = f"{edge.get('sourceRegionId')}>{edge.get('targetRegionId')}"
            grouped_edge_activity.setdefault(key, []).append(float(edge.get("activity", 0.0)))
            grouped_synapse_change.setdefault(key, []).append(abs(float(edge.get("weight", 0.0))) - abs(float(edge.get("baseWeight", 0.0))))

        frames.append({
            "step": current_step,
            "simTime": sim_time,
            "spikesThisStep": spikes_this_step,
            "regionCounts": region_counts,
            "regionExcitatoryCounts": region_excitatory_counts,
            "regionInhibitoryCounts": region_inhibitory_counts,
            "hemisphereCounts": hemisphere_counts,
            "routeSignals": {
                key: {
                    "count": int(value["count"]),
                    "excitatory": int(value["excitatory"]),
                    "inhibitory": int(value["inhibitory"]),
                    "absValue": round(float(value["absValue"]), 5),
                    "netValue": round(float(value["netValue"]), 5),
                }
                for key, value in route_signals_this_step.items()
            },
            "edgeActivity": {key: round(mean(values), 4) for key, values in grouped_edge_activity.items()},
            "synapseChange": {key: round(mean(values), 6) for key, values in grouped_synapse_change.items()},
            "meanWeightChange": round(mean([abs(float(edge.get("weight", 0.0))) - abs(float(edge.get("baseWeight", 0.0))) for edge in edges]), 6),
        })

    elapsed_ms = (time.perf_counter() - started) * 1000.0
    return {
        "version": APP_VERSION,
        "engine": ENGINE_VERSION,
        "engineId": adapter.id,
        "elapsedMs": round(elapsed_ms, 3),
        "rngState": rng_state,
        "step": current_step,
        "simTime": sim_time,
        "totalSpikes": total_spikes,
        "peakSpikes": peak_spikes,
        "nodes": nodes,
        "edges": edges,
        "stimulusSequence": stimulus_sequence,
        "routeStats": route_stats,
        "frames": frames,
    }


def simulate(request: SimulationRequest) -> dict[str, Any]:
    adapter = get_adapter(request.engine_id)
    if adapter.id != request.engine_id:
        raise HTTPException(status_code=404, detail=f"未知の計算エンジンです: {request.engine_id}")
    if not adapter.executable:
        if adapter.id == "brian2" and not adapter.package_detected:
            raise HTTPException(
                status_code=409,
                detail="Brian2が未導入です。ローカル環境で requirements-brian2.txt をインストールしてください。",
            )
        raise HTTPException(
            status_code=409,
            detail=f"{adapter.name}はv015では互換性診断・変換設定書き出しまで対応しています。",
        )
    if adapter.id == "brian2":
        try:
            return simulate_brian2(request)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Brian2計算に失敗しました: {exc}") from exc
    return simulate_native(request)


@app.post("/api/v1/engines/{engine_id}/self-test")
def engine_self_test(engine_id: str) -> dict[str, Any]:
    adapter = get_adapter(engine_id)
    if adapter.id != engine_id:
        raise HTTPException(status_code=404, detail=f"未知の計算エンジンです: {engine_id}")
    if engine_id == "native":
        return {
            "status": "ok",
            "engineId": "native",
            "engineVersion": ENGINE_VERSION,
            "message": "Native計算エンジンは利用可能です。",
        }
    if engine_id == "brian2":
        if not brian2_available():
            raise HTTPException(status_code=409, detail="Brian2が未導入です。requirements-brian2.txtをインストールしてください。")
        try:
            return brian2_self_test()
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Brian2セルフテストに失敗しました: {exc}") from exc
    raise HTTPException(status_code=409, detail=f"{adapter.name}の直接計算セルフテストは未実装です。")


@app.get("/", include_in_schema=False)
def frontend_root() -> RedirectResponse:
    # Vercelのpublic/index.htmlへ明示的に誘導する。
    return RedirectResponse(url="/index.html", status_code=307)


@app.get("/api")
def api_root() -> dict[str, Any]:
    return {
        "name": "Virtual Brain Lab API",
        "version": APP_VERSION,
        "health": "/api/health",
        "docs": "/api/docs",
        "medicalUse": False,
        "adapters": "/api/v1/engines",
        "deployment": {
            "runtime": "vercel-python" if os.getenv("VERCEL") else "local-python",
            "region": os.getenv("VERCEL_REGION", "local"),
            "persistentServerState": False,
        },
    }


@app.get("/api/v1/diagnostics")
def diagnostics() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "engine": ENGINE_VERSION,
        "runtime": "vercel-python" if os.getenv("VERCEL") else "local-python",
        "python": platform.python_version(),
        "region": os.getenv("VERCEL_REGION", "local"),
        "maxNodes": MAX_NODES,
        "maxEdges": MAX_EDGES,
        "maxStepsPerRequest": 100,
        "persistentServerState": False,
        "medicalUse": False,
        "adapters": list_adapters(),
        "brian2": {"available": brian2_available(), "version": brian2_version()},
    }


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "engine": ENGINE_VERSION,
        "model": "conceptual-spiking-network",
        "medicalUse": False,
        "adapters": list_adapters(),
        "brian2": {"available": brian2_available(), "version": brian2_version()},
        "deployment": {
            "runtime": "vercel-python" if os.getenv("VERCEL") else "local-python",
            "region": os.getenv("VERCEL_REGION", "local"),
            "persistentServerState": False,
        },
    }


@app.get("/api/v1/engines")
def engines() -> dict[str, Any]:
    return {
        "version": APP_VERSION,
        "defaultEngine": "native",
        "engines": list_adapters(),
        "note": "v015ではBrian2を任意導入すると直接計算できます。NESTとTVBは診断・書き出し段階です。",
    }


@app.post("/api/v1/engines/{engine_id}/compatibility")
def inspect_engine(engine_id: str, request: AdapterInspectRequest) -> dict[str, Any]:
    if engine_id not in {item["id"] for item in list_adapters()}:
        raise HTTPException(status_code=404, detail=f"未知の計算エンジンです: {engine_id}")
    return compatibility_report(engine_id, request.nodes, request.edges, request.regions, request.config)


@app.post("/api/v1/engines/{engine_id}/export")
def export_engine_manifest(engine_id: str, request: AdapterInspectRequest) -> dict[str, Any]:
    if engine_id not in {item["id"] for item in list_adapters()}:
        raise HTTPException(status_code=404, detail=f"未知の計算エンジンです: {engine_id}")
    return export_manifest(engine_id, request.nodes, request.edges, request.regions, request.config)


@app.post("/api/v1/validate")
def validate_network(request: ValidateRequest) -> dict[str, Any]:
    node_ids = {int(node.get("id", index)) for index, node in enumerate(request.nodes)}
    invalid_edges = [
        index
        for index, edge in enumerate(request.edges)
        if int(edge.get("source", -1)) not in node_ids or int(edge.get("target", -1)) not in node_ids
    ]
    region_ids = set(request.regions)
    unknown_node_regions = sorted({str(node.get("regionId")) for node in request.nodes if str(node.get("regionId")) not in region_ids})
    return {
        "valid": not invalid_edges and not unknown_node_regions,
        "nodes": len(request.nodes),
        "edges": len(request.edges),
        "regions": len(request.regions),
        "invalidEdgeIndexes": invalid_edges[:50],
        "unknownNodeRegions": unknown_node_regions,
    }


@app.post("/api/v1/simulate")
def run_simulation(request: SimulationRequest) -> dict[str, Any]:
    return simulate(request)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.index:app", host="127.0.0.1", port=8765, reload=False)
