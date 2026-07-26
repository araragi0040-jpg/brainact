from __future__ import annotations

"""Optional The Virtual Brain whole-brain bridge.

This adapter aggregates the current point-neuron network into a region-level
connectivity matrix and runs TVB's Generic2dOscillator when ``tvb-library`` is
installed. Continuous regional activity is mapped back to the existing UI as
an activity-equivalent count; it must not be interpreted as literal spikes.
"""

import importlib.util
import time
from typing import Any

TVB_ENGINE_ID = 'tvb-generic2d-region-v1'


def package_available() -> bool:
    try:
        return importlib.util.find_spec('tvb') is not None and importlib.util.find_spec('tvb.simulator') is not None
    except (ModuleNotFoundError, ValueError):
        return False


def package_version() -> str | None:
    if not package_available(): return None
    try:
        import tvb
        return str(getattr(tvb, '__version__', 'unknown'))
    except Exception: return None


def _request_dict(request: Any) -> dict[str, Any]:
    if hasattr(request, 'model_dump'): return request.model_dump()
    return dict(request) if isinstance(request, dict) else dict(vars(request))


def _connectivity(nodes: list[dict[str, Any]], edges: list[dict[str, Any]], regions: list[str]):
    import numpy as np
    index = {region: i for i, region in enumerate(regions)}
    weights = np.zeros((len(regions), len(regions)), dtype=float)
    counts = np.zeros_like(weights)
    delays = np.ones_like(weights)
    for edge in edges:
        source = str(edge.get('sourceRegionId', '')); target = str(edge.get('targetRegionId', ''))
        if source not in index or target not in index: continue
        i, j = index[source], index[target]
        # TVB structural weights are non-negative. Point-neuron signs describe local influence; structural tract magnitude is aggregated by absolute weight.
        value = abs(float(edge.get('weight', 0.0)))
        weights[i, j] += value
        counts[i, j] += 1.0
        delays[i, j] += max(0.1, float(edge.get('delay', 1.0)))
    mask = counts > 0
    weights[mask] = weights[mask] / counts[mask]
    weights = np.clip(weights, 0.0, None)
    maximum_weight = float(weights.max()) if weights.size else 0.0
    if maximum_weight > 0: weights /= maximum_weight
    tract_lengths = np.where(mask, delays / np.maximum(counts, 1.0) * 4.0, 0.0)
    centres = np.zeros((len(regions), 3), dtype=float)
    grouped: dict[str, list[dict[str, Any]]] = {region: [] for region in regions}
    for node in nodes: grouped.setdefault(str(node.get('regionId')), []).append(node)
    for region, items in grouped.items():
        if region not in index or not items: continue
        centres[index[region]] = [sum(float(item.get(axis, 0.0)) for item in items) / len(items) for axis in ('x3d', 'y3d', 'z3d')]
    return weights, tract_lengths, centres


def self_test() -> dict[str, Any]:
    if not package_available(): raise RuntimeError('tvb-libraryがインストールされていません。')
    import numpy as np
    from tvb.simulator.lab import connectivity, coupling, integrators, models, monitors, simulator
    started = time.perf_counter()
    conn = connectivity.Connectivity(weights=np.array([[0., .2], [.15, 0.]]), tract_lengths=np.array([[0., 10.], [10., 0.]]), centres=np.array([[-1.,0.,0.],[1.,0.,0.]]), region_labels=np.array(['A','B']))
    conn.speed = np.array([4.0]); conn.configure()
    sim = simulator.Simulator(model=models.Generic2dOscillator(), connectivity=conn, coupling=coupling.Linear(a=np.array([0.012])), integrator=integrators.HeunDeterministic(dt=0.1), monitors=(monitors.Raw(period=0.1),))
    sim.configure(); output = sim.run(simulation_length=1.0)
    points = int(sum(len(times) for times, _ in output))
    return {'status':'ok','engineId':TVB_ENGINE_ID,'packageVersion':package_version(),'samplePoints':points,'elapsedMs':round((time.perf_counter()-started)*1000,3),'model':'Generic2dOscillator'}


def simulate_tvb(request: Any) -> dict[str, Any]:
    if not package_available(): raise RuntimeError('tvb-libraryが未導入です。requirements-tvb.txtを使用してください。')
    import numpy as np
    from tvb.simulator.lab import connectivity, coupling, integrators, models, monitors, simulator

    payload = _request_dict(request); started = time.perf_counter()
    nodes = [dict(item) for item in payload.get('nodes', [])]; edges = [dict(item) for item in payload.get('edges', [])]; regions = [str(item) for item in payload.get('regions', [])]
    if not regions: raise ValueError('regionsが空です。')
    steps = max(1, int(payload.get('steps', 1))); config = dict(payload.get('config') or {})
    dt_ms = max(0.05, min(2.0, float(config.get('tvbDtMs', .25))))
    weights, tract_lengths, centres = _connectivity(nodes, edges, regions)
    conn = connectivity.Connectivity(weights=weights, tract_lengths=tract_lengths, centres=centres, region_labels=np.asarray(regions, dtype='U64'))
    conn.speed = np.array([float(config.get('tvbSpeed', 4.0))]); conn.configure()
    model = models.Generic2dOscillator()
    sim = simulator.Simulator(model=model, connectivity=conn, coupling=coupling.Linear(a=np.array([float(config.get('tvbCoupling', .012))])), integrator=integrators.HeunDeterministic(dt=dt_ms), monitors=(monitors.Raw(period=dt_ms),))
    sim.configure(); outputs = sim.run(simulation_length=steps * dt_ms)
    if not outputs: raise RuntimeError('TVBから時系列が返されませんでした。')
    _, raw = outputs[0]
    # raw: time x state-variable x region x mode
    activity = np.asarray(raw)[:, 0, :, 0]
    if activity.shape[0] < steps:
        activity = np.pad(activity, ((0, steps-activity.shape[0]),(0,0)), mode='edge')
    activity = activity[-steps:]
    min_v = activity.min(axis=1, keepdims=True); span = np.maximum(activity.max(axis=1, keepdims=True)-min_v, 1e-9)
    normalized = (activity-min_v)/span
    stimulus = dict(payload.get('stimulus_sequence')) if payload.get('stimulus_sequence') else None
    interventions = {str(item.get('regionId')): item for item in (payload.get('interventions') or []) if item.get('regionId')}
    counts_per_region = {region: sum(1 for node in nodes if str(node.get('regionId')) == region) for region in regions}
    current_step = int(payload.get('step', 0)); sim_time = float(payload.get('sim_time',0)); total = int(payload.get('total_spikes',0)); peak = int(payload.get('peak_spikes',0)); frames=[]
    for raw_row in normalized:
        row = np.asarray(raw_row, dtype=float).copy()
        if stimulus and stimulus.get('phase', 'active') == 'active':
            for region in stimulus.get('regions') or []:
                if region in regions:
                    row[regions.index(region)] += float(stimulus.get('strength', 1.0)) * 0.22
            stimulus['remaining'] = int(stimulus.get('remaining', stimulus.get('duration', 1))) - 1
            if stimulus['remaining'] <= 0:
                if int(stimulus.get('currentRepeat', 1)) >= int(stimulus.get('repeats', 1)):
                    stimulus = None
                else:
                    stimulus['phase'] = 'waiting'; stimulus['waitRemaining'] = int(stimulus.get('interval', 1))
        elif stimulus:
            stimulus['waitRemaining'] = int(stimulus.get('waitRemaining', 1)) - 1
            if stimulus['waitRemaining'] <= 0:
                stimulus['phase'] = 'active'; stimulus['currentRepeat'] = int(stimulus.get('currentRepeat', 1)) + 1; stimulus['remaining'] = int(stimulus.get('duration', 1))
        for region, intervention in interventions.items():
            if region not in regions: continue
            index = regions.index(region); strength = float(intervention.get('strength', .5))
            if intervention.get('type') == 'block': row[index] = 0.0
            elif intervention.get('type') == 'suppress': row[index] *= max(0.02, 1.0 - strength * .86)
            elif intervention.get('type') == 'boost': row[index] += strength * .20
        row = np.clip(row, 0.0, 1.0)
        region_counts={region:int(round(float(row[i])*max(1,counts_per_region.get(region,1))*.55)) for i,region in enumerate(regions)}
        spikes=sum(region_counts.values()); total+=spikes; peak=max(peak,spikes); current_step+=1; sim_time=current_step*float(payload.get('dt',.02))
        frames.append({'step':current_step,'simTime':sim_time,'biologicalTimeMs':current_step*dt_ms,'spikesThisStep':spikes,'activityEquivalent':True,'regionCounts':region_counts,'regionExcitatoryCounts':region_counts,'regionInhibitoryCounts':{r:0 for r in regions},'hemisphereCounts':{f'{r}:left':region_counts[r]//2 for r in regions}|{f'{r}:right':region_counts[r]-region_counts[r]//2 for r in regions},'routeSignals':{},'edgeActivity':{},'synapseChange':{},'meanWeightChange':0.0})
    final=row
    for node in nodes:
        idx=regions.index(str(node.get('regionId'))) if str(node.get('regionId')) in regions else 0
        node['voltage']=float(final[idx]); node['pulse']=float(final[idx]); node['fired']=bool(final[idx]>.72)
    return {'version':str(payload.get('version','v021')),'engine':TVB_ENGINE_ID,'engineId':'tvb','engineDetails':{'package':'tvb-library','packageVersion':package_version(),'model':'Generic2dOscillator','scale':'region-level','outputMeaning':'activity-equivalent, not literal spikes','dtMs':dt_ms},'elapsedMs':round((time.perf_counter()-started)*1000,3),'rngState':int(payload.get('rng_state',1)),'step':current_step,'simTime':sim_time,'totalSpikes':total,'peakSpikes':peak,'nodes':nodes,'edges':edges,'stimulusSequence':stimulus,'routeStats':payload.get('route_stats') or {},'engineState':{'biologicalTimeMs':current_step*dt_ms},'frames':frames}
