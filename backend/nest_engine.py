from __future__ import annotations

"""Optional PyNEST execution bridge for Virtual Brain Lab.

The adapter uses NEST's point-neuron kernel when the ``nest`` module is
available. Because NEST owns internal synaptic currents, only membrane voltage,
spike counters, and the conceptual experiment state are serialized between API
requests. This is an initial bridge, not a validated biological model.
"""

import importlib.util
import math
import time
from typing import Any

NEST_ENGINE_ID = 'nest-iaf-psc-alpha-v1'


def package_available() -> bool:
    return importlib.util.find_spec('nest') is not None


def package_version() -> str | None:
    if not package_available():
        return None
    try:
        import nest
        info = getattr(nest, 'build_info', {})
        if isinstance(info, dict):
            return str(info.get('version', 'unknown'))
        return str(getattr(nest, '__version__', 'unknown'))
    except Exception:
        return None


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _request_dict(request: Any) -> dict[str, Any]:
    if hasattr(request, 'model_dump'):
        return request.model_dump()
    return dict(request) if isinstance(request, dict) else dict(vars(request))


def _events(recorder: Any) -> dict[str, Any]:
    try:
        value = recorder.events
        return dict(value)
    except Exception:
        import nest
        data = nest.GetStatus(recorder, 'events')
        return dict(data[0] if isinstance(data, (list, tuple)) else data)


def self_test() -> dict[str, Any]:
    if not package_available():
        raise RuntimeError('NEST Simulatorがインストールされていません。')
    import nest
    started = time.perf_counter()
    nest.ResetKernel()
    try:
        nest.resolution = 0.1
    except Exception:
        nest.SetKernelStatus({'resolution': 0.1})
    neurons = nest.Create('iaf_psc_alpha', 2, params={'I_e': 420.0})
    recorder = nest.Create('spike_recorder')
    nest.Connect(neurons, recorder)
    nest.Simulate(20.0)
    events = _events(recorder)
    return {
        'status': 'ok', 'engineId': NEST_ENGINE_ID,
        'packageVersion': package_version(),
        'spikeCount': len(events.get('senders', [])),
        'elapsedMs': round((time.perf_counter() - started) * 1000.0, 3),
        'model': 'iaf_psc_alpha',
    }


def simulate_nest(request: Any) -> dict[str, Any]:
    if not package_available():
        raise RuntimeError('NEST Simulatorが未導入です。requirements-nest.txtまたはNEST公式環境を使用してください。')
    import nest

    payload = _request_dict(request)
    started = time.perf_counter()
    nodes = [dict(item) for item in payload.get('nodes', [])]
    edges = [dict(item) for item in payload.get('edges', [])]
    regions = [str(item) for item in payload.get('regions', [])]
    config = dict(payload.get('config') or {})
    steps = max(1, int(payload.get('steps', 1)))
    conceptual_dt = float(payload.get('dt', 0.02))
    dt_ms = clamp(float(config.get('nestDtMs', 1.0)), 0.1, 5.0)
    current_step = int(payload.get('step', 0))
    sim_time = float(payload.get('sim_time', 0.0))
    total_spikes = int(payload.get('total_spikes', 0))
    peak_spikes = int(payload.get('peak_spikes', 0))
    stimulus = dict(payload.get('stimulus_sequence')) if payload.get('stimulus_sequence') else None
    interventions = {str(item.get('regionId')): item for item in (payload.get('interventions') or []) if item.get('regionId')}

    if not nodes or not regions:
        raise ValueError('nodesとregionsが必要です。')

    nest.ResetKernel()
    try:
        nest.resolution = dt_ms
    except Exception:
        nest.SetKernelStatus({'resolution': dt_ms})
    try:
        nest.SetKernelStatus({'rng_seed': int(payload.get('rng_state', 1)) % 2147483646 + 1})
    except Exception:
        pass

    collection = nest.Create('iaf_psc_alpha', len(nodes))
    node_params = []
    for node in nodes:
        threshold = -70.0 + 20.0 * float(node.get('baseThreshold', 1.0)) * float(config.get('thresholdScale', 1.0))
        node_params.append({
            'V_m': clamp(-70.0 + 20.0 * float(node.get('voltage', 0.0)), -75.0, -40.0),
            'E_L': -70.0,
            'V_reset': -68.0,
            'V_th': clamp(threshold, -60.0, -42.0),
            'tau_m': clamp(10.0 + (1.0 - float(node.get('leak', 0.88))) * 80.0, 5.0, 50.0),
            't_ref': max(dt_ms, float(node.get('refractoryBase', 2.0)) * dt_ms),
            'I_e': 0.0,
        })
    nest.SetStatus(collection, node_params)

    ids = list(collection.tolist() if hasattr(collection, 'tolist') else collection)
    id_to_index = {int(node.get('id', index)): index for index, node in enumerate(nodes)}
    gid_to_index = {int(gid): index for index, gid in enumerate(ids)}
    for edge in edges:
        source_index = id_to_index.get(int(edge.get('source', -1)))
        target_index = id_to_index.get(int(edge.get('target', -1)))
        if source_index is None or target_index is None:
            continue
        weight = float(edge.get('weight', 0.0)) * 70.0
        delay = max(dt_ms, float(edge.get('delay', 1.0)) * dt_ms)
        nest.Connect(collection[source_index:source_index + 1], collection[target_index:target_index + 1], syn_spec={'weight': weight, 'delay': delay})

    recorder = nest.Create('spike_recorder')
    nest.Connect(collection, recorder)
    previous_events = 0
    frames: list[dict[str, Any]] = []

    for _ in range(steps):
        active_regions: set[str] = set()
        strength = 0.0
        if stimulus and stimulus.get('phase', 'active') == 'active':
            active_regions = set(stimulus.get('regions') or [])
            strength = float(stimulus.get('strength', 1.0))
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

        currents = []
        for node in nodes:
            current = 0.0
            if str(node.get('regionId')) in active_regions:
                current += strength * 480.0
            intervention = interventions.get(str(node.get('regionId')))
            if intervention and intervention.get('type') == 'block':
                current = -1200.0
            elif intervention and intervention.get('type') == 'suppress':
                current -= float(intervention.get('strength', .5)) * 450.0
            elif intervention and intervention.get('type') == 'boost':
                current += float(intervention.get('strength', .5)) * 240.0
            currents.append({'I_e': current})
        nest.SetStatus(collection, currents)
        nest.Simulate(dt_ms)
        events = _events(recorder)
        senders = list(events.get('senders', []))
        new_senders = senders[previous_events:]
        previous_events = len(senders)
        fired_indices = [gid_to_index.get(int(sender), -1) for sender in new_senders]
        fired_indices = [index for index in fired_indices if index >= 0]
        fired_set = set(fired_indices)
        potentials = list(nest.GetStatus(collection, 'V_m'))
        region_counts = {region: 0 for region in regions}
        region_exc = {region: 0 for region in regions}
        region_inh = {region: 0 for region in regions}
        hemisphere_counts = {f'{region}:left': 0 for region in regions} | {f'{region}:right': 0 for region in regions}
        for index, node in enumerate(nodes):
            fired = index in fired_set
            node['firedLast'] = bool(node.get('fired', False)); node['fired'] = fired
            node['voltage'] = clamp((float(potentials[index]) + 70.0) / 20.0, -0.25, 1.5)
            node['pulse'] = 1.0 if fired else float(node.get('pulse', 0.0)) * .82
            if fired:
                node['spikeCount'] = int(node.get('spikeCount', 0)) + 1
                region = str(node.get('regionId'))
                region_counts[region] = region_counts.get(region, 0) + 1
                (region_inh if node.get('type') == 'inhibitory' else region_exc)[region] = (region_inh if node.get('type') == 'inhibitory' else region_exc).get(region, 0) + 1
                key = f"{region}:{node.get('hemisphere', 'left')}"; hemisphere_counts[key] = hemisphere_counts.get(key, 0) + 1
        spikes = len(fired_indices)
        current_step += 1; sim_time = current_step * conceptual_dt; total_spikes += spikes; peak_spikes = max(peak_spikes, spikes)
        frames.append({'step': current_step, 'simTime': sim_time, 'biologicalTimeMs': current_step * dt_ms, 'spikesThisStep': spikes, 'regionCounts': region_counts, 'regionExcitatoryCounts': region_exc, 'regionInhibitoryCounts': region_inh, 'hemisphereCounts': hemisphere_counts, 'routeSignals': {}, 'edgeActivity': {}, 'synapseChange': {}, 'meanWeightChange': 0.0})

    return {
        'version': str(payload.get('version', 'v021')), 'engine': NEST_ENGINE_ID, 'engineId': 'nest',
        'engineDetails': {'package': 'nest-simulator', 'packageVersion': package_version(), 'model': 'iaf_psc_alpha', 'dtMs': dt_ms, 'plasticity': 'fixed synapses in v021', 'statePersistence': 'V_m and conceptual counters'},
        'elapsedMs': round((time.perf_counter() - started) * 1000.0, 3), 'rngState': int(payload.get('rng_state', 1)),
        'step': current_step, 'simTime': sim_time, 'totalSpikes': total_spikes, 'peakSpikes': peak_spikes,
        'nodes': nodes, 'edges': edges, 'stimulusSequence': stimulus, 'routeStats': payload.get('route_stats') or {},
        'engineState': {'biologicalTimeMs': current_step * dt_ms}, 'frames': frames,
    }
