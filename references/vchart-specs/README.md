# VChart Spec 模板

> 产研健康报告中使用的 VChart 图表配置模板
> 
> 底层引擎：VChart 2.0+（字节 VisActor 开源）
> CDN：`https://cdn.jsdelivr.net/npm/@visactor/vchart/build/index.min.js`

## 模板列表

| 文件 | 用途 | 图表类型 |
|------|------|----------|
| `kpi-trend-bar.json` | 月度需求交付数量趋势 | 柱状图（当月高亮） |
| `cycle-growth.json` | 交付周期环比增长率 | 正负双向柱状图 |
| `meego-duration-bar.json` | Meego操作时长+次数 | 柱线组合图（双轴） |

## 使用方式

### 在 HTML 报告中

```html
<!-- 1. 引入 CDN -->
<script src="https://cdn.jsdelivr.net/npm/@visactor/vchart/build/index.min.js"></script>

<!-- 2. 准备容器 -->
<div id="chart-delivery-trend" style="width:100%;height:300px;"></div>

<!-- 3. 渲染图表 -->
<script>
const spec = { /* 从模板复制，替换 data.values */ };
const chart = new VChart.default(spec, { dom: 'chart-delivery-trend' });
chart.renderSync();
</script>
```

### 在飞书卡片中

飞书卡片的 `chart` 组件底层使用 VChart，spec 格式基本相同。
具体用法见 `feishu-card-chart.json`（待创建）。

## 复用规则

1. **只替换数据**：`data[0].values` 换成实际项目数据
2. **保持样式统一**：颜色、圆角、字号不随项目变化
3. **高亮逻辑**：当前分析月份 `highlight: true`
4. **tooltip 格式化**：根据指标单位调整（个/天/%）

## 颜色规范

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色（柱子） | `#2d7eb5` / `#5090c5` | 蓝色系，与报告整体风格一致 |
| 高亮色 | `#2d7eb5` | 当月数据 |
| 正增长 | `#4caf92` | 绿色 |
| 负增长 | `#e86b6b` | 红色 |
| Meego渐变 | `#b57c2d` → `#d79c4a` | 棕色系 |
| 文字 | `#335e83` / `#506c8a` | 深蓝灰 |
