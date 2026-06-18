# Multica Agent 配置指南

> 产研健康报告 Agent 上线步骤
> 创建日期：2026-06-18

---

## 前置条件

- [ ] Multica 账号已注册（https://multica.fzzixun.com）
- [ ] 桌面应用已安装（推荐）或 CLI 已安装
- [ ] OpenClaw 已在本地运行（守护进程）
- [ ] 飞书项目 MCP 已配置（TOOL.md 中有配置信息）

---

## 步骤 1：创建 Agent

1. 打开 Multica 桌面应用
2. 进入工作区（Workspace）
3. 点击左侧「Agents」→「新建 Agent」
4. 填写配置：

| 字段 | 值 |
|------|-----|
| 名称 | `产研健康报告` |
| 描述 | `自动生成产研健康诊断报告，支持 4 个项目（紫鸟/云资源/LinkFox/BrowserAct）` |
| Runtime | **OpenClaw**（关键！不要选 Claude Code 或 Cursor） |
| 可见性 | `workspace`（工作区可见，团队成员都能用） |

5. 点击「创建」

---

## 步骤 2：导入 Skill

### 方式 A：从本地导入（推荐，首次）

1. 在 Agent 配置页，找到「Skills」板块
2. 点击「添加 Skill」→「从本机导入」
3. 守护进程会扫描本地 skill 目录
4. 选择 `rd-health-report` 目录
5. 确认导入

### 方式 B：从 GitHub 导入（团队协作）

1. 先把 `skills/rd-health-report/` 推到 GitHub 仓库
2. 在 Multica UI 点击「添加 Skill」→「从 GitHub 导入」
3. 粘贴仓库 URL（如 `https://github.com/chunmeihu35-ops/rd-health-report/tree/main/skills/rd-health-report`）
4. 确认导入

### 导入后确认

- [ ] Skill 出现在 Agent 的 Skills 列表里
- [ ] Skill 包含以下文件：
  - `SKILL-v3-multica.md`（主文件）
  - `references/project-config.json`
  - `references/project-context/*.md`
  - `references/html-template.html`
  - `references/vchart-specs/*.json`
  - `scripts/monthly-health-report.js`

---

## 步骤 3：配置 MCP（飞书项目）

1. 在 Agent 配置页，找到「MCP」或「环境变量」板块
2. 添加 MCP 配置：

```json
{
  "mcpServers": {
    "feishu-project": {
      "url": "https://project.feishu.cn/mcp_server/v1?mcpKey=m-b48ed5e3-dd5b-4ab9-b1d2-ab5084db42c0&userKey=7503447689602859011"
    }
  }
}
```

3. 保存配置

---

## 步骤 4：配置环境变量（如需要）

如果脚本需要访问 GitHub Gist Token 或其他密钥：

1. 在 Agent 配置页，找到「环境变量」
2. 添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GITHUB_GIST_TOKEN` | `ghp_xxx...` | GitHub Pages 发布用 |

---

## 步骤 5：创建 Issue

### 类型 1：产研健康报告 Issue（用户手动触发）

1. 点击左侧「Issues」→「新建 Issue」
2. 填写：

| 字段 | 值 |
|------|-----|
| 标题 | `云资源 2026年6月报告` |
| 描述 | 见下方模板 |
| Assignee | `产研健康报告`（选刚创建的 Agent） |
| 状态 | `Todo` 或 `In Progress`（不要选 Backlog） |

### Issue 描述模板

```markdown
## 任务
生成云资源项目 2026年6月产研健康报告。

## 要求
1. 按 SKILL-v3-multica.md 的 12 状态流程执行
2. 每个状态完成后在评论里汇报进度
3. 人工审核节点等待我确认后再继续
4. 完成后收集我的质量反馈（1-5 分）

## 项目信息
- 项目：云资源
- 月份：2026-06
- 配置已存在：references/project-config.json
```

3. 点击「创建」
4. Agent 自动开始执行（因为状态不是 Backlog）

### 类型 2：单项目 Skill 执行质量复盘 Issue（自动生成）

每个产研健康报告 Issue 完成后（状态 12），Agent 自动创建：

- **标题格式**：`[单项目复盘] 云资源 2026-06 Skill 执行质量复盘`
- **流程**：自动读取执行日志 → 生成复盘报告 → In Review（你审核）→ Done
- **目的**：单次质检，发现单点问题

### 类型 3：月度全局 Skill 健康度报告（每月 15 日自动生成）

每月 15 日自动创建：

- **标题格式**：`[月度治理] Skill 全局健康度报告 2026-06`
- **流程**：自动汇总所有执行日志 → 生成治理报告 → In Review（你审核）→ Done
- **目的**：全局治理，防止 Skill 膨胀，识别优化冲突

---

## 步骤 6：跟踪执行

Issue 创建后，Agent 会自动在评论里汇报进度。Multica 状态会自动流转：

```
Todo → In Progress（Agent 自动跑：配置→取数→解析）
→ In Review（等你审数据）
→ In Progress（Agent 自动跑：HTML→QA→发布）
→ In Review（等你审内容）
→ In Progress（Agent 自动跑：推送测试群）
→ In Review（等你审卡片）
→ In Progress（Agent 自动跑：推送正式群→收尾）
→ Done
```

如果遇到问题，状态会变为 **已阻塞 (Blocked)**，Agent 会在评论里说明原因。

你在评论里回复：
- `数据 OK` → Agent 继续
- `人均交付数不对，应该是 2.0` → Agent 修复后重新提交

---

## 步骤 7：审核 PoC 结果

报告完成后，你会收到两类后续 Issue：

1. **单项目复盘 Issue**（自动生成）：包含本次执行的耗时、失败原因、优化建议
2. **月度治理 Issue**（每月 15 日）：汇总所有项目的执行数据、Skill 膨胀检测、优化冲突检测

审核通过后，在评论里回复：`PoC 通过，可以上线`

---

## 步骤 8：上线后使用

### 日常使用（团队成员）

1. 创建 Issue，标题格式：`{项目名} {YYYY}年{M}月报告`
2. 分配给「产研健康报告」Agent
3. Agent 自动执行，你在审核节点回复即可
4. 完成后给质量打分

### 月度健康度报告

每月 1 号，Agent 自动运行 `scripts/monthly-health-report.js`，生成上月健康度报告，发给你审核。

---

## 常见问题

### Q1: Agent 没有反应？
- 检查 OpenClaw 守护进程是否在运行
- 检查 Agent 的 Runtime 是否选的是 OpenClaw
- 检查 Issue 状态是否是 Todo/In Progress（Backlog 不会触发）

### Q2: 取数失败？
- 检查 MCP 配置是否正确
- 检查飞书项目 API Key 是否过期
- 在评论里回复：`重跑取数`

### Q3: 我想优化 Skill？
- 小优化：在飞书里跟我说，我改后同步到 Multica
- 大优化：创建 Issue「Skill 优化 - XXX」，分配给 Agent

### Q4: 新人怎么用？
- 看 Issue 描述模板，照着填就行
- 不需要知道脚本怎么跑、文件在哪
- Issue 详情页就是仪表盘

---

## 目录结构（Multica 侧）

Skill 导入后，Agent 工作目录里会有：

```
.agent_context/skills/rd-health-report/
── SKILL-v3-multica.md          ← 主文件（12 状态流程）
├── references/
│   ├── project-config.json      ← 4 个项目配置
│   ├── project-context/         ← 项目历史上下文
│   ├── html-template.html       ← HTML 模板
│   ├── baseline-*.json          ← 项目基线
│   └── execution-log-spec.md    ← 执行日志格式
├── scripts/
│   ├── monthly-health-report.js ← 月度健康度报告
│   └── build-report-card.js     ← 卡片构建
└── 全局脚本（仓库根 scripts/）
    ├── fetch-project-metrics.js ← MCP 取数
    ├── parse-project-metrics.js ← 数据解析
    └── report-qa-gate.js        ← QA 门禁
```

---

## 下一步

1. 按步骤 1-4 配置 Agent
2. 按步骤 5 创建 PoC Issue
3. 按步骤 6-7 跟踪和审核
4. 审核通过后，按步骤 8 日常使用

有问题随时在飞书里找我。
