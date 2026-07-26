(() => {
  'use strict';

  const VERSION = window.VIRTUAL_BRAIN_CONFIG?.appVersion || 'unknown';
  const STORAGE_KEY = `virtual-brain-${VERSION}-engine-benchmarks`;
  let lastResult = null;

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function apiBase() {
    const field = document.getElementById('apiUrl');
    const raw = field?.value?.trim() || window.location.origin;
    return raw.replace(/\/+$/, '');
  }

  async function request(path, options = {}) {
    const response = await fetch(`${apiBase()}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    let data = null;
    try { data = await response.json(); } catch (_) { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.message || `HTTP ${response.status}`);
    return data;
  }

  function panelMarkup() {
    return `
      <section class="engine-lab" id="engineLabPanel">
        <div class="engine-lab-heading">
          <div>
            <p class="engine-lab-eyebrow">MULTI ENGINE VALIDATION</p>
            <h2>計算エンジン比較ラボ</h2>
          </div>
          <span class="engine-lab-version">${escapeHtml(VERSION)}</span>
        </div>
        <p class="engine-lab-copy">同じ初期状態・seed・刺激条件を複製し、利用可能なエンジンで計算結果と処理時間を比較します。</p>
        <div id="engineLabChoices" class="engine-lab-choices"><span>API接続後に取得します。</span></div>
        <div class="engine-lab-controls">
          <label><span>比較step</span><input id="engineLabSteps" type="number" min="1" max="100" value="40" /></label>
          <button id="engineLabRefresh" type="button">エンジン更新</button>
          <button id="engineLabSelfTests" type="button">選択エンジン診断</button>
          <button id="engineLabRun" type="button" class="primary">同条件比較を実行</button>
          <button id="engineLabExport" type="button" disabled>比較JSONを書き出す</button>
        </div>
        <div id="engineLabStatus" class="engine-lab-status">待機中</div>
        <div id="engineLabResults" class="engine-lab-results empty">比較結果はここに表示されます。</div>
      </section>`;
  }

  function selectedIds() {
    return [...document.querySelectorAll('#engineLabChoices input[type="checkbox"]:checked')].map(item => item.value);
  }

  async function refreshEngines() {
    const target = document.getElementById('engineLabChoices');
    target.innerHTML = '<span>取得中…</span>';
    try {
      const data = await request('/api/v1/engines');
      target.innerHTML = (data.engines || []).map(engine => {
        const ready = !!engine.executable;
        const checked = engine.id === 'native' || ready;
        const status = ready ? '実行可' : engine.packageDetected ? '実装準備' : '未導入';
        return `<label class="engine-choice ${ready ? 'ready' : 'limited'}">
          <input type="checkbox" value="${escapeHtml(engine.id)}" ${checked ? 'checked' : ''} />
          <span><strong>${escapeHtml(engine.name)}</strong><small>${escapeHtml(status)} / ${escapeHtml(engine.scale || '')}</small></span>
        </label>`;
      }).join('');
      setStatus(`${(data.engines || []).length}件のエンジン情報を取得しました。`);
    } catch (error) {
      target.innerHTML = '<span>APIへ接続できません。</span>';
      setStatus(error.message, true);
    }
  }

  async function runSelfTests() {
    const ids = selectedIds();
    if (!ids.length) return setStatus('診断するエンジンを選択してください。', true);
    setBusy(true, 'エンジンを診断中…');
    const results = [];
    for (const id of ids) {
      try {
        const value = await request(`/api/v1/engines/${encodeURIComponent(id)}/self-test`, { method: 'POST', body: '{}' });
        results.push({ id, ok: true, value });
      } catch (error) {
        results.push({ id, ok: false, error: error.message });
      }
    }
    renderSelfTests(results);
    setBusy(false, `診断完了：${results.filter(item => item.ok).length}/${results.length}件が利用可能です。`);
  }

  async function runComparison() {
    const ids = selectedIds();
    if (ids.length < 2) return setStatus('比較には2件以上のエンジンを選択してください。', true);
    if (!window.VBL_APP?.getSimulationPayload) return setStatus('現在のネットワーク状態を取得できません。画面を再読み込みしてください。', true);
    const steps = Math.max(1, Math.min(100, Number(document.getElementById('engineLabSteps').value) || 40));
    const payload = window.VBL_APP.getSimulationPayload(steps);
    payload.steps = steps;
    payload.engine_id = 'native';
    setBusy(true, `${ids.length}エンジンを同条件で計算中…`);
    try {
      lastResult = await request('/api/v1/compare', {
        method: 'POST',
        body: JSON.stringify({ engine_ids: ids, request: payload }),
      });
      renderComparison(lastResult);
      document.getElementById('engineLabExport').disabled = false;
      saveHistory(lastResult);
      setBusy(false, `比較完了：${lastResult.availableCount || 0}/${lastResult.requestedCount || ids.length}件を計算しました。`);
    } catch (error) {
      setBusy(false, error.message, true);
    }
  }

  function renderSelfTests(results) {
    const target = document.getElementById('engineLabResults');
    target.classList.remove('empty');
    target.innerHTML = `<div class="engine-test-grid">${results.map(item => `
      <article class="engine-test-card ${item.ok ? 'ok' : 'ng'}">
        <strong>${escapeHtml(item.id)}</strong>
        <span>${item.ok ? '利用可能' : '利用不可'}</span>
        <small>${escapeHtml(item.ok ? JSON.stringify(item.value) : item.error)}</small>
      </article>`).join('')}</div>`;
  }

  function renderComparison(data) {
    const target = document.getElementById('engineLabResults');
    target.classList.remove('empty');
    const results = data.results || [];
    const pairs = data.pairs || [];
    const rows = results.map(item => {
      if (item.status !== 'ok') return `<tr><td>${escapeHtml(item.engineId)}</td><td colspan="6" class="engine-error">${escapeHtml(item.error || item.status)}</td></tr>`;
      return `<tr><td><strong>${escapeHtml(item.engineId)}</strong></td><td>${item.totalSpikes}</td><td>${item.peakSpikes}</td><td>${Number(item.meanSpikesPerStep || 0).toFixed(2)}</td><td>${Number(item.meanWeightChange || 0).toFixed(5)}</td><td>${Number(item.elapsedMs || 0).toFixed(1)} ms</td><td>${item.steps}</td></tr>`;
    }).join('');
    const pairCards = pairs.length ? pairs.map(pair => `<article class="engine-pair-card">
      <div><strong>${escapeHtml(pair.engineA)} ↔ ${escapeHtml(pair.engineB)}</strong><span>${Number(pair.compositeAgreement || 0).toFixed(1)}%</span></div>
      <dl><dt>総発火差</dt><dd>${pair.totalSpikeDelta > 0 ? '+' : ''}${pair.totalSpikeDelta}</dd><dt>時系列一致</dt><dd>${Number(pair.temporalAgreement || 0).toFixed(1)}%</dd><dt>領域パターン</dt><dd>${Number(pair.regionPatternSimilarity || 0).toFixed(1)}%</dd><dt>速度比 B/A</dt><dd>${Number(pair.elapsedRatioBtoA || 0).toFixed(2)}</dd></dl>
    </article>`).join('') : '<p class="engine-lab-empty">比較可能な組み合わせがありません。</p>';
    target.innerHTML = `
      <div class="engine-table-wrap"><table><thead><tr><th>エンジン</th><th>総発火</th><th>ピーク</th><th>平均/step</th><th>結合変化</th><th>計算時間</th><th>step</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="engine-pair-grid">${pairCards}</div>
      <p class="engine-lab-warning">${escapeHtml(data.warning || '')}</p>`;
  }

  function setStatus(message, error = false) {
    const target = document.getElementById('engineLabStatus');
    target.textContent = message;
    target.classList.toggle('error', !!error);
  }

  function setBusy(busy, message, error = false) {
    for (const id of ['engineLabRefresh', 'engineLabSelfTests', 'engineLabRun']) {
      const button = document.getElementById(id);
      if (button) button.disabled = busy;
    }
    setStatus(message, error);
  }

  function exportResult() {
    if (!lastResult) return;
    const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `virtual-brain-${VERSION}-engine-comparison.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveHistory(result) {
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      history.unshift({ savedAt: new Date().toISOString(), result });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 10)));
    } catch (_) { /* storage is optional */ }
  }

  function init() {
    const engineSection = document.querySelector('.engine-section');
    if (!engineSection || document.getElementById('engineLabPanel')) return;
    engineSection.insertAdjacentHTML('afterend', panelMarkup());
    document.getElementById('engineLabRefresh').addEventListener('click', refreshEngines);
    document.getElementById('engineLabSelfTests').addEventListener('click', runSelfTests);
    document.getElementById('engineLabRun').addEventListener('click', runComparison);
    document.getElementById('engineLabExport').addEventListener('click', exportResult);
    refreshEngines();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
