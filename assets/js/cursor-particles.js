/* cursor-particles.js — 鼠标跟随粒子：墨色 / 朱砂 / 群青 三色拖尾
   仅在桌面端（有精确指针）且未开启「减少动态效果」时启用；离屏自动暂停 */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduce || !fine) return;

    var cvs = document.createElement('canvas');
    cvs.setAttribute('aria-hidden', 'true');
    cvs.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90;';
    document.body.appendChild(cvs);
    var ctx = cvs.getContext('2d');

    var W = 0, H = 0, dpr = 1;
    var parts = [];
    var px = -999, py = -999, lx = -999, ly = -999;
    var alive = true;

    // 三色：墨（深）/ 朱砂 / 群青，跟随主题的国风三色
    var palette = ['44,36,27', '196,69,54', '58,90,140'];
    function readPalette() {
        var cs = getComputedStyle(document.documentElement);
        var vals = [
            cs.getPropertyValue('--c-ink').trim(),
            cs.getPropertyValue('--c-cinnabar').trim(),
            cs.getPropertyValue('--c-ultramarine').trim()
        ];
        palette = vals.map(function (v) {
            if (!v) return '44,36,27';
            if (v.charAt(0) === '#') {
                var h = v.slice(1);
                if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
                var n = parseInt(h, 16);
                return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
            }
            var m = v.match(/\d+/g);
            return m ? m.slice(0, 3).join(',') : '44,36,27';
        });
    }

    function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        cvs.width = W * dpr; cvs.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(x, y, n) {
        for (var i = 0; i < n; i++) {
            if (parts.length > 90) parts.shift();
            parts.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 1.6,
                vy: (Math.random() - 0.5) * 1.2 - 0.35,
                r: 1.5 + Math.random() * 3.4,
                life: 1,
                c: palette[(Math.random() * palette.length) | 0]
            });
        }
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);
        for (var i = parts.length - 1; i >= 0; i--) {
            var p = parts[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.012;          // 轻微下沉，像墨在水里落
            p.vx *= 0.98; p.vy *= 0.985;
            p.life -= 0.016;
            p.r *= 0.985;
            if (p.life <= 0 || p.r < 0.2) { parts.splice(i, 1); continue; }
            var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
            g.addColorStop(0, 'rgba(' + p.c + ',' + (0.5 * p.life) + ')');
            g.addColorStop(0.5, 'rgba(' + p.c + ',' + (0.18 * p.life) + ')');
            g.addColorStop(1, 'rgba(' + p.c + ',0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        if (alive) requestAnimationFrame(frame);
    }

    window.addEventListener('mousemove', function (e) {
        lx = px; ly = py; px = e.clientX; py = e.clientY;
        var d = Math.hypot(px - lx, py - ly);
        spawn(px, py, Math.min(4, 1 + Math.round(d / 18)));
    }, { passive: true });

    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () {
        alive = !document.hidden;
        if (alive) requestAnimationFrame(frame);
    });
    window.addEventListener('zk:themechange', readPalette);

    readPalette();
    size();
    requestAnimationFrame(frame);
})();
