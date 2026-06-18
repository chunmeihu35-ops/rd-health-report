# 执行日志格式规范

> 每次报告生成完成后，Agent 必须写入此格式的 JSON 文件。
> 路径：`tmp/execution-log/{YYYY-MM}-{alias}.json`

## JSON 结构

```json
{
  "project": "云资源",
  "alias": "cloud-resource",
  "reportMonth": "2026-06",
  "createdAt": "2026-06-18T09:00:00+08:00",
  "completedAt": "2026-06-18T09:35:00+08:00",
  "status": "success",
  "totalDurationMs": 2100000,
  "states": {
    "0_config_check": { "status": "ok", "durationMs": 5000, "output": "配置已加载" },
    "1_fetch": { "status": "ok", "durationMs": 30000, "output": "MCP 取数完成" },
    "2_parse": { "status": "ok", "durationMs": 10000, "output": "JSON 解析完成" },
    "3_data_review": { "status": "ok", "durationMs": 600000, "output": "用户确认数据OK", "reviewRounds": 1 },
    "4_html_generate": { "status": "ok", "durationMs": 120000, "output": "HTML 生成完成" },
    "5_qa_gate": { "status": "ok", "durationMs": 15000, "output": "QA Gate PASSED", "retryCount": 0 },
    "6_publish": { "status": "ok", "durationMs": 30000, "output": "GitHub Pages 部署完成" },
    "7_content_review": { "status": "ok", "durationMs": 300000, "output": "用户确认定稿", "reviewRounds": 1 },
    "8_push_test": { "status": "ok", "durationMs": 20000, "output": "测试群卡片已发送" },
    "9_card_review": { "status": "ok", "durationMs": 120000, "output": "用户确认卡片OK", "reviewRounds": 1 },
    "10_push_formal": { "status": "ok", "durationMs": 15000, "output": "正式群卡片已发送" },
    "11_wrapup": { "status": "ok", "durationMs": 30000, "output": "基线+memory+上下文已更新" }
  },
  "failureReason": null,
  "reportUrl": "https://chunmeihu35-ops.github.io/pmo-reports/cloud-resource-health-report-202606.html",
  "shortUrl": "https://is.gd/YZ202606",
  "userFeedback": {
    "score": 4,
    "text": "分析质量不错，但核心问题第2条可以更具体",
    "optimizeSkill": "否"
  }
}
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project | string | ✅ | 项目中文名 |
| alias | string | ✅ | 项目英文别名 |
| reportMonth | string | ✅ | 报告月份 YYYY-MM |
| createdAt | ISO-8601 | ✅ | 开始时间 |
| completedAt | ISO-8601 | ✅ | 完成时间 |
| status | enum | ✅ | success / failed / partial |
| totalDurationMs | number | ✅ | 总耗时（毫秒） |
| states | object | ✅ | 各状态执行详情 |
| failureReason | string/null | ✅ | 失败原因（成功时为 null） |
| reportUrl | string | ✅ | GitHub Pages URL |
| shortUrl | string | ✅ | is.gd 短链 |
| userFeedback | object | ✅ | 用户反馈（必填，Issue 关闭前收集） |

## states 子字段

| 字段 | 类型 | 说明 |
|------|------|------|
| status | enum | ok / failed / skipped / waiting |
| durationMs | number | 该状态耗时（毫秒） |
| output | string | 关键输出/结果 |
| retryCount | number | 重试次数（默认 0） |
| reviewRounds | number | 人工审核轮次（默认 1） |
| error | string | 错误信息（失败时必填） |
