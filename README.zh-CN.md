# DMV Appointment Monitor（中文）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[English](./README.md) | 简体中文

这是一个基于 Electron + Playwright 的桌面程序，用于监控 Kentucky DMV 预约可用性。

## 功能截图

<p align="center">
  <img src="./docs/images/app-screenshot.png" alt="DMV Appointment Monitor 功能截图" width="1100" />
</p>

<p align="center">
  <strong>实时预约点列表</strong> · <strong>真实 Earliest 查询</strong> · <strong>绿色成功日志</strong> · <strong>Bark 详细推送</strong>
</p>

> 界面目标是“快速做决定”：先选预约类型，再从实时抓取的预约点中选择，随后在状态区、日志区和推送中同时看到最早可用信息。

## 功能概览

- 支持 `Written Test (56)` 和 `Road Test (55)`。
- 选择 `Appointment Type` 后，会实时抓取该类型下所有预约点，并生成可选列表。
- 监控逻辑基于你选中的预约点执行（不是写死单一地点）。
- 会真实点击 `Check Earliest Availability`，并提取返回的最早信息（例如 `February 26, 16 available`）。
- 检测到可预约时：
  - UI 日志显示绿色成功记录
  - 发送桌面通知
  - 发送 Bark 推送（包含地点、状态、检查时间、最早信息）
- 打包前强制先通过测试。

## 环境要求

- Node.js `>=20`
- npm

## 快速开始

```bash
npm install
npx playwright install chromium
npm start
```

## 常用脚本

- `npm test`
  执行全部测试（包含真实 DMV 网页集成测试）。
- `npm run test:live`
  仅执行真实网页集成测试。
- `npm run build:win`
  Windows 打包（测试通过后才会继续）。
- `npm run build:all`
  Windows-only 构建辅助脚本（同样带测试门禁）。

Windows 一键脚本：

- `build_auto.bat`
  自动执行依赖安装、Playwright 安装、测试、打包。

## 项目结构

- `electron/main.js`：调度、通知、IPC
- `electron/preload.js`：渲染进程桥接 API
- `src/services/monitor.js`：抓取与解析核心逻辑
- `src/renderer/*`：界面
- `tests/*.test.js`：单元测试与真实网页集成测试

## 使用说明

- 本工具不保证一定能抢到预约。
- 请遵守 DMV 网站条款与当地法律法规。

## 平台支持

项目现已调整为仅支持 Windows 构建与发布流程。

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 安全

安全问题请通过 [SECURITY.md](./SECURITY.md) 报告。

## 许可证

MIT，见 [LICENSE](./LICENSE)。
