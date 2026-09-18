/* home.js — 首页专属：毛笔逐字书写、座右铭打字机、数字滚动、滚动提示 */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 姓名：毛笔逐字揭示 ---------- */
    var nameEl = document.querySelector('.brush-name');
    if (nameEl) {
        var chars = (nameEl.dataset.text || nameEl.textContent).trim().split('');
        nameEl.textContent = '';
        chars.forEach(function (c, i) {
            var s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            nameEl.appendChild(s);
        });
        var spans = nameEl.querySelectorAll('.ch');
        function reveal() {
            spans.forEach(function (s, i) {
                window.setTimeout(function () { s.classList.add('done'); }, reduce ? 0 : 260 + i * 180);
            });
        }
        if (reduce) reveal();
        else window.setTimeout(reveal, 180);
    }

    /* ---------- 座右铭：打字机 ---------- */
    var flog = document.querySelector('.hero-flog');
    if (flog) {
        var text = flog.dataset.text || flog.textContent.trim();
        var target = flog.querySelector('.txt') || flog;
        target.textContent = '';
        var caret = document.createElement('span');
        caret.className = 'caret';
        caret.textContent = '|';
        flog.appendChild(caret);
        if (reduce) {
            target.textContent = text;
        } else {
            var i = 0;
            (function type() {
                if (i <= text.length) {
                    target.textContent = text.slice(0, i++);
                    window.setTimeout(type, 78);
                }
            })();
        }
    }

    /* ---------- 数字滚动 ---------- */
    var nums = document.querySelectorAll('[data-count]');
    if (nums.length && 'IntersectionObserver' in window && !reduce) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                var to = parseFloat(el.dataset.count) || 0;
                var dur = 1200, t0 = performance.now();
                (function tick(now) {
                    var p = Math.min(1, (now - t0) / dur);
                    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
                    if (p < 1) requestAnimationFrame(tick);
                })(t0);
                io.unobserve(el);
            });
        }, { threshold: 0.5 });
        nums.forEach(function (n) { io.observe(n); });
    }

    /* ---------- 滚动提示：点击滚到下一屏 ---------- */
    var hint = document.querySelector('.scroll-hint');
    if (hint) {
        hint.addEventListener('click', function () {
            var next = document.getElementById('next-screen');
            if (next) next.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
    }
})();
