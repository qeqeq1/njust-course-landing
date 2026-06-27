# 梨课程 · 引导页

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

南京理工大学课表查询工具「梨课程」的移动端引导页面，提供 APK 下载、功能介绍与使用指引。

## 功能

- **动态版本展示** — 从 CDN 拉取 `latest.json`，实时显示最新 APK 版本号并构造下载链接
- **下载确认弹窗** — 点击下载后弹出 5 步使用指引，3 秒倒计时后方可确认下载
- **截图轮播** — 四张应用截图，窄屏双图并排滑动，宽屏四图展开
- **Bento 卡片** — 登录、设置、隐私、边界说明等模块化引导卡片，关键图片支持灯箱放大
- **隐私政策** — 独立隐私政策页面，说明数据收集、存储、账号安全等事项

## 技术栈

纯静态 HTML / CSS / JS，可直接部署至任意静态托管服务（Nginx、CDN、GitHub Pages 等）。

## 文件结构

```
├── index.html      # 主页面
├── style.css       # 样式（Apple 设计风格）
├── script.js       # 交互逻辑
├── privacy.html    # 隐私政策页面
├── assest/img/     # 截图与引导图片
└── latest.json     # CDN 版本描述文件（sync.py 自动生成）
```

## 部署

将除 `sync.py` 外的所有文件上传至静态服务器即可。确保 `latest.json` 可通过 `https://your-cdn/latest.json` 访问。

## 许可证

MIT License
