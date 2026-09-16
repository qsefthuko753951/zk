/* cards.js — 作品卡 3D 翻转 + 分类筛选（FLIP 过渡） */
(function () {
    'use strict';

    /* ---------- 3D 翻转卡 ---------- */
    document.querySelectorAll('.flip-card').forEach(function (card) {
        var inner = card.querySelector('.flip-inner');
        if (!inner) return;
        var btn = card.querySelector('.flip-toggle');
        function flip() {
            var on = card.classList.toggle('is-flipped');
            card.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
        if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); flip(); });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
        });
    });

    /* ---------- 分类筛选（FLIP：First / Last / Invert / Play） ---------- */
    var filterBar = document.querySelector('.filter-bar');
    var grid = document.querySelector('[data-filter-grid]');
    if (!filterBar || !grid || !('IntersectionObserver' in window)) return;
    var cards = Array.prototype.slice.call(grid.children);

    filterBar.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.filter-btn') : null;
        if (!btn) return;
        filterBar.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');

        var key = btn.dataset.filter;

        // First：记录当前位置
        var first = cards.map(function (c) { return c.getBoundingClientRect(); });

        // 应用筛选
        cards.forEach(function (c) {
            var hit = key === 'all' || c.dataset.cat === key;
            c.hidden = !hit;
        });

        // Last + Invert + Play
        cards.forEach(function (c, i) {
            if (c.hidden) return;
            var last = c.getBoundingClientRect();
            var dx = first[i].left - last.left;
            var dy = first[i].top - last.top;
            if (!dx && !dy) return;
            c.animate(
                [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
                { duration: 420, easing: 'cubic-bezier(0.2,1,0.3,1)' }
            );
        });
    });
})();
