/**
 * 仮想神経回路 v018 公開環境設定
 *
 * GitHub / Vercelへそのまま配置できるよう、実行場所からAPI接続先を自動判定します。
 * 秘密情報やAPIキーはこのファイルへ記載しないでください。
 */
(() => {
  'use strict';

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const isFile = protocol === 'file:';
  const isHosted = !isFile && !isLocalHost;

  window.VIRTUAL_BRAIN_CONFIG = Object.freeze({
    appVersion: 'v018',
    environment: isFile ? 'file' : isLocalHost ? 'local' : 'hosted',
    environmentLabel: isFile ? 'ローカルファイル' : isLocalHost ? 'ローカル開発' : '公開環境',
    defaultEngineMode: isFile ? 'local' : 'remote',
    defaultApiUrl: isHosted ? window.location.origin : 'http://127.0.0.1:8765',
    defaultChunkSize: isHosted ? 8 : 4,
    requestTimeoutMs: isHosted ? 18000 : 12000,
    allowBrowserFallback: true,
    maxPayloadWarningBytes: 3_800_000
  });
})();
