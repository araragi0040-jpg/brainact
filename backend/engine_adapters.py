from __future__ import annotations

import importlib.util
import json
import platform
from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class EngineAdapter:
    id: str
    name: str
    scale: str
    description: str
    package: str | None
    execution_implemented: bool
    serverless_recommended: bool
    supported_features: tuple[str, ...]
    limited_features: tuple[str, ...]
    unsupported_features: tuple[str, ...]

    @property
    def package_detected(self) -> bool:
        if not self.package:
            return True
        return importlib.util.find_spec(self.package) is not None

    @property
    def executable(self) -> bool:
        return self.execution_implemented and self.package_detected

    @property
    def status(self) -> str:
        if self.executable:
            return "ready"
        if self.execution_implemented and not self.package_detected:
            return "package-missing"
        if self.package_detected:
            return "bridge-preview"
        return "package-missing-preview"

    def public_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data.update(
            packageDetected=self.package_detected,
            executable=self.executable,
            status=self.status,
        )
        data["supported_features"] = list(self.supported_features)
        data["limited_features"] = list(self.limited_features)
        data["unsupported_features"] = list(self.unsupported_features)
        return data


ADAPTERS: dict[str, EngineAdapter] = {
    "native": EngineAdapter(
        id="native",
        name="Virtual Brain Native",
        scale="ニューロン／領域の概念モデル",
        description="v015標準の独自Python計算エンジン。現在の全機能を最も忠実に処理します。",
        package=None,
        execution_implemented=True,
        serverless_recommended=True,
        supported_features=(
            "発火閾値・不応期",
            "興奮性／抑制性",
            "疲労・順応",
            "短期可塑性",
            "長期可塑性",
            "恒常性調整",
            "仮想介入",
            "段階実験テンプレート",
        ),
        limited_features=("生物物理学的イオンチャネル", "実測アトラス由来の全脳動力学"),
        unsupported_features=("臨床診断",),
    ),
    "brian2": EngineAdapter(
        id="brian2",
        name="Brian2",
        scale="スパイキング・ニューロンネットワーク",
        description="方程式ベースのニューロン／シナプスモデルへ変換し、ローカル環境では直接計算できる初期統合版です。",
        package="brian2",
        execution_implemented=True,
        serverless_recommended=False,
        supported_features=(
            "ニューロンごとの膜電位",
            "閾値発火",
            "不応期",
            "シナプス遅延",
            "STDP近似による直接計算",
            "興奮性／抑制性",
        ),
        limited_features=("独自モデルの恒常性は各リクエスト間でPython側が補正", "段階テンプレートは外側の制御層で実行"),
        unsupported_features=("Brian2未導入環境での直接計算", "医学的妥当性の保証"),
    ),
    "nest": EngineAdapter(
        id="nest",
        name="NEST Simulator",
        scale="大規模スパイキングネットワーク",
        description="大規模な点ニューロンネットワークへの変換を想定した初期ブリッジです。v015では互換性診断と接続設定書き出しまで対応します。",
        package="nest",
        execution_implemented=False,
        serverless_recommended=False,
        supported_features=(
            "大規模ニューロン群",
            "興奮性／抑制性接続",
            "伝達遅延",
            "外部刺激",
            "領域ごとのノード集約",
        ),
        limited_features=("ニューロンタイプはNESTモデル名へのマッピングが必要", "独自可塑性則は対応モデルの選定が必要"),
        unsupported_features=("Vercel Function内でのNEST実行",),
    ),
    "tvb": EngineAdapter(
        id="tvb",
        name="The Virtual Brain",
        scale="脳領域／全脳ネットワーク",
        description="19領域を接続行列へ集約し、全脳レベルの動力学へ変換する初期ブリッジです。v015では互換性診断と領域モデル書き出しまで対応します。",
        package="tvb",
        execution_implemented=False,
        serverless_recommended=False,
        supported_features=(
            "領域間接続行列",
            "領域座標",
            "伝達遅延候補",
            "領域活動の集約",
            "全脳時系列への変換候補",
        ),
        limited_features=("個別ニューロン状態は領域平均へ集約", "独自介入は領域刺激パラメータへ変換"),
        unsupported_features=("シナプス単位の直接表示", "Vercel Function内での長時間全脳計算"),
    ),
}


def list_adapters() -> list[dict[str, Any]]:
    return [adapter.public_dict() for adapter in ADAPTERS.values()]


def get_adapter(engine_id: str) -> EngineAdapter:
    return ADAPTERS.get(engine_id, ADAPTERS["native"])


def compatibility_report(
    engine_id: str,
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    regions: list[str],
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    adapter = get_adapter(engine_id)
    config = config or {}
    excitatory = sum(1 for node in nodes if node.get("type") != "inhibitory")
    inhibitory = len(nodes) - excitatory
    delayed_edges = sum(1 for edge in edges if float(edge.get("delay", 0)) > 0)
    plastic_edges = sum(
        1 for edge in edges
        if abs(float(edge.get("weight", 0))) != abs(float(edge.get("initialWeight", edge.get("weight", 0))))
    )
    warnings: list[str] = []
    score = 100

    if engine_id == "brian2":
        if len(nodes) > 5000:
            warnings.append("現在のノード数はブラウザ連携用の変換範囲を超えています。")
            score -= 20
        if config.get("homeostasis", True):
            warnings.append("恒常性補正はBrian2内部の連続方程式ではなく、APIのstep境界で近似更新します。")
            score -= 3
        if config.get("shortTermPlasticity", True):
            warnings.append("短期可塑性はBrian2 Synapsesの資源・促通変数へ近似変換します。")
    elif engine_id == "nest":
        if len(nodes) < 1000:
            warnings.append("NESTの強みは大規模計算です。現在規模では導入効果が小さい可能性があります。")
            score -= 6
        if config.get("homeostasis", True):
            warnings.append("恒常性補正に対応するNESTモデルまたは外側制御が必要です。")
            score -= 10
    elif engine_id == "tvb":
        if len(regions) < 20:
            warnings.append("TVBではより細かなアトラスへ拡張すると全脳モデルとしての利点が高まります。")
            score -= 8
        if nodes:
            warnings.append("個別ニューロンは領域平均へ集約され、細胞単位の状態は保持されません。")
            score -= 15
        if plastic_edges:
            warnings.append("シナプス単位の学習変化は領域間結合の集約値へ変換されます。")
            score -= 8
    else:
        warnings.append("独自概念モデルのため、生体データとの一致は別途検証が必要です。")
        score -= 5

    if not adapter.package_detected and adapter.package:
        warnings.append(f"Pythonパッケージ「{adapter.package}」は現在の実行環境で検出されていません。")
        score -= 20
    if not adapter.execution_implemented:
        warnings.append("v015ではこの外部エンジンの直接計算は未実装です。互換性診断と変換設定書き出しを利用してください。")

    return {
        "version": "v015",
        "engine": adapter.public_dict(),
        "score": max(0, min(100, score)),
        "summary": {
            "nodes": len(nodes),
            "excitatoryNodes": excitatory,
            "inhibitoryNodes": inhibitory,
            "edges": len(edges),
            "delayedEdges": delayed_edges,
            "plasticEdges": plastic_edges,
            "regions": len(regions),
        },
        "warnings": warnings,
        "recommendedNextStep": _recommended_next_step(adapter),
        "environment": {
            "python": platform.python_version(),
            "packageDetected": adapter.package_detected,
            "executionImplemented": adapter.execution_implemented,
        },
    }


def _recommended_next_step(adapter: EngineAdapter) -> str:
    if adapter.id == "native":
        return "現在の実験を継続し、公開データとの比較指標を増やしてください。"
    if adapter.id == "brian2":
        return "requirements-brian2.txtでBrian2を導入し、動作確認後に現在モデルを直接計算してください。"
    if adapter.id == "nest":
        return "NESTを利用できるローカル／Linux計算環境を用意し、ニューロン数を段階的に増やしてください。"
    return "標準脳アトラスの接続行列と領域座標を用意し、19領域からより細かなパーセレーションへ移行してください。"


def export_manifest(
    engine_id: str,
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    regions: list[str],
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    adapter = get_adapter(engine_id)
    report = compatibility_report(engine_id, nodes, edges, regions, config)
    region_index = {region_id: index for index, region_id in enumerate(regions)}
    grouped_connections: dict[str, dict[str, float]] = {}
    for edge in edges:
        source_region = str(edge.get("sourceRegionId", ""))
        target_region = str(edge.get("targetRegionId", ""))
        if not source_region or not target_region:
            continue
        key = f"{source_region}>{target_region}"
        item = grouped_connections.setdefault(key, {"count": 0, "weightSum": 0.0, "delaySum": 0.0})
        item["count"] += 1
        item["weightSum"] += float(edge.get("weight", 0.0))
        item["delaySum"] += float(edge.get("delay", 0.0))

    region_connections = []
    for key, item in grouped_connections.items():
        source, target = key.split(">", 1)
        count = max(1, int(item["count"]))
        region_connections.append({
            "source": source,
            "target": target,
            "sourceIndex": region_index.get(source),
            "targetIndex": region_index.get(target),
            "edgeCount": count,
            "meanWeight": item["weightSum"] / count,
            "meanDelay": item["delaySum"] / count,
        })

    manifest = {
        "schema": "virtual-brain-adapter-manifest-v1",
        "version": "v015",
        "targetEngine": engine_id,
        "adapter": adapter.public_dict(),
        "compatibility": report,
        "network": {
            "regions": regions,
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
            "regionConnections": region_connections,
        },
        "config": config or {},
        "notes": [
            "この書き出しは変換準備用であり、外部エンジンでの科学的妥当性を保証しません。",
            "各エンジン固有の方程式、単位、時間刻み、可塑性則を別途定義してください。",
        ],
    }
    manifest["starterCode"] = starter_code(engine_id, manifest)
    return manifest


def starter_code(engine_id: str, manifest: dict[str, Any]) -> str:
    network = manifest["network"]
    if engine_id == "brian2":
        return f'''# v015 Brian2 translation starter\nfrom brian2 import *\n\nstart_scope()\ndefaultclock.dt = 0.1*ms\nN = {network["nodeCount"]}\neqs = """\ndv/dt = (-v) / (10*ms) : 1\n"""\nneurons = NeuronGroup(N, eqs, threshold="v > 1", reset="v = 0", refractory=2*ms, method="euler")\n# TODO: manifestのedge情報をSynapsesへ対応付ける\nrun(100*ms)\n'''
    if engine_id == "nest":
        return f'''# v015 NEST translation starter\nimport nest\n\nnest.ResetKernel()\nnodes = nest.Create("iaf_psc_alpha", {network["nodeCount"]})\n# TODO: manifestの接続をConnectへ対応付ける\nnest.Simulate(100.0)\n'''
    if engine_id == "tvb":
        return f'''# v015 TVB translation starter\n# pip install tvb-library\nfrom tvb.simulator.lab import connectivity, coupling, integrators, models, simulator\n\n# TODO: {len(network["regions"])}領域のweights / tract_lengths / centresをmanifestから構築\n# conn = connectivity.Connectivity(...)\n# sim = simulator.Simulator(model=models.ReducedWongWang(), connectivity=conn, ...)\n'''
    return '''# v015 native engine\n# 現在のアプリ／APIでそのまま実行できます。\n'''


def dumps_manifest(manifest: dict[str, Any]) -> str:
    return json.dumps(manifest, ensure_ascii=False, indent=2)
