from __future__ import annotations

"""Cross-engine benchmark helpers with unit-aware comparisons.

Point-neuron engines report literal spike events. Region-level neural-mass
engines report continuous activity mapped to display values. The two are kept
separate so a numerical match is not presented as scientific equivalence.
"""

import math
from typing import Any


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def output_kind(result: dict[str, Any]) -> str:
    details = result.get('engineDetails') or {}
    raw = str(details.get('outputMeaning') or '').lower()
    if 'mixed' in raw: return 'mixed'
    if 'activity' in raw or details.get('scale') == 'region-level': return 'activity-equivalent'
    return 'literal-spikes'


def output_label(kind: str) -> str:
    return {'literal-spikes':'発火イベント','activity-equivalent':'活動相当値','mixed':'混合出力'}.get(kind,'出力値')


def _region_totals(result: dict[str, Any], regions: list[str]) -> dict[str, float]:
    totals = {region: 0.0 for region in regions}
    for frame in result.get('frames') or []:
        for region, value in (frame.get('regionCounts') or {}).items():
            totals[str(region)] = totals.get(str(region), 0.0) + float(value or 0)
    return totals


def summarize_result(engine_id: str, result: dict[str, Any], regions: list[str]) -> dict[str, Any]:
    frames = result.get('frames') or []
    series = [float(frame.get('spikesThisStep', 0)) for frame in frames]
    kind = output_kind(result)
    total = float(result.get('totalSpikes', sum(series)))
    peak = float(result.get('peakSpikes', max(series, default=0)))
    return {
        'engineId': engine_id, 'status': 'ok', 'engine': result.get('engine'),
        'elapsedMs': float(result.get('elapsedMs', 0.0)), 'steps': len(frames),
        'totalSpikes': total, 'peakSpikes': peak, 'totalOutput': total, 'peakOutput': peak,
        'meanSpikesPerStep': round(mean(series), 6), 'meanOutputPerStep': round(mean(series), 6),
        'spikeSeries': series, 'outputSeries': series, 'regionTotals': _region_totals(result, regions),
        'meanWeightChange': float((frames[-1] if frames else {}).get('meanWeightChange', 0.0)),
        'engineDetails': result.get('engineDetails') or {}, 'outputKind': kind, 'outputLabel': output_label(kind),
    }


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b: return 0.0
    dot = sum(x*y for x,y in zip(a,b)); na=math.sqrt(sum(x*x for x in a)); nb=math.sqrt(sum(y*y for y in b))
    if na == 0 and nb == 0: return 1.0
    if na == 0 or nb == 0: return 0.0
    return max(-1.0,min(1.0,dot/(na*nb)))


def pairwise_comparison(a: dict[str, Any], b: dict[str, Any], regions: list[str]) -> dict[str, Any]:
    ak, bk = a.get('outputKind'), b.get('outputKind')
    comparable = ak == bk and ak != 'mixed'
    a_series=list(a.get('outputSeries') or []); b_series=list(b.get('outputSeries') or []); length=min(len(a_series),len(b_series))
    series_mae=mean([abs(a_series[i]-b_series[i]) for i in range(length)]) if length else 0.0
    scale=max(1.0,mean([max(a_series[i],b_series[i]) for i in range(length)])) if length else 1.0
    temporal=max(0.0,1.0-series_mae/scale) if length else 0.0
    ar=[float((a.get('regionTotals') or {}).get(r,0)) for r in regions]; br=[float((b.get('regionTotals') or {}).get(r,0)) for r in regions]
    region_mae=mean([abs(x-y) for x,y in zip(ar,br)]); region_similarity=max(0.0,_cosine_similarity(ar,br))
    ta=float(a.get('totalOutput',0)); tb=float(b.get('totalOutput',0)); total_agreement=1.0-abs(ta-tb)/max(1.0,ta,tb)
    composite=100.0*(.35*total_agreement+.35*temporal+.30*region_similarity) if comparable else None
    return {
        'engineA':a.get('engineId'),'engineB':b.get('engineId'),'outputKindA':ak,'outputKindB':bk,'comparable':comparable,
        'comparisonNote':'同じ出力単位のため数値比較できます。' if comparable else '出力単位が異なるため、一致度は算出せず実行フローのみ比較します。',
        'totalSpikeDelta':tb-ta,'peakSpikeDelta':float(b.get('peakOutput',0))-float(a.get('peakOutput',0)),
        'seriesMAE':round(series_mae,6),'regionMAE':round(region_mae,6),'temporalAgreement':round(temporal*100,3),
        'regionPatternSimilarity':round(region_similarity*100,3),'compositeAgreement':round(composite,3) if composite is not None else None,
        'elapsedRatioBtoA':round(float(b.get('elapsedMs',0))/max(.001,float(a.get('elapsedMs',0))),4),
    }


def build_comparison(results: list[dict[str, Any]], regions: list[str]) -> dict[str, Any]:
    ok=[x for x in results if x.get('status')=='ok']; pairs=[]
    for i,a in enumerate(ok):
        for b in ok[i+1:]: pairs.append(pairwise_comparison(a,b,regions))
    return {'results':results,'pairs':pairs,'availableCount':len(ok),'requestedCount':len(results),
            'warning':'発火イベントと領域活動相当値は別単位です。異なる単位間の一致度は算出しません。'}
