#!/usr/bin/env node
/**
 * 月度 Skill 健康度报告生成器
 * 
 * 用途：汇总上月所有产研健康报告 Issue 的执行数据，生成健康度报告
 * 运行：node scripts/monthly-health-report.js [YYYY-MM]
 * 默认：上月
 * 输出：tmp/monthly-health-report-YYYY-MM.md
 * 
 * 数据来源：tmp/execution-log/*.json
 */

const fs = require('fs');
const path = require('path');

// ── 参数解析 ──
const targetMonth = process.argv[2] || getLastMonth();
const logDir = path.resolve(__dirname, '../../tmp/execution-log');
const outputPath = path.resolve(__dirname, `../../tmp/monthly-health-report-${targetMonth}.md`);

function getLastMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
}

// ─ 读取执行日志 ──
function loadLogs() {
  if (!fs.existsSync(logDir)) {
    console.log(`⚠️ 日志目录不存在：${logDir}`);
    console.log('首次运行，暂无历史数据。报告生成后会自动创建日志。');
    return [];
  }

  const files = fs.readdirSync(logDir)
    .filter(f => f.startsWith(targetMonth) && f.endsWith('.json'))
    .map(f => path.join(logDir, f));

  const logs = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      logs.push(data);
    } catch (e) {
      console.warn(`️ 解析失败：${file} - ${e.message}`);
    }
  }
  return logs;
}

// ── 聚合统计 ──
function aggregate(logs) {
  const total = logs.length;
  if (total === 0) return null;

  const success = logs.filter(l => l.status === 'success').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const partial = logs.filter(l => l.status === 'partial').length;
  const successRate = ((success / total) * 100).toFixed(1);

  // 耗时统计
  const durations = logs.map(l => l.totalDurationMs || 0).filter(d => d > 0);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000)
    : 0;
  const maxDuration = durations.length > 0 ? Math.round(Math.max(...durations) / 1000) : 0;
  const minDuration = durations.length > 0 ? Math.round(Math.min(...durations) / 1000) : 0;

  // 失败原因分布
  const failureReasons = {};
  logs.filter(l => l.status !== 'success').forEach(l => {
    const reason = l.failureReason || '未知原因';
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  });

  // 用户反馈
  const feedbacks = logs.filter(l => l.userFeedback && l.userFeedback.score);
  const avgScore = feedbacks.length > 0
    ? (feedbacks.reduce((a, b) => a + b.userFeedback.score, 0) / feedbacks.length).toFixed(1)
    : '暂无';

  // 按项目分组
  const byProject = {};
  logs.forEach(l => {
    const p = l.project || '未知';
    if (!byProject[p]) byProject[p] = { total: 0, success: 0, failed: 0 };
    byProject[p].total++;
    if (l.status === 'success') byProject[p].success++;
    if (l.status === 'failed') byProject[p].failed++;
  });

  // 待优化清单（用户反馈 < 3 或标记需要优化）
  const optimizationItems = logs
    .filter(l => l.userFeedback && (l.userFeedback.score < 3 || l.userFeedback.optimizeSkill === '是'))
    .map(l => ({
      project: l.project,
      month: l.reportMonth,
      score: l.userFeedback.score,
      feedback: l.userFeedback.text || '无文字反馈',
      date: l.completedAt || l.createdAt
    }));

  return {
    targetMonth,
    total, success, failed, partial, successRate,
    avgDuration, maxDuration, minDuration,
    failureReasons,
    avgScore,
    byProject,
    optimizationItems,
    feedbackCount: feedbacks.length
  };
}

// ── 生成报告 ─
function generateReport(stats) {
  if (!stats) {
    return `# 产研健康报告 Skill · 月度健康度报告（${targetMonth}）

> 生成时间：${new Date().toISOString().slice(0, 10)}

## ⚠️ 暂无数据

本月暂无执行记录。首次报告生成后会自动创建日志。

### 如何产生数据

每次报告生成完成后，Agent 自动写入 \`tmp/execution-log/{YYYY-MM}-{alias}.json\`，包含：
- 执行状态、耗时、失败原因
- 用户反馈打分
- 各状态耗时明细
`;
  }

  const lines = [];
  lines.push(`# 产研健康报告 Skill · 月度健康度报告（${stats.targetMonth}）`);
  lines.push('');
  lines.push(`> 生成时间：${new Date().toISOString().slice(0, 10)}`);
  lines.push('');

  // 概览
  lines.push('## 📊 执行概览');
  lines.push('');
  lines.push(`| 指标 | 数值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 执行次数 | ${stats.total} |`);
  lines.push(`| 成功率 | ${stats.successRate}% (${stats.success}/${stats.total}) |`);
  lines.push(`| 失败次数 | ${stats.failed} |`);
  lines.push(`| 部分成功 | ${stats.partial} |`);
  lines.push(`| 平均耗时 | ${stats.avgDuration}s |`);
  lines.push(`| 最长耗时 | ${stats.maxDuration}s |`);
  lines.push(`| 最短耗时 | ${stats.minDuration}s |`);
  lines.push(`| 用户反馈数 | ${stats.feedbackCount} |`);
  lines.push(`| 平均评分 | ${stats.avgScore}/5 |`);
  lines.push('');

  // 按项目
  lines.push('## 📁 按项目分布');
  lines.push('');
  lines.push(`| 项目 | 执行次数 | 成功 | 失败 | 成功率 |`);
  lines.push(`|------|---------|------|------|--------|`);
  for (const [project, data] of Object.entries(stats.byProject)) {
    const rate = ((data.success / data.total) * 100).toFixed(0);
    lines.push(`| ${project} | ${data.total} | ${data.success} | ${data.failed} | ${rate}% |`);
  }
  lines.push('');

  // 失败原因
  if (Object.keys(stats.failureReasons).length > 0) {
    lines.push('## ❌ 失败原因分布');
    lines.push('');
    lines.push(`| 原因 | 次数 |`);
    lines.push(`|------|------|`);
    for (const [reason, count] of Object.entries(stats.failureReasons).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${reason} | ${count} |`);
    }
    lines.push('');
  }

  // 用户反馈
  if (stats.optimizationItems.length > 0) {
    lines.push('## ️ 待优化清单');
    lines.push('');
    lines.push('以下报告收到低分反馈（<3）或用户标记需要优化 Skill：');
    lines.push('');
    for (const item of stats.optimizationItems) {
      lines.push(`- **${item.project}** (${item.month}) - 评分：${item.score}/5`);
      lines.push(`  反馈：${item.feedback}`);
      lines.push(`  日期：${item.date || '未知'}`);
      lines.push('');
    }
  } else {
    lines.push('## ✅ 待优化清单');
    lines.push('');
    lines.push('本月无待优化项。');
    lines.push('');
  }

  // 建议
  lines.push('## 💡 优化建议');
  lines.push('');
  if (parseFloat(stats.successRate) < 90) {
    lines.push(`- 🔴 成功率 ${stats.successRate}% 低于 90% 目标，建议排查失败原因`);
  }
  if (stats.avgDuration > 600) {
    lines.push(`-  平均耗时 ${stats.avgDuration}s 超过 10 分钟，建议优化取数/生成流程`);
  }
  if (stats.avgScore !== '暂无' && parseFloat(stats.avgScore) < 4) {
    lines.push(`- 🟠 平均评分 ${stats.avgScore}/5 低于 4 分，建议收集具体反馈并优化分析质量`);
  }
  if (parseFloat(stats.successRate) >= 90 && stats.avgDuration <= 600 && (stats.avgScore === '暂无' || parseFloat(stats.avgScore) >= 4)) {
    lines.push('- 🟢 本月各项指标正常，暂无优化建议');
  }
  lines.push('');

  // 审批区
  lines.push('---');
  lines.push('');
  lines.push('##  审批');
  lines.push('');
  lines.push('- [ ] 已审阅本月健康度报告');
  lines.push('- [ ] 待优化清单已确认（有/无）');
  lines.push('- [ ] 优化方案已制定（如需要）');
  lines.push('- [ ] 审批人：___________  日期：___________');
  lines.push('');

  return lines.join('\n');
}

// ── 主流程 ──
console.log(`📊 生成月度健康度报告：${targetMonth}`);

const logs = loadLogs();
console.log(` 找到 ${logs.length} 条执行日志`);

const stats = aggregate(logs);
const report = generateReport(stats);

// 确保输出目录存在
const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputPath, report, 'utf-8');
console.log(`✅ 报告已生成：${outputPath}`);

// 同时输出到 stdout（方便 Agent 直接读取）
console.log('\n--- REPORT START ---');
console.log(report);
console.log('--- REPORT END ---');
