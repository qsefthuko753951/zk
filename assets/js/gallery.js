/* gallery.js — projects 页「沉浸式展厅」：代码雨、无限画布、放映机 */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============ 房间 01：代码雨 ============ */
    var mc = document.getElementById('matrix-canvas');
    if (mc && !reduce) {
        var ctx = mc.getContext('2d');
        var cols = [], drops = [], step = 18, W = 0, H = 0, dpr = 1, alive = false, raf = null;

        function size() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            var r = mc.getBoundingClientRect();
            W = Math.max(1, Math.round(r.width));
            H = Math.max(1, Math.round(r.height));
            mc.width = W * dpr; mc.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var n = Math.floor(W / step);
            drops = [];
            for (var i = 0; i < n; i++) drops[i] = Math.random() * -60;
        }
        function draw() {
            ctx.fillStyle = 'rgba(5,5,5,0.08)';
            ctx.fillRect(0, 0, W, H);
            ctx.font = 'bold ' + step + 'px ' + 'monospace';
            for (var i = 0; i < drops.length; i++) {
                var ch = Math.random() > 0.5 ? '0' : '1';
                ctx.fillStyle = Math.random() > 0.86 ? 'rgba(196,69,54,0.9)' : 'rgba(216,178,106,0.75)';
                ctx.fillText(ch, i * step, drops[i] * step);
                if (drops[i] * step > H && Math.random() > 0.975) drops[i] = 0;
                drops[i] += 0.7;
            }
            if (alive) raf = requestAnimationFrame(draw);
        }
        size();
        window.addEventListener('resize', size);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                es.forEach(function (e) {
                    if (e.isIntersecting && !alive) { alive = true; draw(); }
                    else if (!e.isIntersecting && alive) { alive = false; if (raf) cancelAnimationFrame(raf); }
                });
            }, { threshold: 0.05 }).observe(mc);
        } else { alive = true; draw(); }
    }

    /* ============ 房间 02：无限画布 ============ */
    var wrap = document.getElementById('infinite-wrap');
    if (wrap) {
        var inner = wrap.querySelector('.infinite-inner');
        var items = Array.prototype.slice.call(wrap.querySelectorAll('.inf-item'));
        var frame = wrap.querySelector('.drag-frame');
        var cols = 4, itemW = 0, itemH = 0, gapX = 56, gapY = 72, gridW = 0, gridH = 0;
        var tx = 0, ty = 0, cx = 0, cy = 0;
        var dragging = false, sx = 0, sy = 0, stx = 0, sty = 0, moved = 0, timer = null;

        function layout() {
            var r = wrap.getBoundingClientRect();
            cols = r.width < 700 ? 2 : 4;
            gapX = r.width < 700 ? 18 : 56;
            gapY = r.width < 700 ? 26 : 72;
            itemW = Math.max(r.width / 3.6, 150);
            itemH = itemW * 9 / 16;
            gridW = cols * (itemW + gapX);
            gridH = Math.ceil(items.length / cols) * (itemH + gapY);
        }
        function render() {
            cx += (tx - cx) * 0.09;
            cy += (ty - cy) * 0.09;
            for (var i = 0; i < items.length; i++) {
                var col = i % cols, row = Math.floor(i / cols);
                var x = col * (itemW + gapX), y = row * (itemH + gapY);
                if (col % 2) y += (itemH + gapY) / 2;
                x = ((x + cx) % gridW + gridW) % gridW;
                y = ((y + cy) % gridH + gridH) % gridH;
                if (x > gridW - itemW - gapX) x -= gridW;
                if (y > gridH - itemH - gapY) y -= gridH;
                var it = items[i];
                it.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
                it.style.width = itemW + 'px';
                it.style.height = itemH + 'px';
            }
            requestAnimationFrame(render);
        }
        function active() {
            wrap.classList.add('is-active');
            if (frame) frame.classList.add('is-on');
            clearTimeout(timer);
            timer = setTimeout(function () {
                wrap.classList.remove('is-active');
                if (frame) frame.classList.remove('is-on');
            }, 420);
        }
        function down(x, y) { dragging = true; moved = 0; sx = x; sy = y; stx = tx; sty = ty; }
        function move(x, y) {
            if (!dragging) return;
            tx = stx + (x - sx) * 1.4; ty = sty + (y - sy) * 1.4;
            moved = Math.max(moved, Math.abs(x - sx) + Math.abs(y - sy));
            if (moved > 6) active();
        }
        function up() { dragging = false; }

        wrap.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
        window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
        window.addEventListener('mouseup', up);
        wrap.addEventListener('touchstart', function (e) { down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
        wrap.addEventListener('touchmove', function (e) { move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
        wrap.addEventListener('touchend', up);

        items.forEach(function (it) {
            it.addEventListener('click', function () {
                if (moved > 8) return;
                var img = it.querySelector('img');
                if (!img) return;
                if (window.__openLightboxBySrc) window.__openLightboxBySrc(img.getAttribute('src'));
            });
        });

        layout();
        window.addEventListener('resize', layout);
        render();
    }

    /* ============ 房间 03：放映机 ============ */
    var roomMedia = document.querySelector('.room-media');
    if (roomMedia && !reduce && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                if (roomMedia.dataset.played) return;
                roomMedia.dataset.played = '1';
                roomMedia.classList.add('is-broken');
                setTimeout(function () {
                    roomMedia.classList.remove('is-broken');
                    roomMedia.classList.add('is-stable');
                }, 2800);
            });
        }, { threshold: 0.3 }).observe(roomMedia);
    }

    /* ============ 房间进入视口时点亮（供 CSS 动画触发） ============ */
    var rooms = document.querySelectorAll('.room');
    if (rooms.length && 'IntersectionObserver' in window) {
        var ro = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } });
        }, { threshold: 0.2 });
        rooms.forEach(function (r) { ro.observe(r); });
    } else {
        rooms.forEach(function (r) { r.classList.add('is-in'); });
    }
})();
