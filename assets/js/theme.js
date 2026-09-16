/* theme.js — 深色模式：系统跟随 + 手动切换 + 平滑过渡（支持 View Transitions） */
(function () {
    'use strict';
    var root = document.documentElement;
    var KEY = 'zk-theme';

    function systemIsDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function current() {
        var t = root.getAttribute('data-theme');
        if (t === 'dark' || t === 'light') return t;
        return systemIsDark() ? 'dark' : 'light';
    }

    function apply(next, evt) {
        var commit = function () {
            root.classList.add('theme-anim');
            root.setAttribute('data-theme', next);
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

    // 用户未手动锁定时，跟随系统主题变化
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function () {
            if (root.hasAttribute('data-theme')) return;
            root.classList.add('theme-anim');
            window.setTimeout(function () { root.classList.remove('theme-anim'); }, 560);
        };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
    }
})();
