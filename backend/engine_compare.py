from __future__ import annotations

"""Cross-engine benchmark helpers.

The comparison deliberately reports several independent metrics instead of a
single scientific accuracy score. Different engines use different numerical
models, therefore matching spike counts alone is not evidence of biological
validity.
"""

import math
from typing import Any


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _region_totals(result: dict[str, Any], regions: list[str]) -> dict[str, int]:
    totals = {region: 0 for region in regions}
    for frame in result.get('frames') or []:
        for region, value in (frame.get('regionCounts') or {}).items():
            totals[str(region)] = totals.get(str(region), 0) + int(value or 0)
    return totals


def summarize_result(engine_id: str, result: dict[str, Any], regions: list[str]) -> dict[str, Any]:
    frames = result.get('frames') or []
    series = [int(frame.get('spikesThisStep', 0)) for frame in frames]
    region_totals = _region_totals(result, regions)
    final_frame = frames[-1] if frames else {}
    return {
        'engineId': engine_id,
        'status': 'ok',
        'engine': result.get('engine'),
        'elapsedMs': float(result.get('elapsedMs', 0.0)),
        'steps': len(frames),
        'totalSpikes': int(result.get('totalSpikes', sum(series))),
        'peakSpikes': int(result.get('peakSpikes', max(series, default=0))),
        'meanSpikesPerStep': round(mean(series), 6),
        'spikeSeries': series,
        'regionTotals': region_totals,
        'meanWeightChange': float(final_frame.get('meanWeightChange', 0.0)),
        'engineDetails': result.get('engineDetails') or {},
    }


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 and norm_b == 0:
        return 1.0
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return max(-1.0, min(1.0, dot / (norm_a * norm_b)))


def pairwise_comparison(a: dict[str, Any], b: dict[str, Any], regions: list[str]) -> dict[str, Any]:
    a_series = list(a.get('spikeSeries') or [])
    b_series = list(b.get('spikeSeries') or [])
    length = min(len(a_series), len(b_series))
    if length:
        series_mae = mean([abs(a_series[i] - b_series[i]) for i in range(length)])
        series_scale = max(1.0, mean([max(a_series[i], b_series[i]) for i in range(length)]))
        temporal_agreement = max(0.0, 1.0 - series_mae / series_scale)
    else:
        series_mae = 0.0
        temporal_agreement = 0.0

    a_regions = [float((a.get('regionTotals') or {}).get(region, 0)) for region in regions]
    b_regions = [float((b.get('regionTotals') or {}).get(region, 0)) for region in regions]
    region_mae = mean([abs(x - y) for x, y in zip(a_regions, b_regions)])
    region_similarity = max(0.0, _cosine_similarity(a_regions, b_regions))
    total_a = int(a.get('totalSpikes', 0))
    total_b = int(b.get('totalSpikes', 0))
    total_agreement = 1.0 - abs(total_a - total_b) / max(1, total_a, total_b)
    composite = 100.0 * (0.35 * total_agreement + 0.35 * temporal_agreement + 0.30 * region_similarity)
    return {
        'engineA': a.get('engineId'),
        'engineB': b.get('engineId'),
        'totalSpikeDelta': total_b - total_a,
        'peakSpikeDelta': int(b.get('peakSpikes', 0)) - int(a.get('peakSpikes', 0)),
        'seriesMAE': round(series_mae, 6),
        'regionMAE': round(region_mae, 6),
        'temporalAgreement': round(temporal_agreement * 100.0, 3),
        'regionPatternSimilarity': round(region_similarity * 100.0, 3),
        'compositeAgreement': round(max(0.0, min(100.0, composite)), 3),
        'elapsedRatioBtoA': round(float(b.get('elapsedMs', 0.0)) / max(0.001, float(a.get('elapsedMs', 0.0))), 4),
    }


def build_comparison(results: list[dict[str, Any]], regions: list[str]) -> dict[str, Any]:
    successful = [item for item in results if item.get('status') == 'ok']
    pairs: list[dict[str, Any]] = []
    for index, first in enumerate(successful):
        for second in successful[index + 1:]:
            pairs.append(pairwise_comparison(first, second, regions))
    return {
        'results': results,
        'pairs': pairs,
        'availableCount': len(successful),
        'requestedCount': len(results),
        'warning': '一致度は各計算モデル間の数値的な近さです。人間の脳に対する正確さを示す指標ではありません。',
    }
