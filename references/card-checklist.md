# 产研健康报告卡片 - 推送前自检清单

> **铁律：每次卡片JSON生成后、发送前，必须逐项对照。不通过不发送。**

## 🔴 原则性铁律（违反=严重事故）

- [ ] **禁止复制旧报告改数据**：每份报告从MCP原始数据独立生成
- [ ] **数据准确性**：每个数字可追溯到MCP图表，不编造不估算
- [ ] **用PMO助手API发送**：不用webhook，不用SellerAgent2自己发

## 🟠 KPI区域

- [ ] **趋势色纯机械**：▼ = red，▲ = green（不管好坏，只看方向）
- [ ] **单位完整**：人均交付X个、人均缺陷X个、基准值也带"个"
- [ ] **时长带天**：人均时长X天、基准值也带"天"
- [ ] **交付量带个**：月度交付X个

## 🟡 增长率图（最易出错区域）

- [ ] **数据字段名=growth**（不是value）
- [ ] **yField="growth"**（不是value）
- [ ] **data id="growthData"**（不是barData）
- [ ] **label用 `"formatter": "{growth}%"`**（不是formatMethod）
- [ ] **color顺序**：第一条增长→`["#e86b6b","#4caf92"]`（红前绿后）
- [ ] **axes**: bottom visible + left hidden
- [ ] **bar style**: cornerRadius [4,4,4,4]

## 🟢 交付趋势图

- [ ] **数据字段名=value**，yField="value"
- [ ] **color**: `["#8bb8d9","#2d7eb5"]`（历史=浅蓝，当月=深蓝）
- [ ] **当月type="当月"**，其余type="历史"

## 📝 内容区域

- [ ] **核心发现emoji+编号与报告HTML一致**：🔴🟠🟢 对应报告内发现顺序
- [ ] **不自创表述**：卡片文字直接取自报告，不重新加工
- [ ] **团队人数=MCP口径**：不说"实际编制"，不说"已补人"

## 📎 底部

- [ ] **用markdown标签**（不用note/action）
- [ ] **链接格式**：`[文字](URL)`
- [ ] **PMO出品 · 日期 · 模型名**

## ✅ 最终确认

- [ ] 卡片JSON可被 `JSON.parse()` 正常解析
- [ ] 先 `--dry-run` 或发测试群，确认图表加载正常
- [ ] 对比最近一次成功卡片（output/*-card.json）无结构遗漏

---
*Created: 2026-06-02 | Based on: BrowserAct 5月推送3次修改教训*
*参考成功卡片: output/linkfox-health-report-202604-card.json*
