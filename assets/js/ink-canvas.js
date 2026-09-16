/* ink-canvas.js — 首页水墨粒子背景：缓慢流动的墨点 + 鼠标移动时的墨滴扩散
   颜色取自 CSS 变量 --ink-particle（RGB 三元组），随深浅模式自动变化 */
(function () {
    'use strict';
    var canvas = document.getElementById('ink-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, dpr = 1;
    var blobs = [], drops = [];
    var rgb = '44, 36, 27';
    var alpha = 0.5;
    var scrollBoost = 0;      // 滚动带来的流速加成
    var lastScroll = window.scrollY || 0;
    var pointer = { x: -999, y: -999, lx: -999, ly: -999 };
    var running = true;

    function readTokens() {
        var cs = getComputedStyle(document.documentElement);
        var v = cs.getPropertyValue('--ink-particle').trim();
        if (v) rgb = v;
        var a = parseFloat(cs.getPropertyValue('--ink-canvas-alpha'));
        if (!isNaN(a)) alpha = a;
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var r = canvas.getBoundingClientRect();
        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height));
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
    }

    function build() {
        var count = Math.min(30, Math.round((W * H) / 46000));
        blobs = [];
        for (var i = 0; i < count; i++) {
            blobs.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 20 + Math.random() * 90,
                vx: (Math.random() - 0.5) * 0.16,
                vy: (Math.random() - 0.5) * 0.12 - 0.03,
                a: 0.025 + Math.random() * 0.05,
                ph: Math.random() * Math.PI * 2
            });
        }
    }

    function spawnDrop(x, y, strength) {
        if (drops.length > 34) drops.shift();
        drops.push({
            x: x, y: y,
            r: 4 + Math.random() * 8,
            max: 60 + Math.random() * 150 * strength,
            life: 1,
            a: 0.16 + Math.random() * 0.18
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        var t = Date.now() * 0.0004;

        // 流动墨团
        for (var i = 0; i < blobs.length; i++) {
            var b = blobs[i];
            b.x += b.vx * (1 + scrollBoost * 6);
            b.y += b.vy * (1 + scrollBoost * 8) - scrollBoost * 1.2;
            if (b.x < -b.r) b.x = W + b.r;
            if (b.x > W + b.r) b.x = -b.r;
            if (b.y < -b.r) b.y = H + b.r;
            if (b.y > H + b.r) b.y = -b.r;

            var pulse = 1 + Math.sin(t + b.ph) * 0.12;
            var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse);
            g.addColorStop(0, 'rgba(' + rgb + ',' + (b.a * alpha) + ')');
            g.addColorStop(0.55, 'rgba(' + rgb + ',' + (b.a * alpha * 0.45) + ')');
            g.addColorStop(1, 'rgba(' + rgb + ',0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        // 墨滴扩散
        for (var j = drops.length - 1; j >= 0; j--) {
            var d = drops[j];
            d.r += (d.max - d.r) * 0.055;
            d.life -= 0.009;
            if (d.life <= 0 || d.r > d.max * 0.985) { drops.splice(j, 1); continue; }
            var ease = d.life * d.life;
            var gg = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
            gg.addColorStop(0, 'rgba(' + rgb + ',' + (d.a * ease) + ')');
            gg.addColorStop(0.62, 'rgba(' + rgb + ',' + (d.a * ease * 0.35) + ')');
            gg.addColorStop(1, 'rgba(' + rgb + ',0)');
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }

        scrollBoost *= 0.92;
        if (running) requestAnimationFrame(draw);
    }

    // —— 事件
    window.addEventListener('resize', function () { resize(); readTokens(); }, { passive: true });
    window.addEventListener('scroll', function () {
        var y = window.scrollY || 0;
        scrollBoost = Math.min(2.2, Math.abs(y - lastScroll) / 60);
        lastScroll = y;
    }, { passive: true });

    if (!reduce) {
        window.addEventListener('mousemove', function (e) {
            var r = canvas.getBoundingClientRect();
            pointer.lx = pointer.x; pointer.ly = pointer.y;
            pointer.x = e.clientX - r.left;
            pointer.y = e.clientY - r.top;
            if (pointer.x < 0 || pointer.y < 0 || pointer.x > W || pointer.y > H) return;
            var moved = Math.hypot(pointer.x - pointer.lx, pointer.y - pointer.ly);
            if (moved > 6) spawnDrop(pointer.x, pointer.y, Math.min(1.6, moved / 22));
        }, { passive: true });

        canvas.parentElement.addEventListener('click', function (e) {
            var r = canvas.getBoundingClientRect();
            spawnDrop(e.clientX - r.left, e.clientY - r.top, 1.8);
        });
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { running = false; }
        else if (!running) { running = true; requestAnimationFrame(draw); }
    });

    // 主题切换后重读颜色
    window.addEventListener('zk:themechange', function () { readTokens(); });

    readTokens();
    resize();
    if (reduce) { draw(); running = false; } else { requestAnimationFrame(draw); }
})();
