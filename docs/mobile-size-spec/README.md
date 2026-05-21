# Mobile Size Spec Notes

来源压缩包：`移动端程序尺寸规范(1).zip`

## 解压内容

压缩包里是 3 张 PNG 截图，不是可编辑设计稿：

- `移动端程序尺寸规范/Screenshot 2026-05-16 at 12.52.23.png`
- `移动端程序尺寸规范/Screenshot 2026-05-16 at 12.52.38.png`
- `移动端程序尺寸规范/Screenshot 2026-05-16 at 12.52.53.png`

## 规范要点

### iPhone

- 设计尺寸：375x812pt，参考 iPhone 13/14 Pro
- 状态栏高度：44pt
- 导航栏高度：88pt
- 标签栏高度：83pt
- 安全区域：上下左右各 20pt

### Android

- 设计尺寸：360x640dp，主流尺寸
- 状态栏高度：24dp
- 导航栏高度：56dp
- 标签栏高度：48dp
- 安全区域：上下左右各 16dp

### 通用

- 图标线粗：1.5px 或 2px
- 图标尺寸：24x24px 或 28x28px
- 页面内保持一种图标线粗
- 字体层级：大标题 32px，页面标题 24px，正文标题 18px，正文 16px，辅助说明 14px，小标签/提示 12px
- 标题行高：1.2-1.3
- 正文行高：1.5-1.6
- 按钮最小高度：44px
- 点击区域最小：44x44px
- 画布不要只用 375px，需要兼容 360px 安卓主流尺寸
- 字号、间距、圆角要统一，间距尽量用 8 的倍数

## 已应用到 ParentMarry

- 桌面预览手机画布从 440x896 收敛为 375x812。
- 真机小屏下使用 `100dvh` 铺满，不再保留桌面手机外框。
- 页面导航区按 88px 预留，底部标签栏按 83px 预留。
- iPhone 预览安全边距使用 20px，窄屏手机切到 16px。
- 页面标题统一为 24px，取消负字距。
- 主要按钮和筛选控件点击高度不低于 44px。
- 候选卡片图片、间距、圆角做了统一，尽量按 8px 网格收敛。

## 本地预览

```bash
npm run build:user:static
npm run preview:user
```

然后打开：

```text
http://127.0.0.1:4173
```

浏览器 DevTools 推荐视口：

- iPhone：375x812
- Android：360x640

截图输出：

- `output/playwright/mobile-spec-iphone-375x812-top.png`
- `output/playwright/mobile-spec-android-360x640.png`
