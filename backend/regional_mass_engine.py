from __future__ import annotations

"""Built-in regional neural-mass approximation.

This solver mirrors the region-level role of TVB but does not import or claim
to be The Virtual Brain. It is provided so that the whole-brain workflow can be
exercised on Vercel and in tests before a dedicated TVB server is connected.
"""

import math
import time
from typing import Any

ENGINE_ID = 'regional-mass-lite-v1'

def _payload(request: Any) -> dict[str, Any]:
    if hasattr(request,'model_dump'): return request.model_dump()
    return dict(request) if isinstance(request,dict) else dict(vars(request))

def self_test() -> dict[str, Any]:
    return {'status':'ok','engineId':ENGINE_ID,'message':'内蔵領域質量モデルは利用可能です。','model':'Wilson-Cowan inspired discrete regional model'}

def simulate_regional_mass(request: Any) -> dict[str, Any]:
    p=_payload(request); started=time.perf_counter(); nodes=[dict(x) for x in p.get('nodes',[])]; edges=[dict(x) for x in p.get('edges',[])]; regions=[str(x) for x in p.get('regions',[])]; steps=max(1,int(p.get('steps',1)))
    if not regions: raise ValueError('regionsが空です。')
    idx={r:i for i,r in enumerate(regions)}; n=len(regions); matrix=[[0.0]*n for _ in range(n)]; counts=[[0]*n for _ in range(n)]
    for e in edges:
        s=str(e.get('sourceRegionId','')); t=str(e.get('targetRegionId',''))
        if s in idx and t in idx: matrix[idx[t]][idx[s]]+=float(e.get('weight',0)); counts[idx[t]][idx[s]]+=1
    for i in range(n):
        for j in range(n):
            if counts[i][j]: matrix[i][j]/=counts[i][j]
    state=list((p.get('engine_state') or {}).get('regionalActivity') or [0.04]*n); stimulus=dict(p.get('stimulus_sequence')) if p.get('stimulus_sequence') else None; interventions={str(x.get('regionId')):x for x in p.get('interventions',[]) if x.get('regionId')}; frames=[]; step=int(p.get('step',0)); sim=float(p.get('sim_time',0)); total=int(p.get('total_spikes',0)); peak=int(p.get('peak_spikes',0)); dt=float(p.get('dt',.02))
    for _ in range(steps):
        external=[0.0]*n
        if stimulus and stimulus.get('phase','active')=='active':
            for r in stimulus.get('regions',[]):
                if r in idx: external[idx[r]]+=float(stimulus.get('strength',1))*0.20
            stimulus['remaining']=int(stimulus.get('remaining',stimulus.get('duration',1)))-1
            if stimulus['remaining']<=0:
                if int(stimulus.get('currentRepeat',1))>=int(stimulus.get('repeats',1)): stimulus=None
                else: stimulus['phase']='waiting'; stimulus['waitRemaining']=int(stimulus.get('interval',1))
        elif stimulus:
            stimulus['waitRemaining']=int(stimulus.get('waitRemaining',1))-1
            if stimulus['waitRemaining']<=0: stimulus['phase']='active'; stimulus['currentRepeat']=int(stimulus.get('currentRepeat',1))+1; stimulus['remaining']=int(stimulus.get('duration',1))
        nxt=[0.0]*n
        for i,r in enumerate(regions):
            drive=sum(matrix[i][j]*state[j] for j in range(n))+external[i]
            iv=interventions.get(r)
            if iv and iv.get('type')=='block': drive=-10
            elif iv and iv.get('type')=='suppress': drive-=float(iv.get('strength',.5))*.5
            elif iv and iv.get('type')=='boost': drive+=float(iv.get('strength',.5))*.3
            target=1/(1+math.exp(-max(-20,min(20,5*(drive-.08)))))
            nxt[i]=max(0,min(1,state[i]*.86+target*.14))
        state=nxt; rc={r:int(round(state[i]*max(1,sum(1 for node in nodes if str(node.get('regionId'))==r))*.6)) for i,r in enumerate(regions)}; spikes=sum(rc.values()); total+=spikes; peak=max(peak,spikes); step+=1; sim=step*dt
        frames.append({'step':step,'simTime':sim,'spikesThisStep':spikes,'activityEquivalent':True,'regionCounts':rc,'regionExcitatoryCounts':rc,'regionInhibitoryCounts':{r:0 for r in regions},'hemisphereCounts':({key:value for r in regions for key,value in ((f'{r}:left', rc[r]*sum(1 for node in nodes if str(node.get('regionId'))==r and node.get('hemisphere')=='left')/max(1,sum(1 for node in nodes if str(node.get('regionId'))==r))), (f'{r}:right', rc[r]*sum(1 for node in nodes if str(node.get('regionId'))==r and node.get('hemisphere')!='left')/max(1,sum(1 for node in nodes if str(node.get('regionId'))==r))))}),'routeSignals':{},'edgeActivity':{},'synapseChange':{},'meanWeightChange':0.0})
    for node in nodes:
        i=idx.get(str(node.get('regionId')),0); node['voltage']=state[i]; node['pulse']=state[i]; node['fired']=state[i]>.72
    return {'version':str(p.get('version','v021')),'engine':ENGINE_ID,'engineId':'regional-mass','engineDetails':{'model':'built-in regional neural mass approximation','scale':'region-level','outputMeaning':'activity-equivalent, not literal spikes','tvbPackage':False},'elapsedMs':round((time.perf_counter()-started)*1000,3),'rngState':int(p.get('rng_state',1)),'step':step,'simTime':sim,'totalSpikes':total,'peakSpikes':peak,'nodes':nodes,'edges':edges,'stimulusSequence':stimulus,'routeStats':p.get('route_stats') or {},'engineState':{'regionalActivity':state},'frames':frames}
