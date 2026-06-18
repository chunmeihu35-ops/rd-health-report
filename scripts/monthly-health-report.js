#!/usr/bin/env node
/**
 * Skill 健康度报告生成器（支持两种模式）
 * 
 * 模式 1：单项目执行质量复盘（每个报告完成后自动触发）
 *   用法：node scripts/monthly-health-report.js --project {alias} --month {YYYY-MM}
 *   输出：tmp/review/{alias}-{YYYY-MM}-review.md
 * 
 * 模式 2：月度全局治理报告（每月 15 日自动触发）
 *   用法：node scripts/monthly-health-report.js --global --month {YYYY-MM}
 *   输出：tmp/global-health-report-{YYYY-MM}.md
 * 
 * 默认：模式 2，上月
 * 
 * 数据来源：tmp/execution-log/*.json
 */

const fs = require('fs');
const path = require('path');

// ── 参数解析 ──
const args = process.argv.slice(2);
let mode = 'global'; // default
let project = null;
let targetMonth = getLastMonth();

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project') { project = args[++i]; mode = 'project'; }
  else if (args[i] === '--global') { mode = 'global'; }
  else if (args[i] === '--month') { targetMonth = args[++i]; }
}

const logDir = path.resolve(__dirname, '../../tmp/execution-log');

function getLastMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
}

// ── 读取执行日志 ──
function loadLogs(filterProject = null) {
  if (!fs.existsSync(logDir)) {
    console.log(`⚠️ 日志目录不存在：${logDir}`);
    return [];
  }

  const files = fs.readdirSync(logDir)
    .filter(f => f.startsWith(targetMonth) && f.endsWith('.json'))
    .map(f => path.join(logDir, f));

  const logs = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (filterProject && data.alias !== filterProject) continue;
      logs.push(data);
    } catch (e) {
      console.warn(`⚠️ 解析失败：${file} - ${e.message}`);
    }
  }
  return logs;
}

// ── 模式 1：单项目复盘报告 ──
function generateProjectReview(projectAlias, logs) {
  if (logs.length === 0) {
    return `# [单项目复盘] ${projectAlias} ${targetMonth} Skill 执行质量复盘\n\n> 暂无执行记录\n`;
  }

  const log = logs[0]; // 单项目单月只有一条
  const lines = [];
  lines.push(`# [单项目复盘] ${log.project} ${targetMonth} Skill 执行质量复盘`);
  lines.push('');
  lines.push(`> 生成时间：${new Date().toISOString().slice(0, 10)}`);
  lines.push(`> 执行状态：${log.status === 'success' ? '✅ 成功' : log.status === 'failed' ? '❌ 失败' : '⚠️ 部分成功'}`);
  lines.push(`> 总耗时：${Math.round((log.totalDurationMs || 0) / 1000)}s`);
  lines.push('');

  // 各状态耗时
  lines.push('## 📊 各状态耗时明细');
  lines.push('');
  lines.push('| 状态 | 耗时 | 重试次数 | 审核轮次 | 状态 |');
  lines.push('|------|------|---------|---------|------|');
  if (log.states) {
    for (const [state, data] of Object.entries(log.states)) {
      const duration = Math.round((data.durationMs || 0) / 1000);
      lines.push(`| ${state} | ${duration}s | ${data.retryCount || 0} | ${data.reviewRounds || 1} | ${data.status} |`);
    }
  }
  lines.push('');

  // 失败原因
  if (log.failureReason) {
    lines.push('## ❌ 失败原因');
    lines.push('');
    lines.push(log.failureReason);
    lines.push('');
  }

  // 用户反馈
  if (log.userFeedback) {
    lines.push('## 💬 用户反馈');
    lines.push('');
    lines.push(`- 评分：${log.userFeedback.score}/5`);
    if (log.userFeedback.text) lines.push(`- 文字反馈：${log.userFeedback.text}`);
    lines.push(`- 是否建议优化 Skill：${log.userFeedback.optimizeSkill || '否'}`);
    lines.push('');
  }

  // 优化建议
  lines.push('## 💡 优化建议');
  lines.push('');
  if (log.status !== 'success') {
    lines.push(`- 🔴 本次执行失败，需排查根因：${log.failureReason || '未知'}`);
  }
  if (log.userFeedback && log.userFeedback.score < 3) {
    lines.push(`- 🟠 用户评分低于 3 分，需关注分析质量：${log.userFeedback.text || '无具体反馈'}`);
  }
  if (log.userFeedback && log.userFeedback.optimizeSkill === '是') {
    lines.push('- 🟡 用户建议优化 Skill，需评估具体需求');
  }
  if (log.states) {
    const slowStates = Object.entries(log.states).filter(([_, d]) => d.durationMs > 300000); // >5min
    if (slowStates.length > 0) {
      lines.push(`- ⚪ 以下状态耗时较长（>5min），可考虑优化：${slowStates.map(([s]) => s).join(', ')}`);
    }
  }
  if (log.status === 'success' && (!log.userFeedback || log.userFeedback.score >= 4)) {
    lines.push('- 🟢 本次执行正常，暂无优化建议');
  }
  lines.push('');

  // 冲突检测
  lines.push('## 🔍 冲突检测');
  lines.push('');
  lines.push('- [ ] 本次优化是否与其他项目的配置冲突？');
  lines.push('- [ ] 本次修改是否导致 Skill 文件膨胀（>100 行新增）？');
  lines.push('- [ ] 是否需要合并到月度治理报告？');
  lines.push('');

  return lines.join('\n');
}

// ── 模式 2：月度全局治理报告 ──
function generateGlobalReport(logs) {
  if (logs.length === 0) {
    return `# [月度治理] Skill 全局健康度报告 ${targetMonth}\n\n> 暂无执行记录\n`;
  }

  const total = logs.length;
  const success = logs.filter(l => l.status === 'success').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const partial = logs.filter(l => l.status === 'partial').length;
  const successRate = ((success / total) * 100).toFixed(1);

  const durations = logs.map(l => l.totalDurationMs || 0).filter(d => d > 0);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0;

  const failureReasons = {};
  logs.filter(l => l.status !== 'success').forEach(l => {
    const reason = l.failureReason || '未知原因';
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  });

  const feedbacks = logs.filter(l => l.userFeedback && l.userFeedback.score);
  const avgScore = feedbacks.length > 0 ? (feedbacks.reduce((a, b) => a + b.userFeedback.score, 0) / feedbacks.length).toFixed(1) : '暂无';

  const byProject = {};
  logs.forEach(l => {
    const p = l.project || '未知';
    if (!byProject[p]) byProject[p] = { total: 0, success: 0, failed: 0 };
    byProject[p].total++;
    if (l.status === 'success') byProject[p].success++;
    if (l.status === 'failed') byProject[p].failed++;
  });

  const lines = [];
  lines.push(`# [月度治理] Skill 全局健康度报告 ${targetMonth}`);
  lines.push('');
  lines.push(`> 生成时间：${new Date().toISOString().slice(0, 10)}`);
  lines.push(`> 报告周期：${targetMonth}`);
  lines.push('');

  // 概览
  lines.push('## 📊 执行概览');
  lines.push('');
  lines.push('| 指标 | 数值 |');
  lines.push('|------|------|');
  lines.push(`| 执行次数 | ${total} |`);
  lines.push(`| 成功率 | ${successRate}% (${success}/${total}) |`);
  lines.push(`| 失败次数 | ${failed} |`);
  lines.push(`| 部分成功 | ${partial} |`);
  lines.push(`| 平均耗时 | ${avgDuration}s |`);
  lines.push(`| 平均评分 | ${avgScore}/5 |`);
  lines.push('');

  // 按项目
  lines.push('## 📁 按项目分布');
  lines.push('');
  lines.push('| 项目 | 执行次数 | 成功 | 失败 | 成功率 |');
  lines.push('|------|---------|------|------|--------|');
  for (const [project, data] of Object.entries(byProject)) {
    const rate = ((data.success / data.total) * 100).toFixed(0);
    lines.push(`| ${project} | ${data.total} | ${data.success} | ${data.failed} | ${rate}% |`);
  }
  lines.push('');

  // 失败原因
  if (Object.keys(failureReasons).length > 0) {
    lines.push('## ❌ 失败原因分布');
    lines.push('');
    lines.push('| 原因 | 次数 |');
    lines.push('|------|------|');
    for (const [reason, count] of Object.entries(failureReasons).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${reason} | ${count} |`);
    }
    lines.push('');
  }

  // Skill 膨胀检测
  lines.push('## 🔍 Skill 膨胀检测');
  lines.push('');
  lines.push('- [ ] 检查 SKILL.md 行数是否超过 500 行');
  lines.push('- [ ] 检查 references/ 目录是否有冗余文件');
  lines.push('- [ ] 检查 scripts/ 目录是否有未使用的脚本');
  lines.push('- [ ] 检查是否有重复的逻辑可以合并');
  lines.push('');

  // 优化冲突检测
  lines.push('## ⚠️ 优化冲突检测');
  lines.push('');
  lines.push('- [ ] 检查各项目配置是否有矛盾（如 MCP 地址、群 ID）');
  lines.push('- [ ] 检查分析框架是否有项目特定逻辑污染全局规则');
  lines.push('- [ ] 检查基线数据是否有异常波动');
  lines.push('');

  // 治理建议
  lines.push('## 💡 治理建议');
  lines.push('');
  if (parseFloat(successRate) < 90) {
    lines.push(`- 🔴 成功率 ${successRate}% 低于 90% 目标，建议排查失败原因`);
  }
  if (avgDuration > 600) {
    lines.push(`- 🟠 平均耗时 ${avgDuration}s 超过 10 分钟，建议优化取数/生成流程`);
  }
  if (avgScore !== '暂无' && parseFloat(avgScore) < 4) {
    lines.push(`- 🟡 平均评分 ${avgScore}/5 低于 4 分，建议收集具体反馈并优化分析质量`);
  }
  if (parseFloat(successRate) >= 90 && avgDuration <= 600 && (avgScore === '暂无' || parseFloat(avgScore) >= 4)) {
    lines.push('- 🟢 本月各项指标正常，暂无治理建议');
  }
  lines.push('');

  // 审批区
  lines.push('---');
  lines.push('');
  lines.push('## ✅ 审批');
  lines.push('');
  lines.push('- [ ] 已审阅本月全局健康度报告');
  lines.push('- [ ] Skill 膨胀检测已完成');
  lines.push('- [ ] 优化冲突检测已完成');
  lines.push('- [ ] 治理建议已确认（有/无）');
  lines.push('- [ ] 审批人：___________  日期：___________');
  lines.push('');

  return lines.join('\n');
}

// ── 主流程 ──
console.log(`📊 生成 Skill 健康度报告（模式：${mode}，月份：${targetMonth}）`);

const logs = loadLogs(project);
console.log(`找到 ${logs.length} 条执行日志`);

let report;
let outputPath;

if (mode === 'project' && project) {
  report = generateProjectReview(project, logs);
  const reviewDir = path.resolve(__dirname, '../../tmp/review');
  if (!fs.existsSync(reviewDir)) fs.mkdirSync(reviewDir, { recursive: true });
  outputPath = path.join(reviewDir, `${project}-${targetMonth}-review.md`);
} else {
  report = generateGlobalReport(logs);
  outputPath = path.resolve(__dirname, `../../tmp/global-health-report-${targetMonth}.md`);
}

const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outputPath, report, 'utf-8');
console.log(`✅ 报告已生成：${outputPath}`);

console.log('\n--- REPORT START ---');
console.log(report);
console.log('--- REPORT END ---');
