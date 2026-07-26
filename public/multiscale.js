(() => {
  'use strict';
  const ext = { config: { enabled: false, focusRegion: 'HIP', coupling: .55, localEngine: 'native' } };
  function app(){ return window.VBL_APP; }
  function regions(){ return app()?.getRegions?.() || []; }
  function escapeHtml(v){ return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function panel(){
    const host=document.querySelector('.info-panel .engine-section'); if(!host) return;
    const section=document.createElement('section'); section.className='multiscale-panel'; section.innerHTML=`
      <div class="section-title-row"><h2>マルチスケール計算</h2><span class="mini-badge warn">v021</span></div>
      <p class="section-copy">脳全体は領域単位、選択領域だけはニューロン単位で計算し、両方向に活動を受け渡します。</p>
      <label class="switch-row"><span>ハイブリッド計算を使用</span><input id="multiscaleEnabled" type="checkbox"></label>
      <label class="field"><span>詳細計算する領域</span><select id="multiscaleFocusRegion"></select></label>
      <label class="field"><span>全体↔局所の結合 <strong id="multiscaleCouplingValue">0.55</strong></span><input id="multiscaleCoupling" type="range" min="0.10" max="0.90" step="0.05" value="0.55"></label>
      <label class="field"><span>局所計算方式</span><select id="multiscaleLocalEngine"><option value="native">Native LIF</option><option value="brian2">Brian2候補</option><option value="nest">NEST候補</option></select></label>
      <div class="button-grid"><button id="applyMultiscaleBtn" class="primary" type="button">設定を適用</button><button id="syncMultiscaleSelectionBtn" type="button">選択領域を使用</button></div>
      <div id="multiscaleStatus" class="multiscale-status empty-state">標準計算を使用しています。</div>`;
    host.insertAdjacentElement('afterend',section);
    const select=section.querySelector('#multiscaleFocusRegion'); select.innerHTML=regions().map(r=>`<option value="${r.id}">${escapeHtml(r.name)}</option>`).join(''); select.value=ext.config.focusRegion;
    section.querySelector('#multiscaleCoupling').addEventListener('input',e=>{ ext.config.coupling=Number(e.target.value); section.querySelector('#multiscaleCouplingValue').textContent=ext.config.coupling.toFixed(2); });
    section.querySelector('#applyMultiscaleBtn').addEventListener('click',apply);
    section.querySelector('#syncMultiscaleSelectionBtn').addEventListener('click',()=>{ const s=app()?.getStateRef?.().selection; const state=app()?.getStateRef?.(); let id=s?.type==='region'?s.id:(s?.type==='node'?state.nodes[s.id]?.regionId:null); if(id){select.value=id; ext.config.focusRegion=id; render('選択領域を詳細計算対象に設定しました。');} });
    section.querySelector('#multiscaleEnabled').addEventListener('change',e=>{ext.config.enabled=e.target.checked;});
    select.addEventListener('change',e=>ext.config.focusRegion=e.target.value);
    section.querySelector('#multiscaleLocalEngine').addEventListener('change',e=>ext.config.localEngine=e.target.value);
  }
  function apply(){
    const enabled=document.getElementById('multiscaleEnabled').checked; ext.config.enabled=enabled; ext.config.focusRegion=document.getElementById('multiscaleFocusRegion').value; ext.config.localEngine=document.getElementById('multiscaleLocalEngine').value;
    if(enabled){ app()?.setEngineMode?.('remote'); app()?.setEngineAdapter?.('multiscale'); app()?.selectRegion?.(ext.config.focusRegion); render('マルチスケール計算を適用しました。Python API接続後に実行できます。','active'); }
    else { if(app()?.getStateRef?.().engine.adapterId==='multiscale') app()?.setEngineAdapter?.('native'); render('標準計算へ戻しました。'); }
  }
  function render(message,kind=''){ const box=document.getElementById('multiscaleStatus'); if(!box)return; const r=regions().find(x=>x.id===ext.config.focusRegion); box.className=`multiscale-status ${kind||'empty-state'}`; box.innerHTML=`<strong>${escapeHtml(r?.name||ext.config.focusRegion)}</strong><small>${escapeHtml(message)} / 結合 ${ext.config.coupling.toFixed(2)} / 局所 ${escapeHtml(ext.config.localEngine)}</small>`; }
  ext.augmentPayload = payload => { if(!ext.config.enabled && payload.engine_id!=='multiscale') return payload; payload.engine_id='multiscale'; payload.config={...(payload.config||{}),multiscaleFocusRegion:ext.config.focusRegion,multiscaleCoupling:ext.config.coupling,multiscaleLocalEngine:ext.config.localEngine}; return payload; };
  ext.onRemoteResponse = response => { if(response.engineId==='multiscale'){ ext.config.enabled=true; ext.config.focusRegion=response.engineDetails?.focusRegion||ext.config.focusRegion; render(`全脳領域モデルと局所回路を${response.elapsedMs??'-'}msで計算しました。`,'active'); } };
  window.VBL_EXTENSIONS=(window.VBL_EXTENSIONS||[]); window.VBL_EXTENSIONS.push(ext);
  document.addEventListener('DOMContentLoaded',()=>{panel(); render('標準計算を使用しています。');});
})();
