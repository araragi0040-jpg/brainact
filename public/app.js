(() => {
  'use strict';

  const RUNTIME_CONFIG = window.VIRTUAL_BRAIN_CONFIG || {};
  const MODEL_VERSION = RUNTIME_CONFIG.appVersion || 'v018';
  const STORAGE_KEY = 'virtual-brain-v018-experiments';
  const SCENARIO_STORAGE_KEY = 'virtual-brain-v018-scenarios';
  const LEGACY_STORAGE_KEYS = ['virtual-brain-v014-experiments', 'virtual-brain-v013-experiments', 'virtual-brain-v012-experiments', 'virtual-brain-v011-experiments', 'virtual-brain-v010-experiments', 'virtual-brain-v009-experiments', 'virtual-brain-v008-experiments', 'virtual-brain-v007-experiments', 'virtual-brain-v006-experiments', 'virtual-brain-v005-experiments', 'virtual-brain-v004-experiments', 'virtual-brain-v003-experiments', 'virtual-brain-v002-experiments'];
  const LEGACY_SCENARIO_STORAGE_KEYS = ['virtual-brain-v014-scenarios', 'virtual-brain-v013-scenarios', 'virtual-brain-v012-scenarios', 'virtual-brain-v011-scenarios', 'virtual-brain-v010-scenarios', 'virtual-brain-v009-scenarios', 'virtual-brain-v008-scenarios', 'virtual-brain-v007-scenarios', 'virtual-brain-v006-scenarios', 'virtual-brain-v005-scenarios'];
  const DATASET_STORAGE_KEY = 'virtual-brain-v018-dataset';
  const LEGACY_DATASET_STORAGE_KEYS = ['virtual-brain-v014-dataset', 'virtual-brain-v013-dataset', 'virtual-brain-v012-dataset', 'virtual-brain-v011-dataset'];
  const ENGINE_STORAGE_KEY = 'virtual-brain-v018-engine';
  const LEGACY_ENGINE_STORAGE_KEYS = ['virtual-brain-v014-engine', 'virtual-brain-v013-engine', 'virtual-brain-v012-engine'];
  const DATASET_FORMAT = 'virtual-brain-dataset-v1';
  const DT = 0.02;
  const HISTORY_LIMIT = 240;
  const ANALYSIS_HISTORY_LIMIT = 1200;
  const MAX_EVENTS = 24;

  let REGIONS = [
    { id: 'V1', name: '一次視覚野', short: 'V1', x: 0.07, y: 0.15, count: 10, lateral: 0.48, vertical: 0.08, depth: -0.78, system: '感覚系', lobe: '後頭葉', level: '皮質', parent: '視覚系', functions: '輪郭・方位・初期視覚処理', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'V2', name: '視覚連合野', short: '視覚連合', x: 0.20, y: 0.15, count: 10, lateral: 0.50, vertical: 0.15, depth: -0.55, system: '感覚系', lobe: '後頭葉', level: '皮質', parent: '視覚系', functions: '視覚特徴の統合・物体認識への中継', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'A1', name: '一次聴覚野', short: 'A1', x: 0.07, y: 0.34, count: 8, lateral: 0.63, vertical: -0.05, depth: -0.22, system: '感覚系', lobe: '側頭葉', level: '皮質', parent: '聴覚系', functions: '周波数・音量などの初期聴覚処理', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'A2', name: '聴覚連合野', short: '聴覚連合', x: 0.20, y: 0.34, count: 8, lateral: 0.58, vertical: 0.03, depth: -0.03, system: '感覚系', lobe: '側頭葉', level: '皮質', parent: '聴覚系', functions: '音声・音パターンの統合', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'S1', name: '一次体性感覚野', short: 'S1', x: 0.07, y: 0.55, count: 10, lateral: 0.47, vertical: 0.38, depth: 0.02, system: '感覚系', lobe: '頭頂葉', level: '皮質', parent: '体性感覚系', functions: '触覚・圧覚・身体位置の初期処理', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'PPC', name: '後部頭頂連合野', short: '頭頂連合', x: 0.24, y: 0.55, count: 10, lateral: 0.46, vertical: 0.30, depth: -0.25, system: '連合系', lobe: '頭頂葉', level: '皮質', parent: '感覚統合系', functions: '空間認知・感覚統合・注意配分', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'THA', name: '視床', short: '視床', x: 0.35, y: 0.39, count: 10, lateral: 0.17, vertical: -0.02, depth: 0.00, system: '中継系', lobe: '間脳', level: '皮質下', parent: '視床系', functions: '感覚・運動情報の中継とゲート調整', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'INS', name: '島皮質', short: '島皮質', x: 0.39, y: 0.66, count: 8, lateral: 0.27, vertical: 0.02, depth: 0.10, system: '内受容系', lobe: '島葉', level: '皮質', parent: '内受容・顕著性系', functions: '身体内部感覚・情動・顕著性統合', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'HIP', name: '海馬', short: '海馬', x: 0.50, y: 0.76, count: 10, lateral: 0.30, vertical: -0.28, depth: -0.08, system: '記憶系', lobe: '内側側頭葉', level: '皮質下', parent: '内側側頭葉記憶系', functions: 'エピソード記憶・空間記憶・記憶固定', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'AMY', name: '扁桃体', short: '扁桃体', x: 0.58, y: 0.84, count: 8, lateral: 0.30, vertical: -0.28, depth: 0.22, system: '情動系', lobe: '内側側頭葉', level: '皮質下', parent: '辺縁系', functions: '情動価・脅威・報酬関連の評価', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'ACC', name: '前部帯状皮質', short: 'ACC', x: 0.53, y: 0.50, count: 8, lateral: 0.16, vertical: 0.22, depth: 0.23, system: '顕著性系', lobe: '辺縁葉', level: '皮質', parent: '顕著性・制御系', functions: '葛藤監視・動機づけ・痛みの情動評価', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'PFC', name: '背外側前頭前野', short: 'dlPFC', x: 0.65, y: 0.18, count: 12, lateral: 0.49, vertical: 0.23, depth: 0.70, system: '実行制御系', lobe: '前頭葉', level: '皮質', parent: '前頭前野系', functions: '作業記憶・計画・認知制御', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'OFC', name: '眼窩前頭皮質', short: 'OFC', x: 0.68, y: 0.37, count: 8, lateral: 0.40, vertical: -0.10, depth: 0.70, system: '価値判断系', lobe: '前頭葉', level: '皮質', parent: '前頭前野系', functions: '報酬価値・意思決定・情動調整', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'BG', name: '大脳基底核', short: '基底核', x: 0.72, y: 0.58, count: 10, lateral: 0.20, vertical: -0.05, depth: 0.18, system: '行動選択系', lobe: '皮質下核', level: '皮質下', parent: '大脳基底核回路', functions: '行動選択・習慣・運動開始', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'PMC', name: '前運動野', short: '前運動', x: 0.82, y: 0.28, count: 10, lateral: 0.44, vertical: 0.35, depth: 0.38, system: '運動系', lobe: '前頭葉', level: '皮質', parent: '運動計画系', functions: '運動準備・系列化・感覚運動変換', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'M1', name: '一次運動野', short: 'M1', x: 0.94, y: 0.28, count: 10, lateral: 0.42, vertical: 0.35, depth: 0.19, system: '運動系', lobe: '前頭葉', level: '皮質', parent: '運動出力系', functions: '随意運動指令の生成', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'CBL', name: '小脳', short: '小脳', x: 0.83, y: 0.79, count: 12, lateral: 0.47, vertical: -0.61, depth: -0.55, system: '運動調整系', lobe: '後頭蓋窩', level: '小脳', parent: '小脳系', functions: '運動誤差修正・タイミング・学習', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'HYP', name: '視床下部', short: '視床下部', x: 0.72, y: 0.80, count: 6, lateral: 0.10, vertical: -0.42, depth: 0.02, system: '恒常性系', lobe: '間脳', level: '皮質下', parent: '自律・内分泌系', functions: '自律神経・内分泌・摂食・体温調整', evidence: '解剖学名称に基づく概念モデル' },
    { id: 'BRS', name: '脳幹', short: '脳幹', x: 0.94, y: 0.71, count: 6, lateral: 0.06, vertical: -0.64, depth: -0.04, system: '生命維持系', lobe: '脳幹', level: '脳幹', parent: '脳幹系', functions: '覚醒・呼吸循環・反射・上下行路', evidence: '解剖学名称に基づく概念モデル' }
  ];

  let REGION_BY_ID = new Map(REGIONS.map(region => [region.id, region]));

  const STIMULUS_TARGETS = {
    visual: ['V1'],
    auditory: ['A1'],
    somatic: ['S1'],
    memory: ['HIP'],
    emotion: ['AMY'],
    mixed: ['V1', 'A1']
  };

  let ROUTE_BIASES = new Map([
    ['THA>V1', 5.6], ['THA>A1', 5.3], ['THA>S1', 5.5], ['THA>AMY', 2.8],
    ['V1>V2', 6.0], ['V2>PPC', 4.8], ['V2>PFC', 2.6], ['V2>HIP', 2.3],
    ['A1>A2', 6.0], ['A2>PPC', 3.8], ['A2>INS', 3.0], ['A2>PFC', 2.7],
    ['S1>PPC', 5.1], ['S1>INS', 3.4], ['PPC>PFC', 4.6], ['PPC>PMC', 3.8], ['PPC>HIP', 2.4],
    ['INS>ACC', 4.4], ['INS>OFC', 3.5], ['INS>AMY', 3.8],
    ['HIP>PFC', 3.7], ['HIP>ACC', 2.8], ['HIP>AMY', 3.0], ['PFC>HIP', 2.6],
    ['AMY>OFC', 4.2], ['AMY>HYP', 5.0], ['AMY>HIP', 2.8], ['OFC>AMY', 3.5],
    ['ACC>PFC', 4.4], ['ACC>OFC', 3.4], ['ACC>BG', 3.0], ['PFC>ACC', 3.8],
    ['PFC>OFC', 3.0], ['PFC>BG', 4.8], ['PFC>PMC', 4.2], ['PFC>PPC', 2.7],
    ['OFC>BG', 3.6], ['OFC>HYP', 3.0], ['BG>PMC', 4.8], ['BG>M1', 4.1], ['BG>CBL', 3.4],
    ['PMC>M1', 5.4], ['PMC>CBL', 3.6], ['CBL>PMC', 4.0], ['CBL>M1', 4.8],
    ['M1>BRS', 4.8], ['HYP>BRS', 5.1], ['BRS>THA', 2.6], ['BRS>HYP', 2.8]
  ]);

  const BUILTIN_REGIONS = JSON.parse(JSON.stringify(REGIONS));
  const BUILTIN_ROUTE_BIASES = [...ROUTE_BIASES.entries()];


  const EXPERIMENT_TEMPLATES = {
    'repeated-learning': {
      name: '反復学習', category: '学習・可塑性', targetRequired: false,
      description: '同じ視覚刺激を複数回与え、反応速度、経路通過数、結合強度が変化するかを観察します。',
      hypothesis: '反復刺激によってV1→視覚連合野→頭頂連合野・海馬の経路が強化される。',
      expected: '後半の確認刺激で、到達時間の短縮または関連経路の結合増加が見られる可能性があります。'
    },
    forgetting: {
      name: '忘却・保持', category: '記憶', targetRequired: false,
      description: '学習刺激の後に無刺激期間を置き、想起刺激への反応と結合保持を確認します。',
      hypothesis: '休止期間中に活動は低下するが、学習で変化した一部の結合は残り、想起刺激で再活性化する。',
      expected: '海馬と前頭前野の再反応、学習直後から想起時までの結合変化を比較できます。'
    },
    multisensory: {
      name: '複合刺激', category: '感覚統合', targetRequired: false,
      description: '視覚と聴覚を同時に入力し、単一刺激より広い領域へ活動が伝播するかを観察します。',
      hypothesis: '視覚・聴覚入力が頭頂連合野、島皮質、前頭前野で統合される。',
      expected: 'V1/A1から複数経路が立ち上がり、連合領域の活動と経路通過数が増える可能性があります。'
    },
    attention: {
      name: '注意の競合', category: '認知制御', targetRequired: false,
      description: '視覚と聴覚を競合させ、前頭前野の促進と入力重みの差によって優先経路が変わるかを確認します。',
      hypothesis: '前頭前野の促進下では、重み付けされた視覚入力が聴覚入力より優先される。',
      expected: '視覚系の到達順・通過数が相対的に上がり、PFC・ACCとの関連が強くなる可能性があります。'
    },
    'region-block': {
      name: '領域遮断', category: '仮想介入', targetRequired: true,
      description: '基準刺激の後に指定領域を遮断し、伝播経路や出力がどう変化するかを比較します。',
      hypothesis: '経路上の主要領域を遮断すると、下流領域への到達と総発火が低下する。',
      expected: '遮断前の基準結果と遮断後の結果を自動保存し、差分表示に利用できます。'
    },
    'low-inhibition': {
      name: '抑制低下', category: '興奮・抑制', targetRequired: false,
      description: '基準状態の後に抑制性出力と恒常性調整を弱め、活動の広がりや同期の変化を観察します。',
      hypothesis: '抑制低下によって活動ピーク、同時発火、広域伝播が増加する。',
      expected: '総発火、ピーク、活動領域数、領域相関が基準より上昇する可能性があります。'
    },
    'learning-before-after': {
      name: '学習前後比較', category: '比較実験', targetRequired: false,
      description: '学習前の確認刺激、反復学習、学習後の確認刺激を一続きで実行し、節目を自動保存します。',
      hypothesis: '学習後は同じ刺激への反応量・到達時間・関連結合が学習前から変化する。',
      expected: '「学習前」と「学習後」の2件が保存され、結果比較ですぐに差分を確認できます。'
    }
  };


  const MODEL_PRESETS = {
    standard: { name: '標準バランス', description: '個体差・疲労・短期可塑性・恒常性を中程度にした基準モデル。', thresholdScale: 1.00, heterogeneity: 0.60, fatigueStrength: 0.45, inhibitoryGain: 1.00, shortTerm: true, homeostasis: true, plasticity: true, noise: true },
    learning: { name: '学習しやすい', description: '長期増強を起こしやすく、疲労をやや弱めた反復学習向けモデル。', thresholdScale: 0.96, heterogeneity: 0.70, fatigueStrength: 0.28, inhibitoryGain: 0.92, shortTerm: true, homeostasis: true, plasticity: true, noise: true },
    inhibition: { name: '抑制が強い', description: '抑制性出力を強め、過剰な同期や活動伝播を抑えやすいモデル。', thresholdScale: 1.04, heterogeneity: 0.55, fatigueStrength: 0.42, inhibitoryGain: 1.35, shortTerm: true, homeostasis: true, plasticity: true, noise: true },
    hyper: { name: '過活動', description: '閾値と抑制を下げ、広範囲へ活動が伝播しやすい検証用モデル。', thresholdScale: 0.84, heterogeneity: 0.72, fatigueStrength: 0.18, inhibitoryGain: 0.68, shortTerm: false, homeostasis: false, plasticity: true, noise: true },
    fatigue: { name: '疲労しやすい', description: '連続発火後に閾値が上がりやすく、反復刺激への反応低下を観察するモデル。', thresholdScale: 0.98, heterogeneity: 0.66, fatigueStrength: 0.90, inhibitoryGain: 1.00, shortTerm: true, homeostasis: true, plasticity: true, noise: true },
    recovery: { name: '回復しやすい', description: '疲労とシナプス資源の回復を速め、刺激間隔による回復差を観察するモデル。', thresholdScale: 1.00, heterogeneity: 0.52, fatigueStrength: 0.55, inhibitoryGain: 1.00, shortTerm: true, homeostasis: true, plasticity: true, noise: true }
  };

  const NEURON_PROFILES = {
    regular: { label: '規則発火型', leak: 0.88, thresholdOffset: 0.00, refractory: 2, fatigueGain: 0.025, fatigueRecovery: 0.018, adaptationGain: 0.018, adaptationRecovery: 0.055, homeostaticTarget: 0.045 },
    burst: { label: 'バースト型', leak: 0.91, thresholdOffset: -0.035, refractory: 2, fatigueGain: 0.034, fatigueRecovery: 0.014, adaptationGain: 0.010, adaptationRecovery: 0.070, homeostaticTarget: 0.055 },
    adaptive: { label: '順応型', leak: 0.86, thresholdOffset: 0.018, refractory: 2, fatigueGain: 0.047, fatigueRecovery: 0.010, adaptationGain: 0.048, adaptationRecovery: 0.030, homeostaticTarget: 0.035 },
    fast: { label: '高速発火型', leak: 0.82, thresholdOffset: -0.025, refractory: 1, fatigueGain: 0.016, fatigueRecovery: 0.030, adaptationGain: 0.008, adaptationRecovery: 0.090, homeostaticTarget: 0.080 },
    lowThreshold: { label: '低閾値抑制型', leak: 0.90, thresholdOffset: -0.070, refractory: 2, fatigueGain: 0.025, fatigueRecovery: 0.022, adaptationGain: 0.020, adaptationRecovery: 0.055, homeostaticTarget: 0.065 }
  };

  const els = {};
  const state = {
    seed: 2002,
    trialSeed: 42,
    connectionDensity: 5,
    modelPreset: 'standard',
    structureRandom: null,
    simRandom: null,
    nodes: [],
    edges: [],
    outgoing: new Map(),
    incoming: new Map(),
    regionEdges: [],
    regionEdgeMap: new Map(),
    running: false,
    speed: 1,
    step: 0,
    simTime: 0,
    runStartStep: 0,
    autoStopTarget: null,
    lastFrame: 0,
    accumulator: 0,
    history: [],
    regionHistory: Object.fromEntries(REGIONS.map(region => [region.id, []])),
    totalSpikes: 0,
    peakSpikes: 0,
    selection: null,
    stimulusSequence: null,
    events: [],
    experiments: [],
    scenarios: [],
    scenarioRun: null,
    templateRun: null,
    externalData: {
      mode: 'builtin',
      dataset: null,
      lastImport: null
    },
    engine: {
      mode: RUNTIME_CONFIG.defaultEngineMode === 'remote' ? 'remote' : 'local',
      apiUrl: RUNTIME_CONFIG.defaultApiUrl || 'http://127.0.0.1:8765',
      connected: false,
      connecting: false,
      busy: false,
      fallback: RUNTIME_CONFIG.allowBrowserFallback !== false,
      chunkSize: Number(RUNTIME_CONFIG.defaultChunkSize || 4),
      latencyMs: null,
      serverVersion: null,
      serverEngine: null,
      rngState: 42,
      lastError: null,
      requestCount: 0,
      generation: 0,
      deployment: null,
      payloadBytes: 0,
      adapterId: 'native',
      adapters: [],
      adapterReport: null,
      engineState: {},
      engineDetails: null
    },
    comparison: { active: false, aId: null, bId: null, regionDiffs: {}, maxAbs: 1 },
    networkCanvas: null,
    networkCtx: null,
    chartCanvas: null,
    chartCtx: null,
    networkStage: null,
    chartStage: null,
    dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
    resizeObserver: null,
    lastRegionStepCounts: Object.fromEntries(REGIONS.map(region => [region.id, 0])),
    activitySnapshots: [],
    pathAnalysis: {
      active: false,
      rootRegionId: null,
      direction: 'out',
      depth: 2,
      metric: 'structure',
      threshold: 0.20,
      edges: [],
      edgeKeys: new Set(),
      levels: new Map()
    },
    interventions: new Map(),
    propagation: null,
    brain3d: {
      yaw: -0.42,
      pitch: 0.12,
      zoom: 1,
      dragging: false,
      dragMoved: false,
      suppressClick: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
      autoRotate: false,
      hemisphere: 'both',
      shellVisible: true,
      live: true,
      historyIndex: 0,
      projectedRegions: [],
      shellPoints: [],
      lastAutoRotateTime: 0,
      surfaceStyle: 'solid',
      labelsVisible: true,
      deepVisible: true,
      sliceAxis: 'none',
      slicePosition: 0,
      isolateSelected: false,
      viewPreset: 'perspective'
    },
    analysis: {
      open: false,
      records: [],
      routeStats: {},
      cursorIndex: 0,
      live: true,
      primaryRegionId: 'PFC',
      secondaryRegionId: 'HIP',
      routeKey: '',
      timelineCtx: null,
      correlationCtx: null,
      synapseCtx: null,
      overlayCtx: null,
      resizeHandler: null
    }
  };

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      let t = value += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian() {
    let u = 0;
    let v = 0;
    while (u === 0) u = state.simRandom();
    while (v === 0) v = state.simRandom();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function generateBrainShellPoints() {
    const points = [];
    const pushEllipsoid = ({ center, radii, hemisphere, structure, densityLat = 18, densityLon = 28, deform = null }) => {
      for (let latIndex = 0; latIndex <= densityLat; latIndex += 1) {
        const latitude = -Math.PI / 2 + (latIndex / densityLat) * Math.PI;
        for (let lonIndex = 0; lonIndex < densityLon; lonIndex += 1) {
          const longitude = (lonIndex / densityLon) * Math.PI * 2;
          const ring = Math.cos(latitude);
          let x = ring * Math.cos(longitude) * radii.x;
          let y = Math.sin(latitude) * radii.y;
          let z = ring * Math.sin(longitude) * radii.z;
          if (deform) ({ x, y, z } = deform({ x, y, z, latitude, longitude }));
          const world = { x: center.x + x, y: center.y + y, z: center.z + z };
          let lobe = structure;
          if (structure === 'cerebrum') {
            if (world.z > 0.30) lobe = 'frontal';
            else if (world.z < -0.46) lobe = 'occipital';
            else if (world.y < -0.04 && Math.abs(world.x) > 0.33) lobe = 'temporal';
            else lobe = 'parietal';
          }
          points.push({
            ...world,
            hemisphere,
            structure,
            lobe,
            major: latIndex % 3 === 0 || lonIndex % 5 === 0,
            gridLat: latIndex,
            gridLon: lonIndex
          });
        }
      }
    };

    for (const hemisphere of ['left', 'right']) {
      const side = hemisphere === 'left' ? -1 : 1;
      pushEllipsoid({
        center: { x: side * 0.39, y: 0.05, z: 0.00 },
        radii: { x: 0.43, y: 0.72, z: 0.95 },
        hemisphere,
        structure: 'cerebrum',
        densityLat: 26,
        densityLon: 38,
        deform: ({ x, y, z, latitude, longitude }) => {
          const fold = 1 + 0.025 * Math.sin(longitude * 8 + latitude * 5) + 0.014 * Math.sin(longitude * 15 - latitude * 3);
          const frontRound = z > 0 ? 1 + z * 0.05 : 1;
          const ventralIndent = y < -0.18 && z > -0.18 ? 0.92 : 1;
          return {
            x: side * Math.abs(x) * fold * ventralIndent,
            y: y * fold + 0.025 * Math.cos(longitude * 3),
            z: z * fold * frontRound
          };
        }
      });
      pushEllipsoid({
        center: { x: side * 0.30, y: -0.55, z: -0.55 },
        radii: { x: 0.29, y: 0.22, z: 0.30 },
        hemisphere,
        structure: 'cerebellum',
        densityLat: 14,
        densityLon: 26,
        deform: ({ x, y, z, longitude }) => ({ x, y: y * 0.92, z: z * (1 + 0.06 * Math.sin(longitude * 9)) })
      });
      pushEllipsoid({
        center: { x: side * 0.035, y: -0.54, z: -0.03 },
        radii: { x: 0.055, y: 0.28, z: 0.085 },
        hemisphere,
        structure: 'brainstem',
        densityLat: 10,
        densityLon: 14
      });
    }
    state.brain3d.shellPoints = points;
  }

  function resetBrain3DView() {
    state.brain3d.yaw = -0.42;
    state.brain3d.pitch = 0.12;
    state.brain3d.zoom = 1;
    state.brain3d.viewPreset = 'perspective';
  }

  function cacheElements() {
    const ids = [
      'runStatusDot', 'runStatusText', 'stepCount', 'simTime', 'dataSourceBadge', 'engineBadge',
      'stimulusPreset', 'stimulusStrength', 'stimulusStrengthValue', 'stimulusDuration', 'stimulusDurationValue',
      'stimulusRepeats', 'stimulusInterval', 'stimulateBtn', 'sequenceStatus',
      'playBtn', 'pauseBtn', 'stepBtn', 'resetBtn', 'resetLearningBtn', 'speedSelect', 'autoStopSelect',
      'plasticityToggle', 'noiseToggle', 'seedInput', 'trialSeedInput', 'thresholdScale', 'thresholdScaleValue',
      'modelPreset', 'modelPresetDescription', 'heterogeneity', 'heterogeneityValue', 'fatigueStrength', 'fatigueStrengthValue',
      'inhibitoryGain', 'inhibitoryGainValue', 'shortTermPlasticityToggle', 'homeostasisToggle', 'applyPresetBtn', 'modelMonitor',
      'connectionDensity', 'connectionDensityValue', 'regenerateBtn', 'viewMode', 'connectionFilter', 'relationDisplay',
      'networkStage', 'networkCanvas', 'regionLabels', 'focusHint', 'networkLegend', 'brain3dControls', 'hemisphereSelect',
      'shellToggle', 'autoRotateToggle', 'reset3DViewBtn', 'surfaceStyleSelect', 'labelsToggle', 'deepToggle', 'sliceAxisSelect', 'slicePosition', 'slicePositionLabel', 'isolateSelectedToggle', 'viewPresetButtons', 'liveViewBtn', 'historyStepSlider', 'historyStepLabel',
      'chartStage', 'activityChart', 'chartCaption',
      'totalSpikes', 'peakSpikes', 'avgSpikes', 'activeRegions',
      'selectionEmpty', 'selectionDetails', 'selectedNodeBadge', 'selectedNodeName', 'selectedNodeType', 'selectionData',
      'atlasSystemFilter', 'atlasSummary', 'atlasHierarchy',
      'engineMode', 'engineAdapter', 'engineAdapterStatus', 'apiUrl', 'deploymentEnvironment', 'payloadEstimate', 'remoteChunkSize', 'engineLatency', 'engineFallbackToggle', 'testApiBtn', 'refreshAdaptersBtn', 'validateApiBtn', 'inspectAdapterBtn', 'exportAdapterBtn', 'deploymentCheckBtn', 'copyApiUrlBtn', 'engineSelfTestBtn', 'engineStatus', 'deploymentStatus',
      'dataSourceMode', 'externalDataType', 'externalApplyMode', 'externalSourceName', 'externalSourceVersion', 'externalCoordinateSpace',
      'importDatasetBtn', 'exportDatasetBtn', 'downloadDatasetTemplateBtn', 'resetDatasetBtn', 'externalDataInput', 'externalDataStatus',
      'pathDirection', 'pathDepth', 'pathMetric', 'pathThreshold', 'pathThresholdValue', 'analyzePathBtn', 'clearPathBtn',
      'pathAnalysisResult', 'propagationTimeline', 'interventionType', 'interventionStrength', 'interventionStrengthValue',
      'applyInterventionBtn', 'clearInterventionsBtn', 'interventionStatus',
      'regionActivity', 'eventLog', 'experimentName', 'experimentNote', 'saveExperimentBtn', 'savedExperiments',
      'templateSelect', 'templateDetail', 'templateTargetField', 'templateTargetRegion', 'templateIntensity', 'templateAutoSave',
      'applyTemplateBtn', 'runTemplateBtn', 'templateTimeline', 'templateStatus',
      'scenarioName', 'scenarioRunSteps', 'scenarioResetMode', 'scenarioAutoSave', 'saveScenarioBtn', 'scenarioSelect',
      'loadScenarioBtn', 'runScenarioBtn', 'deleteScenarioBtn', 'scenarioStatus',
      'compareA', 'compareB', 'compareResult', 'showComparisonBtn', 'clearComparisonBtn', 'exportReportBtn',
      'comparisonBadge', 'exportBtn', 'importBtn', 'importInput',
      'openAnalysisBtn', 'analysisModal', 'closeAnalysisBtn', 'refreshAnalysisBtn', 'exportAnalysisBtn',
      'analysisRange', 'analysisPrimaryRegion', 'analysisSecondaryRegion', 'analysisRouteSelect',
      'analysisCursor', 'analysisCursorLabel', 'analysisCursorSummary', 'analysisLiveBtn', 'analysisTo3DBtn',
      'analysisMetricSpikes', 'analysisMetricSpikesSub', 'analysisMetricRegion', 'analysisMetricRegionSub',
      'analysisMetricEI', 'analysisMetricEISub', 'analysisMetricRoute', 'analysisMetricRouteSub',
      'analysisMetricCorrelation', 'analysisMetricCorrelationSub', 'analysisMetricSynapse', 'analysisMetricSynapseSub',
      'analysisInterpretation', 'analysisArrivalTable', 'analysisEITable', 'analysisRouteTable', 'analysisSynapseTable',
      'analysisTimelineCanvas', 'analysisCorrelationCanvas', 'analysisSynapseCanvas', 'analysisOverlayCanvas',
      'analysisExperimentA', 'analysisExperimentB'
    ];
    for (const id of ids) {
      const element = document.getElementById(id);
      if (!element) throw new Error(`必要な要素が見つかりません: #${id}`);
      els[id] = element;
    }
    state.networkCanvas = els.networkCanvas;
    state.networkCtx = state.networkCanvas.getContext('2d');
    state.chartCanvas = els.activityChart;
    state.chartCtx = state.chartCanvas.getContext('2d');
    state.networkStage = els.networkStage;
    state.chartStage = els.chartStage;
    state.analysis.timelineCtx = els.analysisTimelineCanvas.getContext('2d');
    state.analysis.correlationCtx = els.analysisCorrelationCanvas.getContext('2d');
    state.analysis.synapseCtx = els.analysisSynapseCanvas.getContext('2d');
    state.analysis.overlayCtx = els.analysisOverlayCanvas.getContext('2d');
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function restoreBuiltinStructures() {
    REGIONS = deepClone(BUILTIN_REGIONS);
    REGION_BY_ID = new Map(REGIONS.map(region => [region.id, region]));
    ROUTE_BIASES = new Map(BUILTIN_ROUTE_BIASES);
  }

  function refreshRegionDependentControls() {
    if (!els.atlasSystemFilter) return;
    const previousFilter = els.atlasSystemFilter.value || 'all';
    const systems = [...new Set(REGIONS.map(region => region.system).filter(Boolean))];
    els.atlasSystemFilter.innerHTML = `<option value="all">すべて</option>${systems.map(system => `<option value="${escapeHtml(system)}">${escapeHtml(system)}</option>`).join('')}`;
    els.atlasSystemFilter.value = systems.includes(previousFilter) ? previousFilter : 'all';

    const target = els.templateTargetRegion?.value || 'PFC';
    if (els.templateTargetRegion) {
      els.templateTargetRegion.innerHTML = REGIONS.map(region => `<option value="${region.id}">${escapeHtml(region.name)}</option>`).join('');
      els.templateTargetRegion.value = REGION_BY_ID.has(target) ? target : REGIONS[0]?.id || '';
    }

    if (els.analysisPrimaryRegion && els.analysisSecondaryRegion) {
      const primary = REGION_BY_ID.has(state.analysis.primaryRegionId) ? state.analysis.primaryRegionId : REGIONS[0]?.id;
      const secondary = REGION_BY_ID.has(state.analysis.secondaryRegionId) ? state.analysis.secondaryRegionId : REGIONS[1]?.id || primary;
      state.analysis.primaryRegionId = primary;
      state.analysis.secondaryRegionId = secondary;
      const options = REGIONS.map(region => `<option value="${region.id}">${escapeHtml(region.name)}</option>`).join('');
      els.analysisPrimaryRegion.innerHTML = options;
      els.analysisSecondaryRegion.innerHTML = options;
      els.analysisPrimaryRegion.value = primary;
      els.analysisSecondaryRegion.value = secondary;
    }
    renderAtlasHierarchy();
  }

  function currentDataSourceDescriptor() {
    const dataset = state.externalData.dataset;
    if (state.externalData.mode !== 'external' || !dataset) {
      return { mode: 'builtin', name: '内蔵19領域モデル', version: MODEL_VERSION, coordinateSpace: 'normalized-concept' };
    }
    return {
      mode: 'external',
      name: dataset.source?.name || '読み込みデータ',
      version: dataset.source?.version || '',
      coordinateSpace: dataset.coordinateSpace || dataset.source?.coordinateSpace || 'normalized',
      importedAt: dataset.importedAt || null,
      appliedRegions: dataset.summary?.appliedRegions || 0,
      appliedConnections: dataset.summary?.appliedConnections || 0
    };
  }

  function normalizeApiUrl(value) {
    const fallback = RUNTIME_CONFIG.defaultApiUrl || 'http://127.0.0.1:8765';
    return String(value || fallback).trim().replace(/\/+$/, '');
  }

  function runtimeEnvironmentLabel() {
    return RUNTIME_CONFIG.environmentLabel || (window.location.protocol === 'file:' ? 'ローカルファイル' : 'ブラウザ');
  }

  function estimatePayloadBytes(steps = null) {
    try {
      const payload = remoteSimulationPayload(Math.max(1, Number(steps || state.engine.chunkSize || 1)));
      return new Blob([JSON.stringify(payload)]).size;
    } catch (error) {
      return 0;
    }
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }

  function updateDeploymentFields() {
    if (els.deploymentEnvironment) els.deploymentEnvironment.value = runtimeEnvironmentLabel();
    state.engine.payloadBytes = estimatePayloadBytes();
    if (els.payloadEstimate) els.payloadEstimate.value = formatBytes(state.engine.payloadBytes);
  }

  function currentEngineDescriptor() {
    return {
      mode: state.engine.mode,
      label: state.engine.mode === 'remote' ? 'Python API / 公開対応' : 'ブラウザ',
      apiUrl: state.engine.mode === 'remote' ? state.engine.apiUrl : null,
      connected: state.engine.connected,
      serverVersion: state.engine.serverVersion,
      serverEngine: state.engine.serverEngine,
      latencyMs: state.engine.latencyMs,
      adapterId: state.engine.adapterId,
      adapterName: selectedEngineAdapter()?.name || state.engine.adapterId
    };
  }

  function selectedEngineAdapter() {
    return state.engine.adapters.find(item => item.id === state.engine.adapterId) || {
      id: state.engine.adapterId || 'native',
      name: state.engine.adapterId === 'native' ? 'Virtual Brain Native' : state.engine.adapterId,
      status: state.engine.adapterId === 'native' ? 'ready' : 'unknown',
      executable: state.engine.adapterId === 'native',
      packageDetected: state.engine.adapterId === 'native',
      description: 'API接続後に詳細を取得します。',
      scale: ''
    };
  }

  function adapterInspectPayload() {
    return {
      regions: REGIONS.map(region => region.id),
      nodes: state.nodes,
      edges: state.edges,
      config: {
        plasticity: els.plasticityToggle.checked,
        noise: els.noiseToggle.checked,
        thresholdScale: Number(els.thresholdScale.value),
        fatigueStrength: Number(els.fatigueStrength.value),
        inhibitoryGain: Number(els.inhibitoryGain.value),
        shortTermPlasticity: els.shortTermPlasticityToggle.checked,
        homeostasis: els.homeostasisToggle.checked,
        modelPreset: state.modelPreset
      }
    };
  }

  function renderEngineAdapterOptions() {
    if (!els.engineAdapter) return;
    const adapters = state.engine.adapters.length ? state.engine.adapters : [{ id: 'native', name: 'Virtual Brain Native', executable: true, status: 'ready' }];
    els.engineAdapter.innerHTML = adapters.map(adapter => {
      const suffix = adapter.executable ? '実行可' : adapter.packageDetected ? '変換準備' : '未導入';
      return `<option value="${escapeHtml(adapter.id)}">${escapeHtml(adapter.name)}（${suffix}）</option>`;
    }).join('');
    if (!adapters.some(adapter => adapter.id === state.engine.adapterId)) state.engine.adapterId = 'native';
    els.engineAdapter.value = state.engine.adapterId;
    els.engineAdapter.disabled = state.engine.mode !== 'remote';
    renderEngineAdapterStatus();
  }

  function renderEngineAdapterStatus(report = null) {
    if (!els.engineAdapterStatus) return;
    const adapter = selectedEngineAdapter();
    const effectiveReport = report || state.engine.adapterReport;
    if (effectiveReport && effectiveReport.engine?.id === adapter.id) {
      const warnings = (effectiveReport.warnings || []).slice(0, 3);
      els.engineAdapterStatus.className = `adapter-status ${adapter.executable ? 'active' : 'warn'}`;
      els.engineAdapterStatus.innerHTML = `<strong>${escapeHtml(adapter.name)} / 互換性 ${Number(effectiveReport.score || 0)}%</strong><small>${escapeHtml(adapter.scale || '')} / ${effectiveReport.summary?.nodes || 0}N・${effectiveReport.summary?.edges || 0}E・${effectiveReport.summary?.regions || 0}領域</small>${warnings.length ? `<ul>${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}<small>${escapeHtml(effectiveReport.recommendedNextStep || '')}</small>`;
      return;
    }
    const statusLabel = adapter.executable ? '直接計算可能' : adapter.packageDetected ? '変換準備のみ' : 'パッケージ未検出・変換準備のみ';
    els.engineAdapterStatus.className = `adapter-status ${adapter.executable ? 'active' : 'empty-state'}`;
    els.engineAdapterStatus.innerHTML = `<strong>${escapeHtml(adapter.name)}：${escapeHtml(statusLabel)}</strong><small>${escapeHtml(adapter.description || '')}${adapter.scale ? ` / ${escapeHtml(adapter.scale)}` : ''}</small>`;
  }

  async function refreshEngineAdapters({ silent = false } = {}) {
    if (state.engine.mode !== 'remote') {
      state.engine.adapters = [{ id: 'native', name: 'Virtual Brain Native', executable: true, packageDetected: true, status: 'ready', description: 'ブラウザ内計算ではNativeモデルを使用します。', scale: '概念モデル' }];
      state.engine.adapterId = 'native';
      renderEngineAdapterOptions();
      return true;
    }
    if (!state.engine.connected && !(await testApiConnection({ silent: true, skipAdapterRefresh: true }))) return false;
    try {
      const data = await apiRequest('/api/v1/engines', { timeout: 8000 });
      state.engine.adapters = Array.isArray(data.engines) ? data.engines : [];
      renderEngineAdapterOptions();
      if (!silent) addEvent(`計算アダプター${state.engine.adapters.length}件を取得`, true);
      return true;
    } catch (error) {
      state.engine.lastError = String(error.message || error);
      renderEngineStatus();
      return false;
    }
  }

  async function inspectSelectedAdapter() {
    if (state.engine.mode !== 'remote') await changeEngineMode('remote');
    if (!state.engine.connected && !(await testApiConnection({ silent: true }))) return;
    const adapter = selectedEngineAdapter();
    try {
      const report = await apiRequest(`/api/v1/engines/${encodeURIComponent(adapter.id)}/compatibility`, {
        method: 'POST',
        timeout: 15000,
        body: adapterInspectPayload()
      });
      state.engine.adapterReport = report;
      renderEngineAdapterStatus(report);
      addEvent(`${adapter.name}の互換性診断：${report.score}%`, true);
    } catch (error) {
      state.engine.lastError = String(error.message || error);
      renderEngineStatus();
    }
  }

  async function exportSelectedAdapter() {
    if (state.engine.mode !== 'remote') await changeEngineMode('remote');
    if (!state.engine.connected && !(await testApiConnection({ silent: true }))) return;
    const adapter = selectedEngineAdapter();
    try {
      const manifest = await apiRequest(`/api/v1/engines/${encodeURIComponent(adapter.id)}/export`, {
        method: 'POST',
        timeout: 20000,
        body: adapterInspectPayload()
      });
      downloadJsonFile(manifest, `virtual-brain-${MODEL_VERSION}-${adapter.id}-adapter.json`);
      renderEngineAdapterStatus(manifest.compatibility || null);
      addEvent(`${adapter.name}用の変換設定を書き出しました`, true);
    } catch (error) {
      state.engine.lastError = String(error.message || error);
      renderEngineStatus();
    }
  }

  async function runSelectedEngineSelfTest() {
    if (state.engine.mode !== 'remote') await changeEngineMode('remote');
    if (!state.engine.connected && !(await testApiConnection({ silent: true }))) return;
    const adapter = selectedEngineAdapter();
    state.engine.lastError = null;
    renderEngineStatus(`${adapter.name}を確認中`);
    try {
      const result = await apiRequest(`/api/v1/engines/${encodeURIComponent(adapter.id)}/self-test`, {
        method: 'POST',
        timeout: 20000,
        body: {}
      });
      state.engine.engineDetails = result;
      const spikeText = result.spikeCount === undefined ? '' : ` / spike ${result.spikeCount}`;
      const versionText = result.packageVersion ? ` / ${result.packageVersion}` : '';
      renderEngineStatus(`セルフテストOK${versionText}${spikeText}`);
      addEvent(`${adapter.name}のセルフテスト完了`, true);
      await refreshEngineAdapters({ silent: true });
    } catch (error) {
      state.engine.lastError = String(error.message || error);
      renderEngineStatus();
      addEvent(`${adapter.name}のセルフテストに失敗`, true);
    }
  }

  async function changeEngineAdapter(adapterId) {
    state.engine.adapterId = String(adapterId || 'native');
    state.engine.adapterReport = null;
    state.engine.lastError = null;
    const adapter = selectedEngineAdapter();
    persistEngineSettings();
    renderEngineAdapterStatus();
    if (!adapter.executable) {
      renderEngineStatus(`${adapter.name}は診断・書き出しのみ`);
      addEvent(`${adapter.name}を変換対象として選択`, true);
    } else {
      renderEngineStatus(`${adapter.name}を選択`);
      addEvent(`${adapter.name}を計算対象として選択`, true);
    }
  }

  function persistEngineSettings() {
    try {
      localStorage.setItem(ENGINE_STORAGE_KEY, JSON.stringify({
        mode: state.engine.mode,
        apiUrl: state.engine.apiUrl,
        chunkSize: state.engine.chunkSize,
        fallback: state.engine.fallback,
        adapterId: state.engine.adapterId
      }));
    } catch (error) {
      console.warn('計算エンジン設定の保存に失敗しました。', error);
    }
  }

  function loadEngineSettings() {
    try {
      let raw = localStorage.getItem(ENGINE_STORAGE_KEY);
      if (!raw) {
        for (const key of LEGACY_ENGINE_STORAGE_KEYS) {
          raw = localStorage.getItem(key);
          if (raw) break;
        }
      }
      const saved = JSON.parse(raw || '{}');
      const hasSavedMode = saved.mode === 'remote' || saved.mode === 'local';
      state.engine.mode = hasSavedMode ? saved.mode : (RUNTIME_CONFIG.defaultEngineMode === 'remote' ? 'remote' : 'local');
      const hostedDefault = RUNTIME_CONFIG.defaultApiUrl || state.engine.apiUrl;
      const savedUrl = String(saved.apiUrl || '');
      const staleLocalUrl = RUNTIME_CONFIG.environment === 'hosted' && /localhost|127\.0\.0\.1/.test(savedUrl);
      state.engine.apiUrl = normalizeApiUrl(staleLocalUrl ? hostedDefault : (savedUrl || hostedDefault));
      state.engine.chunkSize = [1, 4, 8, 16, 32].includes(Number(saved.chunkSize)) ? Number(saved.chunkSize) : Number(RUNTIME_CONFIG.defaultChunkSize || 4);
      state.engine.fallback = saved.fallback !== false && RUNTIME_CONFIG.allowBrowserFallback !== false;
      state.engine.adapterId = String(saved.adapterId || 'native');
    } catch (error) {
      console.warn('計算エンジン設定の読み込みに失敗しました。', error);
      state.engine.mode = RUNTIME_CONFIG.defaultEngineMode === 'remote' ? 'remote' : 'local';
      state.engine.apiUrl = normalizeApiUrl(RUNTIME_CONFIG.defaultApiUrl);
      state.engine.adapterId = 'native';
    }
    els.engineMode.value = state.engine.mode;
    els.apiUrl.value = state.engine.apiUrl;
    els.remoteChunkSize.value = String(state.engine.chunkSize);
    if (els.engineAdapter) els.engineAdapter.value = state.engine.adapterId;
    els.engineFallbackToggle.checked = state.engine.fallback;
    updateDeploymentFields();
    renderEngineAdapterOptions();
    renderEngineStatus();
    renderDeploymentStatus();
  }

  function renderEngineStatus(message = '') {
    if (!els.engineStatus) return;
    els.engineMode.value = state.engine.mode;
    els.engineBadge.textContent = state.engine.mode === 'remote' ? (selectedEngineAdapter().id === 'native' ? 'Python' : selectedEngineAdapter().name) : 'ブラウザ';
    els.engineBadge.className = state.engine.busy ? 'busy' : state.engine.lastError ? 'error' : state.engine.mode === 'remote' ? 'remote' : '';
    if (state.engine.latencyMs === null) els.engineLatency.value = state.engine.mode === 'remote' ? '未接続' : 'ローカル';
    else els.engineLatency.value = `${Math.round(state.engine.latencyMs)} ms`;

    if (state.engine.busy || state.engine.connecting) {
      els.engineStatus.className = 'engine-status busy';
      els.engineStatus.innerHTML = `<strong>${state.engine.connecting ? 'Python APIへ接続中' : 'Python APIで計算中'}</strong><small>${escapeHtml(state.engine.apiUrl)}${state.engine.connecting ? '' : ` / request ${state.engine.requestCount}`}${message ? ` / ${escapeHtml(message)}` : ''}</small>`;
      return;
    }
    if (state.engine.lastError) {
      els.engineStatus.className = 'engine-status error';
      els.engineStatus.innerHTML = `<strong>計算エンジンエラー</strong><small>${escapeHtml(state.engine.lastError)}${state.engine.fallback ? ' / ブラウザ計算へ自動復帰可能' : ''}</small>`;
      return;
    }
    if (state.engine.mode === 'remote' && state.engine.connected) {
      els.engineStatus.className = 'engine-status active';
      els.engineStatus.innerHTML = `<strong>Python API接続済み</strong><small>${escapeHtml(selectedEngineAdapter().name)} / ${escapeHtml(state.engine.serverEngine || 'python-engine')} / ${escapeHtml(state.engine.serverVersion || '')} / ${Math.round(state.engine.latencyMs || 0)} ms${message ? ` / ${escapeHtml(message)}` : ''}</small>`;
      return;
    }
    if (state.engine.mode === 'remote') {
      els.engineStatus.className = 'engine-status empty-state';
      els.engineStatus.innerHTML = `<strong>Python APIを選択中</strong><small>接続テスト後に再生してください。${message ? ` / ${escapeHtml(message)}` : ''}</small>`;
      return;
    }
    els.engineStatus.className = 'engine-status empty-state';
    els.engineStatus.innerHTML = `<strong>ブラウザ内計算</strong><small>従来版と同じく、すべての発火計算をこの画面内で実行します。${message ? ` / ${escapeHtml(message)}` : ''}</small>`;
  }

  async function apiRequest(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(options.timeout || RUNTIME_CONFIG.requestTimeoutMs || 12000));
    const started = performance.now();
    try {
      const response = await fetch(`${state.engine.apiUrl}${path}`, {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
      state.engine.latencyMs = performance.now() - started;
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function testApiConnection({ silent = false, skipAdapterRefresh = false } = {}) {
    if (state.engine.connecting) return false;
    state.engine.apiUrl = normalizeApiUrl(els.apiUrl.value);
    els.apiUrl.value = state.engine.apiUrl;
    state.engine.lastError = null;
    state.engine.connecting = true;
    renderEngineStatus('接続確認中');
    try {
      const data = await apiRequest('/api/health', { timeout: 5000 });
      state.engine.connected = data.status === 'ok';
      state.engine.serverVersion = data.version || null;
      state.engine.serverEngine = data.engine || null;
      state.engine.deployment = data.deployment || null;
      state.engine.lastError = null;
      if (Array.isArray(data.adapters)) state.engine.adapters = data.adapters;
      renderEngineAdapterOptions();
      persistEngineSettings();
      renderEngineStatus('接続確認完了');
      if (!silent) addEvent(`Python API接続：${data.engine || 'engine'} / ${Math.round(state.engine.latencyMs || 0)}ms`, true);
      return true;
    } catch (error) {
      state.engine.connected = false;
      state.engine.lastError = error.name === 'AbortError' ? '接続がタイムアウトしました。' : String(error.message || error);
      renderEngineStatus();
      if (!silent) addEvent('Python APIへ接続できません', true);
      return false;
    } finally {
      state.engine.connecting = false;
      renderEngineStatus();
    }
  }

  function renderDeploymentStatus(result = null) {
    if (!els.deploymentStatus) return;
    const environment = runtimeEnvironmentLabel();
    const secure = window.isSecureContext;
    const hosted = RUNTIME_CONFIG.environment === 'hosted';
    const payloadBytes = estimatePayloadBytes();
    state.engine.payloadBytes = payloadBytes;
    if (els.payloadEstimate) els.payloadEstimate.value = formatBytes(payloadBytes);
    const warningLimit = Number(RUNTIME_CONFIG.maxPayloadWarningBytes || 3800000);
    const payloadWarning = payloadBytes >= warningLimit;
    if (result?.ok) {
      els.deploymentStatus.className = `deployment-status ${payloadWarning ? 'warn' : 'active'}`;
      els.deploymentStatus.innerHTML = `<strong>公開環境診断：正常</strong><small>${escapeHtml(environment)} / ${secure ? 'HTTPS・安全なコンテキスト' : '非HTTPS'} / API ${escapeHtml(state.engine.apiUrl)} / 送信量 ${formatBytes(payloadBytes)}${payloadWarning ? '（上限接近）' : ''}</small>`;
      return;
    }
    if (result?.error) {
      els.deploymentStatus.className = 'deployment-status error';
      els.deploymentStatus.innerHTML = `<strong>公開環境診断：API未接続</strong><small>${escapeHtml(environment)} / ${escapeHtml(result.error)} / ブラウザ計算は利用可能です。</small>`;
      return;
    }
    els.deploymentStatus.className = `deployment-status ${hosted ? 'active' : 'empty-state'}`;
    els.deploymentStatus.innerHTML = `<strong>${escapeHtml(environment)}</strong><small>${hosted ? 'Vercel同一オリジンAPIを利用できます。' : 'ローカルAPIを起動するか、ブラウザ内計算を使用します。'} / 推定送信量 ${formatBytes(payloadBytes)}</small>`;
  }

  async function runDeploymentCheck() {
    updateDeploymentFields();
    const connected = await testApiConnection({ silent: true });
    if (!connected) {
      renderDeploymentStatus({ error: state.engine.lastError || 'APIへ接続できません。' });
      return;
    }
    try {
      const data = await apiRequest('/api/v1/diagnostics', { timeout: 8000 });
      state.engine.deployment = data;
      renderDeploymentStatus({ ok: true });
      renderEngineStatus(`診断OK / Python ${data.python || '-'} / ${data.runtime || 'runtime'}`);
      addEvent('公開環境診断が完了しました', true);
    } catch (error) {
      renderDeploymentStatus({ error: String(error.message || error) });
    }
  }

  async function copyApiUrl() {
    const value = `${normalizeApiUrl(state.engine.apiUrl)}/api/health`;
    try {
      await navigator.clipboard.writeText(value);
      renderEngineStatus('API URLをコピーしました');
    } catch (error) {
      window.prompt('API URLをコピーしてください', value);
    }
  }

  async function validateRemoteNetwork() {
    if (!state.engine.connected && !(await testApiConnection({ silent: true }))) return;
    try {
      const result = await apiRequest('/api/v1/validate', {
        method: 'POST',
        body: {
          regions: REGIONS.map(region => region.id),
          nodes: state.nodes.map(node => ({ id: node.id, regionId: node.regionId })),
          edges: state.edges.map(edge => ({ source: edge.source, target: edge.target }))
        }
      });
      state.engine.lastError = null;
      renderEngineStatus(result.valid ? `モデル検証OK：${result.nodes}N / ${result.edges}E` : `要確認：不正接続${result.invalidEdgeIndexes?.length || 0}件`);
      addEvent(result.valid ? 'Python APIによる現在モデルの検証完了' : 'Python API検証で不整合を検出', true);
    } catch (error) {
      state.engine.lastError = String(error.message || error);
      renderEngineStatus();
    }
  }

  async function changeEngineMode(mode) {
    const previousMode = state.engine.mode;
    state.engine.mode = mode === 'remote' ? 'remote' : 'local';
    state.engine.apiUrl = normalizeApiUrl(els.apiUrl.value);
    state.engine.chunkSize = Number(els.remoteChunkSize.value) || 4;
    state.engine.fallback = els.engineFallbackToggle.checked;
    if (previousMode !== state.engine.mode) state.engine.generation += 1;
    state.engine.lastError = null;
    if (state.engine.mode === 'local') {
      state.engine.adapterId = 'native';
      state.engine.adapterReport = null;
    }
    persistEngineSettings();
    if (state.engine.mode === 'remote') await testApiConnection({ silent: true });
    renderEngineAdapterOptions();
    renderEngineStatus();
    addEvent(`計算エンジンを${state.engine.mode === 'remote' ? 'Python API' : 'ブラウザ'}へ切替`, true);
  }

  function plainStimulusSequence() {
    if (!state.stimulusSequence) return null;
    const sequence = state.stimulusSequence;
    return {
      preset: sequence.preset,
      regions: [...(sequence.regions || [])],
      regionWeights: sequence.regionWeights ? { ...sequence.regionWeights } : null,
      strength: Number(sequence.strength || 0),
      duration: Number(sequence.duration || 0),
      repeats: Number(sequence.repeats || 1),
      interval: Number(sequence.interval || 0),
      currentRepeat: Number(sequence.currentRepeat || 1),
      phase: sequence.phase || 'active',
      remaining: Number(sequence.remaining || 0),
      waitRemaining: Number(sequence.waitRemaining || 0)
    };
  }

  function remoteSimulationPayload(steps) {
    return {
      version: MODEL_VERSION,
      engine_id: state.engine.adapterId || 'native',
      steps,
      dt: DT,
      rng_state: state.engine.rngState >>> 0,
      step: state.step,
      sim_time: state.simTime,
      total_spikes: state.totalSpikes,
      peak_spikes: state.peakSpikes,
      nodes: state.nodes,
      edges: state.edges,
      regions: REGIONS.map(region => region.id),
      config: {
        plasticity: els.plasticityToggle.checked,
        noise: els.noiseToggle.checked,
        thresholdScale: Number(els.thresholdScale.value),
        fatigueStrength: Number(els.fatigueStrength.value),
        inhibitoryGain: Number(els.inhibitoryGain.value),
        shortTermPlasticity: els.shortTermPlasticityToggle.checked,
        homeostasis: els.homeostasisToggle.checked,
        modelPreset: state.modelPreset
      },
      stimulus_sequence: plainStimulusSequence(),
      interventions: [...state.interventions.entries()].map(([regionId, intervention]) => ({ regionId, ...intervention })),
      route_stats: state.analysis.routeStats,
      engine_state: state.engine.engineState || {}
    };
  }

  function reindexRemoteNetwork() {
    state.outgoing = new Map(state.nodes.map(node => [node.id, []]));
    state.incoming = new Map(state.nodes.map(node => [node.id, []]));
    for (const edge of state.edges) {
      if (!state.outgoing.has(edge.source)) state.outgoing.set(edge.source, []);
      if (!state.incoming.has(edge.target)) state.incoming.set(edge.target, []);
      state.outgoing.get(edge.source).push(edge);
      state.incoming.get(edge.target).push(edge);
    }
    const grouped = new Map();
    for (const edge of state.edges) {
      if (edge.sourceRegionId === edge.targetRegionId) continue;
      const key = `${edge.sourceRegionId}>${edge.targetRegionId}`;
      if (!grouped.has(key)) grouped.set(key, { key, sourceRegionId: edge.sourceRegionId, targetRegionId: edge.targetRegionId, edges: [] });
      grouped.get(key).edges.push(edge);
    }
    state.regionEdges = [...grouped.values()];
    state.regionEdgeMap = new Map(state.regionEdges.map(regionEdge => [regionEdge.key, regionEdge]));
  }

  function appendRemoteFrame(frame) {
    const regionCounts = frame.regionCounts || Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    state.step = Number(frame.step || state.step + 1);
    state.simTime = Number(frame.simTime ?? state.step * DT);
    state.totalSpikes += Number(frame.spikesThisStep || 0);
    state.peakSpikes = Math.max(state.peakSpikes, Number(frame.spikesThisStep || 0));
    state.history.push(Number(frame.spikesThisStep || 0));
    if (state.history.length > HISTORY_LIMIT) state.history.shift();
    for (const region of REGIONS) {
      if (!state.regionHistory[region.id]) state.regionHistory[region.id] = [];
      state.regionHistory[region.id].push(Number(regionCounts[region.id] || 0));
      if (state.regionHistory[region.id].length > HISTORY_LIMIT) state.regionHistory[region.id].shift();
    }
    state.lastRegionStepCounts = { ...regionCounts };
    state.analysis.records.push({
      step: state.step,
      totalSpikes: Number(frame.spikesThisStep || 0),
      regionCounts: { ...regionCounts },
      regionExcitatoryCounts: { ...(frame.regionExcitatoryCounts || {}) },
      regionInhibitoryCounts: { ...(frame.regionInhibitoryCounts || {}) },
      routeSignals: { ...(frame.routeSignals || {}) },
      synapseChange: { ...(frame.synapseChange || {}) },
      meanWeightChange: Number(frame.meanWeightChange || 0)
    });
    if (state.analysis.records.length > ANALYSIS_HISTORY_LIMIT) state.analysis.records.shift();
    state.activitySnapshots.push({
      step: state.step,
      regionCounts: { ...regionCounts },
      hemisphereCounts: { ...(frame.hemisphereCounts || {}) },
      edgeActivity: { ...(frame.edgeActivity || {}) }
    });
    if (state.activitySnapshots.length > ANALYSIS_HISTORY_LIMIT) state.activitySnapshots.shift();
    if (state.brain3d.live) state.brain3d.historyIndex = Math.max(0, state.activitySnapshots.length - 1);
    recordRegionPropagation(regionCounts);
    updateTemplateRun();
  }

  function executeLocalSteps(count) {
    const steps = Math.max(1, Number(count || 1));
    for (let index = 0; index < steps; index += 1) {
      simulationStep();
      if (state.autoStopTarget === null && !state.running && index + 1 < steps) break;
    }
  }

  async function remoteSimulationChunk(requestedSteps = null) {
    if (state.engine.busy || state.engine.connecting) return false;
    const adapter = selectedEngineAdapter();
    if (!adapter.executable) {
      state.running = false;
      state.engine.lastError = `${adapter.name}は現在のAPI環境では直接計算できません。互換性診断または変換設定書き出しを利用してください。`;
      renderEngineStatus();
      renderEngineAdapterStatus();
      updateStatus();
      addEvent(`${adapter.name}の直接計算は未対応`, true);
      return false;
    }
    if (!state.engine.connected && !(await testApiConnection({ silent: true }))) {
      if (state.engine.fallback) {
        state.engine.mode = 'local';
        state.engine.lastError = null;
        persistEngineSettings();
        renderEngineStatus('接続失敗のため自動復帰');
        addEvent('Python API未接続のためブラウザ計算へ復帰', true);
        executeLocalSteps(requestedSteps || state.engine.chunkSize || 1);
        return true;
      }
      state.running = false;
      updateStatus();
      return false;
    }

    let steps = Math.max(1, Number(requestedSteps || state.engine.chunkSize || 1));
    if (state.templateRun && !state.templateRun.complete) steps = 1;
    if (state.autoStopTarget !== null) steps = Math.min(steps, Math.max(1, state.autoStopTarget - state.step));

    const requestGeneration = state.engine.generation;
    state.engine.busy = true;
    state.engine.requestCount += 1;
    state.engine.lastError = null;
    renderEngineStatus(`${steps} step`);
    try {
      const response = await apiRequest('/api/v1/simulate', {
        method: 'POST',
        timeout: 20000,
        body: remoteSimulationPayload(steps)
      });
      if (requestGeneration !== state.engine.generation) return false;
      state.nodes = response.nodes || state.nodes;
      state.edges = response.edges || state.edges;
      state.stimulusSequence = response.stimulusSequence || null;
      state.analysis.routeStats = response.routeStats || state.analysis.routeStats;
      state.engine.rngState = Number(response.rngState || state.engine.rngState) >>> 0;
      state.engine.serverVersion = response.version || state.engine.serverVersion;
      state.engine.serverEngine = response.engine || state.engine.serverEngine;
      state.engine.engineState = response.engineState || state.engine.engineState || {};
      state.engine.engineDetails = response.engineDetails || null;
      if (response.engineId) state.engine.adapterId = response.engineId;
      reindexRemoteNetwork();
      for (const frame of response.frames || []) appendRemoteFrame(frame);
      state.totalSpikes = Number(response.totalSpikes ?? state.totalSpikes);
      state.peakSpikes = Number(response.peakSpikes ?? state.peakSpikes);
      state.step = Number(response.step ?? state.step);
      state.simTime = Number(response.simTime ?? state.simTime);
      state.engine.connected = true;
      state.engine.lastError = null;

      if (state.autoStopTarget !== null && state.step >= state.autoStopTarget) {
        state.running = false;
        state.autoStopTarget = null;
        addEvent(`Python API自動停止：step ${state.step}`, true);
        updateStatus();
        completeScenarioRun();
        completeTemplateRun();
      }
      updateSequenceStatus();
      update3DHistoryControls();
      updateMetrics();
      updateRegionActivity();
      updateSelection();
      renderModelMonitor();
      renderScenarioStatus();
      renderTemplateStatus();
      if (state.analysis.open) refreshAnalysis(false);
      renderEngineStatus(`${response.elapsedMs ?? '-'}msで${(response.frames || []).length} step計算`);
      return true;
    } catch (error) {
      state.engine.connected = false;
      state.engine.lastError = error.name === 'AbortError' ? '計算要求がタイムアウトしました。' : String(error.message || error);
      renderEngineStatus();
      if (state.engine.fallback) {
        state.engine.mode = 'local';
        state.engine.lastError = null;
        persistEngineSettings();
        renderEngineStatus('API失敗のためブラウザ計算へ復帰');
        addEvent('Python API計算に失敗しブラウザ計算へ復帰', true);
        executeLocalSteps(steps);
      } else {
        state.running = false;
        updateStatus();
      }
      return false;
    } finally {
      state.engine.busy = false;
      renderEngineStatus();
    }
  }

  async function executeSingleStep() {
    if (state.engine.mode === 'remote') await remoteSimulationChunk(1);
    else simulationStep();
  }

  function renderExternalDataStatus(message = '') {
    if (!els.externalDataStatus) return;
    const descriptor = currentDataSourceDescriptor();
    const isExternal = descriptor.mode === 'external';
    els.dataSourceMode.value = isExternal ? 'external' : 'builtin';
    els.dataSourceBadge.textContent = isExternal ? '外部' : '内蔵';
    const dataset = state.externalData.dataset;
    if (!isExternal || !dataset) {
      els.externalDataStatus.className = 'dataset-status empty-state';
      els.externalDataStatus.innerHTML = `<strong>内蔵19領域モデル</strong><small>近似座標・仮説接続を使用中${message ? ` / ${escapeHtml(message)}` : ''}</small>`;
      return;
    }
    const summary = dataset.summary || {};
    els.externalDataStatus.className = 'dataset-status active';
    els.externalDataStatus.innerHTML = `<strong>${escapeHtml(descriptor.name)}${descriptor.version ? ` / ${escapeHtml(descriptor.version)}` : ''}</strong><small>領域反映 ${summary.appliedRegions || 0}件・接続反映 ${summary.appliedConnections || 0}件・無視 ${summary.ignored || 0}件 / 座標 ${escapeHtml(descriptor.coordinateSpace || '未指定')}${message ? ` / ${escapeHtml(message)}` : ''}</small>`;
  }

  function normalizeDatasetWeight(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const absolute = Math.abs(numeric);
    if (absolute <= 1.2) return clamp(0.65 + absolute * 5.35, 0.05, 7.5);
    return clamp(absolute, 0.05, 7.5);
  }

  function numberOrUndefined(value) {
    if (value === '' || value === null || value === undefined) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  function normalizedRegionPatch(row) {
    const id = String(row.id || row.regionId || row.region_id || '').trim();
    if (!id || !BUILTIN_REGIONS.some(region => region.id === id)) return null;
    const patch = { id };
    const textFields = ['name', 'short', 'system', 'lobe', 'level', 'parent', 'functions', 'evidence'];
    for (const field of textFields) {
      if (row[field] !== undefined && String(row[field]).trim()) patch[field] = String(row[field]).trim();
    }
    const values = {
      x: numberOrUndefined(row.x ?? row.x2d),
      y: numberOrUndefined(row.y ?? row.y2d),
      lateral: numberOrUndefined(row.lateral ?? row.x3d),
      vertical: numberOrUndefined(row.vertical ?? row.y3d),
      depth: numberOrUndefined(row.depth ?? row.z3d),
      count: numberOrUndefined(row.count ?? row.neuronCount)
    };
    if (values.x !== undefined) patch.x = clamp(values.x, 0.02, 0.98);
    if (values.y !== undefined) patch.y = clamp(values.y, 0.02, 0.98);
    if (values.lateral !== undefined) patch.lateral = clamp(Math.abs(values.lateral), 0.03, 0.85);
    if (values.vertical !== undefined) patch.vertical = clamp(values.vertical, -0.95, 0.95);
    if (values.depth !== undefined) patch.depth = clamp(values.depth, -0.98, 0.98);
    if (values.count !== undefined) patch.count = Math.round(clamp(values.count, 4, 30));
    return patch;
  }

  function normalizedConnection(row) {
    const source = String(row.source || row.sourceRegionId || row.from || '').trim();
    const target = String(row.target || row.targetRegionId || row.to || '').trim();
    if (!source || !target || source === target) return null;
    if (!BUILTIN_REGIONS.some(region => region.id === source) || !BUILTIN_REGIONS.some(region => region.id === target)) return null;
    const weight = normalizeDatasetWeight(row.weight ?? row.strength ?? row.value);
    if (weight === null) return null;
    return {
      source,
      target,
      weight,
      evidence: String(row.evidence || row.sourceNote || '').trim()
    };
  }

  function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (char === '"') {
        if (quoted && input[index + 1] === '"') { field += '"'; index += 1; }
        else quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(field.trim()); field = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && input[index + 1] === '\n') index += 1;
        row.push(field.trim()); field = '';
        if (row.some(value => value !== '')) rows.push(row);
        row = [];
      } else field += char;
    }
    row.push(field.trim());
    if (row.some(value => value !== '')) rows.push(row);
    if (rows.length < 2) return [];
    const headers = rows[0].map(value => value.trim());
    return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
  }

  function inferCsvType(rows) {
    const keys = new Set(Object.keys(rows[0] || {}).map(key => key.toLowerCase()));
    if (keys.has('source') || keys.has('target') || keys.has('from') || keys.has('to')) return 'connections';
    return 'regions';
  }

  function normalizeImportedDataset(raw, fileName = '') {
    const typeSetting = els.externalDataType.value;
    let source = {};
    let coordinateSpace = els.externalCoordinateSpace.value.trim() || 'normalized';
    let regionRows = [];
    let connectionRows = [];

    if (Array.isArray(raw)) {
      const inferred = typeSetting === 'auto' ? inferCsvType(raw) : typeSetting;
      if (inferred === 'connections') connectionRows = raw;
      else regionRows = raw;
    } else if (raw && typeof raw === 'object') {
      source = raw.source && typeof raw.source === 'object' ? raw.source : {};
      coordinateSpace = raw.coordinateSpace?.name || raw.coordinateSpace || source.coordinateSpace || coordinateSpace;
      regionRows = Array.isArray(raw.regions) ? raw.regions : [];
      connectionRows = Array.isArray(raw.connections) ? raw.connections : Array.isArray(raw.edges) ? raw.edges : [];
      if (!regionRows.length && !connectionRows.length && raw.data && Array.isArray(raw.data)) {
        const inferred = typeSetting === 'auto' ? inferCsvType(raw.data) : typeSetting;
        if (inferred === 'connections') connectionRows = raw.data;
        else regionRows = raw.data;
      }
    } else throw new Error('対応するデータ形式ではありません。');

    const regions = regionRows.map(normalizedRegionPatch).filter(Boolean);
    const connections = connectionRows.map(normalizedConnection).filter(Boolean);
    const ignored = Math.max(0, regionRows.length - regions.length) + Math.max(0, connectionRows.length - connections.length);
    if (!regions.length && !connections.length) throw new Error('既存19領域のIDに一致する有効データがありません。');

    return {
      format: DATASET_FORMAT,
      source: {
        name: els.externalSourceName.value.trim() || source.name || fileName || '読み込みデータ',
        version: els.externalSourceVersion.value.trim() || source.version || '',
        url: source.url || '',
        license: source.license || ''
      },
      coordinateSpace,
      applyMode: els.externalApplyMode.value,
      importedAt: new Date().toISOString(),
      regions,
      connections,
      summary: { appliedRegions: regions.length, appliedConnections: connections.length, ignored }
    };
  }

  function applyDatasetStructures(dataset) {
    restoreBuiltinStructures();
    if (!dataset) return;
    const regionMap = new Map(REGIONS.map(region => [region.id, region]));
    for (const patch of dataset.regions || []) {
      const target = regionMap.get(patch.id);
      if (target) Object.assign(target, patch);
    }
    REGION_BY_ID = new Map(REGIONS.map(region => [region.id, region]));
    if (dataset.applyMode === 'replace-connections' && (dataset.connections || []).length) ROUTE_BIASES = new Map();
    for (const connection of dataset.connections || []) {
      ROUTE_BIASES.set(`${connection.source}>${connection.target}`, connection.weight);
    }
  }

  function persistExternalDataset() {
    try {
      localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify({
        activeMode: state.externalData.mode,
        dataset: state.externalData.dataset
      }));
    } catch (error) {
      console.warn('外部データ設定の保存に失敗しました。', error);
    }
  }

  function activateDataSource(mode, { rebuild = true, announce = true } = {}) {
    const externalAvailable = Boolean(state.externalData.dataset);
    const nextMode = mode === 'external' && externalAvailable ? 'external' : 'builtin';
    state.running = false;
    cancelScenarioRun?.('データソース切替');
    cancelTemplateRun?.('データソース切替');
    state.externalData.mode = nextMode;
    applyDatasetStructures(nextMode === 'external' ? state.externalData.dataset : null);
    state.selection = null;
    state.interventions.clear();
    state.pathAnalysis.active = false;
    state.pathAnalysis.edgeKeys = new Set();
    state.lastRegionStepCounts = Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    refreshRegionDependentControls();
    if (rebuild) {
      buildNetwork(Math.max(1, Math.floor(Number(els.seedInput.value) || 2002)));
      initializeAnalysisControls();
      renderInterventions();
      updateSelection();
    }
    persistExternalDataset();
    renderExternalDataStatus();
    if (announce) addEvent(`${nextMode === 'external' ? '読み込みデータ' : '内蔵データ'}へ切替`, true);
  }

  async function importExternalDataset(file) {
    if (!file) return;
    try {
      const text = await file.text();
      let raw;
      if (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv')) raw = parseCsvRows(text);
      else raw = JSON.parse(text);
      let dataset = normalizeImportedDataset(raw, file.name);
      const existing = state.externalData.dataset;
      if (existing) {
        const regionMap = new Map((existing.regions || []).map(region => [region.id, region]));
        for (const region of dataset.regions || []) regionMap.set(region.id, region);
        const connectionMap = new Map();
        const shouldReplaceConnections = dataset.applyMode === 'replace-connections' && (dataset.connections || []).length;
        if (!shouldReplaceConnections) {
          for (const connection of existing.connections || []) connectionMap.set(`${connection.source}>${connection.target}`, connection);
        }
        for (const connection of dataset.connections || []) connectionMap.set(`${connection.source}>${connection.target}`, connection);
        dataset = {
          ...existing,
          ...dataset,
          source: {
            ...existing.source,
            ...dataset.source,
            name: dataset.source?.name || existing.source?.name || file.name
          },
          regions: [...regionMap.values()],
          connections: [...connectionMap.values()],
          summary: {
            appliedRegions: regionMap.size,
            appliedConnections: connectionMap.size,
            ignored: Number(existing.summary?.ignored || 0) + Number(dataset.summary?.ignored || 0)
          }
        };
      }
      state.externalData.dataset = dataset;
      els.externalSourceName.value = dataset.source.name || '';
      els.externalSourceVersion.value = dataset.source.version || '';
      els.externalCoordinateSpace.value = dataset.coordinateSpace || '';
      activateDataSource('external', { rebuild: true, announce: false });
      renderExternalDataStatus(`${file.name}を反映`);
      addEvent(`外部データ「${dataset.source.name}」を読込`, true);
    } catch (error) {
      console.error(error);
      els.externalDataStatus.className = 'dataset-status error';
      els.externalDataStatus.innerHTML = `<strong>読み込みに失敗しました</strong><small>${escapeHtml(error.message || '形式を確認してください。')}</small>`;
    } finally {
      els.externalDataInput.value = '';
    }
  }

  function datasetExportPayload({ template = false } = {}) {
    const descriptor = currentDataSourceDescriptor();
    const connectionEntries = template
      ? [...BUILTIN_ROUTE_BIASES].slice(0, 8)
      : [...ROUTE_BIASES.entries()];
    const regions = (template ? BUILTIN_REGIONS.slice(0, 5) : REGIONS).map(region => ({
      id: region.id, name: region.name, short: region.short, system: region.system, lobe: region.lobe, level: region.level,
      parent: region.parent, functions: region.functions, evidence: region.evidence,
      x: region.x, y: region.y, lateral: region.lateral, vertical: region.vertical, depth: region.depth, count: region.count
    }));
    return {
      format: DATASET_FORMAT,
      source: {
        name: template ? 'v018ひな型データ' : descriptor.name,
        version: template ? '1.0' : descriptor.version,
        url: '', license: ''
      },
      coordinateSpace: template ? 'normalized' : descriptor.coordinateSpace,
      note: template ? '既存19領域のIDを使用してください。connectionsのweightは0〜1または0.05〜7.5を利用できます。' : 'v018から書き出した現在の領域・接続設定',
      regions,
      connections: connectionEntries.map(([key, weight]) => {
        const [source, target] = key.split('>');
        return { source, target, weight };
      })
    };
  }

  function downloadJsonFile(payload, fileName) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function exportCurrentDataset() {
    downloadJsonFile(datasetExportPayload(), `virtual-brain-${MODEL_VERSION}-dataset.json`);
    addEvent('現在の脳領域・接続データを書き出し', true);
  }

  function downloadDatasetTemplate() {
    downloadJsonFile(datasetExportPayload({ template: true }), `virtual-brain-${MODEL_VERSION}-dataset-template.json`);
    addEvent('外部データひな型を書き出し', true);
  }

  function resetExternalDataset() {
    state.externalData.dataset = null;
    state.externalData.mode = 'builtin';
    localStorage.removeItem(DATASET_STORAGE_KEY);
    els.externalSourceName.value = '';
    els.externalSourceVersion.value = '';
    els.externalCoordinateSpace.value = '';
    activateDataSource('builtin', { rebuild: true, announce: false });
    renderExternalDataStatus('読み込みデータを削除');
    addEvent('外部データを削除し内蔵モデルへ復帰', true);
  }

  function loadExternalDataset() {
    try {
      let raw = localStorage.getItem(DATASET_STORAGE_KEY);
      if (!raw) {
        for (const legacyKey of LEGACY_DATASET_STORAGE_KEYS) {
          raw = localStorage.getItem(legacyKey);
          if (raw) break;
        }
      }
      const stored = JSON.parse(raw || 'null');
      if (stored?.dataset) {
        state.externalData.dataset = stored.dataset;
        state.externalData.mode = stored.activeMode === 'external' ? 'external' : 'builtin';
        els.externalSourceName.value = stored.dataset.source?.name || '';
        els.externalSourceVersion.value = stored.dataset.source?.version || '';
        els.externalCoordinateSpace.value = stored.dataset.coordinateSpace || '';
        if (!localStorage.getItem(DATASET_STORAGE_KEY)) persistExternalDataset();
      }
    } catch (error) {
      console.warn('外部データ設定の読み込みに失敗しました。', error);
      state.externalData.dataset = null;
      state.externalData.mode = 'builtin';
    }
    applyDatasetStructures(state.externalData.mode === 'external' ? state.externalData.dataset : null);
    refreshRegionDependentControls();
    renderExternalDataStatus();
  }

  function routeBias(sourceRegionId, targetRegionId) {
    if (sourceRegionId === targetRegionId) return 2.6;
    return ROUTE_BIASES.get(`${sourceRegionId}>${targetRegionId}`) || 0.65;
  }

  function selectedPreset() {
    return MODEL_PRESETS[els.modelPreset?.value] || MODEL_PRESETS.standard;
  }

  function pickNeuronSubtype(nodeType, random) {
    const value = random();
    if (nodeType === 'inhibitory') return value < 0.68 ? 'fast' : 'lowThreshold';
    if (value < 0.58) return 'regular';
    if (value < 0.79) return 'burst';
    return 'adaptive';
  }

  function currentModelConfig() {
    return {
      preset: state.modelPreset || els.modelPreset.value,
      heterogeneity: Number(els.heterogeneity.value),
      fatigueStrength: Number(els.fatigueStrength.value),
      inhibitoryGain: Number(els.inhibitoryGain.value),
      shortTermPlasticity: els.shortTermPlasticityToggle.checked,
      homeostasis: els.homeostasisToggle.checked
    };
  }

  function applyPresetValues(regenerate = true) {
    const preset = selectedPreset();
    state.modelPreset = els.modelPreset.value;
    els.thresholdScale.value = String(preset.thresholdScale);
    els.heterogeneity.value = String(preset.heterogeneity);
    els.fatigueStrength.value = String(preset.fatigueStrength);
    els.inhibitoryGain.value = String(preset.inhibitoryGain);
    els.shortTermPlasticityToggle.checked = preset.shortTerm;
    els.homeostasisToggle.checked = preset.homeostasis;
    els.plasticityToggle.checked = preset.plasticity;
    els.noiseToggle.checked = preset.noise;
    updateModelControlLabels();
    if (regenerate) {
      buildNetwork(Math.max(1, Math.floor(Number(els.seedInput.value) || 2002)));
      addEvent(`モデルプリセット「${preset.name}」を適用`, true);
    }
  }

  function updateModelControlLabels() {
    const preset = selectedPreset();
    els.modelPresetDescription.textContent = preset.description;
    els.thresholdScaleValue.textContent = Number(els.thresholdScale.value).toFixed(2);
    els.heterogeneityValue.textContent = Number(els.heterogeneity.value).toFixed(2);
    els.fatigueStrengthValue.textContent = Number(els.fatigueStrength.value).toFixed(2);
    els.inhibitoryGainValue.textContent = Number(els.inhibitoryGain.value).toFixed(2);
    els.connectionDensityValue.textContent = els.connectionDensity.value;
  }

  function renderModelMonitor() {
    if (!els.modelMonitor || !state.nodes.length) return;
    const subtypeCounts = {};
    for (const node of state.nodes) subtypeCounts[node.subtype] = (subtypeCounts[node.subtype] || 0) + 1;
    const avgFatigue = mean(state.nodes.map(node => node.fatigue || 0));
    const avgHomeostasis = mean(state.nodes.map(node => node.homeostaticOffset || 0));
    const avgResource = mean(state.edges.map(edge => edge.resource ?? 1));
    const activeFatigue = state.nodes.filter(node => (node.fatigue || 0) > 0.25).length;
    const chips = Object.entries(subtypeCounts).map(([id, count]) => `<span>${NEURON_PROFILES[id]?.label || id} <b>${count}</b></span>`).join('');
    els.modelMonitor.innerHTML = `<div class="model-monitor-head"><strong>${escapeHtml(MODEL_PRESETS[state.modelPreset]?.name || selectedPreset().name)}</strong><small>${state.nodes.length}ニューロン / ${state.edges.length}接続</small></div><div class="model-chip-list">${chips}</div><div class="model-live-grid"><span>平均疲労<b>${avgFatigue.toFixed(3)}</b></span><span>疲労中<b>${activeFatigue}</b></span><span>平均資源<b>${avgResource.toFixed(3)}</b></span><span>恒常性補正<b>${avgHomeostasis >= 0 ? '+' : ''}${avgHomeostasis.toFixed(3)}</b></span></div>`;
  }

  function buildNetwork(seed) {
    state.seed = Math.max(1, Math.floor(Number(seed) || 2002));
    state.trialSeed = Math.max(1, Math.floor(Number(els.trialSeedInput.value) || 42));
    state.structureRandom = mulberry32(state.seed);
    state.modelPreset = els.modelPreset.value;
    const heterogeneity = Number(els.heterogeneity.value);
    const recoveryMultiplier = state.modelPreset === 'recovery' ? 1.65 : 1;
    state.nodes = [];
    state.edges = [];
    state.outgoing = new Map();
    state.incoming = new Map();

    let id = 0;
    for (const region of REGIONS) {
      const inhibitoryCount = Math.max(1, Math.round(region.count * 0.2));
      const inhibitorySlots = new Set();
      while (inhibitorySlots.size < inhibitoryCount) {
        inhibitorySlots.add(Math.floor(state.structureRandom() * region.count));
      }

      for (let localIndex = 0; localIndex < region.count; localIndex += 1) {
        const angle = state.structureRandom() * Math.PI * 2;
        const radius = 0.017 + state.structureRandom() * 0.055;
        const nodeType = inhibitorySlots.has(localIndex) ? 'inhibitory' : 'excitatory';
        const x = clamp(region.x + Math.cos(angle) * radius, 0.035, 0.965);
        const y = clamp(region.y + Math.sin(angle) * radius * 0.78, 0.06, 0.94);
        const subtype = pickNeuronSubtype(nodeType, state.structureRandom);
        const profile = NEURON_PROFILES[subtype];
        const thresholdSpread = (state.structureRandom() - 0.5) * 0.18 * heterogeneity;
        const baseThreshold = (nodeType === 'excitatory' ? 1.00 : 0.93) + profile.thresholdOffset + thresholdSpread;
        const leakSpread = (state.structureRandom() - 0.5) * 0.10 * heterogeneity;
        const hemisphere = localIndex % 2 === 0 ? 'left' : 'right';
        const side = hemisphere === 'left' ? -1 : 1;
        const brainJitter = () => (state.structureRandom() - 0.5) * 0.11;
        const brainX = side * Math.max(0.05, region.lateral + brainJitter() * 0.72);
        const brainY = region.vertical + brainJitter();
        const brainZ = region.depth + brainJitter() * 1.35;
        state.nodes.push({
          id,
          name: `${region.id}-${String(localIndex + 1).padStart(2, '0')}`,
          regionId: region.id,
          regionName: region.name,
          type: nodeType,
          subtype,
          subtypeLabel: profile.label,
          leak: clamp(profile.leak + leakSpread, 0.76, 0.95),
          refractoryBase: profile.refractory,
          fatigueGain: profile.fatigueGain * (0.80 + state.structureRandom() * 0.40),
          fatigueRecovery: profile.fatigueRecovery * recoveryMultiplier * (0.85 + state.structureRandom() * 0.30),
          adaptationGain: profile.adaptationGain * (0.85 + state.structureRandom() * 0.30),
          adaptationRecovery: profile.adaptationRecovery * recoveryMultiplier,
          homeostaticTarget: profile.homeostaticTarget,
          x,
          y,
          z: Number(((state.structureRandom() - 0.5) * 84).toFixed(2)),
          hemisphere,
          brainX,
          brainY,
          brainZ,
          baseThreshold,
          voltage: 0,
          refractory: 0,
          fired: false,
          firedLast: false,
          spikeCount: 0,
          pulse: 0,
          externalInput: 0,
          fatigue: 0,
          adaptation: 0,
          firingEma: 0,
          homeostaticOffset: 0
        });
        state.outgoing.set(id, []);
        state.incoming.set(id, []);
        id += 1;
      }
    }

    const density = Math.max(3, Math.min(9, Number(els.connectionDensity.value) || 5));
    state.connectionDensity = density;
    for (const source of state.nodes) {
      const connections = Math.max(2, density - 1 + Math.floor(state.structureRandom() * 3));
      const candidates = state.nodes
        .filter(target => target.id !== source.id)
        .map(target => {
          const distance = Math.hypot(target.x - source.x, target.y - source.y);
          const bias = routeBias(source.regionId, target.regionId);
          const score = bias * (0.55 + state.structureRandom()) / (0.28 + distance);
          return { target, score };
        })
        .sort((a, b) => b.score - a.score);

      let created = 0;
      let attempts = 0;
      while (created < connections && attempts < connections * 16) {
        attempts += 1;
        const poolSize = Math.min(candidates.length, 12 + Math.floor(state.structureRandom() * 18));
        const candidate = candidates[Math.floor(state.structureRandom() * poolSize)];
        if (!candidate) continue;
        const target = candidate.target;
        if (state.edges.some(edge => edge.source === source.id && edge.target === target.id)) continue;

        const route = routeBias(source.regionId, target.regionId);
        const routeScale = Math.min(1.28, 0.88 + route * 0.055);
        const magnitude = source.type === 'inhibitory'
          ? (0.18 + state.structureRandom() * 0.31) * routeScale
          : (0.15 + state.structureRandom() * 0.32) * routeScale;
        const weight = source.type === 'inhibitory' ? -magnitude : magnitude;
        const edge = {
          id: state.edges.length,
          source: source.id,
          target: target.id,
          sourceRegionId: source.regionId,
          targetRegionId: target.regionId,
          weight,
          baseWeight: weight,
          delay: 1 + Math.floor(state.structureRandom() * 5),
          queue: [],
          activity: 0,
          lastSignal: 0,
          stpMode: source.subtype === 'burst' ? 'depressing' : source.subtype === 'adaptive' || source.subtype === 'lowThreshold' ? 'facilitating' : 'stable',
          resource: 1,
          facilitation: 0,
          resourceRecovery: (source.subtype === 'burst' ? 0.026 : 0.045) * recoveryMultiplier,
          depressionRate: source.subtype === 'burst' ? 0.22 : source.subtype === 'fast' ? 0.08 : 0.12,
          facilitationRate: source.subtype === 'adaptive' || source.subtype === 'lowThreshold' ? 0.18 : 0.055,
          facilitationDecay: source.subtype === 'adaptive' || source.subtype === 'lowThreshold' ? 0.085 : 0.14
        };
        state.edges.push(edge);
        state.outgoing.get(source.id).push(edge);
        state.incoming.get(target.id).push(edge);
        created += 1;
      }
    }

    buildRegionEdges();
    if (els.analysisRouteSelect) updateAnalysisRouteOptions();
    resetSimulation(false);
    renderRegionLabels();
    updateModelControlLabels();
    renderModelMonitor();
    renderAtlasHierarchy();
    addEvent(`ネットワークを再生成（${state.nodes.length}ニューロン / ${state.edges.length}接続 / ${selectedPreset().name}）`, true);
  }

  function buildRegionEdges() {
    const grouped = new Map();
    for (const edge of state.edges) {
      if (edge.sourceRegionId === edge.targetRegionId) continue;
      const key = `${edge.sourceRegionId}>${edge.targetRegionId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          sourceRegionId: edge.sourceRegionId,
          targetRegionId: edge.targetRegionId,
          edges: []
        });
      }
      grouped.get(key).edges.push(edge);
    }
    state.regionEdges = [...grouped.values()];
    state.regionEdgeMap = new Map(state.regionEdges.map(regionEdge => [regionEdge.key, regionEdge]));
  }

  function getSelectedRegionId() {
    if (!state.selection) return null;
    if (state.selection.type === 'region') return state.selection.id;
    return state.nodes[state.selection.id]?.regionId || null;
  }

  function pearsonCorrelation(valuesA, valuesB) {
    const length = Math.min(valuesA.length, valuesB.length);
    if (length < 4) return 0;
    const a = valuesA.slice(-length);
    const b = valuesB.slice(-length);
    const meanA = mean(a);
    const meanB = mean(b);
    let numerator = 0;
    let varianceA = 0;
    let varianceB = 0;
    for (let index = 0; index < length; index += 1) {
      const deltaA = Number(a[index] || 0) - meanA;
      const deltaB = Number(b[index] || 0) - meanB;
      numerator += deltaA * deltaB;
      varianceA += deltaA * deltaA;
      varianceB += deltaB * deltaB;
    }
    const denominator = Math.sqrt(varianceA * varianceB);
    return denominator > 0.000001 ? clamp(numerator / denominator, -1, 1) : 0;
  }

  function regionRelationship(regionEdge, metric = 'structure') {
    const weights = regionEdge.edges.map(edge => edge.weight);
    const meanWeight = mean(weights);
    const meanAbsWeight = mean(weights.map(Math.abs));
    if (metric === 'activity') {
      const samples = state.activitySnapshots.slice(-48).map(snapshot => Number(snapshot.edgeActivity?.[regionEdge.key] || 0));
      const activity = samples.length ? mean(samples) : mean(regionEdge.edges.map(edge => edge.activity));
      return {
        score: clamp(activity * 1.85, 0, 1),
        signed: meanWeight < 0 ? -1 : 1,
        raw: `平均活動 ${activity.toFixed(3)}`
      };
    }
    if (metric === 'functional') {
      const sourceHistory = state.regionHistory[regionEdge.sourceRegionId] || [];
      const targetHistory = state.regionHistory[regionEdge.targetRegionId] || [];
      const correlation = pearsonCorrelation(sourceHistory, targetHistory);
      return {
        score: Math.abs(correlation),
        signed: Math.sign(correlation) || 1,
        raw: `相関 ${correlation >= 0 ? '+' : ''}${correlation.toFixed(2)}`
      };
    }
    if (metric === 'learning') {
      const delta = mean(regionEdge.edges.map(edge => Math.abs(edge.weight) - Math.abs(edge.baseWeight)));
      return {
        score: clamp(Math.abs(delta) * 32, 0, 1),
        signed: Math.sign(delta) || 1,
        raw: `結合変化 ${delta >= 0 ? '+' : ''}${delta.toFixed(4)}`
      };
    }
    const density = clamp(regionEdge.edges.length / 14, 0, 1);
    const score = clamp((meanAbsWeight / 0.62) * 0.72 + density * 0.28, 0, 1);
    return {
      score,
      signed: meanWeight < 0 ? -1 : 1,
      raw: `平均結合 ${meanAbsWeight.toFixed(3)} / ${regionEdge.edges.length}本`
    };
  }

  function analyzeSelectedPath() {
    const rootRegionId = getSelectedRegionId();
    if (!rootRegionId) {
      els.pathAnalysisResult.className = 'path-analysis-result empty-state';
      els.pathAnalysisResult.textContent = '先にニューロンまたは脳領域を選択してください。';
      addEvent('経路解析：起点領域が未選択', true);
      return;
    }

    const direction = els.pathDirection.value;
    const depth = Number(els.pathDepth.value);
    const metric = els.pathMetric.value;
    const threshold = Number(els.pathThreshold.value);
    const queue = [{ regionId: rootRegionId, level: 0 }];
    const levels = new Map([[rootRegionId, 0]]);
    const resultEdges = [];
    const resultKeys = new Set();

    while (queue.length) {
      const current = queue.shift();
      if (!current || current.level >= depth) continue;
      let candidates = [];
      if (direction === 'out' || direction === 'both') {
        candidates.push(...state.regionEdges
          .filter(edge => edge.sourceRegionId === current.regionId)
          .map(edge => ({ edge, nextRegionId: edge.targetRegionId, traversal: 'out' })));
      }
      if (direction === 'in' || direction === 'both') {
        candidates.push(...state.regionEdges
          .filter(edge => edge.targetRegionId === current.regionId)
          .map(edge => ({ edge, nextRegionId: edge.sourceRegionId, traversal: 'in' })));
      }
      candidates = candidates
        .map(candidate => ({ ...candidate, relation: regionRelationship(candidate.edge, metric) }))
        .filter(candidate => candidate.relation.score >= threshold)
        .sort((a, b) => b.relation.score - a.relation.score)
        .slice(0, 5);

      for (const candidate of candidates) {
        if (!resultKeys.has(candidate.edge.key)) {
          resultKeys.add(candidate.edge.key);
          resultEdges.push({
            key: candidate.edge.key,
            sourceRegionId: candidate.edge.sourceRegionId,
            targetRegionId: candidate.edge.targetRegionId,
            traversal: candidate.traversal,
            level: current.level + 1,
            score: candidate.relation.score,
            signed: candidate.relation.signed,
            raw: candidate.relation.raw
          });
        }
        if (!levels.has(candidate.nextRegionId)) {
          levels.set(candidate.nextRegionId, current.level + 1);
          queue.push({ regionId: candidate.nextRegionId, level: current.level + 1 });
        }
      }
    }

    state.pathAnalysis = {
      active: true,
      rootRegionId,
      direction,
      depth,
      metric,
      threshold,
      edges: resultEdges,
      edgeKeys: resultKeys,
      levels
    };
    els.relationDisplay.value = 'trace';
    renderPathAnalysis();
    updateViewModeUI();
    addEvent(`経路解析：${REGION_BY_ID.get(rootRegionId).name}から${resultEdges.length}経路`, true);
  }

  function clearPathAnalysis() {
    state.pathAnalysis = {
      active: false,
      rootRegionId: null,
      direction: els.pathDirection.value,
      depth: Number(els.pathDepth.value),
      metric: els.pathMetric.value,
      threshold: Number(els.pathThreshold.value),
      edges: [],
      edgeKeys: new Set(),
      levels: new Map()
    };
    if (els.relationDisplay.value === 'trace') els.relationDisplay.value = 'structure';
    renderPathAnalysis();
    updateViewModeUI();
  }

  function renderPathAnalysis() {
    const analysis = state.pathAnalysis;
    if (!analysis.active) {
      els.pathAnalysisResult.className = 'path-analysis-result empty-state';
      els.pathAnalysisResult.textContent = '領域を選択して解析してください。';
      return;
    }
    const root = REGION_BY_ID.get(analysis.rootRegionId);
    if (!analysis.edges.length) {
      els.pathAnalysisResult.className = 'path-analysis-result empty-state';
      els.pathAnalysisResult.textContent = `${root.name}から、指定条件を満たす経路は見つかりませんでした。`;
      return;
    }
    const metricLabels = {
      structure: '構造', activity: '活動', functional: '機能', learning: '学習'
    };
    const rows = analysis.edges
      .sort((a, b) => a.level - b.level || b.score - a.score)
      .slice(0, 18)
      .map(edge => {
        const source = REGION_BY_ID.get(edge.sourceRegionId);
        const target = REGION_BY_ID.get(edge.targetRegionId);
        return `<div class="path-row" data-path-key="${escapeHtml(edge.key)}">
          <span class="path-level">${edge.level}</span>
          <span class="path-route">${escapeHtml(source.short)} <b>→</b> ${escapeHtml(target.short)}</span>
          <span class="path-score">${edge.score.toFixed(2)}</span>
          <small>${escapeHtml(edge.raw)}</small>
        </div>`;
      }).join('');
    els.pathAnalysisResult.className = 'path-analysis-result';
    els.pathAnalysisResult.innerHTML = `
      <div class="path-summary"><strong>${escapeHtml(root.name)}</strong>を起点に${analysis.edges.length}経路・${analysis.levels.size}領域を抽出<br><small>${metricLabels[analysis.metric]}基準 / 深さ${analysis.depth} / 閾値${analysis.threshold.toFixed(2)}</small></div>
      <div class="path-list">${rows}</div>`;
  }

  function renderPropagationTimeline() {
    if (!state.propagation || !state.propagation.arrivals.size) {
      els.propagationTimeline.innerHTML = '<div class="empty-state">刺激実行後に到達順を表示します。</div>';
      return;
    }
    const arrivals = [...state.propagation.arrivals.entries()]
      .map(([regionId, item]) => ({ region: REGION_BY_ID.get(regionId), ...item }))
      .sort((a, b) => a.offset - b.offset || a.region.name.localeCompare(b.region.name, 'ja'));
    els.propagationTimeline.innerHTML = arrivals.map((item, index) => `
      <div class="timeline-item${item.target ? ' target' : ''}">
        <span>${index + 1}</span>
        <strong>${escapeHtml(item.region.short)}</strong>
        <small>+${item.offset} step${item.target ? '・刺激点' : ''}</small>
      </div>`).join('');
  }

  function applySelectedIntervention() {
    const regionId = getSelectedRegionId();
    if (!regionId) {
      addEvent('仮想介入：対象領域が未選択', true);
      return;
    }
    const intervention = {
      type: els.interventionType.value,
      strength: Number(els.interventionStrength.value),
      appliedStep: state.step
    };
    state.interventions.set(regionId, intervention);
    renderInterventions();
    const labels = { suppress: '抑制', boost: '促進', block: '遮断' };
    addEvent(`${REGION_BY_ID.get(regionId).name}へ${labels[intervention.type]}介入 ${intervention.strength.toFixed(2)}`, true);
  }

  function clearInterventions() {
    if (state.interventions.size) addEvent(`仮想介入を${state.interventions.size}件解除`, true);
    state.interventions.clear();
    renderInterventions();
  }

  function renderInterventions() {
    if (!state.interventions.size) {
      els.interventionStatus.className = 'intervention-status empty-state';
      els.interventionStatus.textContent = '介入はありません。';
      return;
    }
    const labels = { suppress: '抑制', boost: '促進', block: '遮断' };
    els.interventionStatus.className = 'intervention-status';
    els.interventionStatus.innerHTML = [...state.interventions.entries()].map(([regionId, intervention]) => `
      <div class="intervention-row ${intervention.type}">
        <strong>${escapeHtml(REGION_BY_ID.get(regionId).short)}</strong>
        <span>${labels[intervention.type]} ${intervention.strength.toFixed(2)}</span>
        <small>step ${intervention.appliedStep}</small>
      </div>`).join('');
  }

  function currentRelationForEdge(regionEdge) {
    const display = els.relationDisplay?.value || 'structure';
    const metric = display === 'trace' ? state.pathAnalysis.metric : display;
    return regionRelationship(regionEdge, metric);
  }

  function pathEdgeRecord(regionEdge) {
    return state.pathAnalysis.edges.find(edge => edge.key === regionEdge.key) || null;
  }

  function relationshipEdgeVisible(regionEdge) {
    const display = els.relationDisplay?.value || 'structure';
    if (display === 'trace') return state.pathAnalysis.active && state.pathAnalysis.edgeKeys.has(regionEdge.key);
    if (display === 'activity') return currentRelationForEdge(regionEdge).score > 0.035;
    if (display === 'functional') return currentRelationForEdge(regionEdge).score > 0.12;
    if (display === 'learning') return currentRelationForEdge(regionEdge).score > 0.025;
    return regionEdge.edges.length >= 2;
  }

  function relationStrokeStyle(regionEdge, activity = 0) {
    const display = els.relationDisplay?.value || 'structure';
    const relation = currentRelationForEdge(regionEdge);
    const trace = pathEdgeRecord(regionEdge);
    if (display === 'trace' && trace) {
      const alpha = clamp(0.46 + trace.score * 0.5, 0.46, 0.96);
      return trace.signed < 0 ? `rgba(255,127,145,${alpha})` : `rgba(255,200,103,${alpha})`;
    }
    if (display === 'functional') {
      return relation.signed < 0
        ? `rgba(255,127,145,${0.16 + relation.score * 0.72})`
        : `rgba(112,167,255,${0.14 + relation.score * 0.72})`;
    }
    if (display === 'learning') {
      return relation.signed < 0
        ? `rgba(255,127,145,${0.14 + relation.score * 0.76})`
        : `rgba(255,200,103,${0.14 + relation.score * 0.76})`;
    }
    const meanWeight = mean(regionEdge.edges.map(edge => edge.weight));
    if (display === 'activity' || activity > 0.05) {
      return meanWeight < 0
        ? `rgba(255,127,145,${0.16 + Math.max(activity, relation.score) * 0.72})`
        : `rgba(77,217,196,${0.14 + Math.max(activity, relation.score) * 0.76})`;
    }
    return 'rgba(145,181,206,.10)';
  }

  function drawArrowHead(ctx, fromX, fromY, toX, toY, color, size = 5) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.translate(toX, toY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.55);
    ctx.lineTo(-size, size * 0.55);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function resetSimulation(resetWeights = false) {
    state.running = false;
    state.step = 0;
    state.simTime = 0;
    state.runStartStep = 0;
    state.autoStopTarget = null;
    state.history = [];
    state.regionHistory = Object.fromEntries(REGIONS.map(region => [region.id, []]));
    state.totalSpikes = 0;
    state.peakSpikes = 0;
    state.stimulusSequence = null;
    state.events = [];
    state.lastRegionStepCounts = Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    state.activitySnapshots = [];
    state.propagation = null;
    state.analysis.records = [];
    state.analysis.routeStats = {};
    state.analysis.cursorIndex = 0;
    state.analysis.live = true;
    state.pathAnalysis = {
      active: false, rootRegionId: null, direction: els.pathDirection.value, depth: Number(els.pathDepth.value),
      metric: els.pathMetric.value, threshold: Number(els.pathThreshold.value), edges: [], edgeKeys: new Set(), levels: new Map()
    };
    state.brain3d.live = true;
    state.brain3d.historyIndex = 0;
    state.trialSeed = Math.max(1, Math.floor(Number(els.trialSeedInput.value) || 42));
    state.simRandom = mulberry32((state.seed * 2654435761 + state.trialSeed) >>> 0);
    state.engine.rngState = (state.seed * 2654435761 + state.trialSeed) >>> 0;
    state.engine.engineState = {};
    state.engine.engineDetails = null;
    state.engine.generation += 1;

    for (const node of state.nodes) {
      node.voltage = state.simRandom() * 0.16;
      node.refractory = 0;
      node.fired = false;
      node.firedLast = false;
      node.spikeCount = 0;
      node.pulse = 0;
      node.externalInput = 0;
      node.fatigue = 0;
      node.adaptation = 0;
      node.firingEma = 0;
      node.homeostaticOffset = 0;
    }
    for (const edge of state.edges) {
      edge.queue = [];
      edge.activity = 0;
      edge.lastSignal = 0;
      edge.resource = 1;
      edge.facilitation = 0;
      if (resetWeights) edge.weight = edge.baseWeight;
    }
    renderModelMonitor();

    updateStatus();
    updateMetrics();
    updateSequenceStatus();
    updateRegionActivity();
    updateSelection();
    renderEventLog();
    renderPathAnalysis();
    renderPropagationTimeline();
    renderInterventions();
    renderScenarioStatus();
    renderTemplateStatus();
    update3DHistoryControls();
    if (state.analysis.open) refreshAnalysis(false);
  }

  function startRun() {
    if (!state.running) {
      state.running = true;
      state.runStartStep = state.step;
      const autoStop = Number(els.autoStopSelect.value);
      state.autoStopTarget = state.templateRun && !state.templateRun.complete
        ? state.templateRun.totalSteps
        : autoStop > 0 ? state.step + autoStop : null;
      updateStatus();
    }
  }

  function scheduleStimulus() {
    const preset = els.stimulusPreset.value;
    const sequence = {
      preset,
      regions: STIMULUS_TARGETS[preset],
      regionWeights: null,
      strength: Number(els.stimulusStrength.value),
      duration: Number(els.stimulusDuration.value),
      repeats: Number(els.stimulusRepeats.value),
      interval: Number(els.stimulusInterval.value),
      currentRepeat: 1,
      phase: 'active',
      remaining: Number(els.stimulusDuration.value),
      waitRemaining: 0,
      visitedRegions: new Set()
    };
    state.stimulusSequence = sequence;
    state.propagation = {
      startedAt: state.step,
      targets: [...sequence.regions],
      arrivals: new Map(sequence.regions.map(regionId => [regionId, { step: state.step, offset: 0, target: true }]))
    };
    renderPropagationTimeline();
    addEvent(`刺激1/${sequence.repeats}開始：${sequence.regions.join('・')}`, true);
    updateSequenceStatus();
    startRun();
  }

  function processStimulus() {
    const sequence = state.stimulusSequence;
    if (!sequence) return;

    if (sequence.phase === 'active') {
      for (const node of state.nodes) {
        if (sequence.regions.includes(node.regionId) && state.simRandom() < 0.58) {
          const regionWeight = Number(sequence.regionWeights?.[node.regionId] ?? 1);
          node.externalInput += sequence.strength * regionWeight * (0.72 + state.simRandom() * 0.58);
        }
      }
      sequence.remaining -= 1;
      if (sequence.remaining <= 0) {
        addEvent(`刺激${sequence.currentRepeat}/${sequence.repeats}終了`);
        if (sequence.currentRepeat >= sequence.repeats) {
          state.stimulusSequence = null;
          addEvent('刺激シーケンス完了', true);
        } else {
          sequence.phase = 'waiting';
          sequence.waitRemaining = sequence.interval;
        }
      }
    } else if (sequence.phase === 'waiting') {
      sequence.waitRemaining -= 1;
      if (sequence.waitRemaining <= 0) {
        sequence.currentRepeat += 1;
        sequence.phase = 'active';
        sequence.remaining = sequence.duration;
        addEvent(`刺激${sequence.currentRepeat}/${sequence.repeats}開始`, true);
      }
    }
    updateSequenceStatus();
  }

  function simulationStep() {
    const plasticityEnabled = els.plasticityToggle.checked;
    const noiseEnabled = els.noiseToggle.checked;
    const thresholdScale = Number(els.thresholdScale.value);
    const fatigueStrength = Number(els.fatigueStrength.value);
    const inhibitoryGain = Number(els.inhibitoryGain.value);
    const shortTermEnabled = els.shortTermPlasticityToggle.checked;
    const homeostasisEnabled = els.homeostasisToggle.checked;

    for (const node of state.nodes) {
      node.firedLast = node.fired;
      node.fired = false;
      node.externalInput = 0;
      node.pulse *= 0.82;
      node.fatigue = Math.max(0, node.fatigue - node.fatigueRecovery);
      node.adaptation = Math.max(0, node.adaptation - node.adaptationRecovery);
      if (node.refractory > 0) node.refractory -= 1;
    }
    for (const edge of state.edges) {
      edge.resource = clamp(edge.resource + (1 - edge.resource) * edge.resourceRecovery, 0.05, 1);
      edge.facilitation = Math.max(0, edge.facilitation * (1 - edge.facilitationDecay));
    }

    processStimulus();

    const synapticInputs = new Float64Array(state.nodes.length);
    const routeSignalsThisStep = {};
    for (const edge of state.edges) {
      edge.activity *= 0.84;
      edge.lastSignal *= 0.76;
      if (!edge.queue.length) continue;
      const nextQueue = [];
      for (const signal of edge.queue) {
        signal.delay -= 1;
        if (signal.delay <= 0) {
          synapticInputs[edge.target] += signal.value;
          edge.activity = Math.min(1, edge.activity + Math.abs(signal.value) * 1.7);
          edge.lastSignal = Math.sign(signal.value);
          const routeKey = `${edge.sourceRegionId}>${edge.targetRegionId}`;
          const stepRoute = routeSignalsThisStep[routeKey] || { count: 0, excitatory: 0, inhibitory: 0, absValue: 0, netValue: 0 };
          stepRoute.count += 1;
          if (signal.value >= 0) stepRoute.excitatory += 1;
          else stepRoute.inhibitory += 1;
          stepRoute.absValue += Math.abs(signal.value);
          stepRoute.netValue += signal.value;
          routeSignalsThisStep[routeKey] = stepRoute;
          const cumulative = state.analysis.routeStats[routeKey] || { count: 0, excitatory: 0, inhibitory: 0, absValue: 0, netValue: 0, lastStep: 0 };
          cumulative.count += 1;
          if (signal.value >= 0) cumulative.excitatory += 1;
          else cumulative.inhibitory += 1;
          cumulative.absValue += Math.abs(signal.value);
          cumulative.netValue += signal.value;
          cumulative.lastStep = state.step + 1;
          state.analysis.routeStats[routeKey] = cumulative;
        } else {
          nextQueue.push(signal);
        }
      }
      edge.queue = nextQueue;
    }

    let spikesThisStep = 0;
    const regionCounts = Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    const regionExcitatoryCounts = Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    const regionInhibitoryCounts = Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    const hemisphereCounts = Object.fromEntries(REGIONS.flatMap(region => [
      [`${region.id}:left`, 0],
      [`${region.id}:right`, 0]
    ]));
    for (const node of state.nodes) {
      const intervention = state.interventions.get(node.regionId);
      if (intervention?.type === 'block') {
        node.voltage = 0;
        node.refractory = Math.max(node.refractory, 1);
        continue;
      }
      if (node.refractory > 0) {
        node.voltage *= 0.45;
        continue;
      }
      const noise = noiseEnabled ? gaussian() * 0.018 : 0;
      let totalInput = synapticInputs[node.id] + node.externalInput + noise - node.adaptation * fatigueStrength;
      let effectiveThreshold = node.baseThreshold * thresholdScale * (1 + node.fatigue * fatigueStrength * 0.72 + node.homeostaticOffset);
      if (intervention?.type === 'suppress') {
        totalInput *= Math.max(0.04, 1 - intervention.strength * 0.86);
        node.voltage *= Math.max(0.55, 1 - intervention.strength * 0.24);
        effectiveThreshold *= 1 + intervention.strength * 0.48;
      } else if (intervention?.type === 'boost') {
        totalInput += intervention.strength * 0.085;
        effectiveThreshold *= Math.max(0.72, 1 - intervention.strength * 0.16);
      }
      node.voltage = node.voltage * node.leak + totalInput;
      node.voltage = clamp(node.voltage, -0.58, 1.75);
      if (node.voltage >= effectiveThreshold) {
        node.fired = true;
        node.spikeCount += 1;
        node.pulse = 1;
        node.voltage = 0.05;
        node.refractory = node.refractoryBase;
        node.fatigue = clamp(node.fatigue + node.fatigueGain, 0, 1.35);
        node.adaptation = clamp(node.adaptation + node.adaptationGain, 0, 0.85);
        spikesThisStep += 1;
        regionCounts[node.regionId] += 1;
        if (node.type === 'inhibitory') regionInhibitoryCounts[node.regionId] += 1;
        else regionExcitatoryCounts[node.regionId] += 1;
        hemisphereCounts[`${node.regionId}:${node.hemisphere}`] += 1;
      }
    }

    for (const node of state.nodes) {
      node.firingEma = node.firingEma * 0.975 + (node.fired ? 1 : 0) * 0.025;
      if (homeostasisEnabled) {
        const error = node.firingEma - node.homeostaticTarget;
        node.homeostaticOffset = clamp(node.homeostaticOffset + error * 0.0018, -0.16, 0.28);
      } else {
        node.homeostaticOffset *= 0.998;
      }
    }

    for (const node of state.nodes) {
      if (!node.fired) continue;
      const outgoing = state.outgoing.get(node.id) || [];
      for (const edge of outgoing) {
        let signalValue = edge.weight;
        if (signalValue < 0) signalValue *= inhibitoryGain;
        if (shortTermEnabled) {
          const shortTermScale = clamp(edge.resource * (1 + edge.facilitation), 0.08, 1.65);
          signalValue *= shortTermScale;
          edge.resource = clamp(edge.resource * (1 - edge.depressionRate), 0.05, 1);
          edge.facilitation = clamp(edge.facilitation + edge.facilitationRate * (1 - edge.facilitation), 0, 0.8);
        }
        edge.queue.push({ delay: edge.delay, value: signalValue });
        edge.activity = Math.min(1, edge.activity + Math.abs(signalValue));
        edge.lastSignal = Math.sign(signalValue);
      }
    }

    if (plasticityEnabled) {
      for (const edge of state.edges) {
        const pre = state.nodes[edge.source];
        const post = state.nodes[edge.target];
        const sign = edge.weight < 0 ? -1 : 1;
        let magnitude = Math.abs(edge.weight);
        const learningScale = state.modelPreset === 'learning' ? 1.35 : state.modelPreset === 'hyper' ? 1.12 : 1;
        const depressionScale = state.modelPreset === 'learning' ? 0.82 : 1;
        const subtypeScale = pre.subtype === 'burst' ? 1.12 : pre.subtype === 'adaptive' ? 0.92 : 1;
        if (pre.firedLast && post.fired) magnitude += 0.0058 * learningScale * subtypeScale;
        else if (pre.fired && post.firedLast) magnitude -= 0.0032 * depressionScale;
        magnitude += (Math.abs(edge.baseWeight) - magnitude) * 0.00055;
        magnitude = clamp(magnitude, 0.055, 0.82);
        edge.weight = sign * magnitude;
      }
    }

    state.step += 1;
    state.simTime = state.step * DT;
    state.totalSpikes += spikesThisStep;
    state.peakSpikes = Math.max(state.peakSpikes, spikesThisStep);
    state.history.push(spikesThisStep);
    if (state.history.length > HISTORY_LIMIT) state.history.shift();

    for (const region of REGIONS) {
      state.regionHistory[region.id].push(regionCounts[region.id]);
      if (state.regionHistory[region.id].length > HISTORY_LIMIT) state.regionHistory[region.id].shift();
    }
    state.lastRegionStepCounts = regionCounts;
    recordAnalysisStep({
      spikesThisStep,
      regionCounts,
      regionExcitatoryCounts,
      regionInhibitoryCounts,
      routeSignalsThisStep
    });
    state.activitySnapshots.push({
      step: state.step,
      regionCounts: { ...regionCounts },
      hemisphereCounts: { ...hemisphereCounts },
      edgeActivity: Object.fromEntries(state.regionEdges.map(regionEdge => [
        regionEdge.key,
        Number(mean(regionEdge.edges.map(edge => edge.activity)).toFixed(4))
      ]))
    });
    if (state.activitySnapshots.length > ANALYSIS_HISTORY_LIMIT) state.activitySnapshots.shift();
    if (state.brain3d.live) state.brain3d.historyIndex = Math.max(0, state.activitySnapshots.length - 1);
    update3DHistoryControls();
    recordRegionPropagation(regionCounts);
    updateTemplateRun();

    if (state.autoStopTarget !== null && state.step >= state.autoStopTarget) {
      state.running = false;
      state.autoStopTarget = null;
      addEvent(`自動停止：step ${state.step}`, true);
      updateStatus();
      completeScenarioRun();
      completeTemplateRun();
    }

    renderScenarioStatus();
    renderTemplateStatus();
    updateMetrics();
    updateRegionActivity();
    updateSelection();
    if (state.analysis.open && state.step % 8 === 0) refreshAnalysis(false);
  }

  function recordRegionPropagation(regionCounts) {
    const propagation = state.propagation;
    if (!propagation) return;
    let changed = false;
    for (const region of REGIONS) {
      if (regionCounts[region.id] <= 0 || propagation.arrivals.has(region.id)) continue;
      const offset = Math.max(0, state.step - propagation.startedAt);
      propagation.arrivals.set(region.id, { step: state.step, offset, target: false });
      addEvent(`${region.name}へ反応が伝播（+${offset} step）`);
      changed = true;
    }
    if (changed) renderPropagationTimeline();
  }

  function addEvent(message, important = false) {
    state.events.unshift({ step: state.step, message, important });
    if (state.events.length > MAX_EVENTS) state.events.length = MAX_EVENTS;
    renderEventLog();
  }

  function renderEventLog() {
    if (!state.events.length) {
      els.eventLog.innerHTML = '<div class="empty-state">刺激や領域反応をここに記録します。</div>';
      return;
    }
    els.eventLog.innerHTML = state.events.map(event => `
      <div class="event-item${event.important ? ' important' : ''}">
        <time>${event.step}</time>
        <span>${escapeHtml(event.message)}</span>
      </div>
    `).join('');
  }

  function updateSequenceStatus() {
    const sequence = state.stimulusSequence;
    if (!sequence) {
      els.sequenceStatus.className = 'sequence-status';
      els.sequenceStatus.textContent = '刺激は予約されていません。';
      return;
    }
    els.sequenceStatus.className = 'sequence-status active';
    if (sequence.phase === 'active') {
      els.sequenceStatus.textContent = `${sequence.currentRepeat}/${sequence.repeats}回目を刺激中・残り${sequence.remaining} step`;
    } else {
      els.sequenceStatus.textContent = `${sequence.currentRepeat + 1}/${sequence.repeats}回目まで${sequence.waitRemaining} step`;
    }
  }

  function updateMetrics() {
    const avg = state.history.length
      ? state.history.reduce((sum, value) => sum + value, 0) / state.history.length
      : 0;
    const activeRegionCount = REGIONS.filter(region => state.lastRegionStepCounts[region.id] > 0).length;
    els.stepCount.textContent = String(state.step);
    els.simTime.textContent = state.simTime.toFixed(2);
    els.totalSpikes.textContent = String(state.totalSpikes);
    els.peakSpikes.textContent = String(state.peakSpikes);
    els.avgSpikes.textContent = avg.toFixed(1);
    els.activeRegions.textContent = String(activeRegionCount);
    renderModelMonitor();
  }

  function updateStatus() {
    els.runStatusText.textContent = state.running ? '実行中' : '停止中';
    els.runStatusDot.classList.toggle('running', state.running);
  }

  function fitCanvas(canvas, ctx, stage) {
    const width = Math.max(1, Math.floor(stage.clientWidth));
    const height = Math.max(1, Math.floor(stage.clientHeight));
    const pixelWidth = Math.max(1, Math.floor(width * state.dpr));
    const pixelHeight = Math.max(1, Math.floor(height * state.dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    return { width, height };
  }

  function drawBackground(ctx, width, height) {
    const bg = ctx.createRadialGradient(width * 0.5, height * 0.44, 20, width * 0.5, height * 0.5, width * 0.68);
    bg.addColorStop(0, 'rgba(22,50,68,.56)');
    bg.addColorStop(1, 'rgba(5,13,19,.18)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  function edgeVisible(edge) {
    const regionEdge = state.regionEdgeMap.get(`${edge.sourceRegionId}>${edge.targetRegionId}`);
    if (edge.sourceRegionId !== edge.targetRegionId && regionEdge && !relationshipEdgeVisible(regionEdge)) return false;
    const filter = els.connectionFilter.value;
    if (filter === 'active') return edge.activity > 0.08;
    if (filter !== 'selected') return true;
    if (!state.selection) return false;
    if (state.selection.type === 'node') {
      return edge.source === state.selection.id || edge.target === state.selection.id;
    }
    return edge.sourceRegionId === state.selection.id || edge.targetRegionId === state.selection.id;
  }

  function regionEdgeVisible(regionEdge) {
    if (!relationshipEdgeVisible(regionEdge)) return false;
    const filter = els.connectionFilter.value;
    const activity = mean(regionEdge.edges.map(edge => edge.activity));
    if (filter === 'active') return activity > 0.06;
    if (filter !== 'selected') return true;
    const selectedRegionId = getSelectedRegionId();
    return selectedRegionId
      ? regionEdge.sourceRegionId === selectedRegionId || regionEdge.targetRegionId === selectedRegionId
      : false;
  }

  function drawNetwork() {
    const ctx = state.networkCtx;
    const { width, height } = fitCanvas(state.networkCanvas, ctx, state.networkStage);
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);
    if (els.viewMode.value === 'brain3d') drawBrain3D(ctx, width, height);
    else if (els.viewMode.value === 'regions') drawRegionView(ctx, width, height);
    else drawNeuronView(ctx, width, height);
  }

  function drawNeuronView(ctx, width, height) {
    for (const edge of state.edges) {
      if (!edgeVisible(edge)) continue;
      const source = state.nodes[edge.source];
      const target = state.nodes[edge.target];
      const x1 = source.x * width;
      const y1 = source.y * height;
      const x2 = target.x * width;
      const y2 = target.y * height;
      const active = edge.activity;
      const inhibitory = edge.weight < 0;
      const regionEdge = state.regionEdgeMap.get(`${edge.sourceRegionId}>${edge.targetRegionId}`);
      const trace = regionEdge ? pathEdgeRecord(regionEdge) : null;
      const relation = regionEdge ? currentRelationForEdge(regionEdge) : null;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 0.3 + Math.abs(edge.weight) * 1.5 + active * 1.45 + (trace ? 1.1 : relation ? relation.score * 0.55 : 0);
      if (regionEdge && els.relationDisplay.value !== 'structure') {
        ctx.strokeStyle = relationStrokeStyle(regionEdge, active);
      } else if (active > 0.08) {
        ctx.strokeStyle = inhibitory
          ? `rgba(255,127,145,${0.12 + active * 0.72})`
          : `rgba(77,217,196,${0.10 + active * 0.76})`;
      } else {
        ctx.strokeStyle = inhibitory ? 'rgba(255,127,145,.065)' : 'rgba(145,181,206,.055)';
      }
      ctx.stroke();

      if (active > 0.12) {
        const progress = ((state.step + edge.delay * 2) % 14) / 14;
        const sx = x1 + (x2 - x1) * progress;
        const sy = y1 + (y2 - y1) * progress;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.25 + active * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = inhibitory ? 'rgba(255,127,145,.9)' : 'rgba(77,217,196,.92)';
        ctx.fill();
      }
    }

    for (const node of state.nodes) {
      const x = node.x * width;
      const y = node.y * height;
      const selected = state.selection?.type === 'node' && node.id === state.selection.id;
      const baseColor = node.type === 'inhibitory' ? [255, 127, 145] : [112, 167, 255];
      const glow = node.pulse;
      if (glow > 0.02 || selected) {
        ctx.beginPath();
        ctx.arc(x, y, 7 + glow * 10 + (selected ? 4 : 0), 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15 + glow * 9);
        gradient.addColorStop(0, `rgba(${baseColor.join(',')},${0.30 + glow * 0.46})`);
        gradient.addColorStop(1, `rgba(${baseColor.join(',')},0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, 2.6 + glow * 2.7 + (selected ? 1 : 0), 0, Math.PI * 2);
      ctx.fillStyle = node.fired
        ? 'rgba(244,255,255,1)'
        : `rgba(${baseColor.join(',')},${0.55 + Math.min(.38, Math.max(0, node.voltage) * .35)})`;
      ctx.fill();
      if (node.fatigue > 0.04) {
        ctx.beginPath();
        ctx.arc(x, y, 4.2 + glow * 1.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(node.fatigue / 0.75, 0, 1));
        ctx.strokeStyle = `rgba(255,200,103,${0.28 + Math.min(0.62, node.fatigue * 0.62)})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = 'rgba(235,246,251,.72)';
      ctx.fillStyle = 'rgba(235,246,251,.72)';
      ctx.lineWidth = 0.75;
      if (node.subtype === 'burst') {
        ctx.beginPath(); ctx.arc(0, -5.2, 1.15, 0, Math.PI * 2); ctx.fill();
      } else if (node.subtype === 'adaptive') {
        ctx.beginPath(); ctx.moveTo(-2.2, 4.8); ctx.lineTo(0, 2.6); ctx.lineTo(2.2, 4.8); ctx.stroke();
      } else if (node.subtype === 'fast') {
        ctx.beginPath(); ctx.moveTo(0, -5.5); ctx.lineTo(2.2, -2.2); ctx.lineTo(-2.2, -2.2); ctx.closePath(); ctx.stroke();
      } else if (node.subtype === 'lowThreshold') {
        ctx.strokeRect(-1.5, -5.6, 3, 3);
      }
      ctx.restore();
      if (selected) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      const comparison = regionComparison(node.regionId);
      if (state.comparison.active && comparison.normalized > 0.01) {
        ctx.beginPath();
        ctx.arc(x, y, 4.8 + comparison.normalized * 2.6, 0, Math.PI * 2);
        ctx.strokeStyle = comparisonColor(comparison.difference, 0.24 + comparison.normalized * 0.62);
        ctx.lineWidth = 0.7 + comparison.normalized * 1.4;
        ctx.stroke();
      }
    }
  }

  function drawRegionView(ctx, width, height) {
    for (const regionEdge of state.regionEdges) {
      if (!regionEdgeVisible(regionEdge)) continue;
      const source = REGION_BY_ID.get(regionEdge.sourceRegionId);
      const target = REGION_BY_ID.get(regionEdge.targetRegionId);
      const activity = mean(regionEdge.edges.map(edge => edge.activity));
      const meanWeight = mean(regionEdge.edges.map(edge => edge.weight));
      const relation = currentRelationForEdge(regionEdge);
      const trace = pathEdgeRecord(regionEdge);
      const x1 = source.x * width;
      const y1 = source.y * height;
      const x2 = target.x * width;
      const y2 = target.y * height;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - Math.min(32, Math.abs(x2 - x1) * 0.08);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.lineWidth = clamp(0.6 + regionEdge.edges.length * 0.12 + activity * 2.4 + relation.score * 1.4 + (trace ? 1.2 : 0), 0.8, 7);
      const strokeStyle = relationStrokeStyle(regionEdge, activity);
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
      if (trace || els.relationDisplay.value === 'functional' || els.relationDisplay.value === 'learning') {
        const t = 0.84;
        const oneMinus = 1 - t;
        const px = oneMinus * oneMinus * x1 + 2 * oneMinus * t * mx + t * t * x2;
        const py = oneMinus * oneMinus * y1 + 2 * oneMinus * t * my + t * t * y2;
        const prevT = t - 0.035;
        const prevOneMinus = 1 - prevT;
        const prevX = prevOneMinus * prevOneMinus * x1 + 2 * prevOneMinus * prevT * mx + prevT * prevT * x2;
        const prevY = prevOneMinus * prevOneMinus * y1 + 2 * prevOneMinus * prevT * my + prevT * prevT * y2;
        drawArrowHead(ctx, prevX, prevY, px, py, strokeStyle, trace ? 7 : 5);
      }
    }

    for (const region of REGIONS) {
      const nodes = state.nodes.filter(node => node.regionId === region.id);
      const active = nodes.filter(node => node.pulse > 0.12).length;
      const intensity = nodes.length ? active / nodes.length : 0;
      const selected = state.selection?.type === 'region' && state.selection.id === region.id;
      const intervention = state.interventions.get(region.id);
      const traceLevel = state.pathAnalysis.active ? state.pathAnalysis.levels.get(region.id) : undefined;
      const radius = 19 + Math.sqrt(region.count) * 2.4;
      const x = region.x * width;
      const y = region.y * height;

      if (intensity > 0.01 || selected) {
        const glowRadius = radius + 14 + intensity * 28;
        const gradient = ctx.createRadialGradient(x, y, radius * 0.25, x, y, glowRadius);
        gradient.addColorStop(0, `rgba(77,217,196,${0.14 + intensity * .56})`);
        gradient.addColorStop(1, 'rgba(77,217,196,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = selected
        ? 'rgba(39,102,130,.92)'
        : `rgba(22,48,65,${0.82 + intensity * .15})`;
      ctx.fill();
      ctx.strokeStyle = selected
        ? 'rgba(255,255,255,.92)'
        : `rgba(77,217,196,${0.18 + intensity * .65})`;
      ctx.lineWidth = selected ? 2 : 1 + intensity * 2;
      ctx.stroke();

      if (traceLevel !== undefined) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5 + traceLevel * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = traceLevel === 0 ? 'rgba(255,255,255,.95)' : 'rgba(255,200,103,.78)';
        ctx.lineWidth = traceLevel === 0 ? 2.4 : 1.4;
        ctx.stroke();
      }
      if (intervention) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 9, 0, Math.PI * 2);
        ctx.setLineDash(intervention.type === 'block' ? [4, 3] : []);
        ctx.strokeStyle = intervention.type === 'boost' ? 'rgba(77,217,196,.95)' : 'rgba(255,127,145,.92)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const comparison = regionComparison(region.id);
      if (state.comparison.active && comparison.normalized > 0.01) {
        const compareRadius = radius + 13 + comparison.normalized * 5;
        ctx.beginPath();
        ctx.arc(x, y, compareRadius, 0, Math.PI * 2);
        ctx.strokeStyle = comparisonColor(comparison.difference, 0.36 + comparison.normalized * 0.58);
        ctx.lineWidth = 1.5 + comparison.normalized * 3;
        ctx.stroke();
        ctx.fillStyle = comparisonColor(comparison.difference, 0.94);
        ctx.font = '700 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${comparison.difference >= 0 ? '+' : ''}${comparison.difference}`, x, y + radius + 16);
      }

      ctx.fillStyle = 'rgba(238,248,252,.92)';
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(region.short, x, y - 4);
      ctx.fillStyle = 'rgba(141,164,179,.85)';
      ctx.font = '9px system-ui, sans-serif';
      const statusText = traceLevel !== undefined ? `L${traceLevel}・${active}/${region.count}` : `${active}/${region.count}`;
      ctx.fillText(statusText, x, y + 9);
    }
  }

  function update3DHistoryControls() {
    const length = state.activitySnapshots.length;
    const maxIndex = Math.max(0, length - 1);
    els.historyStepSlider.max = String(maxIndex);
    if (state.brain3d.live) state.brain3d.historyIndex = maxIndex;
    state.brain3d.historyIndex = clamp(state.brain3d.historyIndex, 0, maxIndex);
    els.historyStepSlider.value = String(state.brain3d.historyIndex);
    els.liveViewBtn.classList.toggle('active', state.brain3d.live);
    if (!length) {
      els.historyStepLabel.textContent = '履歴なし';
      return;
    }
    const snapshot = state.activitySnapshots[state.brain3d.historyIndex];
    const distance = Math.max(0, state.step - snapshot.step);
    els.historyStepLabel.textContent = state.brain3d.live ? `現在 ${snapshot.step}` : `${distance} step前`;
  }

  function currentActivitySnapshot() {
    if (!state.activitySnapshots.length) return null;
    const index = state.brain3d.live
      ? state.activitySnapshots.length - 1
      : clamp(state.brain3d.historyIndex, 0, state.activitySnapshots.length - 1);
    return state.activitySnapshots[index];
  }

  function hemisphereVisible(hemisphere) {
    return state.brain3d.hemisphere === 'both' || state.brain3d.hemisphere === hemisphere;
  }

  function regionBrainPoint(region, hemisphere) {
    const side = hemisphere === 'left' ? -1 : 1;
    return {
      x: side * region.lateral,
      y: region.vertical,
      z: region.depth
    };
  }

  function rotateBrainPoint(point) {
    const cosYaw = Math.cos(state.brain3d.yaw);
    const sinYaw = Math.sin(state.brain3d.yaw);
    const cosPitch = Math.cos(state.brain3d.pitch);
    const sinPitch = Math.sin(state.brain3d.pitch);
    const x1 = point.x * cosYaw - point.z * sinYaw;
    const z1 = point.x * sinYaw + point.z * cosYaw;
    const y2 = point.y * cosPitch - z1 * sinPitch;
    const z2 = point.y * sinPitch + z1 * cosPitch;
    return { x: x1, y: y2, z: z2 };
  }

  function projectBrainPoint(point, width, height) {
    const rotated = rotateBrainPoint(point);
    const cameraDistance = 3.15;
    const perspective = cameraDistance / Math.max(1.7, cameraDistance - rotated.z * 0.72);
    const scale = Math.min(width, height) * 0.41 * state.brain3d.zoom * perspective;
    return {
      x: width * 0.5 + rotated.x * scale,
      y: height * 0.49 - rotated.y * scale,
      z: rotated.z,
      perspective,
      scale
    };
  }

  function selectedRegionFor3D() {
    if (!state.selection) return null;
    if (state.selection.type === 'region') return state.selection.id;
    return state.nodes[state.selection.id]?.regionId || null;
  }

  function brainRegionIntensity(regionId, hemisphere, snapshot) {
    const nodes = state.nodes.filter(node => node.regionId === regionId && node.hemisphere === hemisphere);
    if (!nodes.length) return 0;
    const isLatest = state.brain3d.live || snapshot?.step === state.step;
    if (isLatest) {
      const pulseMean = mean(nodes.map(node => node.pulse));
      const firedRatio = nodes.filter(node => node.fired).length / nodes.length;
      return clamp(Math.max(pulseMean * 0.86, firedRatio), 0, 1);
    }
    const count = Number(snapshot?.hemisphereCounts?.[`${regionId}:${hemisphere}`] || 0);
    return clamp(count / Math.max(1, nodes.length), 0, 1);
  }

  function brainRegionEdgeVisible(regionEdge, activity) {
    if (!relationshipEdgeVisible(regionEdge)) return false;
    const filter = els.connectionFilter.value;
    if (filter === 'active') return activity > 0.045;
    if (filter !== 'selected') return true;
    const selectedRegionId = selectedRegionFor3D();
    return selectedRegionId
      ? regionEdge.sourceRegionId === selectedRegionId || regionEdge.targetRegionId === selectedRegionId
      : false;
  }

  function sliceCoordinate(point, axis) {
    if (axis === 'sagittal') return point.x;
    if (axis === 'coronal') return point.z;
    if (axis === 'axial') return point.y;
    return 0;
  }

  function pointVisibleInSlice(point) {
    const axis = state.brain3d.sliceAxis;
    if (axis === 'none') return true;
    const limit = state.brain3d.slicePosition;
    return sliceCoordinate(point, axis) <= limit;
  }

  function regionVisibleIn3D(region, hemisphere) {
    if (!hemisphereVisible(hemisphere)) return false;
    if (!state.brain3d.deepVisible && region.level !== '皮質') return false;
    if (state.brain3d.isolateSelected) {
      const selected = selectedRegionFor3D();
      if (!selected || selected !== region.id) return false;
    }
    return pointVisibleInSlice(regionBrainPoint(region, hemisphere));
  }

  function lobeColor(lobe, alpha = 1) {
    const colors = {
      frontal: [112,167,255], parietal: [77,217,196], temporal: [191,140,255], occipital: [255,200,103],
      cerebellum: [255,127,145], brainstem: [155,174,188], '前頭葉': [112,167,255], '頭頂葉': [77,217,196],
      '側頭葉': [191,140,255], '内側側頭葉': [191,140,255], '後頭葉': [255,200,103], '後頭蓋窩': [255,127,145],
      '脳幹': [155,174,188], '間脳': [132,209,255], '辺縁葉': [255,155,196], '島葉': [116,226,191], '皮質下核': [181,199,119]
    };
    const rgb = colors[lobe] || [116,178,198];
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }

  function set3DViewPreset(preset) {
    state.brain3d.viewPreset = preset;
    if (preset === 'front') { state.brain3d.yaw = 0; state.brain3d.pitch = 0; }
    else if (preset === 'side') { state.brain3d.yaw = Math.PI / 2; state.brain3d.pitch = 0.03; }
    else if (preset === 'top') { state.brain3d.yaw = -0.18; state.brain3d.pitch = -1.05; }
    else if (preset === 'back') { state.brain3d.yaw = Math.PI; state.brain3d.pitch = 0; }
    else resetBrain3DView();
    if (els.viewPresetButtons) {
      els.viewPresetButtons.querySelectorAll('[data-view-preset]').forEach(button => button.classList.toggle('active', button.dataset.viewPreset === preset));
    }
  }

  function drawSlicePlane(ctx, width, height) {
    const axis = state.brain3d.sliceAxis;
    if (axis === 'none') return;
    const p = state.brain3d.slicePosition;
    let corners;
    if (axis === 'sagittal') corners = [{x:p,y:-.82,z:-1.02},{x:p,y:.82,z:-1.02},{x:p,y:.82,z:1.02},{x:p,y:-.82,z:1.02}];
    else if (axis === 'coronal') corners = [{x:-.86,y:-.82,z:p},{x:-.86,y:.82,z:p},{x:.86,y:.82,z:p},{x:.86,y:-.82,z:p}];
    else corners = [{x:-.86,y:p,z:-1.02},{x:-.86,y:p,z:1.02},{x:.86,y:p,z:1.02},{x:.86,y:p,z:-1.02}];
    const projected = corners.map(point => projectBrainPoint(point,width,height));
    ctx.beginPath();
    ctx.moveTo(projected[0].x,projected[0].y);
    for (let i=1;i<projected.length;i+=1) ctx.lineTo(projected[i].x,projected[i].y);
    ctx.closePath();
    ctx.fillStyle='rgba(255,255,255,.035)'; ctx.fill();
    ctx.strokeStyle='rgba(255,200,103,.48)'; ctx.lineWidth=1; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
  }

  function drawBrain3D(ctx, width, height) {
    const snapshot = currentActivitySnapshot();
    const selectedRegionId = selectedRegionFor3D();
    state.brain3d.projectedRegions = [];

    const halo = ctx.createRadialGradient(width * 0.5, height * 0.48, 10, width * 0.5, height * 0.48, Math.min(width, height) * 0.50);
    halo.addColorStop(0, 'rgba(29,67,89,.36)');
    halo.addColorStop(0.72, 'rgba(9,24,34,.11)');
    halo.addColorStop(1, 'rgba(4,10,15,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    if (state.brain3d.shellVisible) {
      const shell = state.brain3d.shellPoints
        .filter(point => hemisphereVisible(point.hemisphere) && pointVisibleInSlice(point))
        .map(point => ({ point, projected: projectBrainPoint(point, width, height) }))
        .sort((a, b) => a.projected.z - b.projected.z);
      const style = state.brain3d.surfaceStyle;
      for (const item of shell) {
        if (style === 'wire' && !item.point.major) continue;
        const depthAlpha = clamp(0.035 + (item.projected.z + 1.2) * 0.040, 0.025, 0.14);
        const isolateFade = state.brain3d.isolateSelected ? 0.38 : 1;
        const alpha = (style === 'solid' ? depthAlpha * (item.point.major ? 1.5 : 1.0) : style === 'wire' ? depthAlpha * 1.8 : depthAlpha * 1.15) * isolateFade;
        const radius = style === 'solid' ? (item.point.major ? 1.55 : 1.15) : style === 'wire' ? 0.92 : (item.point.major ? 1.05 : 0.62);
        ctx.beginPath();
        ctx.arc(item.projected.x, item.projected.y, radius * item.projected.perspective, 0, Math.PI * 2);
        ctx.fillStyle = lobeColor(item.point.lobe, alpha);
        ctx.fill();
      }
    }

    drawSlicePlane(ctx, width, height);

    const regionProjection = new Map();
    for (const region of REGIONS) {
      for (const hemisphere of ['left', 'right']) {
        if (!regionVisibleIn3D(region, hemisphere)) continue;
        const projected = projectBrainPoint(regionBrainPoint(region, hemisphere), width, height);
        regionProjection.set(`${region.id}:${hemisphere}`, projected);
      }
    }

    for (const regionEdge of state.regionEdges) {
      if (state.brain3d.isolateSelected && selectedRegionId && regionEdge.sourceRegionId !== selectedRegionId && regionEdge.targetRegionId !== selectedRegionId) continue;
      const liveActivity = mean(regionEdge.edges.map(edge => edge.activity));
      const activity = Number(snapshot?.edgeActivity?.[regionEdge.key] ?? liveActivity);
      if (!brainRegionEdgeVisible(regionEdge, activity)) continue;
      const meanWeight = mean(regionEdge.edges.map(edge => edge.weight));
      const relation = currentRelationForEdge(regionEdge);
      const trace = pathEdgeRecord(regionEdge);
      for (const hemisphere of ['left', 'right']) {
        const source = regionProjection.get(`${regionEdge.sourceRegionId}:${hemisphere}`);
        const target = regionProjection.get(`${regionEdge.targetRegionId}:${hemisphere}`);
        if (!source || !target) continue;
        const controlX = (source.x + target.x) / 2 + (hemisphere === 'left' ? -1 : 1) * Math.min(38, Math.abs(target.y - source.y) * 0.16 + 9);
        const controlY = (source.y + target.y) / 2 - 10 - activity * 15;
        ctx.beginPath(); ctx.moveTo(source.x, source.y); ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
        ctx.lineWidth = clamp(0.5 + regionEdge.edges.length * 0.06 + activity * 3.2 + relation.score * 1.4 + (trace ? 1.4 : 0), 0.65, 6.8);
        const strokeStyle = relationStrokeStyle(regionEdge, activity);
        ctx.strokeStyle = strokeStyle; ctx.stroke();
        if (trace || els.relationDisplay.value === 'functional' || els.relationDisplay.value === 'learning') {
          const t=.84, om=1-t, pt=t-.035, pom=1-pt;
          const ax=om*om*source.x+2*om*t*controlX+t*t*target.x, ay=om*om*source.y+2*om*t*controlY+t*t*target.y;
          const px=pom*pom*source.x+2*pom*pt*controlX+pt*pt*target.x, py=pom*pom*source.y+2*pom*pt*controlY+pt*pt*target.y;
          drawArrowHead(ctx,px,py,ax,ay,strokeStyle,trace?7:5);
        }
        if (activity > .07 && state.brain3d.live) {
          const progress=((state.step+regionEdge.edges.length)%30)/30, one=1-progress;
          const px=one*one*source.x+2*one*progress*controlX+progress*progress*target.x;
          const py=one*one*source.y+2*one*progress*controlY+progress*progress*target.y;
          ctx.beginPath(); ctx.arc(px,py,1.8+activity*2.2,0,Math.PI*2);
          ctx.fillStyle=meanWeight<0?'rgba(255,127,145,.92)':'rgba(77,217,196,.95)'; ctx.fill();
        }
      }
    }

    const regionItems=[];
    for (const region of REGIONS) for (const hemisphere of ['left','right']) {
      if (!regionVisibleIn3D(region,hemisphere)) continue;
      const projected=regionProjection.get(`${region.id}:${hemisphere}`);
      const intensity=brainRegionIntensity(region.id,hemisphere,snapshot);
      regionItems.push({region,hemisphere,projected,intensity,selected:selectedRegionId===region.id,intervention:state.interventions.get(region.id),traceLevel:state.pathAnalysis.active?state.pathAnalysis.levels.get(region.id):undefined});
    }
    regionItems.sort((a,b)=>a.projected.z-b.projected.z);

    for (const item of regionItems) {
      const {region,hemisphere,projected,intensity,selected,intervention,traceLevel}=item;
      const deepScale=region.level==='皮質'?1:0.86;
      const radius=(5.8+Math.sqrt(region.count)*.82)*projected.perspective*deepScale;
      const glowRadius=radius+8+intensity*25+(selected?8:0);
      if (intensity>.015||selected) {
        const gradient=ctx.createRadialGradient(projected.x,projected.y,radius*.15,projected.x,projected.y,glowRadius);
        gradient.addColorStop(0,selected?'rgba(255,255,255,.58)':`rgba(77,217,196,${.18+intensity*.62})`); gradient.addColorStop(1,'rgba(77,217,196,0)');
        ctx.fillStyle=gradient; ctx.beginPath(); ctx.arc(projected.x,projected.y,glowRadius,0,Math.PI*2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(projected.x,projected.y,radius+intensity*2.7,0,Math.PI*2);
      ctx.fillStyle=selected?'rgba(241,251,255,.97)':intensity>.02?`rgba(77,217,196,${.58+intensity*.38})`:lobeColor(region.lobe,.83);
      ctx.fill(); ctx.strokeStyle=selected?'rgba(255,255,255,1)':`rgba(220,242,248,${.25+intensity*.55})`; ctx.lineWidth=selected?2.2:1; ctx.stroke();
      if (region.level!=='皮質') { ctx.beginPath(); ctx.arc(projected.x,projected.y,radius+3,0,Math.PI*2); ctx.setLineDash([2,3]); ctx.strokeStyle='rgba(255,255,255,.27)'; ctx.stroke(); ctx.setLineDash([]); }
      if (traceLevel!==undefined) { ctx.beginPath(); ctx.arc(projected.x,projected.y,radius+5+traceLevel*1.2,0,Math.PI*2); ctx.strokeStyle=traceLevel===0?'rgba(255,255,255,.96)':'rgba(255,200,103,.82)'; ctx.lineWidth=traceLevel===0?2.2:1.35; ctx.stroke(); }
      if (intervention) { ctx.beginPath(); ctx.arc(projected.x,projected.y,radius+9,0,Math.PI*2); ctx.setLineDash(intervention.type==='block'?[4,3]:[]); ctx.strokeStyle=intervention.type==='boost'?'rgba(77,217,196,.98)':'rgba(255,127,145,.95)'; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]); }
      const comparison=regionComparison(region.id);
      if (state.comparison.active&&comparison.normalized>.01) { ctx.beginPath(); ctx.arc(projected.x,projected.y,radius+12+comparison.normalized*6,0,Math.PI*2); ctx.strokeStyle=comparisonColor(comparison.difference,.36+comparison.normalized*.58); ctx.lineWidth=1.5+comparison.normalized*3.2; ctx.stroke(); }
      const broadLabels=state.brain3d.labelsVisible&&(state.brain3d.hemisphere!=='both'||state.brain3d.isolateSelected);
      if (selected||intensity>.12||traceLevel!==undefined||broadLabels||(state.comparison.active&&comparison.normalized>.18)) {
        ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.font=selected?'700 11px system-ui, sans-serif':'600 9px system-ui, sans-serif'; ctx.fillStyle=selected?'rgba(255,255,255,.98)':'rgba(226,244,250,.90)';
        const levelLabel=traceLevel!==undefined?` L${traceLevel}`:'', comparisonLabel=state.comparison.active&&comparison.normalized>.18?` ${comparison.difference>=0?'+':''}${comparison.difference}`:'';
        ctx.fillText(`${region.short}${hemisphere==='left'?'L':'R'}${levelLabel}${comparisonLabel}`,projected.x,projected.y-radius-4);
      }
      state.brain3d.projectedRegions.push({regionId:region.id,hemisphere,x:projected.x,y:projected.y,radius:Math.max(12,radius+5),z:projected.z});
    }

    ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.font='10px system-ui, sans-serif'; ctx.fillStyle='rgba(141,164,179,.84)';
    const snapshotStep=snapshot?.step??0;
    const sliceText=state.brain3d.sliceAxis==='none'?'全体':`${{sagittal:'矢状',coronal:'冠状',axial:'水平'}[state.brain3d.sliceAxis]}切開 ${state.brain3d.slicePosition.toFixed(2)}`;
    ctx.fillText(`解剖3Dモデル / ${sliceText} / 表示step ${snapshotStep} / 表面形状と座標は近似`,14,height-14);
  }

  function drawChart() {
    const ctx = state.chartCtx;
    const { width, height } = fitCanvas(state.chartCanvas, ctx, state.chartStage);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5,13,19,.24)';
    ctx.fillRect(0, 0, width, height);

    const padding = { left: 36, right: 15, top: 14, bottom: 23 };
    const plotWidth = Math.max(1, width - padding.left - padding.right);
    const plotHeight = Math.max(1, height - padding.top - padding.bottom);
    const selectedRegionId = selectedRegionIdForChart();
    const selectedHistory = selectedRegionId ? state.regionHistory[selectedRegionId] : [];
    const maxValue = Math.max(4, ...state.history, ...selectedHistory);

    ctx.strokeStyle = 'rgba(255,255,255,.065)';
    ctx.lineWidth = 1;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(141,164,179,.7)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + plotHeight * (i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const label = Math.round(maxValue * (1 - i / 4));
      ctx.fillText(String(label), padding.left - 7, y + 3);
    }

    drawSeries(ctx, state.history, padding, plotWidth, plotHeight, maxValue, 'rgba(77,217,196,.95)', 2);
    if (selectedHistory.length) {
      drawSeries(ctx, selectedHistory, padding, plotWidth, plotHeight, maxValue, 'rgba(112,167,255,.92)', 1.5);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(77,217,196,.9)';
    ctx.fillText('全体', padding.left, height - 7);
    if (selectedRegionId) {
      const region = REGION_BY_ID.get(selectedRegionId);
      ctx.fillStyle = 'rgba(112,167,255,.9)';
      ctx.fillText(region.name, padding.left + 34, height - 7);
      els.chartCaption.textContent = `全体発火数と「${region.name}」の直近${HISTORY_LIMIT} step`;
    } else {
      els.chartCaption.textContent = `全体発火数の直近${HISTORY_LIMIT} step（領域選択で重ねて表示）`;
    }
  }

  function drawSeries(ctx, series, padding, plotWidth, plotHeight, maxValue, color, lineWidth) {
    if (!series.length) return;
    ctx.beginPath();
    series.forEach((value, index) => {
      const x = padding.left + (series.length === 1 ? 0 : index / (HISTORY_LIMIT - 1)) * plotWidth;
      const y = padding.top + plotHeight - (value / maxValue) * plotHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function selectedRegionIdForChart() {
    if (!state.selection) return null;
    if (state.selection.type === 'region') return state.selection.id;
    return state.nodes[state.selection.id]?.regionId || null;
  }

  function renderRegionLabels() {
    const regionMode = els.viewMode.value === 'regions' || els.viewMode.value === 'brain3d';
    els.regionLabels.innerHTML = REGIONS.map(region => `
      <span class="region-label${regionMode ? ' hidden-label' : ''}" style="left:${region.x * 100}%;top:${Math.max(3, region.y * 100 - 8)}%">${region.name}</span>
    `).join('');
  }

  function currentRegionStats(regionId) {
    const nodes = state.nodes.filter(node => node.regionId === regionId);
    const active = nodes.filter(node => node.fired || node.pulse > 0.2).length;
    const totalSpikes = nodes.reduce((sum, node) => sum + node.spikeCount, 0);
    return {
      nodes,
      active,
      totalSpikes,
      intensity: nodes.length ? active / nodes.length : 0
    };
  }

  function updateRegionActivity() {
    els.regionActivity.innerHTML = REGIONS.map(region => {
      const stats = currentRegionStats(region.id);
      const selected = selectedRegionIdForChart() === region.id;
      const intervention = state.interventions.get(region.id);
      const traceLevel = state.pathAnalysis.active ? state.pathAnalysis.levels.get(region.id) : undefined;
      const comparison = regionComparison(region.id);
      const comparisonClass = state.comparison.active && comparison.difference !== 0 ? (comparison.difference > 0 ? 'compare-up' : 'compare-down') : '';
      const classes = [selected ? 'selected' : '', intervention ? `intervened ${intervention.type}` : '', traceLevel !== undefined ? 'traced' : '', comparisonClass].filter(Boolean).join(' ');
      const suffix = state.comparison.active
        ? `${comparison.difference >= 0 ? '+' : ''}${comparison.difference}`
        : traceLevel !== undefined ? `L${traceLevel}` : intervention ? intervention.type === 'block' ? '遮' : intervention.type === 'boost' ? '促' : '抑' : String(stats.active);
      return `
        <div class="region-row${classes ? ` ${classes}` : ''}" data-region-id="${region.id}">
          <span>${region.name}</span>
          <div class="region-bar"><span style="width:${Math.min(100, stats.intensity * 100)}%"></span></div>
          <strong>${suffix}</strong>
        </div>
      `;
    }).join('');
  }

  function renderAtlasHierarchy() {
    if (!els.atlasHierarchy) return;
    const filter = els.atlasSystemFilter?.value || 'all';
    const visible = REGIONS.filter(region => filter === 'all' || region.system === filter);
    const groups = new Map();
    for (const region of visible) {
      const key = region.system;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(region);
    }
    const selectedId = getSelectedRegionId();
    els.atlasSummary.textContent = `${REGIONS.length}領域 / ${new Set(REGIONS.map(region => region.system)).size}機能系 / ${state.nodes.length || REGIONS.reduce((sum, region) => sum + region.count, 0)}仮想ニューロン`;
    els.atlasHierarchy.innerHTML = [...groups.entries()].map(([system, regions]) => `
      <div class="atlas-group">
        <div class="atlas-group-title"><strong>${escapeHtml(system)}</strong><span>${regions.length}</span></div>
        ${regions.map(region => `<button type="button" class="atlas-region${selectedId === region.id ? ' selected' : ''}" data-atlas-region="${region.id}"><span><b>${escapeHtml(region.short)}</b>${escapeHtml(region.name)}</span><small>${escapeHtml(region.lobe)}・${escapeHtml(region.level)}</small></button>`).join('')}
      </div>`).join('');
  }

  function updateSelection() {
    if (!state.selection) {
      els.selectionEmpty.classList.remove('hidden');
      els.selectionDetails.classList.add('hidden');
      els.focusHint.textContent = els.viewMode.value === 'brain3d'
        ? '3D領域をクリックして関連を確認'
        : 'ノードまたは領域をクリックして関連を確認';
      renderAtlasHierarchy();
      return;
    }

    els.selectionEmpty.classList.add('hidden');
    els.selectionDetails.classList.remove('hidden');
    if (state.selection.type === 'node') updateNodeSelection(state.selection.id);
    else updateRegionSelection(state.selection.id);
    renderAtlasHierarchy();
  }

  function updateNodeSelection(nodeId) {
    const node = state.nodes[nodeId];
    if (!node) {
      state.selection = null;
      updateSelection();
      return;
    }
    const incoming = state.incoming.get(node.id) || [];
    const outgoing = state.outgoing.get(node.id) || [];
    const strongest = [...outgoing].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
    const strongestTarget = strongest ? state.nodes[strongest.target] : null;
    const intervention = state.interventions.get(node.regionId);
    const interventionLabels = { suppress: '抑制', boost: '促進', block: '遮断' };

    els.selectedNodeBadge.className = 'node-badge';
    els.selectedNodeBadge.style.background = node.type === 'inhibitory' ? '#ff7f91' : '#70a7ff';
    els.selectedNodeName.textContent = node.name;
    els.selectedNodeType.textContent = `${node.type === 'inhibitory' ? '抑制性' : '興奮性'} / ${node.subtypeLabel}`;
    const effectiveThreshold = node.baseThreshold * Number(els.thresholdScale.value) * (1 + node.fatigue * Number(els.fatigueStrength.value) * 0.72 + node.homeostaticOffset);
    els.selectionData.innerHTML = dlRows([
      ['脳領域', `${node.regionId} / ${node.regionName}`],
      ['解剖区分', `${REGION_BY_ID.get(node.regionId)?.lobe || '-'} / ${REGION_BY_ID.get(node.regionId)?.level || '-'}`],
      ['機能系', REGION_BY_ID.get(node.regionId)?.system || '-'],
      ['発火タイプ', node.subtypeLabel],
      ['膜電位', node.voltage.toFixed(3)],
      ['実効発火閾値', effectiveThreshold.toFixed(3)],
      ['疲労 / 順応', `${node.fatigue.toFixed(3)} / ${node.adaptation.toFixed(3)}`],
      ['恒常性補正', `${node.homeostaticOffset >= 0 ? '+' : ''}${node.homeostaticOffset.toFixed(3)}`],
      ['発火回数', node.spikeCount],
      ['入力 / 出力', `${incoming.length} / ${outgoing.length}`],
      ['最強出力先', strongestTarget ? `${strongestTarget.name} (${strongest.weight.toFixed(3)})` : 'なし'],
      ['仮想介入', intervention ? `${interventionLabels[intervention.type]} ${intervention.strength.toFixed(2)}` : 'なし'],
      ['仮想3D座標', `${node.brainX.toFixed(2)}, ${node.brainY.toFixed(2)}, ${node.brainZ.toFixed(2)} (${node.hemisphere === 'left' ? '左' : '右'})`]
    ]);
    els.focusHint.textContent = `${node.name}：入力${incoming.length}本 / 出力${outgoing.length}本`;
  }

  function updateRegionSelection(regionId) {
    const region = REGION_BY_ID.get(regionId);
    if (!region) {
      state.selection = null;
      updateSelection();
      return;
    }
    const stats = currentRegionStats(regionId);
    const incomingRegions = new Set(state.regionEdges.filter(edge => edge.targetRegionId === regionId).map(edge => edge.sourceRegionId));
    const outgoingRegions = new Set(state.regionEdges.filter(edge => edge.sourceRegionId === regionId).map(edge => edge.targetRegionId));
    const intervention = state.interventions.get(regionId);
    const interventionLabels = { suppress: '抑制', boost: '促進', block: '遮断' };
    const traceLevel = state.pathAnalysis.active ? state.pathAnalysis.levels.get(regionId) : undefined;
    const strongest = state.regionEdges
      .filter(edge => edge.sourceRegionId === regionId)
      .map(edge => ({
        target: edge.targetRegionId,
        strength: mean(edge.edges.map(item => Math.abs(item.weight))) * edge.edges.length
      }))
      .sort((a, b) => b.strength - a.strength)[0];

    els.selectedNodeBadge.className = 'node-badge region';
    els.selectedNodeBadge.style.background = 'linear-gradient(135deg,#1f8f84,#236ba3)';
    els.selectedNodeName.textContent = region.name;
    els.selectedNodeType.textContent = `${region.level} / ${region.lobe} / ${region.system}`;
    els.selectionData.innerHTML = dlRows([
      ['領域ID', region.id],
      ['上位分類', region.parent],
      ['解剖区分', `${region.lobe} / ${region.level}`],
      ['主な機能', region.functions],
      ['根拠区分', region.evidence],
      ['ニューロン数', stats.nodes.length],
      ['現在活動', `${stats.active} / ${stats.nodes.length}`],
      ['累積発火', stats.totalSpikes],
      ['入力領域', [...incomingRegions].join(', ') || 'なし'],
      ['出力領域', [...outgoingRegions].join(', ') || 'なし'],
      ['強い出力先', strongest ? REGION_BY_ID.get(strongest.target).name : 'なし'],
      ['解析階層', traceLevel !== undefined ? `L${traceLevel}` : '解析外'],
      ['仮想介入', intervention ? `${interventionLabels[intervention.type]} ${intervention.strength.toFixed(2)}` : 'なし'],
      ['仮想中心座標', `±${region.lateral.toFixed(2)}, ${region.vertical.toFixed(2)}, ${region.depth.toFixed(2)}`]
    ]);
    els.focusHint.textContent = `${region.name}：入力${incomingRegions.size}領域 / 出力${outgoingRegions.size}領域`;
  }

  function dlRows(rows) {
    return rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  }

  function hitTest(event) {
    const rect = state.networkCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (els.viewMode.value === 'brain3d') {
      let best = null;
      let bestDistance = Infinity;
      for (const item of state.brain3d.projectedRegions) {
        const distance = Math.hypot(item.x - x, item.y - y);
        if (distance <= item.radius && distance < bestDistance) {
          best = item;
          bestDistance = distance;
        }
      }
      state.selection = best ? { type: 'region', id: best.regionId } : null;
    } else if (els.viewMode.value === 'regions') {
      let best = null;
      let bestDistance = 44;
      for (const region of REGIONS) {
        const distance = Math.hypot(region.x * rect.width - x, region.y * rect.height - y);
        if (distance < bestDistance) {
          best = region;
          bestDistance = distance;
        }
      }
      state.selection = best ? { type: 'region', id: best.id } : null;
    } else {
      let best = null;
      let bestDistance = 13;
      for (const node of state.nodes) {
        const distance = Math.hypot(node.x * rect.width - x, node.y * rect.height - y);
        if (distance < bestDistance) {
          best = node;
          bestDistance = distance;
        }
      }
      state.selection = best ? { type: 'node', id: best.id } : null;
    }
    updateSelection();
    updateRegionActivity();
  }


  function intensityMultiplier() {
    return { gentle: 0.82, standard: 1, strong: 1.22 }[els.templateIntensity.value] || 1;
  }

  function templateProtocol(templateId = els.templateSelect.value) {
    const multiplier = intensityMultiplier();
    const targetRegionId = REGION_BY_ID.has(els.templateTargetRegion.value) ? els.templateTargetRegion.value : 'PFC';
    const stimulus = (regions, strength, duration, repeats = 1, interval = 8, regionWeights = null) => ({
      regions, strength: Number((strength * multiplier).toFixed(3)), duration, repeats, interval, regionWeights
    });
    const base = {
      id: templateId,
      ...EXPERIMENT_TEMPLATES[templateId],
      targetRegionId,
      controls: { modelPreset: 'standard', thresholdScale: 1, inhibitoryGain: 1, plasticity: true, noise: true, shortTerm: true, homeostasis: true },
      phases: []
    };
    switch (templateId) {
      case 'repeated-learning':
        base.controls.modelPreset = 'learning';
        base.controls.thresholdScale = 0.96;
        base.phases = [
          { label: '初期確認', duration: 70, stimulus: stimulus(['V1'], 1.05, 8, 1, 8), capture: '学習前' },
          { label: '反復学習', duration: 210, stimulus: stimulus(['V1'], 1.25, 10, 8, 12), controls: { plasticity: true } },
          { label: '確認刺激', duration: 90, stimulus: stimulus(['V1'], 1.05, 8, 1, 8), capture: '学習後' }
        ];
        break;
      case 'forgetting':
        base.controls.modelPreset = 'learning';
        base.phases = [
          { label: '記憶形成', duration: 180, stimulus: stimulus(['V1'], 1.2, 10, 6, 12), capture: '学習直後' },
          { label: '無刺激保持', duration: 260, stimulus: null, controls: { plasticity: true } },
          { label: '想起プローブ', duration: 100, stimulus: stimulus(['HIP'], 0.95, 8, 2, 18), capture: '保持後想起' }
        ];
        break;
      case 'multisensory':
        base.phases = [
          { label: '視覚単独', duration: 90, stimulus: stimulus(['V1'], 1.05, 10, 2, 14), capture: '視覚単独' },
          { label: '聴覚単独', duration: 90, stimulus: stimulus(['A1'], 1.05, 10, 2, 14), capture: '聴覚単独' },
          { label: '視聴覚同時', duration: 130, stimulus: stimulus(['V1', 'A1'], 1.12, 12, 3, 16), capture: '複合刺激' }
        ];
        break;
      case 'attention':
        base.controls.modelPreset = 'standard';
        base.phases = [
          { label: '競合基準', duration: 110, stimulus: stimulus(['V1', 'A1'], 1.05, 12, 2, 18, { V1: 1, A1: 1 }), capture: '注意操作前' },
          { label: '注意制御', duration: 160, stimulus: stimulus(['V1', 'A1'], 1.08, 12, 4, 14, { V1: 1.35, A1: 0.70 }), interventions: [{ regionId: 'PFC', type: 'boost', strength: 0.5 * multiplier }] },
          { label: '優先度確認', duration: 100, stimulus: stimulus(['V1', 'A1'], 1.02, 10, 2, 16, { V1: 1.35, A1: 0.70 }), interventions: [{ regionId: 'PFC', type: 'boost', strength: 0.5 * multiplier }], capture: '注意操作後' }
        ];
        break;
      case 'region-block':
        base.phases = [
          { label: '遮断前基準', duration: 120, stimulus: stimulus(['V1'], 1.15, 10, 3, 15), capture: '遮断前' },
          { label: `${REGION_BY_ID.get(targetRegionId)?.short || targetRegionId}遮断`, duration: 150, stimulus: stimulus(['V1'], 1.15, 10, 4, 14), interventions: [{ regionId: targetRegionId, type: 'block', strength: 1 }], capture: '遮断後' }
        ];
        break;
      case 'low-inhibition':
        base.phases = [
          { label: '基準状態', duration: 120, stimulus: stimulus(['V1', 'A1'], 1.05, 10, 3, 15), controls: { inhibitoryGain: 1, homeostasis: true }, capture: '抑制低下前' },
          { label: '抑制低下', duration: 160, stimulus: stimulus(['V1', 'A1'], 1.12, 12, 4, 12), controls: { inhibitoryGain: Math.max(0.5, 0.72 / multiplier), homeostasis: false }, capture: '抑制低下後' }
        ];
        break;
      case 'learning-before-after':
        base.controls.modelPreset = 'learning';
        base.phases = [
          { label: '学習前プローブ', duration: 90, stimulus: stimulus(['V1'], 1.0, 8, 1, 8), capture: '学習前' },
          { label: '反復学習', duration: 230, stimulus: stimulus(['V1'], 1.25, 10, 9, 12), controls: { plasticity: true } },
          { label: '学習後プローブ', duration: 90, stimulus: stimulus(['V1'], 1.0, 8, 1, 8), capture: '学習後' }
        ];
        break;
      default:
        return templateProtocol('repeated-learning');
    }
    base.totalSteps = base.phases.reduce((sum, phase) => sum + phase.duration, 0);
    return base;
  }

  function initializeTemplateControls() {
    els.templateTargetRegion.innerHTML = REGIONS.map(region => `<option value="${region.id}"${region.id === 'PFC' ? ' selected' : ''}>${escapeHtml(region.name)}</option>`).join('');
    renderTemplateDetail();
  }

  function renderTemplateDetail() {
    if (state.templateRun?.complete && state.templateRun.templateId !== els.templateSelect.value) state.templateRun = null;
    const template = EXPERIMENT_TEMPLATES[els.templateSelect.value] || EXPERIMENT_TEMPLATES['repeated-learning'];
    const protocol = templateProtocol(template.id || els.templateSelect.value);
    els.templateTargetField.classList.toggle('hidden', !template.targetRequired);
    els.templateDetail.innerHTML = `<div class="template-title"><strong>${escapeHtml(template.name)}</strong><span class="template-category">${escapeHtml(template.category)}</span></div><p>${escapeHtml(template.description)}</p><dl><div><dt>仮説</dt><dd>${escapeHtml(template.hypothesis)}</dd></div><div><dt>観察</dt><dd>${escapeHtml(template.expected)}</dd></div></dl>`;
    renderTemplateTimeline(protocol);
    if (!state.templateRun) {
      els.templateStatus.className = 'template-status empty-state';
      els.templateStatus.textContent = `全${protocol.totalSteps} step・${protocol.phases.length}段階。条件適用後に手動調整もできます。`;
    }
  }

  function renderTemplateTimeline(protocol = templateProtocol()) {
    const run = state.templateRun;
    els.templateTimeline.innerHTML = protocol.phases.map((phase, index) => {
      const isCurrent = run && run.templateId === protocol.id && run.phaseIndex === index && !run.complete;
      const isComplete = run && run.templateId === protocol.id && (index < run.phaseIndex || run.complete);
      const detail = phase.stimulus ? `${phase.stimulus.regions.map(id => REGION_BY_ID.get(id)?.short || id).join('＋')} / ${phase.stimulus.repeats}回` : '無刺激';
      return `<div class="template-phase${isCurrent ? ' active' : ''}${isComplete ? ' complete' : ''}"><span class="phase-index">${index + 1}</span><div><strong>${escapeHtml(phase.label)}</strong><small>${escapeHtml(detail)}${phase.interventions?.length ? ` / 介入${phase.interventions.length}件` : ''}${phase.capture ? ` / 保存：${escapeHtml(phase.capture)}` : ''}</small></div><span>${phase.duration} step</span></div>`;
    }).join('');
  }

  function applyTemplateControls({ reset = true } = {}) {
    cancelScenarioRun('テンプレート適用により中断');
    cancelTemplateRun('条件を再適用', false);
    const protocol = templateProtocol();
    const controls = protocol.controls;
    els.modelPreset.value = controls.modelPreset || 'standard';
    applyPresetValues(false);
    if (controls.thresholdScale != null) els.thresholdScale.value = String(controls.thresholdScale);
    if (controls.inhibitoryGain != null) els.inhibitoryGain.value = String(controls.inhibitoryGain);
    els.plasticityToggle.checked = controls.plasticity !== false;
    els.noiseToggle.checked = controls.noise !== false;
    els.shortTermPlasticityToggle.checked = controls.shortTerm !== false;
    els.homeostasisToggle.checked = controls.homeostasis !== false;
    const firstStimulus = protocol.phases.find(phase => phase.stimulus)?.stimulus;
    if (firstStimulus) {
      const preset = firstStimulus.regions.length > 1 ? 'mixed' : firstStimulus.regions[0] === 'V1' ? 'visual' : firstStimulus.regions[0] === 'A1' ? 'auditory' : firstStimulus.regions[0] === 'HIP' ? 'memory' : 'visual';
      els.stimulusPreset.value = preset;
      els.stimulusStrength.value = String(firstStimulus.strength);
      els.stimulusDuration.value = String(firstStimulus.duration);
      els.stimulusRepeats.value = String([1,2,3,5,8].includes(firstStimulus.repeats) ? firstStimulus.repeats : 8);
      els.stimulusInterval.value = String([5,10,20,40].includes(firstStimulus.interval) ? firstStimulus.interval : 10);
    }
    els.scenarioRunSteps.value = String(protocol.totalSteps <= 100 ? 100 : protocol.totalSteps <= 250 ? 250 : protocol.totalSteps <= 500 ? 500 : 1000);
    els.scenarioResetMode.value = 'learning';
    els.scenarioAutoSave.checked = els.templateAutoSave.checked;
    els.scenarioName.value = protocol.name;
    els.experimentName.value = `${protocol.name} 結果`;
    els.experimentNote.value = `仮説：${protocol.hypothesis}\n観察ポイント：${protocol.expected}`;
    updateModelControlLabels();
    if (reset) {
      buildNetwork(Math.max(1, Math.floor(Number(els.seedInput.value) || 2002)));
      state.interventions.clear();
      renderInterventions();
    }
    renderTemplateDetail();
    addEvent(`実験テンプレート「${protocol.name}」を適用`, true);
    return protocol;
  }

  function scheduleProtocolStimulus(stimulus, phaseLabel) {
    if (!stimulus) {
      state.stimulusSequence = null;
      updateSequenceStatus();
      return;
    }
    state.stimulusSequence = {
      preset: 'template', regions: [...stimulus.regions], regionWeights: stimulus.regionWeights || null,
      strength: stimulus.strength, duration: stimulus.duration, repeats: stimulus.repeats, interval: stimulus.interval,
      currentRepeat: 1, phase: 'active', remaining: stimulus.duration, waitRemaining: 0, visitedRegions: new Set()
    };
    state.propagation = {
      startedAt: state.step,
      targets: [...stimulus.regions],
      arrivals: new Map(stimulus.regions.map(regionId => [regionId, { step: state.step, offset: 0, target: true }]))
    };
    renderPropagationTimeline();
    updateSequenceStatus();
    addEvent(`${phaseLabel}：刺激開始`, true);
  }

  function enterTemplatePhase(index) {
    const run = state.templateRun;
    if (!run) return;
    run.phaseIndex = index;
    run.phaseStartStep = state.step;
    const phase = run.protocol.phases[index];
    if (!phase) return completeTemplateRun();
    state.stimulusSequence = null;
    state.interventions.clear();
    const controls = phase.controls || {};
    if (controls.plasticity != null) els.plasticityToggle.checked = controls.plasticity;
    if (controls.noise != null) els.noiseToggle.checked = controls.noise;
    if (controls.inhibitoryGain != null) {
      els.inhibitoryGain.value = String(controls.inhibitoryGain);
      els.inhibitoryGainValue.textContent = Number(controls.inhibitoryGain).toFixed(2);
    }
    if (controls.homeostasis != null) els.homeostasisToggle.checked = controls.homeostasis;
    for (const intervention of phase.interventions || []) {
      if (!REGION_BY_ID.has(intervention.regionId)) continue;
      state.interventions.set(intervention.regionId, { ...intervention, strength: clamp(Number(intervention.strength || 0.6), 0.1, 1), appliedStep: state.step });
    }
    renderInterventions();
    scheduleProtocolStimulus(phase.stimulus, phase.label);
    addEvent(`テンプレート段階${index + 1}「${phase.label}」`, true);
    renderTemplateStatus();
    renderTemplateTimeline(run.protocol);
  }

  function resetTemplateObservationMetrics() {
    state.history = [];
    state.regionHistory = Object.fromEntries(REGIONS.map(region => [region.id, []]));
    state.totalSpikes = 0;
    state.peakSpikes = 0;
    state.lastRegionStepCounts = Object.fromEntries(REGIONS.map(region => [region.id, 0]));
    state.activitySnapshots = [];
    state.propagation = null;
    state.analysis.records = [];
    state.analysis.routeStats = {};
    state.analysis.cursorIndex = 0;
    state.analysis.live = true;
    for (const node of state.nodes) node.spikeCount = 0;
    updateMetrics();
    updateRegionActivity();
    renderPropagationTimeline();
    update3DHistoryControls();
  }

  function captureTemplateCheckpoint(phase) {
    const run = state.templateRun;
    if (!run || !phase.capture || !run.autoSave) return;
    if (run.capturedPhaseIndexes.has(run.phaseIndex)) return;
    run.capturedPhaseIndexes.add(run.phaseIndex);
    const name = `${run.protocol.name} / ${phase.capture}`;
    const snapshot = createSnapshot(name, `テンプレート「${run.protocol.name}」の節目：${phase.capture}`);
    snapshot.templateId = run.templateId;
    snapshot.templateName = run.protocol.name;
    snapshot.templateCheckpoint = phase.capture;
    state.experiments.unshift(snapshot);
    run.savedExperimentIds.push(snapshot.id);
    persistExperiments();
    renderExperiments();
    addEvent(`節目「${phase.capture}」を自動保存`, true);
  }

  function updateTemplateRun() {
    const run = state.templateRun;
    if (!run || run.complete) return;
    const phase = run.protocol.phases[run.phaseIndex];
    if (!phase) return completeTemplateRun();
    if (state.step - run.phaseStartStep < phase.duration) return;
    captureTemplateCheckpoint(phase);
    const nextIndex = run.phaseIndex + 1;
    if (nextIndex >= run.protocol.phases.length) completeTemplateRun();
    else {
      resetTemplateObservationMetrics();
      enterTemplatePhase(nextIndex);
    }
  }

  function runSelectedTemplate() {
    const protocol = applyTemplateControls({ reset: true });
    state.scenarioRun = null;
    state.templateRun = {
      templateId: protocol.id,
      protocol,
      phaseIndex: 0,
      phaseStartStep: 0,
      startedAtStep: 0,
      totalSteps: protocol.totalSteps,
      autoSave: els.templateAutoSave.checked,
      savedExperimentIds: [],
      capturedPhaseIndexes: new Set(),
      complete: false
    };
    enterTemplatePhase(0);
    state.running = true;
    state.runStartStep = 0;
    state.autoStopTarget = protocol.totalSteps;
    updateStatus();
    renderTemplateStatus();
    addEvent(`テンプレート「${protocol.name}」をガイド実行`, true);
  }

  function completeTemplateRun() {
    const run = state.templateRun;
    if (!run || run.complete) return;
    const phase = run.protocol.phases[run.phaseIndex];
    if (phase) captureTemplateCheckpoint(phase);
    run.complete = true;
    state.running = false;
    state.autoStopTarget = null;
    state.stimulusSequence = null;
    if (run.autoSave && !run.savedExperimentIds.length) {
      const snapshot = createSnapshot(`${run.protocol.name} / 完了`, `テンプレート「${run.protocol.name}」の最終結果`);
      snapshot.templateId = run.templateId;
      snapshot.templateName = run.protocol.name;
      state.experiments.unshift(snapshot);
      run.savedExperimentIds.push(snapshot.id);
      persistExperiments();
      renderExperiments();
    }
    updateStatus();
    updateSequenceStatus();
    renderTemplateStatus();
    renderTemplateTimeline(run.protocol);
    addEvent(`テンプレート「${run.protocol.name}」完了`, true);
  }

  function cancelTemplateRun(reason = '中断', announce = true) {
    if (!state.templateRun) return;
    if (!state.templateRun.complete && announce) addEvent(`テンプレート実行を${reason}`, true);
    state.templateRun = null;
    renderTemplateStatus();
    renderTemplateTimeline(templateProtocol());
  }

  function renderTemplateStatus() {
    const run = state.templateRun;
    if (!run) {
      const protocol = templateProtocol();
      els.templateStatus.className = 'template-status empty-state';
      els.templateStatus.textContent = `全${protocol.totalSteps} step・${protocol.phases.length}段階。条件適用またはガイド実行してください。`;
      return;
    }
    const phase = run.protocol.phases[Math.min(run.phaseIndex, run.protocol.phases.length - 1)];
    const elapsed = Math.min(run.totalSteps, state.step - run.startedAtStep);
    const remaining = Math.max(0, run.totalSteps - elapsed);
    els.templateStatus.className = `template-status ${run.complete ? 'complete' : 'running'}`;
    els.templateStatus.innerHTML = `<div class="template-status-grid"><strong>${escapeHtml(run.protocol.name)} ${run.complete ? '完了' : `実行中：${escapeHtml(phase?.label || '')}`}</strong><small>${elapsed}/${run.totalSteps} step・残り${remaining}・自動保存 ${run.autoSave ? 'ON' : 'OFF'}・保存${run.savedExperimentIds.length}件</small></div>`;
  }

  function createScenario(name) {
    return {
      id: `scenario-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name,
      createdAt: new Date().toISOString(),
      modelVersion: MODEL_VERSION,
      dataSource: currentDataSourceDescriptor(),
      calculationEngine: currentEngineDescriptor(),
      seed: Math.max(1, Math.floor(Number(els.seedInput.value) || state.seed)),
      trialSeed: Math.max(1, Math.floor(Number(els.trialSeedInput.value) || state.trialSeed)),
      stimulusPreset: els.stimulusPreset.value,
      stimulusStrength: Number(els.stimulusStrength.value),
      stimulusDuration: Number(els.stimulusDuration.value),
      stimulusRepeats: Number(els.stimulusRepeats.value),
      stimulusInterval: Number(els.stimulusInterval.value),
      plasticity: els.plasticityToggle.checked,
      noise: els.noiseToggle.checked,
      thresholdScale: Number(els.thresholdScale.value),
      modelConfig: currentModelConfig(),
      connectionDensity: Number(els.connectionDensity.value),
      runSteps: Number(els.scenarioRunSteps.value),
      resetMode: els.scenarioResetMode.value,
      autoSave: els.scenarioAutoSave.checked,
      interventions: [...state.interventions.entries()].map(([regionId, intervention]) => ({
        regionId,
        type: intervention.type,
        strength: intervention.strength
      })),
      pathSettings: {
        rootRegionId: getSelectedRegionId(),
        direction: els.pathDirection.value,
        depth: Number(els.pathDepth.value),
        metric: els.pathMetric.value,
        threshold: Number(els.pathThreshold.value)
      }
    };
  }

  function saveScenario() {
    const name = els.scenarioName.value.trim() || `シナリオ ${state.scenarios.length + 1}`;
    const scenario = createScenario(name);
    state.scenarios.unshift(scenario);
    persistScenarios();
    els.scenarioName.value = '';
    renderScenarios();
    els.scenarioSelect.value = scenario.id;
    renderScenarioStatus();
    addEvent(`シナリオ「${name}」を保存`, true);
  }

  function loadScenarios() {
    try {
      let raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
      if (!raw) {
        for (const key of LEGACY_SCENARIO_STORAGE_KEYS) {
          raw = localStorage.getItem(key);
          if (raw) break;
        }
      }
      const parsed = JSON.parse(raw || '[]');
      state.scenarios = Array.isArray(parsed) ? parsed : [];
      if (state.scenarios.length && !localStorage.getItem(SCENARIO_STORAGE_KEY)) persistScenarios();
    } catch (error) {
      console.warn('シナリオの読み込みに失敗しました。', error);
      state.scenarios = [];
    }
    renderScenarios();
  }

  function persistScenarios() {
    try {
      localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(state.scenarios));
    } catch (error) {
      console.warn('シナリオの保存に失敗しました。', error);
      addEvent('シナリオのブラウザ保存に失敗しました', true);
    }
  }

  function selectedScenario() {
    return state.scenarios.find(item => item.id === els.scenarioSelect.value) || null;
  }

  function renderScenarios() {
    const previous = els.scenarioSelect.value;
    const options = state.scenarios.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    els.scenarioSelect.innerHTML = `<option value="">選択してください</option>${options}`;
    if (state.scenarios.some(item => item.id === previous)) els.scenarioSelect.value = previous;
    renderScenarioStatus();
  }

  function renderScenarioStatus() {
    if (state.scenarioRun) {
      const remaining = Math.max(0, state.scenarioRun.targetStep - state.step);
      els.scenarioStatus.className = `scenario-status ${state.scenarioRun.complete ? 'complete' : 'running'}`;
      els.scenarioStatus.innerHTML = `<div class="scenario-summary"><strong>${escapeHtml(state.scenarioRun.name)}</strong><small>${state.scenarioRun.complete ? '実行完了' : `実行中・残り${remaining} step`} / 自動保存 ${state.scenarioRun.autoSave ? 'ON' : 'OFF'}</small></div>`;
      return;
    }
    const scenario = selectedScenario();
    if (!scenario) {
      els.scenarioStatus.className = 'scenario-status empty-state';
      els.scenarioStatus.textContent = state.scenarios.length ? `${state.scenarios.length}件保存されています。` : '保存済みシナリオはありません。';
      return;
    }
    els.scenarioStatus.className = 'scenario-status';
    els.scenarioStatus.innerHTML = `<div class="scenario-summary"><strong>${escapeHtml(scenario.name)}</strong><small>${scenario.stimulusPreset} / ${scenario.runSteps || 250} step / ${MODEL_PRESETS[scenario.modelConfig?.preset || 'standard']?.name || '標準'} / 介入 ${(scenario.interventions || []).length}件 / seed ${scenario.seed}-${scenario.trialSeed}</small></div>`;
  }

  function applyScenario(scenario) {
    if (!scenario) return false;
    state.running = false;
    cancelTemplateRun('シナリオ読込');
    state.scenarioRun = null;
    state.interventions.clear();

    els.seedInput.value = String(scenario.seed ?? 2002);
    els.trialSeedInput.value = String(scenario.trialSeed ?? 42);
    els.stimulusPreset.value = scenario.stimulusPreset || 'visual';
    els.stimulusStrength.value = String(scenario.stimulusStrength ?? 1.2);
    els.stimulusDuration.value = String(scenario.stimulusDuration ?? 12);
    els.stimulusRepeats.value = String(scenario.stimulusRepeats ?? 3);
    els.stimulusInterval.value = String(scenario.stimulusInterval ?? 10);
    els.plasticityToggle.checked = scenario.plasticity !== false;
    els.noiseToggle.checked = scenario.noise !== false;
    els.thresholdScale.value = String(scenario.thresholdScale ?? 1);
    const modelConfig = scenario.modelConfig || {};
    els.modelPreset.value = modelConfig.preset || 'standard';
    els.heterogeneity.value = String(modelConfig.heterogeneity ?? 0.60);
    els.fatigueStrength.value = String(modelConfig.fatigueStrength ?? 0.45);
    els.inhibitoryGain.value = String(modelConfig.inhibitoryGain ?? 1.00);
    els.shortTermPlasticityToggle.checked = modelConfig.shortTermPlasticity !== false;
    els.homeostasisToggle.checked = modelConfig.homeostasis !== false;
    els.connectionDensity.value = String(scenario.connectionDensity ?? 5);
    els.scenarioRunSteps.value = String(scenario.runSteps || 250);
    els.scenarioResetMode.value = scenario.resetMode || 'learning';
    els.scenarioAutoSave.checked = scenario.autoSave !== false;

    els.stimulusStrengthValue.textContent = Number(els.stimulusStrength.value).toFixed(2);
    els.stimulusDurationValue.textContent = els.stimulusDuration.value;
    updateModelControlLabels();

    const path = scenario.pathSettings || {};
    els.pathDirection.value = path.direction || 'out';
    els.pathDepth.value = String(path.depth || 2);
    els.pathMetric.value = path.metric || 'structure';
    els.pathThreshold.value = String(path.threshold ?? 0.2);
    els.pathThresholdValue.textContent = Number(els.pathThreshold.value).toFixed(2);

    buildNetwork(Number(scenario.seed));
    if ((scenario.resetMode || 'learning') !== 'learning') resetSimulation(false);

    for (const intervention of scenario.interventions || []) {
      if (!REGION_BY_ID.has(intervention.regionId)) continue;
      state.interventions.set(intervention.regionId, {
        type: intervention.type,
        strength: Number(intervention.strength || 0.6),
        appliedStep: 0
      });
    }
    renderInterventions();

    if (path.rootRegionId && REGION_BY_ID.has(path.rootRegionId)) {
      state.selection = { type: 'region', id: path.rootRegionId };
      analyzeSelectedPath();
    } else {
      clearPathAnalysis();
    }
    updateSelection();
    updateRegionActivity();
    renderScenarioStatus();
    addEvent(`シナリオ「${scenario.name}」の条件を読み込み`, true);
    return true;
  }

  function loadSelectedScenario() {
    const scenario = selectedScenario();
    if (!scenario) {
      addEvent('読込対象のシナリオが未選択', true);
      return;
    }
    applyScenario(scenario);
  }

  function runSelectedScenario() {
    const scenario = selectedScenario();
    if (!scenario) {
      addEvent('実行対象のシナリオが未選択', true);
      return;
    }
    if (!applyScenario(scenario)) return;
    state.scenarioRun = {
      scenarioId: scenario.id,
      name: scenario.name,
      targetStep: Number(scenario.runSteps || 250),
      autoSave: scenario.autoSave !== false,
      complete: false
    };
    scheduleStimulus();
    state.autoStopTarget = state.scenarioRun.targetStep;
    renderScenarioStatus();
    addEvent(`シナリオ「${scenario.name}」を再現実行`, true);
  }

  function completeScenarioRun() {
    if (!state.scenarioRun || state.scenarioRun.complete) return;
    state.scenarioRun.complete = true;
    if (state.scenarioRun.autoSave) {
      const timestamp = new Date().toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const name = `${state.scenarioRun.name} / ${timestamp}`;
      state.experiments.unshift(createSnapshot(name, `シナリオ「${state.scenarioRun.name}」の自動実行結果`));
      persistExperiments();
      renderExperiments();
      addEvent(`シナリオ結果「${name}」を自動保存`, true);
    }
    renderScenarioStatus();
  }

  function cancelScenarioRun(reason = '中断') {
    if (!state.scenarioRun || state.scenarioRun.complete) return;
    addEvent(`シナリオ実行を${reason}`, true);
    state.scenarioRun = null;
    renderScenarioStatus();
  }

  function deleteSelectedScenario() {
    const scenario = selectedScenario();
    if (!scenario) {
      addEvent('削除対象のシナリオが未選択', true);
      return;
    }
    state.scenarios = state.scenarios.filter(item => item.id !== scenario.id);
    persistScenarios();
    renderScenarios();
    addEvent(`シナリオ「${scenario.name}」を削除`, true);
  }

  function comparisonExperiments() {
    const a = state.experiments.find(item => item.id === els.compareA.value);
    const b = state.experiments.find(item => item.id === els.compareB.value);
    return { a, b };
  }

  function calculateComparison(a, b) {
    const regionDiffs = Object.fromEntries(REGIONS.map(region => [
      region.id,
      Number(b?.regionSpikes?.[region.id] || 0) - Number(a?.regionSpikes?.[region.id] || 0)
    ]));
    const maxAbs = Math.max(1, ...Object.values(regionDiffs).map(value => Math.abs(value)));
    return { regionDiffs, maxAbs };
  }

  function showComparisonOverlay(announce = true) {
    const { a, b } = comparisonExperiments();
    if (!a || !b) {
      addEvent('差分表示には実験A・Bの選択が必要です', true);
      return;
    }
    const values = calculateComparison(a, b);
    state.comparison = { active: true, aId: a.id, bId: b.id, ...values };
    renderComparisonState();
    updateRegionActivity();
    updateViewModeUI();
    if (announce) addEvent(`実験差分を表示：${a.name} → ${b.name}`, true);
  }

  function clearComparisonOverlay() {
    state.comparison = { active: false, aId: null, bId: null, regionDiffs: {}, maxAbs: 1 };
    renderComparisonState();
    updateRegionActivity();
    updateViewModeUI();
  }

  function regionComparison(regionId) {
    if (!state.comparison.active) return { difference: 0, normalized: 0 };
    const difference = Number(state.comparison.regionDiffs[regionId] || 0);
    return { difference, normalized: clamp(Math.abs(difference) / state.comparison.maxAbs, 0, 1) };
  }

  function comparisonColor(difference, alpha = 0.9) {
    return difference >= 0 ? `rgba(255,200,103,${alpha})` : `rgba(112,167,255,${alpha})`;
  }

  function renderComparisonState() {
    if (!state.comparison.active) {
      els.comparisonBadge.classList.add('hidden');
      return;
    }
    const a = state.experiments.find(item => item.id === state.comparison.aId);
    const b = state.experiments.find(item => item.id === state.comparison.bId);
    if (!a || !b) {
      clearComparisonOverlay();
      return;
    }
    const top = REGIONS.map(region => ({ region, difference: Number(state.comparison.regionDiffs[region.id] || 0) }))
      .sort((x, y) => Math.abs(y.difference) - Math.abs(x.difference))[0];
    els.comparisonBadge.classList.remove('hidden');
    els.comparisonBadge.innerHTML = `<strong>差分表示 B-A</strong><br>${escapeHtml(a.name)} → ${escapeHtml(b.name)}<br><span class="${top.difference >= 0 ? 'increase' : 'decrease'}">最大差 ${escapeHtml(top.region.short)} ${top.difference >= 0 ? '+' : ''}${top.difference}</span>`;
  }

  function reportMetricRow(label, aValue, bValue, digits = 0) {
    const av = Number(aValue || 0);
    const bv = Number(bValue || 0);
    const diff = bv - av;
    return `<tr><th>${escapeHtml(label)}</th><td>${av.toFixed(digits)}</td><td>${bv.toFixed(digits)}</td><td>${diff >= 0 ? '+' : ''}${diff.toFixed(digits)}</td></tr>`;
  }

  function exportComparisonReport() {
    const { a, b } = comparisonExperiments();
    if (!a || !b) {
      addEvent('レポート出力には実験A・Bの選択が必要です', true);
      return;
    }
    const { regionDiffs, maxAbs } = calculateComparison(a, b);
    const regionRows = REGIONS.map(region => {
      const av = Number(a.regionSpikes?.[region.id] || 0);
      const bv = Number(b.regionSpikes?.[region.id] || 0);
      const diff = regionDiffs[region.id];
      const width = Math.max(2, Math.round(Math.abs(diff) / maxAbs * 100));
      const color = diff >= 0 ? '#b77c14' : '#3b6eaf';
      return `<tr><th>${escapeHtml(region.name)}</th><td>${av}</td><td>${bv}</td><td class="${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '+' : ''}${diff}</td><td><span class="bar" style="width:${width}%;background:${color}"></span></td></tr>`;
    }).join('');
    const generatedAt = new Date().toLocaleString('ja-JP');
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>仮想神経回路 比較レポート</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;background:#f4f7f9;color:#16232d}main{max-width:980px;margin:auto;padding:36px 22px}header,.card{background:#fff;border:1px solid #dce5ea;border-radius:14px;padding:22px;margin-bottom:16px}h1{margin:0 0 6px;font-size:25px}h2{font-size:17px;margin:0 0 14px}p,small{color:#5d7180;line-height:1.65}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:9px 7px;border-bottom:1px solid #e6edf1;text-align:right}th:first-child{text-align:left}.up{color:#9a660b}.down{color:#2f67a8}.bar{display:block;height:8px;border-radius:9px;min-width:2px}.notes{white-space:pre-wrap;background:#f6f9fa;border-radius:10px;padding:12px}.disclaimer{font-size:12px}</style></head><body><main><header><small>VIRTUAL BRAIN LAB / ${MODEL_VERSION}</small><h1>実験比較レポート</h1><p>${escapeHtml(a.name)}（A）と ${escapeHtml(b.name)}（B）の差分。生成日時：${escapeHtml(generatedAt)}</p></header><section class="card"><h2>主要指標</h2><table><thead><tr><th>指標</th><th>A</th><th>B</th><th>B-A</th></tr></thead><tbody>${reportMetricRow('総発火', a.totalSpikes, b.totalSpikes)}${reportMetricRow('ピーク発火', a.peakSpikes, b.peakSpikes)}${reportMetricRow('平均発火', a.avgSpikes, b.avgSpikes, 1)}${reportMetricRow('平均結合', a.meanWeight, b.meanWeight, 3)}${reportMetricRow('結合変化', a.meanWeightChange, b.meanWeightChange, 4)}${reportMetricRow('平均疲労', a.avgFatigue, b.avgFatigue, 3)}${reportMetricRow('シナプス資源', a.meanSynapticResource ?? 1, b.meanSynapticResource ?? 1, 3)}${reportMetricRow('恒常性補正', a.meanHomeostaticOffset, b.meanHomeostaticOffset, 3)}</tbody></table></section><section class="card"><h2>領域別差分</h2><table><thead><tr><th>領域</th><th>A</th><th>B</th><th>B-A</th><th>差の大きさ</th></tr></thead><tbody>${regionRows}</tbody></table></section><section class="card"><h2>条件・メモ</h2><h3>A：${escapeHtml(a.name)}</h3><div class="notes">${escapeHtml(a.note || 'メモなし')}</div><p>刺激 ${escapeHtml(a.stimulusPreset)} / モデル ${escapeHtml(MODEL_PRESETS[a.modelConfig?.preset || 'standard']?.name || '標準')} / seed ${a.seed}-${a.trialSeed ?? '-'} / 介入 ${(a.interventions || []).length}件</p><h3>B：${escapeHtml(b.name)}</h3><div class="notes">${escapeHtml(b.note || 'メモなし')}</div><p>刺激 ${escapeHtml(b.stimulusPreset)} / モデル ${escapeHtml(MODEL_PRESETS[b.modelConfig?.preset || 'standard']?.name || '標準')} / seed ${b.seed}-${b.trialSeed ?? '-'} / 介入 ${(b.interventions || []).length}件</p></section><section class="card disclaimer"><strong>注意</strong><p>本結果は概念モデル内の仮想計算です。人間の脳活動、診断、治療効果、因果関係を示すものではありません。B-Aはシミュレーション上の差であり、条件差が複数ある場合は特定要因だけの効果とは断定できません。</p></section></main></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `virtual-brain-${MODEL_VERSION}-comparison-report.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addEvent('比較レポートを書き出し', true);
  }

  function createSnapshot(name, note) {
    const avg = state.history.length ? mean(state.history) : 0;
    const regionSpikes = Object.fromEntries(REGIONS.map(region => [
      region.id,
      state.nodes.filter(node => node.regionId === region.id).reduce((sum, node) => sum + node.spikeCount, 0)
    ]));
    const weights = state.edges.map(edge => Math.abs(edge.weight));
    const weightChanges = state.edges.map(edge => Math.abs(edge.weight) - Math.abs(edge.baseWeight));
    const subtypeCounts = Object.fromEntries(Object.keys(NEURON_PROFILES).map(id => [id, state.nodes.filter(node => node.subtype === id).length]));
    const avgFatigue = mean(state.nodes.map(node => node.fatigue || 0));
    const meanSynapticResource = mean(state.edges.map(edge => edge.resource ?? 1));
    const meanHomeostaticOffset = mean(state.nodes.map(node => node.homeostaticOffset || 0));
    return {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name,
      note,
      createdAt: new Date().toISOString(),
      modelVersion: MODEL_VERSION,
      dataSource: currentDataSourceDescriptor(),
      calculationEngine: currentEngineDescriptor(),
      seed: state.seed,
      trialSeed: state.trialSeed,
      nodeCount: state.nodes.length,
      edgeCount: state.edges.length,
      stimulusPreset: els.stimulusPreset.value,
      stimulusStrength: Number(els.stimulusStrength.value),
      stimulusDuration: Number(els.stimulusDuration.value),
      stimulusRepeats: Number(els.stimulusRepeats.value),
      stimulusInterval: Number(els.stimulusInterval.value),
      plasticity: els.plasticityToggle.checked,
      noise: els.noiseToggle.checked,
      thresholdScale: Number(els.thresholdScale.value),
      modelConfig: currentModelConfig(),
      connectionDensity: Number(els.connectionDensity.value),
      relationDisplay: els.relationDisplay.value,
      scenarioId: state.scenarioRun?.scenarioId || null,
      scenarioName: state.scenarioRun?.name || null,
      templateId: state.templateRun?.templateId || null,
      templateName: state.templateRun?.protocol?.name || null,
      templatePhase: state.templateRun?.protocol?.phases?.[state.templateRun?.phaseIndex]?.label || null,
      interventions: [...state.interventions.entries()].map(([regionId, intervention]) => ({ regionId, ...intervention })),
      pathAnalysis: state.pathAnalysis.active ? {
        rootRegionId: state.pathAnalysis.rootRegionId, direction: state.pathAnalysis.direction, depth: state.pathAnalysis.depth,
        metric: state.pathAnalysis.metric, threshold: state.pathAnalysis.threshold, edgeCount: state.pathAnalysis.edges.length
      } : null,
      propagation: state.propagation ? [...state.propagation.arrivals.entries()].map(([regionId, item]) => ({ regionId, ...item })) : [],
      step: state.step,
      simTime: state.simTime,
      totalSpikes: state.totalSpikes,
      peakSpikes: state.peakSpikes,
      avgSpikes: Number(avg.toFixed(3)),
      meanWeight: Number(mean(weights).toFixed(4)),
      meanWeightChange: Number(mean(weightChanges).toFixed(5)),
      avgFatigue: Number(avgFatigue.toFixed(5)),
      fatiguedNodes: state.nodes.filter(node => (node.fatigue || 0) > 0.25).length,
      meanSynapticResource: Number(meanSynapticResource.toFixed(5)),
      meanHomeostaticOffset: Number(meanHomeostaticOffset.toFixed(5)),
      subtypeCounts,
      regionSpikes,
      history: [...state.history],
      analysis: createAnalysisSnapshot()
    };
  }

  function saveExperiment() {
    const name = els.experimentName.value.trim() || `実験 ${state.experiments.length + 1}`;
    const note = els.experimentNote.value.trim();
    state.experiments.unshift(createSnapshot(name, note));
    persistExperiments();
    els.experimentName.value = '';
    els.experimentNote.value = '';
    renderExperiments();
    addEvent(`実験「${name}」を保存`, true);
  }

  function loadExperiments() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        for (const legacyKey of LEGACY_STORAGE_KEYS) {
          raw = localStorage.getItem(legacyKey);
          if (raw) break;
        }
      }
      const parsed = JSON.parse(raw || '[]');
      state.experiments = Array.isArray(parsed) ? parsed : [];
      if (state.experiments.length && !localStorage.getItem(STORAGE_KEY)) persistExperiments();
    } catch (error) {
      console.warn('実験データの読み込みに失敗しました。', error);
      state.experiments = [];
    }
    renderExperiments();
  }

  function persistExperiments() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.experiments));
    } catch (error) {
      console.warn('実験データの保存に失敗しました。', error);
      addEvent('ブラウザ保存に失敗しました', true);
    }
  }

  function deleteExperiment(id) {
    state.experiments = state.experiments.filter(item => item.id !== id);
    if (state.comparison.aId === id || state.comparison.bId === id) clearComparisonOverlay();
    persistExperiments();
    renderExperiments();
  }

  function renderExperiments() {
    if (!state.experiments.length) {
      els.savedExperiments.innerHTML = '<div class="empty-state">保存済み実験はありません。</div>';
    } else {
      els.savedExperiments.innerHTML = state.experiments.map(item => `
        <div class="saved-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${new Date(item.createdAt).toLocaleString('ja-JP')}<br>${item.templateName ? `${escapeHtml(item.templateName)} / ` : ''}${MODEL_PRESETS[item.modelConfig?.preset || 'standard']?.name || '標準'} / 発火 ${item.totalSpikes} / 介入 ${(item.interventions || []).length}件 / seed ${item.seed}-${item.trialSeed ?? '-'}</small>
          </div>
          <button data-delete-id="${escapeHtml(item.id)}" aria-label="削除">削除</button>
        </div>
      `).join('');
    }

    const previousA = els.compareA.value;
    const previousB = els.compareB.value;
    const options = state.experiments.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    els.compareA.innerHTML = `<option value="">比較A</option>${options}`;
    els.compareB.innerHTML = `<option value="">比較B</option>${options}`;
    els.compareA.value = state.experiments.some(item => item.id === previousA) ? previousA : '';
    els.compareB.value = state.experiments.some(item => item.id === previousB) ? previousB : '';
    const analysisPreviousA = els.analysisExperimentA.value;
    const analysisPreviousB = els.analysisExperimentB.value;
    els.analysisExperimentA.innerHTML = `<option value="">比較実験A：なし</option>${options}`;
    els.analysisExperimentB.innerHTML = `<option value="">比較実験B：なし</option>${options}`;
    els.analysisExperimentA.value = state.experiments.some(item => item.id === analysisPreviousA) ? analysisPreviousA : '';
    els.analysisExperimentB.value = state.experiments.some(item => item.id === analysisPreviousB) ? analysisPreviousB : '';
    updateComparison();
    if (state.analysis.open) refreshAnalysis(false);
  }

  function updateComparison() {
    const a = state.experiments.find(item => item.id === els.compareA.value);
    const b = state.experiments.find(item => item.id === els.compareB.value);
    if (!a || !b) {
      els.compareResult.className = 'compare-result empty-state';
      els.compareResult.textContent = '保存した実験を2件選択してください。';
      return;
    }

    const delta = (valueA, valueB, digits = 1) => {
      const aNumber = Number(valueA || 0);
      const bNumber = Number(valueB || 0);
      const difference = bNumber - aNumber;
      return `${difference >= 0 ? '+' : ''}${difference.toFixed(digits)}`;
    };
    const regionDiffs = REGIONS.map(region => ({
      region,
      difference: Number(b.regionSpikes?.[region.id] || 0) - Number(a.regionSpikes?.[region.id] || 0)
    })).sort((x, y) => Math.abs(y.difference) - Math.abs(x.difference));
    const topRegion = regionDiffs[0];

    els.compareResult.className = 'compare-result';
    els.compareResult.innerHTML = `
      <table>
        <thead><tr><th>指標</th><th>A</th><th>B</th><th>B-A</th></tr></thead>
        <tbody>
          <tr><td>総発火</td><td>${a.totalSpikes}</td><td>${b.totalSpikes}</td><td>${delta(a.totalSpikes, b.totalSpikes, 0)}</td></tr>
          <tr><td>ピーク</td><td>${a.peakSpikes}</td><td>${b.peakSpikes}</td><td>${delta(a.peakSpikes, b.peakSpikes, 0)}</td></tr>
          <tr><td>平均</td><td>${Number(a.avgSpikes).toFixed(1)}</td><td>${Number(b.avgSpikes).toFixed(1)}</td><td>${delta(a.avgSpikes, b.avgSpikes, 1)}</td></tr>
          <tr><td>平均結合</td><td>${Number(a.meanWeight).toFixed(3)}</td><td>${Number(b.meanWeight).toFixed(3)}</td><td>${delta(a.meanWeight, b.meanWeight, 3)}</td></tr>
          <tr><td>結合変化</td><td>${Number(a.meanWeightChange || 0).toFixed(4)}</td><td>${Number(b.meanWeightChange || 0).toFixed(4)}</td><td>${delta(a.meanWeightChange, b.meanWeightChange, 4)}</td></tr>
          <tr><td>モデル</td><td>${escapeHtml(MODEL_PRESETS[a.modelConfig?.preset || 'standard']?.name || '標準')}</td><td>${escapeHtml(MODEL_PRESETS[b.modelConfig?.preset || 'standard']?.name || '標準')}</td><td>—</td></tr>
          <tr><td>平均疲労</td><td>${Number(a.avgFatigue || 0).toFixed(3)}</td><td>${Number(b.avgFatigue || 0).toFixed(3)}</td><td>${delta(a.avgFatigue, b.avgFatigue, 3)}</td></tr>
          <tr><td>シナプス資源</td><td>${Number(a.meanSynapticResource ?? 1).toFixed(3)}</td><td>${Number(b.meanSynapticResource ?? 1).toFixed(3)}</td><td>${delta(a.meanSynapticResource ?? 1, b.meanSynapticResource ?? 1, 3)}</td></tr>
          <tr><td>恒常性補正</td><td>${Number(a.meanHomeostaticOffset || 0).toFixed(3)}</td><td>${Number(b.meanHomeostaticOffset || 0).toFixed(3)}</td><td>${delta(a.meanHomeostaticOffset, b.meanHomeostaticOffset, 3)}</td></tr>
          <tr><td>介入数</td><td>${(a.interventions || []).length}</td><td>${(b.interventions || []).length}</td><td>${delta((a.interventions || []).length, (b.interventions || []).length, 0)}</td></tr>
        </tbody>
      </table>
      <div class="compare-summary">最大の領域差：${escapeHtml(topRegion.region.name)} ${topRegion.difference >= 0 ? '+' : ''}${topRegion.difference}発火。正負はBがAより多い／少ないことを表します。介入条件が異なる場合は、介入そのものが差の要因候補になります。</div>
    `;
    if (state.comparison.active) showComparisonOverlay(false);
  }

  function exportExperiments() {
    const payload = {
      app: 'Virtual Brain Lab',
      version: MODEL_VERSION,
      exportedAt: new Date().toISOString(),
      experiments: state.experiments,
      scenarios: state.scenarios
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `virtual-brain-${MODEL_VERSION}-experiments.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function importExperiments(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const incoming = Array.isArray(parsed) ? parsed : parsed.experiments;
        if (!Array.isArray(incoming)) throw new Error('experiments配列がありません。');
        const valid = incoming.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string');
        const merged = new Map(state.experiments.map(item => [item.id, item]));
        valid.forEach(item => merged.set(item.id, item));
        state.experiments = [...merged.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const incomingScenarios = Array.isArray(parsed?.scenarios) ? parsed.scenarios : [];
        if (incomingScenarios.length) {
          const scenarioMap = new Map(state.scenarios.map(item => [item.id, item]));
          incomingScenarios.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string').forEach(item => scenarioMap.set(item.id, item));
          state.scenarios = [...scenarioMap.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
          persistScenarios();
          renderScenarios();
        }
        persistExperiments();
        renderExperiments();
        addEvent(`${valid.length}件の実験データと${incomingScenarios.length}件のシナリオを読み込み`, true);
      } catch (error) {
        console.error(error);
        addEvent(`JSON読込失敗：${error.message}`, true);
      } finally {
        els.importInput.value = '';
      }
    };
    reader.onerror = () => addEvent('JSONファイルを読み込めませんでした', true);
    reader.readAsText(file);
  }

  function updateViewModeUI() {
    const is3D = els.viewMode.value === 'brain3d';
    const relationMode = els.relationDisplay.value;
    els.brain3dControls.classList.toggle('hidden', !is3D);
    state.networkStage.classList.toggle('mode-3d', is3D);
    const relationLabels = {
      structure: '構造接続', activity: '最近の活動', functional: '機能的関連', learning: '学習変化', trace: '解析経路'
    };
    const relationLegend = relationMode === 'trace'
      ? '<span><i class="legend-line trace"></i>解析経路</span><span><i class="legend-dot intervention"></i>介入中</span>'
      : `<span><i class="legend-line active"></i>${relationLabels[relationMode]}</span><span><i class="legend-dot intervention"></i>介入中</span>`;
    const comparisonLegend = state.comparison.active
      ? '<span><i class="legend-dot compare-up"></i>Bで増加</span><span><i class="legend-dot compare-down"></i>Bで減少</span>'
      : '';
    if (is3D) {
      els.focusHint.textContent = '3D領域をクリックして関連を確認';
      els.networkLegend.innerHTML = `<span><i class="legend-dot frontal"></i>前頭葉</span><span><i class="legend-dot parietal"></i>頭頂葉</span><span><i class="legend-dot temporal"></i>側頭葉</span><span><i class="legend-dot occipital"></i>後頭葉</span>${relationLegend}${comparisonLegend}`;
      update3DHistoryControls();
    } else if (els.viewMode.value === 'regions') {
      els.networkLegend.innerHTML = `${relationLegend}${comparisonLegend}`;
    } else {
      els.networkLegend.innerHTML = `<span><i class="legend-dot excitatory"></i>興奮性</span><span><i class="legend-dot inhibitory"></i>抑制性</span>${relationLegend}${comparisonLegend}`;
    }
    renderRegionLabels();
    renderComparisonState();
  }

  function beginBrainDrag(event) {
    if (els.viewMode.value !== 'brain3d') return;
    state.brain3d.dragging = true;
    state.brain3d.dragMoved = false;
    state.brain3d.pointerId = event.pointerId;
    state.brain3d.lastX = event.clientX;
    state.brain3d.lastY = event.clientY;
    state.networkCanvas.classList.add('dragging');
    state.networkCanvas.setPointerCapture?.(event.pointerId);
  }

  function moveBrainDrag(event) {
    if (!state.brain3d.dragging || event.pointerId !== state.brain3d.pointerId) return;
    const dx = event.clientX - state.brain3d.lastX;
    const dy = event.clientY - state.brain3d.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) state.brain3d.dragMoved = true;
    state.brain3d.yaw += dx * 0.008;
    state.brain3d.pitch = clamp(state.brain3d.pitch + dy * 0.006, -1.12, 1.12);
    state.brain3d.lastX = event.clientX;
    state.brain3d.lastY = event.clientY;
  }

  function endBrainDrag(event) {
    if (!state.brain3d.dragging) return;
    if (event?.pointerId !== undefined && event.pointerId !== state.brain3d.pointerId) return;
    state.brain3d.dragging = false;
    state.brain3d.suppressClick = state.brain3d.dragMoved;
    state.brain3d.pointerId = null;
    state.networkCanvas.classList.remove('dragging');
    if (event?.pointerId !== undefined) state.networkCanvas.releasePointerCapture?.(event.pointerId);
  }

  function recordAnalysisStep({ spikesThisStep, regionCounts, regionExcitatoryCounts, regionInhibitoryCounts, routeSignalsThisStep }) {
    const synapseChange = Object.fromEntries(state.regionEdges.map(regionEdge => [
      regionEdge.key,
      Number(mean(regionEdge.edges.map(edge => Math.abs(edge.weight) - Math.abs(edge.baseWeight))).toFixed(6))
    ]));
    const meanWeightChange = mean(state.edges.map(edge => Math.abs(edge.weight) - Math.abs(edge.baseWeight)));
    state.analysis.records.push({
      step: state.step,
      totalSpikes: spikesThisStep,
      regionCounts: { ...regionCounts },
      regionExcitatoryCounts: { ...regionExcitatoryCounts },
      regionInhibitoryCounts: { ...regionInhibitoryCounts },
      routeSignals: Object.fromEntries(Object.entries(routeSignalsThisStep).map(([key, value]) => [key, {
        count: value.count,
        excitatory: value.excitatory,
        inhibitory: value.inhibitory,
        absValue: Number(value.absValue.toFixed(5)),
        netValue: Number(value.netValue.toFixed(5))
      }])),
      synapseChange,
      meanWeightChange: Number(meanWeightChange.toFixed(6))
    });
    if (state.analysis.records.length > ANALYSIS_HISTORY_LIMIT) state.analysis.records.shift();
    if (state.analysis.live) state.analysis.cursorIndex = Math.max(0, state.analysis.records.length - 1);
  }

  function createAnalysisSnapshot() {
    const source = state.analysis.records.slice(-HISTORY_LIMIT);
    return {
      records: source.map(record => ({
        step: record.step,
        totalSpikes: record.totalSpikes,
        regionCounts: { ...record.regionCounts },
        regionExcitatoryCounts: { ...record.regionExcitatoryCounts },
        regionInhibitoryCounts: { ...record.regionInhibitoryCounts },
        meanWeightChange: record.meanWeightChange
      })),
      routeStats: Object.fromEntries(Object.entries(state.analysis.routeStats).map(([key, value]) => [key, { ...value }])),
      synapseChange: source.length ? { ...source[source.length - 1].synapseChange } : {},
      propagation: state.propagation ? [...state.propagation.arrivals.entries()].map(([regionId, item]) => ({ regionId, ...item })) : []
    };
  }

  function initializeAnalysisControls() {
    const options = REGIONS.map(region => `<option value="${region.id}">${escapeHtml(region.name)}</option>`).join('');
    els.analysisPrimaryRegion.innerHTML = options;
    els.analysisSecondaryRegion.innerHTML = options;
    els.analysisPrimaryRegion.value = state.analysis.primaryRegionId;
    els.analysisSecondaryRegion.value = state.analysis.secondaryRegionId;
    updateAnalysisRouteOptions();
  }

  function updateAnalysisRouteOptions() {
    const previous = els.analysisRouteSelect.value || state.analysis.routeKey;
    const options = state.regionEdges
      .slice()
      .sort((a, b) => a.sourceRegionId.localeCompare(b.sourceRegionId) || a.targetRegionId.localeCompare(b.targetRegionId))
      .map(regionEdge => {
        const source = REGION_BY_ID.get(regionEdge.sourceRegionId);
        const target = REGION_BY_ID.get(regionEdge.targetRegionId);
        return `<option value="${escapeHtml(regionEdge.key)}">${escapeHtml(source?.short || regionEdge.sourceRegionId)} → ${escapeHtml(target?.short || regionEdge.targetRegionId)}</option>`;
      }).join('');
    els.analysisRouteSelect.innerHTML = options || '<option value="">経路なし</option>';
    const fallback = state.regionEdgeMap.has('VIS>THA') ? 'VIS>THA' : state.regionEdges[0]?.key || '';
    els.analysisRouteSelect.value = state.regionEdgeMap.has(previous) ? previous : fallback;
    state.analysis.routeKey = els.analysisRouteSelect.value;
  }

  function openAnalysis() {
    state.analysis.open = true;
    els.analysisModal.classList.remove('hidden');
    document.body.classList.add('analysis-open');
    state.analysis.live = true;
    state.analysis.cursorIndex = Math.max(0, state.analysis.records.length - 1);
    refreshAnalysis(true);
  }

  function closeAnalysis() {
    state.analysis.open = false;
    els.analysisModal.classList.add('hidden');
    document.body.classList.remove('analysis-open');
  }

  function analysisRangeRecords() {
    const limit = Math.max(1, Number(els.analysisRange.value) || 240);
    return state.analysis.records.slice(-limit);
  }

  function analysisCursorRecord() {
    if (!state.analysis.records.length) return null;
    const index = clamp(state.analysis.cursorIndex, 0, state.analysis.records.length - 1);
    return state.analysis.records[index];
  }

  function aggregateRegion(records, field, regionId) {
    return records.reduce((sum, record) => sum + Number(record[field]?.[regionId] || 0), 0);
  }

  function routeName(routeKey, long = false) {
    const [sourceId, targetId] = String(routeKey || '').split('>');
    const source = REGION_BY_ID.get(sourceId);
    const target = REGION_BY_ID.get(targetId);
    return `${long ? source?.name : source?.short || sourceId} → ${long ? target?.name : target?.short || targetId}`;
  }

  function analysisCorrelation(records, regionA, regionB) {
    const a = records.map(record => Number(record.regionCounts?.[regionA] || 0));
    const b = records.map(record => Number(record.regionCounts?.[regionB] || 0));
    return pearsonCorrelation(a, b);
  }

  function strongestCorrelation(records) {
    let best = { a: null, b: null, value: 0 };
    if (records.length < 8) return best;
    for (let i = 0; i < REGIONS.length; i += 1) {
      for (let j = i + 1; j < REGIONS.length; j += 1) {
        const value = analysisCorrelation(records, REGIONS[i].id, REGIONS[j].id);
        if (Math.abs(value) > Math.abs(best.value)) best = { a: REGIONS[i], b: REGIONS[j], value };
      }
    }
    return best;
  }

  function currentAnalysisSummary() {
    const records = analysisRangeRecords();
    const cursorRecord = analysisCursorRecord();
    const total = records.reduce((sum, record) => sum + record.totalSpikes, 0);
    const peak = records.length ? Math.max(...records.map(record => record.totalSpikes)) : 0;
    const regionTotals = Object.fromEntries(REGIONS.map(region => [region.id, aggregateRegion(records, 'regionCounts', region.id)]));
    const excitatoryTotal = REGIONS.reduce((sum, region) => sum + aggregateRegion(records, 'regionExcitatoryCounts', region.id), 0);
    const inhibitoryTotal = REGIONS.reduce((sum, region) => sum + aggregateRegion(records, 'regionInhibitoryCounts', region.id), 0);
    const topRegion = REGIONS.slice().sort((a, b) => regionTotals[b.id] - regionTotals[a.id])[0] || null;
    const routeEntries = Object.entries(state.analysis.routeStats).sort((a, b) => Number(b[1].count || 0) - Number(a[1].count || 0));
    const topRoute = routeEntries[0] || null;
    const correlation = strongestCorrelation(records);
    const synapseEntries = Object.entries(cursorRecord?.synapseChange || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const topSynapse = synapseEntries[0] || null;
    return {
      records, cursorRecord, total, peak, regionTotals, excitatoryTotal, inhibitoryTotal,
      topRegion, topRoute, correlation, topSynapse
    };
  }

  function refreshAnalysis(announce = false) {
    if (!state.analysis.open) return;
    state.analysis.primaryRegionId = els.analysisPrimaryRegion.value || state.analysis.primaryRegionId;
    state.analysis.secondaryRegionId = els.analysisSecondaryRegion.value || state.analysis.secondaryRegionId;
    state.analysis.routeKey = els.analysisRouteSelect.value || state.analysis.routeKey;
    const summary = currentAnalysisSummary();
    updateAnalysisCursor(summary.cursorRecord);
    updateAnalysisMetrics(summary);
    renderAnalysisInterpretation(summary);
    renderAnalysisArrivalTable();
    renderAnalysisEITable(summary.records);
    renderAnalysisRouteTable();
    renderAnalysisSynapseTable(summary.cursorRecord);
    drawAnalysisTimeline(summary.records);
    drawAnalysisCorrelation(summary.records);
    drawAnalysisSynapse(summary.records);
    drawAnalysisOverlay();
    if (announce) addEvent('詳細分析を更新', true);
  }

  function updateAnalysisCursor(cursorRecord) {
    const length = state.analysis.records.length;
    const max = Math.max(0, length - 1);
    if (state.analysis.live) state.analysis.cursorIndex = max;
    state.analysis.cursorIndex = clamp(state.analysis.cursorIndex, 0, max);
    els.analysisCursor.max = String(max);
    els.analysisCursor.value = String(state.analysis.cursorIndex);
    els.analysisCursor.disabled = length === 0;
    if (!cursorRecord) {
      els.analysisCursorLabel.textContent = 'step 0';
      els.analysisCursorSummary.textContent = '刺激またはシナリオを実行すると、時間点を確認できます。';
      return;
    }
    const top = REGIONS.slice().sort((a, b) => Number(cursorRecord.regionCounts?.[b.id] || 0) - Number(cursorRecord.regionCounts?.[a.id] || 0))[0];
    const excitatory = REGIONS.reduce((sum, region) => sum + Number(cursorRecord.regionExcitatoryCounts?.[region.id] || 0), 0);
    const inhibitory = REGIONS.reduce((sum, region) => sum + Number(cursorRecord.regionInhibitoryCounts?.[region.id] || 0), 0);
    els.analysisCursorLabel.textContent = `step ${cursorRecord.step}`;
    els.analysisCursorSummary.textContent = `発火 ${cursorRecord.totalSpikes}・最大 ${top?.short || '—'} ${Number(cursorRecord.regionCounts?.[top?.id] || 0)}・興奮 ${excitatory} / 抑制 ${inhibitory}`;
  }

  function updateAnalysisMetrics(summary) {
    const avg = summary.records.length ? summary.total / summary.records.length : 0;
    els.analysisMetricSpikes.textContent = String(summary.total);
    els.analysisMetricSpikesSub.textContent = `平均 ${avg.toFixed(2)}/step・ピーク ${summary.peak}`;
    els.analysisMetricRegion.textContent = summary.topRegion?.short || '—';
    els.analysisMetricRegionSub.textContent = `${summary.topRegion ? summary.regionTotals[summary.topRegion.id] : 0} spike`;
    const ratio = summary.inhibitoryTotal > 0 ? summary.excitatoryTotal / summary.inhibitoryTotal : (summary.excitatoryTotal > 0 ? Infinity : 0);
    els.analysisMetricEI.textContent = Number.isFinite(ratio) ? `${ratio.toFixed(1)} : 1` : '興奮のみ';
    els.analysisMetricEISub.textContent = `興奮 ${summary.excitatoryTotal} / 抑制 ${summary.inhibitoryTotal}`;
    els.analysisMetricRoute.textContent = summary.topRoute ? routeName(summary.topRoute[0]) : '—';
    els.analysisMetricRouteSub.textContent = `通過 ${summary.topRoute ? summary.topRoute[1].count : 0}`;
    els.analysisMetricCorrelation.textContent = summary.correlation.a ? `${summary.correlation.a.short} × ${summary.correlation.b.short}` : '—';
    els.analysisMetricCorrelationSub.textContent = `r = ${summary.correlation.value.toFixed(2)}`;
    els.analysisMetricSynapse.textContent = summary.topSynapse ? routeName(summary.topSynapse[0]) : '—';
    els.analysisMetricSynapseSub.textContent = `Δ ${summary.topSynapse ? Number(summary.topSynapse[1]).toFixed(4) : '0.0000'}`;
  }

  function renderAnalysisInterpretation(summary) {
    if (!summary.records.length) {
      els.analysisInterpretation.textContent = '刺激またはシナリオを実行すると、活動の中心、伝播時間、興奮・抑制バランス、同期、結合変化をここに整理します。';
      return;
    }
    const parts = [];
    const avg = summary.total / summary.records.length;
    parts.push(`選択範囲では合計 <strong>${summary.total}</strong> 回、平均 <strong>${avg.toFixed(2)}</strong> 回/stepの発火が記録され、最も活動した領域は <strong>${escapeHtml(summary.topRegion?.name || '—')}</strong> でした。`);
    if (state.propagation?.arrivals?.size) {
      const arrivals = [...state.propagation.arrivals.entries()].sort((a, b) => a[1].offset - b[1].offset);
      const last = arrivals[arrivals.length - 1];
      parts.push(`刺激後の初回反応は ${arrivals.length} 領域で確認され、最も遅い記録は <strong>${escapeHtml(REGION_BY_ID.get(last[0])?.name || last[0])}</strong> の +${last[1].offset} stepでした。`);
    } else {
      parts.push('刺激開始を基準にした到達時間はまだ記録されていません。');
    }
    if (summary.inhibitoryTotal > 0) {
      const ratio = summary.excitatoryTotal / summary.inhibitoryTotal;
      parts.push(`発火内訳は興奮性 ${summary.excitatoryTotal}、抑制性 ${summary.inhibitoryTotal}で、比率は約 <strong>${ratio.toFixed(1)} : 1</strong> です。`);
    }
    if (summary.topRoute) parts.push(`信号通過が最も多い経路は <strong>${escapeHtml(routeName(summary.topRoute[0], true))}</strong> で、累計 ${summary.topRoute[1].count} 回でした。`);
    if (summary.correlation.a) parts.push(`活動の同期が最も強い組み合わせは <strong>${escapeHtml(summary.correlation.a.name)}と${escapeHtml(summary.correlation.b.name)}</strong>（r=${summary.correlation.value.toFixed(2)}）ですが、これは直接接続や因果を示す値ではありません。`);
    if (summary.topSynapse) parts.push(`選択時点で最も大きな平均結合変化は <strong>${escapeHtml(routeName(summary.topSynapse[0], true))}</strong> の Δ${Number(summary.topSynapse[1]).toFixed(4)} です。`);
    els.analysisInterpretation.innerHTML = parts.join(' ');
  }

  function renderAnalysisArrivalTable() {
    if (!state.propagation?.arrivals?.size) {
      els.analysisArrivalTable.innerHTML = '<div class="empty-state">刺激シーケンスを開始すると、各領域の初回到達stepを記録します。</div>';
      return;
    }
    const rows = [...state.propagation.arrivals.entries()]
      .sort((a, b) => a[1].offset - b[1].offset)
      .map(([regionId, item], index) => `<tr><td>${index + 1}</td><td>${escapeHtml(REGION_BY_ID.get(regionId)?.name || regionId)}</td><td>step ${item.step}</td><td>+${item.offset}</td><td>${item.target ? '<span class="analysis-route-badge">刺激元</span>' : '伝播'}</td></tr>`).join('');
    els.analysisArrivalTable.innerHTML = `<table class="analysis-table"><thead><tr><th>順</th><th>領域</th><th>初回</th><th>遅延</th><th>区分</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderAnalysisEITable(records) {
    if (!records.length) {
      els.analysisEITable.innerHTML = '<div class="empty-state">発火記録がありません。</div>';
      return;
    }
    const rows = REGIONS.map(region => {
      const excitatory = aggregateRegion(records, 'regionExcitatoryCounts', region.id);
      const inhibitory = aggregateRegion(records, 'regionInhibitoryCounts', region.id);
      const total = excitatory + inhibitory;
      const exWidth = total ? excitatory / total * 100 : 0;
      const inWidth = total ? inhibitory / total * 100 : 0;
      return `<tr><td>${escapeHtml(region.name)}</td><td>${excitatory}</td><td>${inhibitory}</td><td>${total}</td><td class="analysis-bar-cell"><span class="analysis-stack-bar"><i class="ex" style="width:${exWidth.toFixed(1)}%"></i><i class="inh" style="width:${inWidth.toFixed(1)}%"></i></span></td></tr>`;
    }).join('');
    els.analysisEITable.innerHTML = `<table class="analysis-table"><thead><tr><th>領域</th><th>興奮</th><th>抑制</th><th>合計</th><th>内訳</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderAnalysisRouteTable() {
    const entries = Object.entries(state.analysis.routeStats).sort((a, b) => b[1].count - a[1].count).slice(0, 36);
    if (!entries.length) {
      els.analysisRouteTable.innerHTML = '<div class="empty-state">シナプス信号が到達すると、経路別に累計します。</div>';
      return;
    }
    const rows = entries.map(([key, value], index) => `<tr><td>${index + 1}</td><td>${escapeHtml(routeName(key, true))}</td><td>${value.count}</td><td>${value.excitatory}</td><td>${value.inhibitory}</td><td>${Number(value.absValue || 0).toFixed(2)}</td><td>step ${value.lastStep}</td></tr>`).join('');
    els.analysisRouteTable.innerHTML = `<table class="analysis-table"><thead><tr><th>順</th><th>経路</th><th>通過</th><th>興奮</th><th>抑制</th><th>|信号|</th><th>最終</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderAnalysisSynapseTable(cursorRecord) {
    const entries = Object.entries(cursorRecord?.synapseChange || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 12);
    if (!entries.length) {
      els.analysisSynapseTable.innerHTML = '<div class="empty-state">可塑性を有効にして実行すると、経路別の変化を表示します。</div>';
      return;
    }
    const rows = entries.map(([key, value]) => `<tr><td>${escapeHtml(routeName(key, true))}</td><td class="${value >= 0 ? 'positive' : 'negative'}">${value >= 0 ? '+' : ''}${Number(value).toFixed(5)}</td></tr>`).join('');
    els.analysisSynapseTable.innerHTML = `<table class="analysis-table"><thead><tr><th>経路</th><th>平均Δ</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function fitAnalysisCanvas(canvas, ctx) {
    const stage = canvas.parentElement;
    const width = Math.max(1, Math.floor(stage.clientWidth));
    const height = Math.max(1, Math.floor(stage.clientHeight));
    const pixelWidth = Math.max(1, Math.floor(width * state.dpr));
    const pixelHeight = Math.max(1, Math.floor(height * state.dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    return { width, height };
  }

  function drawAnalysisGrid(ctx, width, height, padding, maxValue, minValue = 0) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(3,10,15,.45)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    ctx.font = '9px system-ui';
    ctx.fillStyle = 'rgba(141,164,179,.72)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (height - padding.top - padding.bottom) * i / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const value = maxValue - (maxValue - minValue) * i / 4;
      ctx.fillText(value.toFixed(Math.abs(maxValue - minValue) < 2 ? 2 : 0), padding.left - 6, y + 3);
    }
  }

  function drawAnalysisLine(ctx, values, width, height, padding, minValue, maxValue, color, lineWidth = 1.8) {
    if (!values.length) return;
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const span = Math.max(0.0001, maxValue - minValue);
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = padding.left + (values.length === 1 ? 0 : index / (values.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - (Number(value || 0) - minValue) / span * plotHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawAnalysisTimeline(records) {
    const ctx = state.analysis.timelineCtx;
    const { width, height } = fitAnalysisCanvas(els.analysisTimelineCanvas, ctx);
    const padding = { left: 38, right: 14, top: 24, bottom: 24 };
    const primary = state.analysis.primaryRegionId;
    const secondary = state.analysis.secondaryRegionId;
    const total = records.map(record => record.totalSpikes);
    const primarySeries = records.map(record => Number(record.regionCounts?.[primary] || 0));
    const secondarySeries = records.map(record => Number(record.regionCounts?.[secondary] || 0));
    const maxValue = Math.max(3, ...total, ...primarySeries, ...secondarySeries);
    drawAnalysisGrid(ctx, width, height, padding, maxValue, 0);
    drawAnalysisLine(ctx, total, width, height, padding, 0, maxValue, 'rgba(237,246,251,.82)', 1.4);
    drawAnalysisLine(ctx, primarySeries, width, height, padding, 0, maxValue, 'rgba(77,217,196,.95)', 2.1);
    drawAnalysisLine(ctx, secondarySeries, width, height, padding, 0, maxValue, 'rgba(255,200,103,.92)', 1.8);
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(237,246,251,.82)'; ctx.fillText('全体', padding.left, 14);
    ctx.fillStyle = 'rgba(77,217,196,.95)'; ctx.fillText(REGION_BY_ID.get(primary)?.short || primary, padding.left + 42, 14);
    ctx.fillStyle = 'rgba(255,200,103,.92)'; ctx.fillText(REGION_BY_ID.get(secondary)?.short || secondary, padding.left + 100, 14);
    if (records.length) {
      const cursor = analysisCursorRecord();
      const index = records.findIndex(record => record.step === cursor?.step);
      if (index >= 0) {
        const x = padding.left + (records.length === 1 ? 0 : index / (records.length - 1)) * (width - padding.left - padding.right);
        ctx.strokeStyle = 'rgba(255,127,145,.8)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, height - padding.bottom); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = 'rgba(141,164,179,.72)';
      ctx.textAlign = 'left'; ctx.fillText(`step ${records[0].step}`, padding.left, height - 7);
      ctx.textAlign = 'right'; ctx.fillText(`step ${records[records.length - 1].step}`, width - padding.right, height - 7);
    }
  }

  function correlationColor(value) {
    const magnitude = Math.min(1, Math.abs(value));
    return value >= 0
      ? `rgba(77,217,196,${0.10 + magnitude * 0.78})`
      : `rgba(255,127,145,${0.10 + magnitude * 0.78})`;
  }

  function drawAnalysisCorrelation(records) {
    const ctx = state.analysis.correlationCtx;
    const { width, height } = fitAnalysisCanvas(els.analysisCorrelationCanvas, ctx);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(3,10,15,.45)'; ctx.fillRect(0, 0, width, height);
    const labelSpace = width < 500 ? 52 : 72;
    const matrixSize = Math.min(width - labelSpace - 12, height - labelSpace - 12);
    const cell = matrixSize / REGIONS.length;
    const startX = labelSpace;
    const startY = 8;
    ctx.font = width < 500 ? '7px system-ui' : '9px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    REGIONS.forEach((region, row) => {
      ctx.fillStyle = 'rgba(141,164,179,.82)';
      ctx.fillText(region.short, startX - 5, startY + row * cell + cell / 2);
      REGIONS.forEach((other, column) => {
        const value = region.id === other.id ? 1 : analysisCorrelation(records, region.id, other.id);
        ctx.fillStyle = correlationColor(value);
        ctx.fillRect(startX + column * cell + 1, startY + row * cell + 1, Math.max(1, cell - 2), Math.max(1, cell - 2));
        if (cell > 25) {
          ctx.fillStyle = Math.abs(value) > .55 ? '#071017' : 'rgba(237,246,251,.68)';
          ctx.textAlign = 'center';
          ctx.fillText(value.toFixed(1), startX + column * cell + cell / 2, startY + row * cell + cell / 2);
          ctx.textAlign = 'right';
        }
      });
    });
    ctx.save();
    ctx.translate(startX, startY + matrixSize + 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    REGIONS.forEach((region, index) => {
      ctx.save();
      ctx.translate(index * cell + cell / 2, 0);
      ctx.rotate(-Math.PI / 3);
      ctx.fillStyle = 'rgba(141,164,179,.82)';
      ctx.fillText(region.short, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function drawAnalysisSynapse(records) {
    const ctx = state.analysis.synapseCtx;
    const { width, height } = fitAnalysisCanvas(els.analysisSynapseCanvas, ctx);
    const routeKey = state.analysis.routeKey;
    const values = records.map(record => Number(record.synapseChange?.[routeKey] || 0));
    const maxAbs = Math.max(0.001, ...values.map(Math.abs));
    const padding = { left: 43, right: 12, top: 25, bottom: 23 };
    drawAnalysisGrid(ctx, width, height, padding, maxAbs, -maxAbs);
    const zeroY = padding.top + (height - padding.top - padding.bottom) / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.moveTo(padding.left, zeroY); ctx.lineTo(width - padding.right, zeroY); ctx.stroke();
    drawAnalysisLine(ctx, values, width, height, padding, -maxAbs, maxAbs, 'rgba(255,200,103,.95)', 2);
    ctx.font = '10px system-ui'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(237,246,251,.82)';
    ctx.fillText(routeName(routeKey, true), padding.left, 14);
  }

  function experimentOverlaySeries(experiment) {
    if (!experiment) return [];
    if (Array.isArray(experiment.analysis?.records) && experiment.analysis.records.length) {
      return experiment.analysis.records.map(record => Number(record.totalSpikes || 0));
    }
    return Array.isArray(experiment.history) ? experiment.history.map(Number) : [];
  }

  function drawAnalysisOverlay() {
    const ctx = state.analysis.overlayCtx;
    const { width, height } = fitAnalysisCanvas(els.analysisOverlayCanvas, ctx);
    const current = analysisRangeRecords().map(record => record.totalSpikes);
    const a = state.experiments.find(item => item.id === els.analysisExperimentA.value);
    const b = state.experiments.find(item => item.id === els.analysisExperimentB.value);
    const series = [
      { label: '現在', values: current, color: 'rgba(77,217,196,.95)' },
      { label: a?.name || '実験A', values: experimentOverlaySeries(a), color: 'rgba(255,200,103,.92)' },
      { label: b?.name || '実験B', values: experimentOverlaySeries(b), color: 'rgba(112,167,255,.92)' }
    ].filter(item => item.values.length);
    const padding = { left: 38, right: 14, top: 28, bottom: 22 };
    const maxValue = Math.max(3, ...series.flatMap(item => item.values));
    drawAnalysisGrid(ctx, width, height, padding, maxValue, 0);
    series.forEach((item, index) => {
      drawAnalysisLine(ctx, item.values, width, height, padding, 0, maxValue, item.color, index === 0 ? 2.2 : 1.6);
      ctx.fillStyle = item.color;
      ctx.font = '9px system-ui';
      ctx.textAlign = 'left';
      const shortLabel = item.label.length > 18 ? `${item.label.slice(0, 18)}…` : item.label;
      ctx.fillText(shortLabel, padding.left + index * Math.max(80, (width - padding.left - padding.right) / 3), 16);
    });
  }

  function moveAnalysisCursorTo3D() {
    const record = analysisCursorRecord();
    if (!record) return;
    const index = state.activitySnapshots.findIndex(snapshot => snapshot.step === record.step);
    if (index < 0) {
      addEvent(`step ${record.step}の3D履歴は保持範囲外です`, true);
      return;
    }
    state.brain3d.live = false;
    state.brain3d.historyIndex = index;
    els.viewMode.value = 'brain3d';
    updateViewModeUI();
    update3DHistoryControls();
    addEvent(`分析step ${record.step}を3D表示`, true);
  }

  function exportAnalysisReport() {
    const summary = currentAnalysisSummary();
    if (!summary.records.length) {
      addEvent('分析レポートには実行記録が必要です', true);
      return;
    }
    const interpretation = els.analysisInterpretation.textContent;
    const regionRows = REGIONS.map(region => {
      const spikes = summary.regionTotals[region.id];
      const ex = aggregateRegion(summary.records, 'regionExcitatoryCounts', region.id);
      const inh = aggregateRegion(summary.records, 'regionInhibitoryCounts', region.id);
      return `<tr><th>${escapeHtml(region.name)}</th><td>${spikes}</td><td>${ex}</td><td>${inh}</td></tr>`;
    }).join('');
    const routeRows = Object.entries(state.analysis.routeStats).sort((a, b) => b[1].count - a[1].count).slice(0, 20)
      .map(([key, value]) => `<tr><th>${escapeHtml(routeName(key, true))}</th><td>${value.count}</td><td>${value.excitatory}</td><td>${value.inhibitory}</td><td>${Number(value.absValue || 0).toFixed(2)}</td></tr>`).join('');
    const arrivalRows = state.propagation?.arrivals?.size
      ? [...state.propagation.arrivals.entries()].sort((a, b) => a[1].offset - b[1].offset).map(([regionId, item]) => `<tr><th>${escapeHtml(REGION_BY_ID.get(regionId)?.name || regionId)}</th><td>${item.step}</td><td>+${item.offset}</td></tr>`).join('')
      : '<tr><td colspan="3">到達記録なし</td></tr>';
    const generatedAt = new Date().toLocaleString('ja-JP');
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>仮想神経回路 v018 分析レポート</title><style>body{margin:0;background:#f3f6f8;color:#172630;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:1050px;margin:auto;padding:34px 20px}.card,header{background:#fff;border:1px solid #dce5ea;border-radius:14px;padding:20px;margin-bottom:15px}h1{margin:3px 0 7px;font-size:25px}h2{font-size:17px;margin:0 0 12px}p{line-height:1.7;color:#506876}small{color:#738895}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px;border-bottom:1px solid #e6edf1;text-align:right}th:first-child{text-align:left}.note{background:#f6f9fa;padding:13px;border-radius:9px}.warn{font-size:12px}</style></head><body><main><header><small>VIRTUAL BRAIN LAB / ${MODEL_VERSION}</small><h1>実験結果の詳細分析</h1><p>生成日時：${escapeHtml(generatedAt)} / 分析範囲：${summary.records.length} step / step ${summary.records[0].step}〜${summary.records[summary.records.length - 1].step}</p></header><section class="card"><h2>自動要約</h2><div class="note">${escapeHtml(interpretation)}</div></section><section class="card"><h2>領域別活動</h2><table><thead><tr><th>領域</th><th>発火</th><th>興奮性</th><th>抑制性</th></tr></thead><tbody>${regionRows}</tbody></table></section><section class="card"><h2>刺激後の初回到達</h2><table><thead><tr><th>領域</th><th>step</th><th>遅延</th></tr></thead><tbody>${arrivalRows}</tbody></table></section><section class="card"><h2>信号経路</h2><table><thead><tr><th>経路</th><th>通過</th><th>興奮</th><th>抑制</th><th>|信号|</th></tr></thead><tbody>${routeRows || '<tr><td colspan="5">信号記録なし</td></tr>'}</tbody></table></section><section class="card warn"><strong>注意</strong><p>本レポートはv018概念モデル内部の仮想計算結果です。相関は直接接続や因果関係を示さず、人間の脳活動、診断、治療効果を示すものではありません。</p></section></main></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `virtual-brain-${MODEL_VERSION}-analysis-report.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addEvent('詳細分析レポートを書き出し', true);
  }

  function zoomBrainView(event) {
    if (els.viewMode.value !== 'brain3d') return;
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    state.brain3d.zoom = clamp(state.brain3d.zoom * factor, 0.62, 2.25);
  }

  function bindEvents() {
    els.stimulusStrength.addEventListener('input', () => {
      els.stimulusStrengthValue.textContent = Number(els.stimulusStrength.value).toFixed(2);
    });
    els.stimulusDuration.addEventListener('input', () => {
      els.stimulusDurationValue.textContent = els.stimulusDuration.value;
    });
    els.thresholdScale.addEventListener('input', () => {
      updateModelControlLabels();
      updateSelection();
    });
    els.modelPreset.addEventListener('change', () => updateModelControlLabels());
    els.heterogeneity.addEventListener('input', updateModelControlLabels);
    els.fatigueStrength.addEventListener('input', () => {
      updateModelControlLabels();
      updateSelection();
    });
    els.inhibitoryGain.addEventListener('input', updateModelControlLabels);
    els.connectionDensity.addEventListener('input', updateModelControlLabels);
    els.applyPresetBtn.addEventListener('click', () => applyPresetValues(true));
    els.pathThreshold.addEventListener('input', () => {
      els.pathThresholdValue.textContent = Number(els.pathThreshold.value).toFixed(2);
    });
    els.interventionStrength.addEventListener('input', () => {
      els.interventionStrengthValue.textContent = Number(els.interventionStrength.value).toFixed(2);
    });

    els.stimulateBtn.addEventListener('click', scheduleStimulus);
    els.playBtn.addEventListener('click', startRun);
    els.pauseBtn.addEventListener('click', () => {
      state.running = false;
      if (!state.templateRun || state.templateRun.complete) state.autoStopTarget = null;
      cancelScenarioRun('手動停止');
      updateStatus();
      addEvent(state.templateRun && !state.templateRun.complete ? 'テンプレートを一時停止' : '手動停止');
    });
    els.stepBtn.addEventListener('click', async () => {
      state.running = false;
      state.autoStopTarget = null;
      await executeSingleStep();
      updateStatus();
    });
    els.resetBtn.addEventListener('click', () => {
      cancelScenarioRun('リセット');
      cancelTemplateRun('リセット');
      state.scenarioRun = null;
      resetSimulation(false);
      addEvent('状態をリセット（学習結果は保持）', true);
    });
    els.resetLearningBtn.addEventListener('click', () => {
      cancelScenarioRun('初期化');
      cancelTemplateRun('初期化');
      state.scenarioRun = null;
      resetSimulation(true);
      addEvent('状態と学習結果を初期化', true);
    });
    els.speedSelect.addEventListener('change', () => {
      state.speed = Number(els.speedSelect.value);
    });
    els.regenerateBtn.addEventListener('click', () => {
      cancelScenarioRun('再生成');
      cancelTemplateRun('再生成');
      state.scenarioRun = null;
      const seed = Math.max(1, Math.floor(Number(els.seedInput.value) || 2002));
      buildNetwork(seed);
    });
    els.trialSeedInput.addEventListener('change', () => {
      state.trialSeed = Math.max(1, Math.floor(Number(els.trialSeedInput.value) || 42));
    });

    els.viewMode.addEventListener('change', () => {
      updateViewModeUI();
      updateSelection();
      updateRegionActivity();
    });
    els.connectionFilter.addEventListener('change', updateSelection);
    els.relationDisplay.addEventListener('change', () => {
      if (els.relationDisplay.value === 'trace' && !state.pathAnalysis.active) {
        els.pathAnalysisResult.className = 'path-analysis-result empty-state';
        els.pathAnalysisResult.textContent = '「選択領域から解析」を実行すると、解析経路のみ表示できます。';
      }
      updateViewModeUI();
    });
    els.analyzePathBtn.addEventListener('click', analyzeSelectedPath);
    els.clearPathBtn.addEventListener('click', clearPathAnalysis);
    els.applyInterventionBtn.addEventListener('click', applySelectedIntervention);
    els.clearInterventionsBtn.addEventListener('click', clearInterventions);
    els.templateSelect.addEventListener('change', renderTemplateDetail);
    els.templateTargetRegion.addEventListener('change', renderTemplateDetail);
    els.templateIntensity.addEventListener('change', renderTemplateDetail);
    els.applyTemplateBtn.addEventListener('click', () => applyTemplateControls({ reset: true }));
    els.runTemplateBtn.addEventListener('click', runSelectedTemplate);
    els.saveScenarioBtn.addEventListener('click', saveScenario);
    els.scenarioSelect.addEventListener('change', renderScenarioStatus);
    els.loadScenarioBtn.addEventListener('click', loadSelectedScenario);
    els.runScenarioBtn.addEventListener('click', runSelectedScenario);
    els.deleteScenarioBtn.addEventListener('click', deleteSelectedScenario);
    els.networkCanvas.addEventListener('click', event => {
      if (state.brain3d.suppressClick) {
        state.brain3d.suppressClick = false;
        return;
      }
      hitTest(event);
    });
    els.networkCanvas.addEventListener('pointerdown', beginBrainDrag);
    els.networkCanvas.addEventListener('pointermove', moveBrainDrag);
    els.networkCanvas.addEventListener('pointerup', endBrainDrag);
    els.networkCanvas.addEventListener('pointercancel', endBrainDrag);
    els.networkCanvas.addEventListener('wheel', zoomBrainView, { passive: false });
    els.hemisphereSelect.addEventListener('change', () => {
      state.brain3d.hemisphere = els.hemisphereSelect.value;
    });
    els.shellToggle.addEventListener('change', () => {
      state.brain3d.shellVisible = els.shellToggle.checked;
    });
    els.autoRotateToggle.addEventListener('change', () => {
      state.brain3d.autoRotate = els.autoRotateToggle.checked;
    });
    els.surfaceStyleSelect.addEventListener('change', () => { state.brain3d.surfaceStyle = els.surfaceStyleSelect.value; });
    els.labelsToggle.addEventListener('change', () => { state.brain3d.labelsVisible = els.labelsToggle.checked; });
    els.deepToggle.addEventListener('change', () => { state.brain3d.deepVisible = els.deepToggle.checked; });
    els.sliceAxisSelect.addEventListener('change', () => {
      state.brain3d.sliceAxis = els.sliceAxisSelect.value;
      els.slicePosition.disabled = state.brain3d.sliceAxis === 'none';
    });
    els.slicePosition.addEventListener('input', () => {
      state.brain3d.slicePosition = Number(els.slicePosition.value);
      els.slicePositionLabel.textContent = state.brain3d.slicePosition.toFixed(2);
    });
    els.isolateSelectedToggle.addEventListener('change', () => { state.brain3d.isolateSelected = els.isolateSelectedToggle.checked; });
    els.viewPresetButtons.addEventListener('click', event => {
      const button = event.target.closest('[data-view-preset]');
      if (button) set3DViewPreset(button.dataset.viewPreset);
    });
    els.reset3DViewBtn.addEventListener('click', () => set3DViewPreset('perspective'));
    els.liveViewBtn.addEventListener('click', () => {
      state.brain3d.live = true;
      update3DHistoryControls();
    });
    els.historyStepSlider.addEventListener('input', () => {
      state.brain3d.live = false;
      state.brain3d.historyIndex = Number(els.historyStepSlider.value);
      update3DHistoryControls();
    });
    els.regionActivity.addEventListener('click', event => {
      const row = event.target.closest('[data-region-id]');
      if (!row) return;
      state.selection = { type: 'region', id: row.dataset.regionId };
      updateSelection();
      updateRegionActivity();
    });

    els.engineMode.addEventListener('change', () => changeEngineMode(els.engineMode.value));
    els.engineAdapter.addEventListener('change', () => changeEngineAdapter(els.engineAdapter.value));
    els.apiUrl.addEventListener('change', () => {
      state.engine.apiUrl = normalizeApiUrl(els.apiUrl.value);
      els.apiUrl.value = state.engine.apiUrl;
      updateDeploymentFields();
      state.engine.connected = false;
      state.engine.lastError = null;
      persistEngineSettings();
      renderEngineStatus('URLを変更しました');
    });
    els.remoteChunkSize.addEventListener('change', () => {
      state.engine.chunkSize = Number(els.remoteChunkSize.value) || 4;
      updateDeploymentFields();
      renderDeploymentStatus();
      persistEngineSettings();
      renderEngineStatus();
    });
    els.engineFallbackToggle.addEventListener('change', () => {
      state.engine.fallback = els.engineFallbackToggle.checked;
      persistEngineSettings();
    });
    els.testApiBtn.addEventListener('click', () => testApiConnection());
    els.refreshAdaptersBtn.addEventListener('click', () => refreshEngineAdapters());
    els.validateApiBtn.addEventListener('click', validateRemoteNetwork);
    els.inspectAdapterBtn.addEventListener('click', inspectSelectedAdapter);
    els.exportAdapterBtn.addEventListener('click', exportSelectedAdapter);
    els.deploymentCheckBtn.addEventListener('click', runDeploymentCheck);
    els.copyApiUrlBtn.addEventListener('click', copyApiUrl);
    els.engineSelfTestBtn.addEventListener('click', runSelectedEngineSelfTest);

    els.dataSourceMode.addEventListener('change', () => activateDataSource(els.dataSourceMode.value));
    els.importDatasetBtn.addEventListener('click', () => els.externalDataInput.click());
    els.externalDataInput.addEventListener('change', () => importExternalDataset(els.externalDataInput.files?.[0]));
    els.exportDatasetBtn.addEventListener('click', exportCurrentDataset);
    els.downloadDatasetTemplateBtn.addEventListener('click', downloadDatasetTemplate);
    els.resetDatasetBtn.addEventListener('click', resetExternalDataset);

    els.atlasSystemFilter.addEventListener('change', renderAtlasHierarchy);
    els.atlasHierarchy.addEventListener('click', event => {
      const button = event.target.closest('[data-atlas-region]');
      if (!button) return;
      state.selection = { type: 'region', id: button.dataset.atlasRegion };
      updateSelection();
      updateRegionActivity();
    });

    els.saveExperimentBtn.addEventListener('click', saveExperiment);
    els.savedExperiments.addEventListener('click', event => {
      const button = event.target.closest('[data-delete-id]');
      if (button) deleteExperiment(button.dataset.deleteId);
    });
    els.compareA.addEventListener('change', updateComparison);
    els.compareB.addEventListener('change', updateComparison);
    els.showComparisonBtn.addEventListener('click', () => showComparisonOverlay(true));
    els.clearComparisonBtn.addEventListener('click', clearComparisonOverlay);
    els.exportReportBtn.addEventListener('click', exportComparisonReport);
    els.exportBtn.addEventListener('click', exportExperiments);
    els.importBtn.addEventListener('click', () => els.importInput.click());
    els.importInput.addEventListener('change', () => importExperiments(els.importInput.files?.[0]));

    els.openAnalysisBtn.addEventListener('click', openAnalysis);
    els.closeAnalysisBtn.addEventListener('click', closeAnalysis);
    els.refreshAnalysisBtn.addEventListener('click', () => refreshAnalysis(true));
    els.exportAnalysisBtn.addEventListener('click', exportAnalysisReport);
    els.analysisModal.addEventListener('click', event => {
      if (event.target === els.analysisModal) closeAnalysis();
    });
    els.analysisRange.addEventListener('change', () => refreshAnalysis(false));
    els.analysisPrimaryRegion.addEventListener('change', () => {
      state.analysis.primaryRegionId = els.analysisPrimaryRegion.value;
      refreshAnalysis(false);
    });
    els.analysisSecondaryRegion.addEventListener('change', () => {
      state.analysis.secondaryRegionId = els.analysisSecondaryRegion.value;
      refreshAnalysis(false);
    });
    els.analysisRouteSelect.addEventListener('change', () => {
      state.analysis.routeKey = els.analysisRouteSelect.value;
      refreshAnalysis(false);
    });
    els.analysisCursor.addEventListener('input', () => {
      state.analysis.live = false;
      state.analysis.cursorIndex = Number(els.analysisCursor.value);
      refreshAnalysis(false);
    });
    els.analysisLiveBtn.addEventListener('click', () => {
      state.analysis.live = true;
      state.analysis.cursorIndex = Math.max(0, state.analysis.records.length - 1);
      refreshAnalysis(false);
    });
    els.analysisTo3DBtn.addEventListener('click', moveAnalysisCursorTo3D);
    els.analysisExperimentA.addEventListener('change', drawAnalysisOverlay);
    els.analysisExperimentB.addEventListener('change', drawAnalysisOverlay);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.analysis.open) closeAnalysis();
    });
    state.analysis.resizeHandler = () => {
      if (state.analysis.open) refreshAnalysis(false);
    };
    window.addEventListener('resize', state.analysis.resizeHandler);

    state.resizeObserver = new ResizeObserver(() => {
      drawNetwork();
      drawChart();
    });
    state.resizeObserver.observe(state.networkStage);
    state.resizeObserver.observe(state.chartStage);
  }

  function frame(timestamp) {
    if (!state.lastFrame) state.lastFrame = timestamp;
    const elapsed = Math.min(100, timestamp - state.lastFrame);
    state.lastFrame = timestamp;
    if (els.viewMode?.value === 'brain3d' && state.brain3d.autoRotate && !state.brain3d.dragging) {
      state.brain3d.yaw += elapsed * 0.00018;
    }
    if (state.running) {
      if (state.engine.mode === 'remote') {
        const remoteSteps = state.templateRun && !state.templateRun.complete ? 1 : Math.max(1, Number(state.engine.chunkSize || 4));
        const requestInterval = Math.max(45, 70 * remoteSteps / Math.max(0.25, state.speed));
        state.accumulator += elapsed;
        if (state.accumulator >= requestInterval && !state.engine.busy) {
          state.accumulator = Math.max(0, state.accumulator - requestInterval);
          remoteSimulationChunk(remoteSteps);
        }
      } else {
        state.accumulator += elapsed * state.speed;
        const stepInterval = 70;
        let guard = 0;
        while (state.accumulator >= stepInterval && guard < 16) {
          simulationStep();
          state.accumulator -= stepInterval;
          guard += 1;
          if (!state.running) break;
        }
      }
    }
    drawNetwork();
    drawChart();
    requestAnimationFrame(frame);
  }

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function init() {
    cacheElements();
    generateBrainShellPoints();
    bindEvents();
    loadEngineSettings();
    if (state.engine.mode === 'remote') testApiConnection({ silent: true }).then(() => renderDeploymentStatus());
    loadExternalDataset();
    updateModelControlLabels();
    buildNetwork(Number(els.seedInput.value));
    initializeTemplateControls();
    initializeAnalysisControls();
    loadExperiments();
    loadScenarios();
    updateDeploymentFields();
    renderDeploymentStatus();
    renderComparisonState();
    updateStatus();
    updateMetrics();
    updateSequenceStatus();
    updateViewModeUI();
    renderPathAnalysis();
    renderPropagationTimeline();
    renderInterventions();
    renderAtlasHierarchy();
    update3DHistoryControls();
    requestAnimationFrame(frame);
  }

  window.VBL_APP = {
    version: MODEL_VERSION,
    getSimulationPayload(steps = 40) {
      const payload = remoteSimulationPayload(Math.max(1, Math.min(100, Number(steps) || 40)));
      payload.engine_id = 'native';
      return JSON.parse(JSON.stringify(payload));
    },
    getApiUrl() { return normalizeApiUrl(els.apiUrl?.value || state.engine.apiUrl || window.location.origin); },
    getEngineSnapshot() { return JSON.parse(JSON.stringify(engineMetadata())); }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
