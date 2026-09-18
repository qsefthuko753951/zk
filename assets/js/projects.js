/* projects.js — 作品页：3D Coverflow 轮播 + 灯箱查看 */
(function () {
    'use strict';

    /* ================= 3D Coverflow ================= */
    var wrap = document.querySelector('.coverflow');
    var items = wrap ? Array.prototype.slice.call(wrap.querySelectorAll('.cf-item')) : [];
    var idx = 0;
    var total = items.length;

    function layout() {
        if (!items.length) return;
        var mobile = window.innerWidth < 768;
        var off1 = mobile ? 20 : 26;
        var off2 = mobile ? 34 : 44;
        items.forEach(function (it, i) {
            var off = i - idx;
            if (off < -Math.floor(total / 2)) off += total;
            if (off > Math.floor(total / 2)) off -= total;
            it.classList.remove('is-active');

            if (Math.abs(off) > 2) {
                it.style.transform = 'translate(-50%, -50%) translateZ(-420px) rotateY(' + (off > 0 ? -80 : 80) + 'deg) scale(0.55)';
                it.style.opacity = 0; it.style.zIndex = 1; it.style.pointerEvents = 'none';
                return;
            }
            var scale = 1, x = 0, z = 0, ry = 0, filter = 1, zIndex = 10;
            if (off === 0) { it.classList.add('is-active'); }
            else if (Math.abs(off) === 1) { scale = 0.86; x = off * off1; z = -150; ry = -off * 48; filter = 0.55; zIndex = 9; }
            else { scale = 0.7; x = off * off2; z = -320; ry = -off * 62; filter = 0.25; zIndex = 8; }
            it.style.transform = 'translate(-50%, -50%) translateX(' + x + 'vw) translateZ(' + z + 'px) rotateY(' + ry + 'deg) scale(' + scale + ')';
            it.style.opacity = 1; it.style.zIndex = zIndex; it.style.pointerEvents = 'auto';
            it.style.filter = 'brightness(' + filter + ')';
        });
    }

    function move(dir) { idx = (idx + dir + total) % total; layout(); }

    if (items.length) {
        layout();
        window.addEventListener('resize', layout);
        var prev = document.querySelector('.cf-prev');
        var next = document.querySelector('.cf-next');
        if (prev) prev.addEventListener('click', function () { move(-1); });
        if (next) next.addEventListener('click', function () { move(1); });

        // 拖拽旋转
        var sx = null, moved = false;
        wrap.addEventListener('pointerdown', function (e) { sx = e.clientX; moved = false; });
        window.addEventListener('pointermove', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 10) moved = true; });
        window.addEventListener('pointerup', function (e) {
            if (sx === null) return;
            var dx = e.clientX - sx; sx = null;
            if (Math.abs(dx) > 40) { moved = true; move(dx < 0 ? 1 : -1); }
        });
    }

    /* ================= 灯箱 ================= */
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var lbImg = lb.querySelector('img');
    var lbCount = lb.querySelector('.lb-count');
    var slides = items.map(function (it) {
        var img = it.querySelector('img');
        return { src: img ? img.getAttribute('src') : '', alt: img ? img.getAttribute('alt') : '' };
    }).filter(function (s) { return s.src; });
    var cur = -1;

    function open(i) {
        if (!slides.length) return;
        cur = (i + slides.length) % slides.length;
        lbImg.src = slides[cur].src;
        lbImg.alt = slides[cur].alt || '';
        if (lbCount) lbCount.textContent = (cur + 1) + ' / ' + slides.length;
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('is-open'); document.body.style.overflow = ''; }

    items.forEach(function (it, i) {
        it.addEventListener('click', function () {
            if (moved) { moved = false; return; }
            if (it.classList.contains('is-active')) { open(i); return; }
            idx = i; layout();
        });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { open(cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { open(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    /* 供展厅（无限画布）按图片地址唤起同一个灯箱 */
    window.__openLightboxBySrc = function (src) {
        if (!src) return;
        for (var i = 0; i < slides.length; i++) {
            if (slides[i].src === src || slides[i].src.indexOf(src) >= 0 || src.indexOf(slides[i].src) >= 0) { open(i); return; }
        }
        // 展厅里出现灯箱未收录的图时，直接展示
        lbImg.src = src; lbImg.alt = '';
        if (lbCount) lbCount.textContent = '';
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') open(cur - 1);
        else if (e.key === 'ArrowRight') open(cur + 1);
    });
})();
