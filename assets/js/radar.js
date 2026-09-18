/* radar.js — 技能页 Canvas 动态雷达图 + 数字滚动 */
(function () {
    'use strict';
    var cvs = document.getElementById('radar');
    if (!cvs) return;
    var ctx = cvs.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var axes = [
        { label: 'AI 应用', v: 85 },
        { label: '工程实现', v: 70 },
        { label: '视觉设计', v: 80 },
        { label: '内容创作', v: 62 },
        { label: '自动化', v: 72 },
        { label: '学习速度', v: 88 }
    ];

    var W = 0, H = 0, dpr = 1, progress = 0, target = 0, raf = null;

    function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var r = cvs.getBoundingClientRect();
        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height || r.width));
        cvs.width = W * dpr; cvs.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function css(name, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    }

    function draw() {
        var cx = W / 2, cy = H / 2 + 4;
        var R = Math.min(W, H) / 2 - 42;
        var n = axes.length;
        var ink = css('--c-ink', '#2C241B');
        var line = css('--c-line', 'rgba(44,36,27,0.14)');
        var acc = css('--c-cinnabar', '#C44536');
        var ult = css('--c-ultramarine', '#3A5A8C');

        ctx.clearRect(0, 0, W, H);

        // 网格
        ctx.strokeStyle = line; ctx.lineWidth = 1;
        for (var ring = 1; ring <= 4; ring++) {
            var rr = R * ring / 4;
            ctx.beginPath();
            for (var i = 0; i <= n; i++) {
                var a = (Math.PI * 2 * i) / n - Math.PI / 2;
                var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.stroke();
        }
        // 轴线
        for (var j = 0; j < n; j++) {
            var ang = (Math.PI * 2 * j) / n - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
            ctx.stroke();
        }

        // 数据面（带进度）
        ctx.beginPath();
        for (var k = 0; k < n; k++) {
            var a2 = (Math.PI * 2 * k) / n - Math.PI / 2;
            var val = (axes[k].v / 100) * progress;
            var x2 = cx + Math.cos(a2) * R * val;
            var y2 = cy + Math.sin(a2) * R * val;
            if (k === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        var grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
        grad.addColorStop(0, 'rgba(196,69,54,0.42)');
        grad.addColorStop(1, 'rgba(58,90,140,0.34)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = acc;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 顶点
        for (var m = 0; m < n; m++) {
            var a3 = (Math.PI * 2 * m) / n - Math.PI / 2;
            var v3 = (axes[m].v / 100) * progress;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a3) * R * v3, cy + Math.sin(a3) * R * v3, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = acc; ctx.fill();
        }

        // 标签
        ctx.fillStyle = ink;
        ctx.font = '12px ' + (css('--font-sans', 'sans-serif'));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var t = 0; t < n; t++) {
            var a4 = (Math.PI * 2 * t) / n - Math.PI / 2;
            var lx = cx + Math.cos(a4) * (R + 22);
            var ly = cy + Math.sin(a4) * (R + 20);
            ctx.globalAlpha = 0.75;
            ctx.fillText(axes[t].label, lx, ly);
            ctx.globalAlpha = 0.45;
            ctx.fillText(Math.round(axes[t].v * progress), lx, ly + 14);
            ctx.globalAlpha = 1;
        }
        return { ult: ult };
    }

    function animateIn() {
        var t0 = performance.now();
        (function step(now) {
            var p = Math.min(1, (now - t0) / 1100);
            progress = 1 - Math.pow(1 - p, 3);
            draw();
            if (p < 1) raf = requestAnimationFrame(step);
        })(t0);
    }

    size();
    window.addEventListener('resize', function () { size(); draw(); });
    window.addEventListener('zk:themechange', function () { draw(); });

    if (reduce) { progress = 1; draw(); }
    else if ('IntersectionObserver' in window) {
        progress = 0; draw();
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { animateIn(); io.unobserve(e.target); } });
        }, { threshold: 0.3 });
        io.observe(cvs);
    } else { progress = 1; draw(); }
})();
