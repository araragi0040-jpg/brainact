from __future__ import annotations

"""Brian2 execution bridge for Virtual Brain Lab v015.

The bridge intentionally uses Brian2's NumPy code generation target so that the
first integration works without a local C/C++ toolchain. It translates the
current conceptual network into a dimensionless leaky integrate-and-fire model
with heterogeneous membrane constants, delayed synapses, short-term plasticity,
and an optional STDP approximation.

This remains a conceptual mapping. It is not a validated biological model and
must not be used for diagnosis or treatment decisions.
"""

import importlib.util
import math
import time
from typing import Any


BRIAN2_ENGINE_ID = "brian2-lif-stdp-v1"


def package_available() -> bool:
    return importlib.util.find_spec("brian2") is not None


def package_version() -> str | None:
    if not package_available():
        return None
    try:
        import brian2 as b2

        return str(getattr(b2, "__version__", "unknown"))
    except Exception:
        return None


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def rng_uniform(state: int) -> tuple[int, float]:
    next_state = (1664525 * (state & 0xFFFFFFFF) + 1013904223) & 0xFFFFFFFF
    return next_state, next_state / 4294967296.0


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


def _request_dict(request: Any) -> dict[str, Any]:
    if hasattr(request, "model_dump"):
        return request.model_dump()
    if isinstance(request, dict):
        return dict(request)
    return dict(vars(request))


def _tau_from_leak(leak: float, dt_ms: float) -> float:
    leak = clamp(leak, 0.05, 0.999)
    return clamp(-dt_ms / math.log(leak), dt_ms * 1.1, 250.0)


def _tau_from_recovery(recovery: float, dt_ms: float, *, maximum: float = 2000.0) -> float:
    recovery = clamp(recovery, 0.0001, 0.95)
    return clamp(dt_ms / recovery, dt_ms * 1.1, maximum)


def self_test() -> dict[str, Any]:
    if not package_available():
        raise RuntimeError("Brian2パッケージがインストールされていません。")

    import brian2 as b2

    started = time.perf_counter()
    b2.start_scope()
    b2.prefs.codegen.target = "numpy"
    b2.defaultclock.dt = 1 * b2.ms
    group = b2.NeuronGroup(
        2,
        "dv/dt=(-v+input_current)/(5*ms):1\ninput_current:1",
        threshold="v>1",
        reset="v=0",
        method="euler",
    )
    group.v = [0.0, 0.0]
    group.input_current = [8.0, 0.0]
    syn = b2.Synapses(group, group, on_pre="v_post += 0.8")
    syn.connect(i=[0], j=[1])
    monitor = b2.SpikeMonitor(group)
    network = b2.Network(group, syn, monitor)
    network.run(6 * b2.ms)
    return {
        "status": "ok",
        "engineId": BRIAN2_ENGINE_ID,
        "packageVersion": str(getattr(b2, "__version__", "unknown")),
        "spikeCount": int(monitor.num_spikes),
        "elapsedMs": round((time.perf_counter() - started) * 1000.0, 3),
        "codegenTarget": "numpy",
    }


def simulate_brian2(request: Any) -> dict[str, Any]:
    if not package_available():
        raise RuntimeError("Brian2パッケージがインストールされていません。requirements-brian2.txtを使用してください。")

    import numpy as np
    import brian2 as b2

    payload = _request_dict(request)
    started = time.perf_counter()
    nodes = [dict(node) for node in payload.get("nodes", [])]
    edges = [dict(edge) for edge in payload.get("edges", [])]
    regions = [str(region_id) for region_id in payload.get("regions", [])]
    config = dict(payload.get("config") or {})
    interventions = normalize_interventions(list(payload.get("interventions") or []))
    route_stats = {key: dict(value) for key, value in (payload.get("route_stats") or {}).items()}
    stimulus_sequence = dict(payload.get("stimulus_sequence")) if payload.get("stimulus_sequence") else None

    if not nodes:
        raise ValueError("nodesが空です。")
    if not regions:
        raise ValueError("regionsが空です。")

    id_to_index = {int(node.get("id", index)): index for index, node in enumerate(nodes)}
    valid_edges: list[dict[str, Any]] = []
    for edge in edges:
        source_id = int(edge.get("source", -1))
        target_id = int(edge.get("target", -1))
        if source_id in id_to_index and target_id in id_to_index:
            valid_edges.append(edge)
    edges = valid_edges

    requested_steps = max(1, int(payload.get("steps", 1)))
    conceptual_dt = float(payload.get("dt", 0.01))
    dt_ms = clamp(float(config.get("brian2DtMs", 1.0)), 0.1, 5.0)
    noise_enabled = bool(config.get("noise", True))
    plasticity_enabled = bool(config.get("plasticity", True))
    short_term_enabled = bool(config.get("shortTermPlasticity", True))
    homeostasis_enabled = bool(config.get("homeostasis", True))
    threshold_scale = float(config.get("thresholdScale", 1.0))
    fatigue_strength = float(config.get("fatigueStrength", 0.45))
    inhibitory_gain = float(config.get("inhibitoryGain", 1.0))
    model_preset = str(config.get("modelPreset", "standard"))
    rng_state = int(payload.get("rng_state", 1)) & 0xFFFFFFFF
    current_step = int(payload.get("step", 0))
    sim_time = float(payload.get("sim_time", 0.0))
    total_spikes = int(payload.get("total_spikes", 0))
    peak_spikes = int(payload.get("peak_spikes", 0))

    b2.start_scope()
    b2.prefs.codegen.target = "numpy"
    b2.defaultclock.dt = dt_ms * b2.ms

    equations = """
    dv/dt = (-v + input_current - adaptation*fatigue_strength_local) / tau_mem : 1
    dadaptation/dt = -adaptation / tau_adaptation : 1
    dfatigue/dt = -fatigue / tau_fatigue : 1
    dref_timer/dt = -ref_decay : 1
    input_current : 1
    threshold_value : 1
    tau_mem : second
    tau_adaptation : second
    tau_fatigue : second
    ref_decay : Hz
    refractory_steps : 1
    adaptation_gain : 1
    fatigue_gain : 1
    fatigue_strength_local : 1
    blocked : 1
    """
    group = b2.NeuronGroup(
        len(nodes),
        equations,
        threshold="v >= threshold_value and ref_timer <= 0 and blocked < 0.5",
        reset="v = 0.05; ref_timer = refractory_steps; adaptation += adaptation_gain; fatigue += fatigue_gain",
        method="euler",
        name="vbl_neurons",
    )

    group.v = np.array([float(node.get("voltage", 0.0)) for node in nodes])
    group.adaptation = np.array([float(node.get("adaptation", 0.0)) for node in nodes])
    group.fatigue = np.array([float(node.get("fatigue", 0.0)) for node in nodes])
    group.ref_timer = np.array([max(0.0, float(node.get("refractory", 0.0))) for node in nodes])
    group.ref_decay = np.full(len(nodes), 1.0 / dt_ms) / b2.ms
    group.refractory_steps = np.array([max(1.0, float(node.get("refractoryBase", 2.0))) for node in nodes])
    group.tau_mem = np.array([_tau_from_leak(float(node.get("leak", 0.88)), dt_ms) for node in nodes]) * b2.ms
    group.tau_adaptation = np.array([
        _tau_from_recovery(float(node.get("adaptationRecovery", 0.055)), dt_ms, maximum=1000.0)
        for node in nodes
    ]) * b2.ms
    group.tau_fatigue = np.array([
        _tau_from_recovery(float(node.get("fatigueRecovery", 0.018)), dt_ms, maximum=2500.0)
        for node in nodes
    ]) * b2.ms
    group.adaptation_gain = np.array([float(node.get("adaptationGain", 0.018)) for node in nodes])
    group.fatigue_gain = np.array([float(node.get("fatigueGain", 0.025)) for node in nodes])
    group.fatigue_strength_local = np.full(len(nodes), fatigue_strength)
    group.blocked = np.zeros(len(nodes))
    group.input_current = np.zeros(len(nodes))
    group.threshold_value = np.ones(len(nodes))

    synapses = None
    if edges:
        synapse_model = """
        g : 1
        sign_value : 1
        inhibitory_scale : 1
        dresource/dt = (1-resource)/tau_resource : 1 (clock-driven)
        dfacilitation/dt = -facilitation/tau_facilitation : 1 (clock-driven)
        depression_rate : 1
        facilitation_rate : 1
        tau_resource : second
        tau_facilitation : second
        dApre/dt = -Apre/tau_stdp : 1 (event-driven)
        dApost/dt = -Apost/tau_stdp : 1 (event-driven)
        tau_stdp : second
        a_pre_increment : 1
        a_post_increment : 1
        plastic_enabled : 1
        g_min : 1
        g_max : 1
        """
        on_pre = """
        v_post += sign_value*g*resource*(1+facilitation)*inhibitory_scale*int(ref_timer_post <= 0)*int(blocked_post < 0.5)
        resource = clip(resource*(1-depression_rate), 0.05, 1.0)
        facilitation = clip(facilitation + facilitation_rate*(1-facilitation), 0, 0.8)
        Apre += a_pre_increment
        g = clip(g + plastic_enabled*Apost, g_min, g_max)
        """
        on_post = """
        Apost += a_post_increment
        g = clip(g + plastic_enabled*Apre, g_min, g_max)
        """
        synapses = b2.Synapses(
            group,
            group,
            model=synapse_model,
            on_pre=on_pre,
            on_post=on_post,
            method="euler",
            name="vbl_synapses",
        )
        sources = np.array([id_to_index[int(edge.get("source", -1))] for edge in edges], dtype=int)
        targets = np.array([id_to_index[int(edge.get("target", -1))] for edge in edges], dtype=int)
        synapses.connect(i=sources, j=targets)
        magnitudes = np.array([abs(float(edge.get("weight", 0.0))) for edge in edges])
        signs = np.array([-1.0 if float(edge.get("weight", 0.0)) < 0 else 1.0 for edge in edges])
        synapses.g = magnitudes
        synapses.sign_value = signs
        synapses.inhibitory_scale = np.where(signs < 0, inhibitory_gain, 1.0)
        synapses.resource = np.array([clamp(float(edge.get("resource", 1.0)), 0.05, 1.0) if short_term_enabled else 1.0 for edge in edges])
        synapses.facilitation = np.array([clamp(float(edge.get("facilitation", 0.0)), 0.0, 0.8) if short_term_enabled else 0.0 for edge in edges])
        synapses.depression_rate = np.array([clamp(float(edge.get("depressionRate", 0.12)), 0.0, 0.95) if short_term_enabled else 0.0 for edge in edges])
        synapses.facilitation_rate = np.array([clamp(float(edge.get("facilitationRate", 0.055)), 0.0, 0.95) if short_term_enabled else 0.0 for edge in edges])
        synapses.tau_resource = np.array([
            _tau_from_recovery(float(edge.get("resourceRecovery", 0.045)), dt_ms, maximum=3000.0)
            for edge in edges
        ]) * b2.ms
        synapses.tau_facilitation = np.array([
            _tau_from_recovery(float(edge.get("facilitationDecay", 0.14)), dt_ms, maximum=1500.0)
            for edge in edges
        ]) * b2.ms
        synapses.tau_stdp = np.full(len(edges), 20.0) * b2.ms
        learning_scale = 1.35 if model_preset == "learning" else 1.12 if model_preset == "hyper" else 1.0
        depression_scale = 0.82 if model_preset == "learning" else 1.0
        synapses.a_pre_increment = np.full(len(edges), 0.0058 * learning_scale)
        synapses.a_post_increment = np.full(len(edges), -0.0032 * depression_scale)
        synapses.plastic_enabled = np.full(len(edges), 1.0 if plasticity_enabled else 0.0)
        synapses.g_min = np.full(len(edges), 0.055)
        synapses.g_max = np.full(len(edges), 0.82)
        synapses.delay = np.array([max(1.0, float(edge.get("delay", 1.0))) * dt_ms for edge in edges]) * b2.ms

    spike_monitor = b2.SpikeMonitor(group, name="vbl_spikes")
    network_objects = [group, spike_monitor]
    if synapses is not None:
        network_objects.append(synapses)
    network = b2.Network(*network_objects)

    edge_index_by_source: dict[int, list[int]] = {}
    for edge_index, edge in enumerate(edges):
        edge.setdefault("queue", [])
        edge.setdefault("activity", 0.0)
        edge.setdefault("lastSignal", 0.0)
        edge_index_by_source.setdefault(int(edge.get("source", -1)), []).append(edge_index)

    frames: list[dict[str, Any]] = []
    previous_monitor_count = 0
    biological_time_ms = float(payload.get("engine_state", {}).get("biologicalTimeMs", current_step * dt_ms))

    for _ in range(requested_steps):
        for node in nodes:
            node["firedLast"] = bool(node.get("fired", False))
            node["fired"] = False
            node["externalInput"] = 0.0
            node["pulse"] = float(node.get("pulse", 0.0)) * 0.82

        stimulus_sequence, rng_state = process_stimulus(stimulus_sequence, nodes, rng_state)

        route_signals_this_step: dict[str, dict[str, Any]] = {}
        for edge in edges:
            edge["activity"] = float(edge.get("activity", 0.0)) * 0.84
            edge["lastSignal"] = float(edge.get("lastSignal", 0.0)) * 0.76
            next_queue: list[dict[str, Any]] = []
            for raw_signal in edge.get("queue") or []:
                signal = dict(raw_signal)
                signal["delay"] = int(signal.get("delay", 1)) - 1
                if signal["delay"] <= 0:
                    value = float(signal.get("value", 0.0))
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

        inputs = np.zeros(len(nodes), dtype=float)
        thresholds = np.zeros(len(nodes), dtype=float)
        blocked = np.zeros(len(nodes), dtype=float)
        for index, node in enumerate(nodes):
            region_id = str(node.get("regionId", ""))
            intervention = interventions.get(region_id)
            if noise_enabled:
                rng_state, gaussian_value = rng_gaussian(rng_state)
                noise = gaussian_value * 0.018
            else:
                noise = 0.0
            total_input = float(node.get("externalInput", 0.0)) + noise
            effective_threshold = float(node.get("baseThreshold", 1.0)) * threshold_scale * (
                1.0 + float(node.get("fatigue", 0.0)) * fatigue_strength * 0.72 + float(node.get("homeostaticOffset", 0.0))
            )
            if intervention and intervention.get("type") == "block":
                blocked[index] = 1.0
                total_input = 0.0
            elif intervention and intervention.get("type") == "suppress":
                strength = float(intervention.get("strength", 0.5))
                total_input *= max(0.04, 1.0 - strength * 0.86)
                effective_threshold *= 1.0 + strength * 0.48
            elif intervention and intervention.get("type") == "boost":
                strength = float(intervention.get("strength", 0.5))
                total_input += strength * 0.085
                effective_threshold *= max(0.72, 1.0 - strength * 0.16)

            tau_ms = float(group.tau_mem[index] / b2.ms)
            inputs[index] = total_input * max(1.0, tau_ms / dt_ms)
            thresholds[index] = effective_threshold

        group.input_current = inputs
        group.threshold_value = thresholds
        group.blocked = blocked
        network.run(dt_ms * b2.ms)
        biological_time_ms += dt_ms

        monitor_count = len(spike_monitor.i)
        fired_indices = [int(index) for index in spike_monitor.i[previous_monitor_count:monitor_count]]
        previous_monitor_count = monitor_count
        fired_set = set(fired_indices)

        group_v = np.asarray(group.v[:], dtype=float)
        group_adaptation = np.asarray(group.adaptation[:], dtype=float)
        group_fatigue = np.asarray(group.fatigue[:], dtype=float)
        group_ref = np.maximum(0.0, np.asarray(group.ref_timer[:], dtype=float))

        spikes_this_step = len(fired_indices)
        region_counts = {region_id: 0 for region_id in regions}
        region_excitatory_counts = {region_id: 0 for region_id in regions}
        region_inhibitory_counts = {region_id: 0 for region_id in regions}
        hemisphere_counts = {f"{region_id}:left": 0 for region_id in regions}
        hemisphere_counts.update({f"{region_id}:right": 0 for region_id in regions})

        for index, node in enumerate(nodes):
            fired = index in fired_set
            node["voltage"] = float(group_v[index])
            node["adaptation"] = max(0.0, float(group_adaptation[index]))
            node["fatigue"] = max(0.0, float(group_fatigue[index]))
            node["refractory"] = int(math.ceil(float(group_ref[index])))
            node["fired"] = fired
            if fired:
                node["spikeCount"] = int(node.get("spikeCount", 0)) + 1
                node["pulse"] = 1.0
                region_id = str(node.get("regionId", ""))
                if region_id in region_counts:
                    region_counts[region_id] += 1
                    if node.get("type") == "inhibitory":
                        region_inhibitory_counts[region_id] += 1
                    else:
                        region_excitatory_counts[region_id] += 1
                    hemisphere_key = f"{region_id}:{node.get('hemisphere', 'left')}"
                    hemisphere_counts[hemisphere_key] = hemisphere_counts.get(hemisphere_key, 0) + 1
            node["firingEma"] = float(node.get("firingEma", 0.0)) * 0.975 + (1.0 if fired else 0.0) * 0.025
            if homeostasis_enabled:
                error = float(node["firingEma"]) - float(node.get("homeostaticTarget", 0.045))
                node["homeostaticOffset"] = clamp(float(node.get("homeostaticOffset", 0.0)) + error * 0.0018, -0.16, 0.28)
            else:
                node["homeostaticOffset"] = float(node.get("homeostaticOffset", 0.0)) * 0.998

        if synapses is not None:
            syn_g = np.asarray(synapses.g[:], dtype=float)
            syn_resource = np.asarray(synapses.resource[:], dtype=float)
            syn_facilitation = np.asarray(synapses.facilitation[:], dtype=float)
            for edge_index, edge in enumerate(edges):
                sign = -1.0 if float(edge.get("weight", 0.0)) < 0 else 1.0
                edge["weight"] = sign * float(syn_g[edge_index])
                edge["resource"] = float(syn_resource[edge_index]) if short_term_enabled else float(edge.get("resource", 1.0))
                edge["facilitation"] = float(syn_facilitation[edge_index]) if short_term_enabled else float(edge.get("facilitation", 0.0))

        for fired_index in fired_indices:
            node_id = int(nodes[fired_index].get("id", fired_index))
            for edge_index in edge_index_by_source.get(node_id, []):
                edge = edges[edge_index]
                signal_value = float(edge.get("weight", 0.0))
                if signal_value < 0:
                    signal_value *= inhibitory_gain
                if short_term_enabled:
                    signal_value *= clamp(float(edge.get("resource", 1.0)) * (1.0 + float(edge.get("facilitation", 0.0))), 0.08, 1.65)
                edge.setdefault("queue", []).append({"delay": int(max(1, edge.get("delay", 1))), "value": signal_value})
                edge["activity"] = min(1.0, float(edge.get("activity", 0.0)) + abs(signal_value))
                edge["lastSignal"] = 1 if signal_value >= 0 else -1

        current_step += 1
        sim_time = current_step * conceptual_dt
        total_spikes += spikes_this_step
        peak_spikes = max(peak_spikes, spikes_this_step)

        grouped_edge_activity: dict[str, list[float]] = {}
        grouped_synapse_change: dict[str, list[float]] = {}
        for edge in edges:
            route_key = f"{edge.get('sourceRegionId')}>{edge.get('targetRegionId')}"
            grouped_edge_activity.setdefault(route_key, []).append(float(edge.get("activity", 0.0)))
            grouped_synapse_change.setdefault(route_key, []).append(abs(float(edge.get("weight", 0.0))) - abs(float(edge.get("baseWeight", edge.get("weight", 0.0)))))

        frames.append({
            "step": current_step,
            "simTime": sim_time,
            "biologicalTimeMs": round(biological_time_ms, 4),
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
            "meanWeightChange": round(mean([
                abs(float(edge.get("weight", 0.0))) - abs(float(edge.get("baseWeight", 0.0)))
                for edge in edges
            ]), 6),
        })

    elapsed_ms = (time.perf_counter() - started) * 1000.0
    return {
        "version": "v015",
        "engine": BRIAN2_ENGINE_ID,
        "engineId": "brian2",
        "engineDetails": {
            "package": "brian2",
            "packageVersion": str(getattr(b2, "__version__", "unknown")),
            "codegenTarget": "numpy",
            "model": "dimensionless LIF + delayed synapses + STP + optional STDP",
            "biologicalTimeMs": round(biological_time_ms, 4),
            "dtMs": dt_ms,
            "statePersistence": "request-payload",
        },
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
        "engineState": {"biologicalTimeMs": round(biological_time_ms, 4)},
        "frames": frames,
    }
