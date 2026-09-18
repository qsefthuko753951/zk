/* theme.js — 深色模式：默认日间 + 手动切换 + 平滑过渡（支持 View Transitions）
   2026-09-17：取消「跟随系统深色」。手机系统开启深色时首屏不再直接变黑，
   一律从日间开始，只有用户手动点过切换按钮才会进入夜间并记住选择。 */
(function () {
    'use strict';
    var root = document.documentElement;
    var KEY = 'zk-theme';
    /* 手机浏览器地址栏配色，与 tokens.css 中 --c-bg 保持一致 */
    var META_LIGHT = '#F1F1EB';
    var META_DARK = '#0C1122';

    function current() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function apply(next, evt) {
        var commit = function () {
            root.classList.add('theme-anim');
            root.setAttribute('data-theme', next);
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', next === 'dark' ? META_DARK : META_LIGHT);
            window.setTimeout(function () { root.classList.remove('theme-anim'); }, 560);
            window.dispatchEvent(new CustomEvent('zk:themechange', { detail: { theme: next } }));
        };

        // 浏览器支持 View Transitions 时，用圆形裁切从按钮位置扩散揭示新主题
        if (document.startViewTransition && evt && typeof evt.clientX === 'number') {
            var x = evt.clientX, y = evt.clientY;
            var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
            try {
                var vt = document.startViewTransition(commit);
                vt.ready.then(function () {
                    root.animate(
                        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
                        { duration: 560, easing: 'cubic-bezier(0.2,1,0.3,1)', pseudoElement: '::view-transition-new(root)' }
                    );
                }).catch(function () {});
                return;
            } catch (e) { /* 退化到普通切换 */ }
        }
        commit();
    }

    window.__toggleTheme = function (evt) {
        var next = current() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(KEY, next); } catch (e) {}
        apply(next, evt);
    };

    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.theme-toggle') : null;
        if (!btn) return;
        e.preventDefault();
        window.__toggleTheme(e);
    });

    /* 首屏归一：没有存储过的选择时明确写 light，杜绝任何系统深色残留 */
    if (!root.hasAttribute('data-theme')) root.setAttribute('data-theme', 'light');
})();
