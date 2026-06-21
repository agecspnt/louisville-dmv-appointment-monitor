# DMV Appointment Monitor（中文）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[English](./README.md) | 简体中文

这是一个基于 Electron + Playwright 的桌面程序，用于监控 Kentucky DMV 预约可用性，并可选地自动抢占真实预约时段。

## 功能截图

<p align="center">
  <img src="./docs/images/app-screenshot.png" alt="DMV Appointment Monitor 功能截图" width="1100" />
</p>

<p align="center">
  <strong>实时预约点列表</strong> · <strong>真实 Earliest 查询</strong> · <strong>自动预约 / 自动提交</strong> · <strong>Bark 详细推送</strong>
</p>

> 界面目标是“快速做决定”：先选预约类型，再从实时抓取的预约点中选择，随后在状态区、日志区和推送中同时看到最早可用信息。

## 功能概览

- 支持 `Written Test (56)` 和 `Road Test (55)`。
- 选择 `Appointment Type` 后，会实时抓取该类型下所有预约点，并生成可选列表。
- 监控逻辑基于你选中的预约点执行（不是写死单一地点）。
- 会真实点击 `Check Earliest Availability`，并提取返回的最早信息（例如 `February 26, 16 available`）。
- 支持可选的真实自动预约链路：
  - 打开选中的预约点
  - 选择当前最早的可用现场预约时段
  - 自动填写申请人信息
  - 可选地自动直接提交
- 提供 `Book Earliest Now` 按钮，可直接尝试当前地点最早时段，无需等待定时监控。
- 申请人信息默认只保存在当前运行内存中，不自动落盘。
- 检测到可预约时：
  - UI 日志显示绿色成功记录
  - 发送桌面通知
  - 发送 Bark 推送（包含地点、状态、检查时间、最早信息）
- Windows 发布包现已内置 Playwright Chromium，不再依赖目标机器用户目录里的浏览器缓存。
- 打包前强制先通过测试。

## 环境要求

- Node.js `>=20`
- npm

## 快速开始

```bash
npm install
npm run install:browsers
npm start
```

## 下载方式

目前只提供 Windows 版本，请在 [GitHub Releases](https://github.com/agecspnt/louisville-dmv-appointment-monitor/releases) 下载。

1. 打开最新的 release 页面。
2. 在 `Assets` 里下载 Windows 安装包或便携版。
3. 在 Windows 上运行下载好的文件。自 `v1.0.2` 起，发布包已自带 Chromium，换一台 Windows 机器也不需要预先装 Playwright 浏览器缓存。

## 自动预约配置

1. 选择 `Road Test (55)` 或 `Written Test (56)`。
2. 选择一个实时抓取到的预约点。
3. 填写申请人信息：
   - `First Name`
   - `Last Name`
   - `Email`
   - `Phone`
   - `Receive Texts`（可选）
4. 选择模式：
   - 勾选 `Auto Book` 和 `Auto Submit`：监控到名额后自动提交预约。
   - 仅勾选 `Auto Book`：监控到名额后自动占位、填表，并停在最后提交前。
5. 如果你想立刻尝试当前地点的最早时段，可以点击 `Book Earliest Now`。

## 自动预约说明

- 自动预约走的是 Kentucky DMV 的真实网页流程，可能会创建真实预约。
- 只有在你接受“程序代你提交”时，才建议开启 `Auto Submit`。
- 从检测到可用到实际提交之间，名额仍可能被其他用户抢走。
- 某些地点仍然会受县限制或电话预约规则约束，具体以 DMV 页面提示为准。

## Bark 配置

这个项目在检测到可预约时，可以通过 Bark 发送推送通知。

1. 在 iPhone 上安装并打开 Bark。
2. 从 Bark 里复制你的设备 key。这个项目会通过 `https://api.day.app/<你的-key>/...` 发送通知。
3. 运行桌面程序：`npm start`
4. 把 key 粘贴到界面里的 `Bark Key` 输入框。
5. 点击 `Test Bark`，确认手机能够收到测试通知。如果输入框为空，测试会失败。
6. 开始监控。检测到可预约时，程序会把地点、状态、检查时间和最早可用信息推送到 Bark。

参考： [Bark 官方页面](https://bark.day.app/#/)

## 常用脚本

- `npm run install:browsers`
  以 hermetic 方式安装 Chromium，供打包后的 Windows 应用随包携带。
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
- `src/services/monitor.js`：抓取、解析与真实预约链路
- `src/renderer/*`：界面
- `tests/*.test.js`：单元测试与真实网页集成测试

## 使用说明

- 本工具不保证一定能抢到预约。
- 请遵守 DMV 网站条款与当地法律法规。

## 平台支持

项目现已调整为仅支持 Windows 构建与发布流程，安装包请从 [Releases](https://github.com/agecspnt/louisville-dmv-appointment-monitor/releases) 下载。

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 安全

安全问题请通过 [SECURITY.md](./SECURITY.md) 报告。

## 许可证

MIT，见 [LICENSE](./LICENSE)。
