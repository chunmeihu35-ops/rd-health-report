# 产研健康诊断报告 Skill

> 从飞书项目 MCP 自动取数 → 生成可视化 HTML 报告 → QA 门禁 → 发布 → 飞书卡片推送

## 概述

本 Skill 实现产研健康诊断报告的端到端自动化：

1. **取数**：通过飞书项目 MCP 拉取度量数据
2. **解析**：结构化 JSON，计算环比、基线
3. **生成**：从 HTML 模板 + VChart 图表生成完整报告
4. **QA 门禁**：27 项自动检查（HTML 结构/数据完整性/图表配置）
5. **发布**：GitHub Pages + is.gd 短链
6. **推送**：飞书消息卡片（测试群→正式群）
7. **收尾**：基线更新、项目上下文记录

## 支持项目

| 项目 | 类型 | 配置 |
|------|------|------|
| 紫鸟浏览器 | 成熟型 | ✅ 已配置 |
| 云资源 | 事务型 | ✅ 已配置 |
| LinkFox | 成熟型 | ✅ 已配置 |
| BrowserAct | MVP型 | ✅ 已配置 |

## 目录结构

```
├── SKILL-v3-multica.md          ← Multica 版（12 状态流程）
├── SKILL.md                     ← OpenClaw 版（当前生产用）
├── MULTICA-SETUP.md             ← Multica Agent 配置指南
├── references/
│   ├── project-config.json      ← 项目配置（4 个项目）
│   ├── project-context/         ← 项目历史上下文
│   ├── html-template.html       ← HTML 报告模板
│   ├── card-template.json       ← 飞书卡片模板
│   ├── vchart-specs/            ← VChart 图表配置
│   ├── baseline-*.json          ← 项目基线数据
│   ├── mcp-config.md            ← MCP 连接配置（需替换密钥）
│   └── execution-log-spec.md    ← 执行日志格式
├── scripts/
│   ├── monthly-health-report.js ← 月度健康度报告
│   └── build-report-card.js     ← 卡片构建脚本
└── 全局脚本（需配合仓库根 scripts/）
    ├── fetch-project-metrics.js ← MCP 取数
    ├── parse-project-metrics.js ← 数据解析
    └── report-qa-gate.js        ← QA 门禁
```

## 使用方式

### 方式 1：飞书直接对话（当前）

在飞书群里 @Agent + "生成云资源 6月报告"

### 方式 2：Multica Issue（团队协作）

1. 创建 Issue，标题：`云资源 2026年6月报告`
2. 分配给「产研健康报告」Agent
3. Agent 自动执行，人工审核节点等待确认
4. 详见 [MULTICA-SETUP.md](MULTICA-SETUP.md)

## 配置新项目

编辑 `references/project-config.json`，添加：

```json
{
  "project": "项目名",
  "alias": "english-alias",
  "type": "成熟型/事务型/MVP型",
  "mcpViewId": "从度量视图URL提取",
  "mcpNode": "从度量视图URL提取",
  "mcpViewUrl": "https://project.feishu.cn/...",
  "formalGroup": "oc_xxx...",
  "shortLinkPrefix": "ABBR",
  "background": "项目背景描述"
}
```

## 安全注意

- `references/mcp-config.md` 包含 MCP API Key，**不要直接推送到公开仓库**
- 推送到 GitHub 前，请用占位符替换实际密钥
- Multica 侧通过 Agent 的 MCP 配置注入密钥

## License

Internal use only.
