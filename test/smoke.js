'use strict';
// 无依赖冒烟测试：验证配色注册表完整、CSS 生成器只改颜色且不碰媒体元素。
// 运行：npm test（或 node test/smoke.js）
const assert = require('node:assert');
const script = require('../eye-comfort-palette.user.js');

// ---- 注册表完整性 ----
assert.ok(Array.isArray(script.THEMES), 'THEMES 应为数组');
assert.ok(script.THEMES.length >= 4, '至少包含 跟随网站 + 三套配色');
assert.strictEqual(script.THEMES[0].id, 'off', '第一套应为 off（跟随网站）');
assert.strictEqual(script.THEMES[0].colors, null, 'off 不应有 colors');

const ids = new Set();
for (const t of script.THEMES) {
  assert.ok(t.id && t.name && t.scheme, `主题 ${t.id} 缺少 id/name/scheme`);
  assert.ok(!ids.has(t.id), `主题 id 重复：${t.id}`);
  ids.add(t.id);
  if (t.id === 'off') continue;
  for (const key of ['text', 'bg', 'surface', 'input', 'link', 'linkVisited', 'border', 'muted', 'highlight']) {
    assert.ok(/^#[0-9a-f]{6}$/i.test(t.colors[key]), `主题 ${t.id} 的 ${key} 应为 #rrggbb，实际 ${t.colors[key]}`);
    assert.ok(script.buildCss(t).includes(t.colors[key]), `主题 ${t.id} 的 CSS 应包含 ${key}`);
  }
}

// ---- 核心要求：CSS 只改颜色，不碰媒体元素、不碰布局 ----
const css = script.buildCss(script.THEMES[1]);
assert.ok(css.includes('!important'), '覆盖规则必须带 !important');
assert.ok(css.includes('color-scheme: light'), '浅色主题应声明 color-scheme: light');

const media = ['img', 'video', 'canvas', 'svg', 'iframe', 'audio', 'object', 'embed', 'picture', 'source'];
for (const el of media) {
  assert.ok(!new RegExp(`\\b${el}\\b[^{]*\\{`).test(css), `CSS 不应包含 <${el}> 选择器`);
}

const layoutProps = ['display', 'position', 'margin', 'padding', 'width', 'height', 'font-size', 'transform', 'z-index', 'top', 'left'];
for (const prop of layoutProps) {
  assert.ok(!new RegExp(`\\b${prop}\\s*:`).test(css), `CSS 不应设置布局属性 ${prop}`);
}

// ---- 深色主题的 color-scheme 应为 dark ----
const dark = script.THEMES.find((t) => t.id === 'dark');
assert.ok(script.buildCss(dark).includes('color-scheme: dark'), '深色主题应声明 color-scheme: dark');

// ---- 新增配色只需追加配置：不同主题生成的 CSS 结构一致（仅色值与主题名不同） ----
function skeleton(css) {
  return css
    .replace(/^\/\*.*\*\/\n/m, '') // 去掉主题名注释行
    .replace(/#[0-9a-f]{6}/gi, 'X'); // 色值归一化
}
const lightCss = script.buildCss(script.THEMES[1]);
const sepia = script.THEMES.find((t) => t.id === 'sepia');
assert.strictEqual(skeleton(script.buildCss(sepia)), skeleton(lightCss), '不同主题的 CSS 结构应完全一致');

console.log('✅ 冒烟测试通过：注册表完整、CSS 只改颜色、媒体元素与布局不受影响');
