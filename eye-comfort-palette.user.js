// ==UserScript==
// @name         网页配色切换器 Webpage Color Changer
// @namespace    https://github.com/xyz6683/eye-comfort-palette
// @version      1.0.0
// @description  一键把深色网页切换为白底黑字等护眼配色；按网站自动记忆，可随时恢复或停用；只改颜色，不破坏布局。
// @homepageURL  https://github.com/xyz6683/eye-comfort-palette
// @supportURL   https://github.com/xyz6683/eye-comfort-palette/issues
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @noframes
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const STYLE_ID = 'wbc-theme-style';
  const ROOT_ID = 'wbc-root';
  const host = typeof location !== 'undefined' ? (location.hostname || 'unknown') : 'unknown';
  const IS_BROWSER = typeof document !== 'undefined' && typeof window !== 'undefined';
  const IS_GM = typeof GM_setValue === 'function' && typeof GM_getValue === 'function';

  // ---------------------------------------------------------------
  // 1. 配色注册表：新增一套配色，只需在这里追加一个对象
  //    id         唯一标识（存储用）
  //    scheme     页面 color-scheme 属性（决定原生表单控件/滚动条的明暗渲染）
  //    colors     九个色值，全部为 #rrggbb 格式，供 buildCss 统一消费
  // ---------------------------------------------------------------
  const THEMES = [
    {
      id: 'off',
      name: '跟随网站',
      desc: '恢复网页原本的配色',
      scheme: 'normal',
      colors: null,
    },
    {
      id: 'light',
      name: '白底黑字',
      desc: '经典黑白，长时间阅读不易疲劳',
      scheme: 'light',
      colors: {
        text: '#1b1b1b',
        bg: '#ffffff',
        surface: '#f3f3f5',
        input: '#ffffff',
        link: '#0b57d0',
        linkVisited: '#681da8',
        border: '#c9c9ce',
        muted: '#8b8b90',
        highlight: '#fff2a8',
      },
    },
    {
      id: 'sepia',
      name: '护眼米黄',
      desc: '暖色纸感，夜间柔和不刺眼',
      scheme: 'light',
      colors: {
        text: '#3d3224',
        bg: '#f7f0e0',
        surface: '#efe6cf',
        input: '#fdfaf1',
        link: '#8a5a22',
        linkVisited: '#6d4b7d',
        border: '#d9cbb0',
        muted: '#9c8c72',
        highlight: '#ffe08a',
      },
    },
    {
      id: 'dark',
      name: '柔和深色',
      desc: '低对比深灰，替代刺眼的纯黑主题',
      scheme: 'dark',
      colors: {
        text: '#d6d6d6',
        bg: '#1f1f1f',
        surface: '#2a2a2a',
        input: '#2b2b2b',
        link: '#8ab4f8',
        linkVisited: '#c58af9',
        border: '#3f3f3f',
        muted: '#8f8f8f',
        highlight: '#5a4a00',
      },
    },
  ];

  const THEME_IDS = THEMES.map(function (t) { return t.id; });
  function themeById(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return null;
  }

  // ---------------------------------------------------------------
  // 2. 按站点存储（GM_setValue / GM_getValue）
  // ---------------------------------------------------------------
  const KEY_THEMES = 'wbcThemeByHost';
  const KEY_EXCLUDED = 'wbcExcludedHosts';

  function gmGet(key, fallback) {
    try {
      if (IS_GM) {
        var v = GM_getValue(key);
        return v === undefined ? fallback : v;
      }
    } catch (e) { /* ignore */ }
    return fallback;
  }
  function gmSet(key, value) {
    try {
      if (IS_GM) GM_setValue(key, value);
    } catch (e) { /* ignore */ }
  }
  function isExcluded() {
    var a = gmGet(KEY_EXCLUDED, []);
    return Array.isArray(a) && a.indexOf(host) >= 0;
  }
  function setExcluded(v) {
    var a = gmGet(KEY_EXCLUDED, []);
    if (!Array.isArray(a)) a = [];
    var i = a.indexOf(host);
    if (v && i < 0) a.push(host);
    if (!v && i >= 0) a.splice(i, 1);
    gmSet(KEY_EXCLUDED, a);
  }
  function getThemeId() {
    var m = gmGet(KEY_THEMES, {});
    return (m && typeof m === 'object' && m[host]) || 'off';
  }
  function setThemeId(id) {
    var m = gmGet(KEY_THEMES, {});
    if (!m || typeof m !== 'object') m = {};
    if (id === 'off') delete m[host];
    else m[host] = id;
    gmSet(KEY_THEMES, m);
  }

  // ---------------------------------------------------------------
  // 3. CSS 生成：只改颜色相关属性，媒体元素与布局一律不碰
  // ---------------------------------------------------------------
  const FLATTEN_SELECTORS =
    'header, footer, nav, main, aside, section, article, div, ul, ol, li, dl, ' +
    'table, thead, tbody, tfoot, tr, fieldset, form, details, summary, ' +
    'figure, figcaption, blockquote, p';

  const TEXT_SELECTORS =
    'html, body, div, p, span, li, td, th, dt, dd, h1, h2, h3, h4, h5, h6, ' +
    'a, label, legend, output, caption, summary, figcaption, blockquote, ' +
    'pre, code, kbd, samp, small, strong, em, b, i, u, abbr, time, q, cite, mark';

  function buildCss(t) {
    var c = t.colors;
    var scheme = t.scheme === 'dark' ? 'dark' : 'light';
    return [
      '/* Webpage Color Changer · ' + t.name + ' */',
      'html { color-scheme: ' + scheme + ' !important; }',
      'html, body { background-color: ' + c.bg + ' !important; background-image: none !important; }',
      FLATTEN_SELECTORS + ' { background-color: transparent !important; background-image: none !important; }',
      TEXT_SELECTORS + ' { color: ' + c.text + ' !important; text-shadow: none !important; -webkit-text-fill-color: ' + c.text + ' !important; }',
      'a { color: ' + c.link + ' !important; -webkit-text-fill-color: ' + c.link + ' !important; }',
      'a:visited { color: ' + c.linkVisited + ' !important; -webkit-text-fill-color: ' + c.linkVisited + ' !important; }',
      'mark { background-color: ' + c.highlight + ' !important; color: ' + c.text + ' !important; }',
      'pre, code, kbd, samp { background-color: ' + c.surface + ' !important; border-color: ' + c.border + ' !important; }',
      'blockquote { border-left-color: ' + c.border + ' !important; }',
      'hr { background-color: ' + c.border + ' !important; border-color: ' + c.border + ' !important; }',
      'table, td, th { border-color: ' + c.border + ' !important; }',
      'input, textarea, select, option, button { color: ' + c.text + ' !important; background-color: ' + c.input + ' !important; border-color: ' + c.border + ' !important; background-image: none !important; }',
      'input::placeholder, textarea::placeholder { color: ' + c.muted + ' !important; opacity: 1 !important; }',
      'input[type="checkbox"], input[type="radio"], input[type="range"], progress { accent-color: ' + c.link + ' !important; }',
      '::selection { background-color: ' + c.highlight + ' !important; color: ' + c.text + ' !important; }',
      '* { scrollbar-color: ' + c.border + ' ' + c.bg + ' !important; }',
      '::-webkit-scrollbar { background-color: ' + c.bg + ' !important; }',
      '::-webkit-scrollbar-track { background-color: ' + c.bg + ' !important; }',
      '::-webkit-scrollbar-thumb { background-color: ' + c.border + ' !important; }',
      '::-webkit-scrollbar-corner { background-color: ' + c.bg + ' !important; }',
      '',
    ].join('\n');
  }

  // ---------------------------------------------------------------
  // 4. 应用 / 移除主题
  // ---------------------------------------------------------------
  function applyTheme(id) {
    var old = document.getElementById(STYLE_ID);
    if (old) old.remove();
    var de = document.documentElement;
    if (de) de.removeAttribute('data-wbc-theme');

    if (!id || id === 'off') return;
    var t = themeById(id);
    if (!t || !t.colors) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = buildCss(t);
    (document.head || de).appendChild(style);
    if (de) de.setAttribute('data-wbc-theme', id);
  }

  // ---------------------------------------------------------------
  // 5. 悬浮面板（Shadow DOM 隔离，页面样式与主题样式都影响不到它）
  // ---------------------------------------------------------------
  const PALETTE_SVG =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1b1b1b" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2 1 1 0 0 1 1-1h1a4 4 0 0 0 0-8h-1a2 2 0 0 1-2-2 2 2 0 0 0-2-2Z"/>' +
    '<circle cx="7.5" cy="10.5" r=".8" fill="#1b1b1b" stroke="none"/>' +
    '<circle cx="12" cy="7.5" r=".8" fill="#1b1b1b" stroke="none"/>' +
    '<circle cx="16.5" cy="9.6" r=".8" fill="#1b1b1b" stroke="none"/>' +
    '</svg>';

  const UI_CSS =
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    ':host { all: initial; }' +
    '.wbc-btn { position: fixed; right: 16px; bottom: 16px; width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(0,0,0,.14); background: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,.28); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .15s ease, opacity .2s ease, box-shadow .15s ease; }' +
    '.wbc-btn:hover { transform: scale(1.07); box-shadow: 0 4px 14px rgba(0,0,0,.32); }' +
    '.wbc-btn.wbc-disabled { opacity: .5; }' +
    '.wbc-dot { position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; border-radius: 50%; background: #0b57d0; border: 2px solid #ffffff; display: none; }' +
    '.wbc-panel { position: fixed; right: 16px; bottom: 72px; width: 264px; background: #ffffff; color: #1b1b1b; border: 1px solid rgba(0,0,0,.12); border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.28); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; font-size: 13px; line-height: 1.45; padding: 14px; display: none; }' +
    '.wbc-panel.wbc-open { display: block; }' +
    '.wbc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }' +
    '.wbc-title { font-size: 14px; font-weight: 600; color: #1b1b1b; }' +
    '.wbc-close { border: none; background: transparent; color: #666; font-size: 16px; cursor: pointer; width: 24px; height: 24px; border-radius: 6px; line-height: 1; }' +
    '.wbc-close:hover { background: #f0f0f0; color: #1b1b1b; }' +
    '.wbc-site { font-size: 11px; color: #8b8b90; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
    '.wbc-list { display: flex; flex-direction: column; gap: 6px; }' +
    '.wbc-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: 1px solid #e4e4e7; background: #ffffff; border-radius: 10px; padding: 8px 10px; cursor: pointer; color: #1b1b1b; font: inherit; }' +
    '.wbc-item:hover { background: #f5f5f7; }' +
    '.wbc-item.wbc-active { border-color: #0b57d0; background: #eef4ff; }' +
    '.wbc-swatch { display: flex; gap: 3px; align-items: center; }' +
    '.wbc-swatch i { width: 13px; height: 13px; border-radius: 50%; border: 1px solid rgba(0,0,0,.18); display: block; }' +
    '.wbc-meta { flex: 1; min-width: 0; }' +
    '.wbc-name { display: block; font-weight: 600; font-size: 13px; color: #1b1b1b; }' +
    '.wbc-desc { display: block; font-size: 11px; color: #8b8b90; }' +
    '.wbc-check { color: #0b57d0; font-weight: 700; font-size: 14px; visibility: hidden; }' +
    '.wbc-item.wbc-active .wbc-check { visibility: visible; }' +
    '.wbc-foot { margin-top: 10px; border-top: 1px solid #eeeeee; padding-top: 10px; }' +
    '.wbc-exclude { width: 100%; border: 1px solid #e4e4e7; background: #ffffff; color: #555555; border-radius: 8px; padding: 6px 10px; font: inherit; font-size: 12px; cursor: pointer; }' +
    '.wbc-exclude:hover { background: #f5f5f7; color: #1b1b1b; }' +
    '.wbc-hint { font-size: 11px; color: #b0b0b5; margin-top: 8px; }';

  var ui = null;

  function initUI() {
    if (ui || document.getElementById(ROOT_ID)) return;

    var root = document.createElement('div');
    root.id = ROOT_ID;
    root.style.setProperty('position', 'fixed', 'important');
    root.style.setProperty('right', '16px', 'important');
    root.style.setProperty('bottom', '16px', 'important');
    root.style.setProperty('width', '0', 'important');
    root.style.setProperty('height', '0', 'important');
    root.style.setProperty('z-index', '2147483647', 'important');
    root.style.setProperty('transform', 'none', 'important');

    var rows = THEMES.map(function (t) {
      var sw;
      if (t.colors) {
        sw = '<span class="wbc-swatch">' +
          '<i style="background:' + t.colors.bg + '"></i>' +
          '<i style="background:' + t.colors.text + '"></i>' +
          '<i style="background:' + t.colors.link + '"></i>' +
          '</span>';
      } else {
        sw = '<span class="wbc-swatch">' +
          '<i style="background:#ffffff;border-style:dashed"></i>' +
          '<i style="background:#1b1b1b;border-style:dashed"></i>' +
          '</span>';
      }
      return '<button class="wbc-item" data-id="' + t.id + '">' + sw +
        '<span class="wbc-meta"><span class="wbc-name">' + t.name + '</span>' +
        '<span class="wbc-desc">' + t.desc + '</span></span>' +
        '<span class="wbc-check">\u2713</span></button>';
    }).join('');

    var shadow = root.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<style>' + UI_CSS + '</style>' +
      '<button class="wbc-btn" title="网页配色">' + PALETTE_SVG + '<i class="wbc-dot"></i></button>' +
      '<div class="wbc-panel">' +
      '<div class="wbc-head"><span class="wbc-title">网页配色</span><button class="wbc-close" title="关闭">\u00d7</button></div>' +
      '<div class="wbc-site"></div>' +
      '<div class="wbc-list">' + rows + '</div>' +
      '<div class="wbc-foot">' +
      '<button class="wbc-exclude"></button>' +
      '<div class="wbc-hint">选择仅对当前网站生效，并自动记忆</div>' +
      '</div>' +
      '</div>';

    var btn = shadow.querySelector('.wbc-btn');
    var panel = shadow.querySelector('.wbc-panel');
    var closeBtn = shadow.querySelector('.wbc-close');
    var excludeBtn = shadow.querySelector('.wbc-exclude');
    var siteLabel = shadow.querySelector('.wbc-site');
    var btnDot = shadow.querySelector('.wbc-dot');
    var items = Array.prototype.slice.call(shadow.querySelectorAll('.wbc-item'));

    ui = { root: root, btn: btn, panel: panel, items: items, btnDot: btnDot, siteLabel: siteLabel, excludeBtn: excludeBtn };

    btn.addEventListener('click', function () { panel.classList.toggle('wbc-open'); });
    closeBtn.addEventListener('click', function () { panel.classList.remove('wbc-open'); });
    items.forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.getAttribute('data-id')); });
    });
    excludeBtn.addEventListener('click', function () {
      setExcluded(!isExcluded());
      applyTheme(isExcluded() ? 'off' : getThemeId());
      syncUI();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') panel.classList.remove('wbc-open');
    });
    document.addEventListener('click', function (e) {
      var path = e.composedPath ? e.composedPath() : [];
      if (panel.classList.contains('wbc-open') && path.indexOf(root) < 0) {
        panel.classList.remove('wbc-open');
      }
    });

    (document.documentElement || document.body).appendChild(root);
    syncUI();
  }

  function syncUI() {
    if (!ui) return;
    var excluded = isExcluded();
    var id = excluded ? 'off' : getThemeId();
    ui.btn.classList.toggle('wbc-disabled', excluded);
    ui.btnDot.style.display = (id !== 'off' && !excluded) ? 'block' : 'none';
    ui.items.forEach(function (b) {
      b.classList.toggle('wbc-active', b.getAttribute('data-id') === id);
    });
    ui.excludeBtn.textContent = excluded ? '\u5728\u6b64\u7f51\u7ad9\u91cd\u65b0\u542f\u7528' : '\u5728\u6b64\u7f51\u7ad9\u505c\u7528';
    ui.siteLabel.textContent = '\u5f53\u524d\u7ad9\u70b9\uff1a' + host;
    ui.btn.title = excluded ? '\u7f51\u9875\u914d\u8272\uff08\u672c\u7f51\u7ad9\u5df2\u505c\u7528\uff09' : '\u7f51\u9875\u914d\u8272';
  }

  function setTheme(id) {
    if (!id || !themeById(id)) return;
    if (id !== 'off' && isExcluded()) setExcluded(false); // 选择配色即自动重新启用
    setThemeId(id);
    applyTheme(id);
    syncUI();
  }

  // ---------------------------------------------------------------
  // 6. 油猴菜单命令
  // ---------------------------------------------------------------
  function cycleTheme() {
    if (isExcluded()) setExcluded(false);
    var cur = getThemeId();
    var idx = Math.max(0, THEME_IDS.indexOf(cur));
    setTheme(THEME_IDS[(idx + 1) % THEME_IDS.length]);
  }

  function registerMenuCommands() {
    if (!IS_BROWSER || typeof GM_registerMenuCommand !== 'function') return;
    GM_registerMenuCommand('\u7f51\u9875\u914d\u8272\uff1a\u5207\u6362\u4e0b\u4e00\u5957\u914d\u8272', cycleTheme);
    GM_registerMenuCommand('\u7f51\u9875\u914d\u8272\uff1a\u6062\u590d\u7f51\u7ad9\u539f\u6837', function () { setTheme('off'); });
    GM_registerMenuCommand('\u7f51\u9875\u914d\u8272\uff1a\u672c\u7f51\u7ad9\u505c\u7528 / \u91cd\u65b0\u542f\u7528', function () {
      setExcluded(!isExcluded());
      applyTheme(isExcluded() ? 'off' : getThemeId());
      syncUI();
    });
  }

  // ---------------------------------------------------------------
  // 7. 启动
  // ---------------------------------------------------------------
  if (IS_BROWSER) {
    if (!isExcluded()) applyTheme(getThemeId());
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI, { once: true });
    } else {
      initUI();
    }
    registerMenuCommands();
  }

  // 供无依赖冒烟测试使用（node test/smoke.js）
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { THEMES: THEMES, THEME_IDS: THEME_IDS, buildCss: buildCss, FLATTEN_SELECTORS: FLATTEN_SELECTORS, TEXT_SELECTORS: TEXT_SELECTORS };
  }
})();
