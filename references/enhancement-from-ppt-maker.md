# 健康报告增强方案（借鉴 PPT Maker）

> 创建时间：2026-04-03
> 状态：待实施

---

## 借鉴分析

### 当前健康报告已有
- ✅ 单文件自包含（内联 CSS）
- ✅ 基础 hover 效果（kpi-card:hover）
- ✅ 响应式布局（kpi-grid 4 列）
- ✅ 专业视觉风格

### PPT Maker 可借鉴
| 技术点 | 价值 | 实施难度 |
|--------|------|:--------:|
| **右侧导航圆点** | 长报告快速定位 | ⭐⭐ |
| **平滑滚动** | 用户体验提升 | ⭐ |
| **响应式完善** | 移动端可读 | ⭐⭐ |
| **Google Fonts 优化** | 中文显示更好 | ⭐ |
| **打印样式** | 打印/导出 PDF | ⭐⭐ |

---

## 增强代码

### 1. 平滑滚动（最简单，立即可用）

在 `<style>` 开头添加：

```css
html {
    scroll-behavior: smooth;
}
```

### 2. 右侧导航圆点

在 `</body>` 前添加：

```html
<!-- 右侧导航圆点 -->
<nav class="nav-dots" id="navDots"></nav>

<style>
.nav-dots {
    position: fixed;
    right: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 100;
}
.nav-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #c9d9e9;
    cursor: pointer;
    transition: all 0.3s ease;
}
.nav-dot:hover, .nav-dot.active {
    background: #2d7eb5;
    transform: scale(1.3);
}
@media (max-width: 768px) {
    .nav-dots { display: none; }
}
</style>

<script>
(function() {
    const sections = document.querySelectorAll('.chart-title, .issue-box, h2');
    const navDots = document.getElementById('navDots');
    
    sections.forEach((section, i) => {
        section.id = section.id || 'section-' + i;
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        dot.title = section.textContent.slice(0, 20);
        dot.onclick = () => section.scrollIntoView({ behavior: 'smooth' });
        navDots.appendChild(dot);
    });
    
    window.addEventListener('scroll', () => {
        const dots = document.querySelectorAll('.nav-dot');
        let current = 0;
        sections.forEach((section, i) => {
            if (window.scrollY >= section.offsetTop - 200) current = i;
        });
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    });
})();
</script>
```

### 3. 响应式完善

在现有 CSS 末尾添加：

```css
/* 移动端适配 */
@media (max-width: 1024px) {
    .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .two-column {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    body { padding: 1rem; }
    .report-container { 
        padding: 1rem 1.2rem;
        border-radius: 16px;
    }
    h1 { font-size: 1.4rem; }
    .kpi-grid { grid-template-columns: 1fr; gap: 1rem; }
    .kpi-value { font-size: 2rem; }
    .chart-row { flex-direction: column; gap: 0.5rem; }
    .chart-label { width: 100%; }
    .subhead { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .data-table { overflow-x: auto; }
    .data-table table { min-width: 500px; }
}

@media (max-width: 480px) {
    .issue-box { padding: 1.2rem; }
    .measures li { padding-left: 1.2rem; }
}
```

### 4. Google Fonts 中文优化

替换现有字体引入为：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
```

更新 font-family：

```css
* {
    font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 5. 打印样式

```css
@media print {
    body { 
        padding: 0; 
        background: white;
    }
    .report-container { 
        box-shadow: none;
        max-width: 100%;
        border-radius: 0;
    }
    .nav-dots { display: none; }
    .kpi-card, .issue-box, .bar-chart {
        break-inside: avoid;
    }
    .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

### 6. 卡片 hover 增强

更新现有 kpi-card:hover：

```css
.kpi-card {
    transition: all 0.2s ease;
}
.kpi-card:hover {
    border-color: #2d7eb5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(45, 126, 181, 0.15);
}

.issue-box {
    transition: all 0.2s ease;
}
.issue-box:hover {
    transform: translateX(4px);
}
```

---

## 实施计划

| 阶段 | 内容 | 风险 |
|------|------|------|
| **Phase 1** | 平滑滚动 + hover 增强 | 极低 |
| **Phase 2** | 响应式完善 + 打印样式 | 低 |
| **Phase 3** | 右侧导航圆点 | 中（需测试） |
| **Phase 4** | Google Fonts 中文优化 | 低 |

---

## 回滚方式

如果增强效果不好：

```powershell
git checkout f00b683 -- skills/rd-health-report/
```

---

## 下一步

1. 先在 Phase 1 做小改动验证
2. 用下次健康报告实际测试效果
3. 用户确认后再继续 Phase 2-4
