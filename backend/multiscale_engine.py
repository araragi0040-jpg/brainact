from __future__ import annotations

"""Hybrid whole-brain / local-circuit conceptual solver.

All regions are evolved as a lightweight regional mass network. A selected
focus region is simultaneously resolved as individual point neurons. Activity
is exchanged in both directions at each step. This is a conceptual coupling
layer, not a biologically validated co-simulation standard.
"""

import math
import time
from typing import Any

ENGINE_ID = 'multiscale-hybrid-v1'


def _payload(request: Any) -> dict[str, Any]:
    if hasattr(request, 'model_dump'): return request.model_dump()
    return dict(request) if isinstance(request, dict) else dict(vars(request))


def _clamp(v: float, lo: float=0.0, hi: float=1.0) -> float: return max(lo,min(hi,v))


def self_test() -> dict[str, Any]:
    return {'status':'ok','engineId':ENGINE_ID,'message':'内蔵マルチスケール結合は利用可能です。','scale':'whole-brain + local-circuit'}


def simulate_multiscale(request: Any) -> dict[str, Any]:
    p=_payload(request); started=time.perf_counter(); nodes=[dict(x) for x in p.get('nodes',[])]; edges=[dict(x) for x in p.get('edges',[])]; regions=[str(x) for x in p.get('regions',[])]; steps=max(1,int(p.get('steps',1)))
    if not regions or not nodes: raise ValueError('regionsまたはnodesが空です。')
    cfg=dict(p.get('config') or {}); focus=str(cfg.get('multiscaleFocusRegion') or regions[0]); coupling=_clamp(float(cfg.get('multiscaleCoupling',.55)),0,1)
    if focus not in regions: focus=regions[0]
    idx={r:i for i,r in enumerate(regions)}; n=len(regions)
    grouped_nodes={r:[] for r in regions}
    for node in nodes: grouped_nodes.setdefault(str(node.get('regionId')),[]).append(node)
    matrix=[[0.0]*n for _ in range(n)]; counts=[[0]*n for _ in range(n)]
    for edge in edges:
        s=str(edge.get('sourceRegionId','')); t=str(edge.get('targetRegionId',''))
        if s in idx and t in idx and s!=t:
            matrix[idx[t]][idx[s]] += float(edge.get('weight',0)); counts[idx[t]][idx[s]] += 1
    for i in range(n):
        for j in range(n):
            if counts[i][j]: matrix[i][j]/=counts[i][j]
    estate=dict(p.get('engine_state') or {}); regional=list(estate.get('regionalActivity') or [])
    if len(regional)!=n:
        regional=[]
        for r in regions:
            vals=[max(0.0,float(x.get('voltage',0))) for x in grouped_nodes.get(r,[])]
            regional.append(_clamp(sum(vals)/max(1,len(vals))*.45+.04))
    stimulus=dict(p.get('stimulus_sequence')) if p.get('stimulus_sequence') else None
    interventions={str(x.get('regionId')):x for x in p.get('interventions',[]) if x.get('regionId')}
    local_ids={int(x.get('id',i)) for i,x in enumerate(nodes) if str(x.get('regionId'))==focus}; incoming={i:[] for i in local_ids}
    for edge in edges:
        target=int(edge.get('target',-1))
        if target in incoming: incoming[target].append(edge)
    node_by_id={int(x.get('id',i)):x for i,x in enumerate(nodes)}
    step=int(p.get('step',0)); sim=float(p.get('sim_time',0)); total=float(p.get('total_spikes',0)); peak=float(p.get('peak_spikes',0)); dt=float(p.get('dt',.02)); frames=[]
    for _ in range(steps):
        external={r:0.0 for r in regions}
        if stimulus and stimulus.get('phase','active')=='active':
            for r in stimulus.get('regions',[]):
                if r in external: external[r]+=float(stimulus.get('strength',1))*0.22*float((stimulus.get('regionWeights') or {}).get(r,1))
            stimulus['remaining']=int(stimulus.get('remaining',stimulus.get('duration',1)))-1
            if stimulus['remaining']<=0:
                if int(stimulus.get('currentRepeat',1))>=int(stimulus.get('repeats',1)): stimulus=None
                else: stimulus['phase']='waiting'; stimulus['waitRemaining']=int(stimulus.get('interval',1))
        elif stimulus:
            stimulus['waitRemaining']=int(stimulus.get('waitRemaining',1))-1
            if stimulus['waitRemaining']<=0: stimulus['phase']='active'; stimulus['currentRepeat']=int(stimulus.get('currentRepeat',1))+1; stimulus['remaining']=int(stimulus.get('duration',1))
        fired=[]
        for node_id in local_ids:
            node=node_by_id[node_id]
            if int(node.get('refractory',0))>0:
                node['refractory']=int(node.get('refractory',0))-1; node['fired']=False; continue
            drive=external.get(focus,0.0)
            for edge in incoming.get(node_id,[]):
                src=node_by_id.get(int(edge.get('source',-1))); w=float(edge.get('weight',0))
                if src is None: continue
                if int(edge.get('source',-1)) in local_ids: drive += w*(1.0 if src.get('fired') else max(0.0,float(src.get('voltage',0)))*.12)
                else: drive += w*regional[idx.get(str(src.get('regionId')),0)]*.07
            iv=interventions.get(focus)
            if iv and iv.get('type')=='block': drive=-10
            elif iv and iv.get('type')=='suppress': drive-=float(iv.get('strength',.5))*.45
            elif iv and iv.get('type')=='boost': drive+=float(iv.get('strength',.5))*.35
            voltage=float(node.get('voltage',0))*float(node.get('leak',.88))+drive
            threshold=float(node.get('baseThreshold',1))+float(node.get('fatigue',0))*float(cfg.get('fatigueStrength',.45))+float(node.get('homeostaticOffset',0))
            did=voltage>=threshold
            node['fired']=did; node['pulse']=1.0 if did else float(node.get('pulse',0))*.78
            if did:
                fired.append(node_id); node['spikeCount']=int(node.get('spikeCount',0))+1; node['voltage']=0.0; node['refractory']=int(node.get('refractoryBase',2)); node['fatigue']=_clamp(float(node.get('fatigue',0))+float(node.get('fatigueGain',.025))*float(cfg.get('fatigueStrength',.45)))
            else:
                node['voltage']=voltage; node['fatigue']=max(0.0,float(node.get('fatigue',0))-float(node.get('fatigueRecovery',.018)))
        local_nodes=[node_by_id[i] for i in local_ids]; local_ratio=len(fired)/max(1,len(local_nodes)); local_voltage=sum(max(0.0,float(x.get('voltage',0))) for x in local_nodes)/max(1,len(local_nodes))
        nxt=[0.0]*n
        for i,r in enumerate(regions):
            drive=sum(matrix[i][j]*regional[j]*.12 for j in range(n))+external[r]
            iv=interventions.get(r)
            if iv and iv.get('type')=='block': drive=-10
            elif iv and iv.get('type')=='suppress': drive-=float(iv.get('strength',.5))*.5
            elif iv and iv.get('type')=='boost': drive+=float(iv.get('strength',.5))*.3
            target=1/(1+math.exp(-max(-20,min(20,5*(drive-.08)))))
            value=_clamp(regional[i]*.86+target*.14)
            if r==focus: value=_clamp((1-coupling)*value+coupling*_clamp(local_ratio*.72+local_voltage*.28))
            nxt[i]=value
        regional=nxt; rc={}
        kinds={}
        for r in regions:
            if r==focus:
                rc[r]=len(fired); kinds[r]='literal-spikes'
            else:
                rc[r]=round(regional[idx[r]]*max(1,len(grouped_nodes.get(r,[])))*.6,3); kinds[r]='activity-equivalent'
        output=sum(float(x) for x in rc.values()); total+=output; peak=max(peak,output); step+=1; sim=step*dt
        hemi={}
        for r in regions:
            rnodes=grouped_nodes.get(r,[]); left=sum(1 for x in rnodes if x.get('hemisphere')=='left'); right=max(0,len(rnodes)-left); denom=max(1,len(rnodes)); hemi[f'{r}:left']=rc[r]*left/denom; hemi[f'{r}:right']=rc[r]*right/denom
        for r in regions:
            if r==focus: continue
            for node in grouped_nodes.get(r,[]): node['voltage']=regional[idx[r]]; node['pulse']=regional[idx[r]]; node['fired']=False
        frames.append({'step':step,'simTime':sim,'spikesThisStep':output,'activityEquivalent':True,'mixedScale':True,'regionCounts':rc,'regionOutputKinds':kinds,'regionExcitatoryCounts':rc,'regionInhibitoryCounts':{r:0 for r in regions},'hemisphereCounts':hemi,'routeSignals':{},'edgeActivity':{},'synapseChange':{},'meanWeightChange':0.0,'scaleMetadata':{'focusRegion':focus,'localSpikes':len(fired),'regionalActivity':{r:round(regional[idx[r]],6) for r in regions}}})
    return {'version':str(p.get('version','v021')),'engine':ENGINE_ID,'engineId':'multiscale','engineDetails':{'model':'hybrid regional mass + local LIF circuit','scale':'multiscale','outputMeaning':'mixed: local literal spikes + regional activity-equivalent','focusRegion':focus,'coupling':coupling},'elapsedMs':round((time.perf_counter()-started)*1000,3),'rngState':int(p.get('rng_state',1)),'step':step,'simTime':sim,'totalSpikes':total,'peakSpikes':peak,'nodes':nodes,'edges':edges,'stimulusSequence':stimulus,'routeStats':p.get('route_stats') or {},'engineState':{'regionalActivity':regional,'focusRegion':focus},'frames':frames}
