# Webpage Color Changer · 网页配色切换器

用户脚本（Tampermonkey / Violentmonkey / Greasemonkey）。有些网站强制黑底白字，看久了眼睛累——
用它一键把网页切换为**白底黑字**等护眼配色，选择按网站自动记忆，可随时恢复或停用。

> 源码：GitHub 主仓库 <https://github.com/xyz6683/eye-comfort-palette> · Gitee 镜像 <https://gitee.com/xyz6683/eye-comfort-palette> · Greasy Fork 发布页 <https://greasyfork.org/zh-CN/scripts/605606-网页配色切换器-webpage-color-changer>

## 特性

- **一键切换配色**：白底黑字 / 护眼米黄 / 柔和深色 / 跟随网站（恢复原样）
- **覆盖彻底**：全部规则带 `!important`，并设置 `color-scheme`，原生表单控件、占位符、滚动条、选中高亮一并处理
- **只改颜色**：不碰尺寸、定位、字体、滤镜，不破坏布局
- **防误伤**：`img` / `video` / `canvas` / `svg` / `iframe` 等媒体内容不改色
- **按网站记忆**：用 `GM_setValue` 存储，选择只对当前站点生效，刷新后自动应用
- **可停用**：面板内一键「在此网站停用」，视频站、设计站不受影响；脚本不注入 iframe（`@noframes`）
- **扩展友好**：新增一套配色只需在注册表追加一个对象

## 安装

**一键安装**：<https://greasyfork.org/zh-CN/scripts/605606-网页配色切换器-webpage-color-changer>（点击「安装此脚本」）

或手动安装：

1. 安装脚本管理器：Tampermonkey（Chrome / Edge / Firefox）或 Violentmonkey
2. 管理器面板 → 「添加新脚本」→ 全选粘贴 [eye-comfort-palette.user.js](eye-comfort-palette.user.js) 的全部内容 → 保存
3. 刷新任意网页，右下角出现调色板按钮 🎨，点开即可切换配色

## 使用

- **切换配色**：点击右下角悬浮按钮，在面板里选择一套配色，立即生效
- **记住选择**：自动按站点记忆，无需再次操作；「跟随网站」= 恢复该网站原样
- **停用 / 启用**：面板底部「在此网站停用」；停用后按钮变淡，点开面板可「重新启用」
- **油猴菜单**：脚本管理器菜单里提供「切换下一套配色」「恢复网站原样」「本网站停用/启用」三个命令

## 新增配色指南

在 `eye-comfort-palette.user.js` 顶部的 `THEMES` 数组里追加一个对象即可，其余逻辑零改动：

```js
{
  id: 'solarized',            // 唯一 id，存储用
  name: '暖阳灰',              // 面板显示名
  desc: '低饱和暖灰，长时间阅读友好',
  scheme: 'light',            // light 或 dark，控制原生控件的明暗渲染
  colors: {                   // 九个色值，均为 #rrggbb
    text: '#073642', bg: '#fdf6e3', surface: '#eee8d5',
    input: '#fdf6e3', link: '#268bd2', linkVisited: '#6c71c4',
    border: '#d5cba8', muted: '#93a1a1', highlight: '#ffd75f',
  },
},
```

各色值含义：`text` 正文、`bg` 页面背景、`surface` 代码块背景、`input` 表单控件背景、
`link` / `linkVisited` 链接、`border` 边框与分隔线、`muted` 占位文字、`highlight` 选中/高亮。

## 本地验收

```bash
npm test        # 无依赖冒烟测试：注册表完整性 + CSS 只改颜色、不碰媒体元素
open demo/dark-site.html   # 装好脚本后打开，按下面清单逐项核对
```

### 验收清单

- [ ] 深色演示页一键切换「白底黑字」：正文、标题、链接、代码块、表格、表单均清晰可读
- [ ] 无大面积黑块残留（页面中 `#010409` 的纯黑区块被扁平化）
- [ ] 渐变 Hero 等背景图被移除，文字不再压在暗色背景上
- [ ] 图片（SVG 示例）颜色保持原样，未被改色
- [ ] 刷新页面后选择保持；切回「跟随网站」后页面完全恢复原样
- [ ] 「护眼米黄」「柔和深色」两套配色同样正常生效

## 已知限制

- 深色网站上的**全屏背景图片会被移除**（保证文字可读），追求设计原貌的站点请「在此网站停用」
- 个别网站对元素写了**内联 `!important` 样式**，脚本规则可能输给它（内联+important 优先级最高），属个别现象
- `@noframes` 下不处理 iframe 内嵌内容：视频嵌入等保持原样（对视频站是件好事）
- 图标字体（iconfont）会随正文变黑，这是保证整体对比度可接受的取舍

## 技术要点

- `@run-at document-start`：页面渲染前注入，避免深色主题闪一下
- 覆盖策略：容器背景扁平化 + 文本色统一 + `color-scheme` 声明 + `-webkit-text-fill-color`（防渐变文字花招）
- 悬浮面板使用 **Shadow DOM** 隔离，页面样式和主题样式都无法干扰面板自身
- 存储：`wbcThemeByHost`（站点→配色 id）、`wbcExcludedHosts`（停用站点列表）

## 开源仓库与发布

**主仓库（GitHub）**：<https://github.com/xyz6683/eye-comfort-palette>

**Gitee 镜像**：<https://gitee.com/xyz6683/eye-comfort-palette>（账号同名 xyz6683）

**双远端推送（SSH 方式，国内网络友好）**：

```bash
# GitHub 22 端口常被墙，走官方 443 端口；Gitee 正常走 22
git remote add github ssh://git@ssh.github.com:443/xyz6683/eye-comfort-palette.git
git remote add gitee git@gitee.com:xyz6683/eye-comfort-palette.git
git push github main && git push gitee main
```

> Gitee 也可以用网页「导入已有仓库」一次性复制，之后在仓库页点「同步」。双远端推送则完全本地可控。

**Greasy Fork 发布页**：<https://greasyfork.org/zh-CN/scripts/605606-网页配色切换器-webpage-color-changer>（已上线）

- 脚本由 GitHub 导入（`xyz6683/eye-comfort-palette`）；若尚未配置自动同步，在脚本管理页的「同步」设置里配置 GitHub webhook 后，每次 push 到 main 即自动更新。

## 目录结构

```
eye-comfort-palette/
├── eye-comfort-palette.user.js   # 用户脚本本体（唯一必需文件）
├── demo/dark-site.html  # 深色主题演示站，用于验收
├── test/smoke.js        # 无依赖冒烟测试
├── package.json         # npm test 入口
└── README.md
```
