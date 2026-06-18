# 产研健康诊断报告 Skill (V3 - Multica 版)

> 从 V2 重构为 12 状态流程，适配 Multica Issue 驱动。
> 新增：配置检查、卡片审核、用户反馈、错误日志。
> 重构日期: 2026-06-18

---

## 🚨 强制门禁（不通过不动手）

### Gate 0: 配置检查（新增）
- [ ] 读取 `references/project-config.json`
- [ ] 确认项目存在且配置完整
- [ ] 若项目不存在 → 进入"新项目引导"流程（见下方）
- [ ] 读取 `references/project-context/{alias}.md`（历史上下文）
- [ ] 列出上月核心问题 + 措施 + 本月需跟进事项

### Gate 1: 读取技能规则
- [ ] 读完本文件 + references/mcp-to-template-mapping.md
- [ ] 列出本次 TOP5 必须遵守的规则

### Gate 2: 获取数据
- [ ] 运行取数脚本: `node scripts/fetch-project-metrics.js {project}`
- [ ] 运行解析脚本: `node scripts/parse-project-metrics.js {project}`
- [ ] 读取 `tmp/metrics/{project}-parsed.json` 确认数据完整
- [ ] 团队人数 = parsed.kpi.monthlyDelivery ÷ parsed.kpi.perCapitaDelivery
- [ ] 人均操作 = parsed.kpi.perCapitaOps 直取（禁止自算）
- [ ] Meego 操作时长单位 = 天（不是分钟）
- [ ] 列出 4 个 KPI + 环比 + 人均操作值
- [ ] 若脚本报错（MCP 超时等）→ 重跑一次，连续失败再问用户

### Gate 3: 分析生成（Gate 0-2 全过才开始）
- [ ] 基于数据独立写分析（不套旧报告）
- [ ] 完整覆盖所有板块
- [ ] 自检：单位、数值、板块完整性

---

## 🔄 12 状态流程（Multica Issue 驱动）

```
状态 0: 配置检查 → 状态 1: 取数 → 状态 2: 解析 
→ 状态 3: 人工审数据 → 状态 4: HTML 生成 → 状态 5: QA Gate 
→ 状态 6: 发布 → 状态 7: 人工审内容 → 状态 8: 推送测试群 
→ 状态 9: 人工审卡片 → 状态 10: 推送正式群 → 状态 11: 收尾 → 状态 12: 已完成
```

### 状态流转规则

| 当前状态 | 完成条件 | 自动流转到 | 失败处理 |
|---------|---------|-----------|---------|
| 0: 配置检查 | 配置存在且完整 | 1: 取数 | 新项目→引导用户提供信息 |
| 1: 取数 | 脚本返回数据 | 2: 解析 | 重跑 1 次，仍失败→报告用户 |
| 2: 解析 | JSON 完整 | 3: 人工审数据 | 检查数据源，修复后重跑 |
| 3: 人工审数据 | 用户回复"数据 OK" | 4: HTML 生成 | 用户指出问题→修复→重新提交审核 |
| 4: HTML 生成 | HTML 文件生成 | 5: QA Gate | 检查模板/脚本，修复后重跑 |
| 5: QA Gate | 退出码=0 | 6: 发布 | 最多重试 2 次，仍 FAIL→报告用户 |
| 6: 发布 | GitHub Pages 部署完成 | 7: 人工审内容 | 检查部署日志，修复后重跑 |
| 7: 人工审内容 | 用户回复"定稿" | 8: 推送测试群 | 用户指出问题→修复→重新提交审核 |
| 8: 推送测试群 | 卡片发送成功 | 9: 人工审卡片 | 检查 webhook/脚本，修复后重跑 |
| 9: 人工审卡片 | 用户回复"卡片 OK" | 10: 推送正式群 | 用户指出问题→修复→重新提交审核 |
| 10: 推送正式群 | 卡片发送成功 | 11: 收尾 | 检查 webhook/脚本，修复后重跑 |
| 11: 收尾 | 基线+memory+ 记录完成 | 12: 已完成 | 手动补执行遗漏步骤 |

### 状态更新机制

每完成一个状态，Agent 自动在 Issue 评论里输出：
```
✅ 状态 X: [状态名] 完成
📋 输出：[关键结果/链接]
⏭️ 下一状态：[状态名]
⏸️ 等待：[人工审核/自动执行]
```

### 错误日志格式

每个状态失败时，Agent 自动记录：
```
❌ 状态 X: [状态名] 失败
🔍 错误：[错误信息]
 位置：[脚本/文件/行号]
🔧 建议：[修复建议]
🔄 已重试：[次数]
```

---

## 状态详细说明

### 状态 0: 配置检查

**自动执行**

1. 读取 `references/project-config.json`
2. 查找匹配的项目（按名称或 alias）
3. 若找到 → 加载配置，进入状态 1
4. 若未找到 → 进入新项目引导：

**新项目引导流程**：
```
Agent 在 Issue 评论里问：
"未找到项目配置，请提供以下信息：
1. 项目名称：
2. 项目类型（单选：成熟型/事务型/MVP 型）：
3. MCP 取数地址（飞书项目度量视图 URL）：
4. 项目背景（1-2 句话）：
5. 正式群 ID（飞书群 ID）："

用户回复后 → Agent 自动：
1. 解析信息
2. 通过 MCP 地址提取 view_id/node
3. 生成 shortLinkPrefix（项目名缩写）
4. 追加到 project-config.json
5. 创建 references/project-context/{alias}.md（空模板）
6. 确认配置 → 进入状态 1
```

### 状态 1-2: 取数 + 解析

**自动执行**（同 V2）

### 状态 3: 人工审数据

**等待用户**

Agent 输出：
```
📊 数据审核清单：
1. 月度交付：XX 个（环比±X%）
2. 人均交付：XX 个（环比±X%）
3. 人均完成时长：XX 天（环比±X%）
4. 人均缺陷：XX 个（环比±X%）
5. 交付周期：XX 天（环比±X%）

请确认数据是否准确，回复"数据 OK"或指出问题。
```

用户回复后：
- "数据 OK" → 进入状态 4
- 指出问题 → Agent 修复 → 重新提交审核

### 状态 4-6: HTML 生成 + QA Gate + 发布

**自动执行**（同 V2，QA Gate 最多重试 2 次）

### 状态 7: 人工审内容

**等待用户**

Agent 输出：
```
📝 内容审核清单：
1. 核心问题定位：X 个问题（详见报告第 X 板块）
2. 行动建议：X 条（责任人 + 时间节点）
3. 反思问题：X 个
4. 上月措施跟进：X 项（状态更新）

请确认分析质量，回复"定稿"或指出问题。
```

用户回复后：
- "定稿" → 进入状态 8
- 指出问题 → Agent 修复 → 重新提交审核

### 状态 8: 推送测试群

**自动执行**

执行 `node scripts/build-report-card.js <html> <项目> <img_key> <chat_id>`
测试群：`oc_efda04ba9d7071b50392051a2d770447`

### 状态 9: 人工审卡片

**等待用户**

Agent 输出：
```
🎴 卡片已发送到测试群，请确认：
1. 图表是否正常加载
2. 排版是否完整
3. 数据是否与 HTML 一致

回复"卡片 OK"或指出问题。
```

用户回复后：
- "卡片 OK" → 进入状态 10
- 指出问题 → Agent 修复 → 重新提交审核

### 状态 10: 推送正式群

**自动执行**

读取项目配置中的 `formalGroup`，发送卡片。

### 状态 11: 收尾

**自动执行**

1. 更新基线文件 `references/baseline-{alias}.json`（6 月滚动窗口重算）
2. 写入 `memory/projects/{alias}/{YYYY-MM}.md`（推送状态+KPI+ 核心发现 + 行动项）
3. 更新 `references/project-context/{alias}.md`（历史上下文）
4. 记录执行日志到 `tmp/execution-log/{YYYY-MM}-{alias}.json`

### 状态 12: 已完成

**自动执行**

Agent 输出：
```
✅ 报告生成完成！
📋 报告链接：[GitHub Pages URL]
📊 短链：[is.gd URL]
 记忆已更新：memory/projects/{alias}/{YYYY-MM}.md
📈 基线已更新：references/baseline-{alias}.json
📚 上下文已更新：references/project-context/{alias}.md

请对本次报告质量打分（1-5 分），并反馈任何问题（可选）。
```

---

## 用户反馈收集（强制最后一步）

Issue 模板里加一个必填字段：
- 本次报告质量打分（1-5 分）
- 哪里不好（文字，可选）
- 是否建议优化 Skill（是/否）

不填这个，Issue 不能关闭。

---

## 月度 Skill 健康度报告（自动生成）

每月 1 号自动跑 `scripts/monthly-health-report.js`，汇总上月所有 Issue 的执行数据：

输出内容：
- 执行次数、成功率、平均耗时
- 失败原因分布
- 用户反馈趋势
- 待优化清单

报告发给用户，用户花 5 分钟扫一眼，决定要不要优化。

---

## 分析框架（四角度，缺一不可）

（同 V2，保持不变）

### 角度一：数据口径说明
### 角度二：多维度交叉验证
### 角度三：系统视角（全局产能约束）
### 角度四：项目历史基线对比

---

## 投入 - 产出双维度判定

（同 V2，保持不变）

---

## 报告结构（17 个板块）

（同 V2，保持不变）

---

## 数据规则

（同 V2，保持不变）

---

## 格式硬性规则

（同 V2，保持不变）

---

## 执行前自检清单

（同 V2，新增状态 0 检查）

---

## 项目配置

（已迁移到 `references/project-config.json`）

---

## 目录结构

```
skills/rd-health-report/
├── SKILL.md（本文件，核心流程 + 分析框架）
├── references/
│   ├── project-config.json          ← 🆕 项目配置（4 个项目）
│   ├── project-context/             ← 🆕 项目历史上下文
│   │   ├── ziniao.md
│   │   ├── cloud-resource.md
│   │   ├── linkfox.md
│   │   └── browseract.md
│   ├── html-template.html
│   ├── card-template.json
│   ├── vchart-specs/*.json
│   ├── mcp-config.md
│   ├── mcp-to-template-mapping.md
│   ├── metrics-definition.md
│   ├── expert-analysis-methodology.md
│   ├── baseline-{project}.json
│   └── lessons-learned-202603.md
├── scripts/
│   ├── build-report-card.js
│   └── monthly-health-report.js     ← 🆕 月度健康度报告
└── 全局脚本（位于仓库根 scripts/）
    ├── fetch-project-metrics.js
    ├── parse-project-metrics.js
    └── report-qa-gate.js
```

---

## 紫讯公司节假日

（同 V2，保持不变）

---

## 指标体系概要

（同 V2，保持不变）

---

## PDCA 闭环

（同 V2，保持不变）

---

## 变更日志

| 日期 | 版本 | 变更内容 | 触发原因 |
|------|------|---------|---------|
| 2026-06-18 | V3 | 12 状态流程、配置检查、卡片审核、用户反馈、月度健康度报告 | Multica 产品化需求 |
| 2026-05-11 | V2 | 从 V1(1297 行) 重构为核心流程 + 分析框架 | 精简技能 |
