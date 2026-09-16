/* smooth-scroll.js — 自定义惯性滚动：缓动跟随 + 章节磁吸吸附
   安全边界：仅桌面精确指针启用；触屏、prefers-reduced-motion、灯箱打开、Ctrl 缩放时一律走原生滚动
   自愈保护：若检测到"接管后页面实际没有移动"，自动卸载自身并恢复原生滚动 */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    // 手动开关：在浏览器控制台执行 localStorage.setItem('zk-smooth','off') 后刷新即可永久关闭
    var off = false;
    try { off = localStorage.getItem('zk-smooth') === 'off'; } catch (e) {}
    if (reduce || !fine || off) return;

    var EASE = 0.18;          // 缓动系数：越小越"重"（0.11 → 0.18，更跟手）
    var SNAP_RANGE = 130;     // 磁吸生效距离（px）
    var SNAP_DELAY = 190;     // 停止滚动多久后吸附
    var NAV_OFFSET = 60;      // 顶部导航高度补偿

    var target = window.scrollY;
    var current = target;
    var running = false;
    var snapTimer = null;
    var rafId = null;

    /* 我们自己写入的位置：用于区分"程序滚动"与"用户滚动"。
       （scroll 事件是异步派发的，单纯的布尔开关挡不住，必须比对数值） */
    var lastSet = -1;
    var disabled = false;

    /* 自愈看门狗 */
    var stuckFrames = 0;
    var lastWatchY = window.scrollY;

    function maxScroll() {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function clamp(v) { return Math.max(0, Math.min(maxScroll(), v)); }
    function blocked() {
        return !!document.querySelector('.lightbox.is-open');
    }

    /* 关键：用 behavior:'instant' 绕开 CSS 的 scroll-behavior: smooth，
       否则每帧 scrollTo 都会被当成一次平滑动画，层层叠加导致滚动卡死 */
    function apply(y) {
        lastSet = y;
        try {
            window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        } catch (err) {
            window.scrollTo(0, y); // 老浏览器不支持字典参数
        }
        if (Math.abs(window.scrollY - y) > 2) {
            // 位置没跟上（可能被其它样式限制），交给看门狗判断是否放弃接管
            return false;
        }
        return true;
    }

    function selfDisable() {
        if (disabled) return;
        disabled = true;
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('wheel', onWheel, { passive: false });
        if (window.console && console.warn) {
            console.warn('[smooth-scroll] 检测到页面未能正常滚动，已恢复浏览器原生滚动。');
        }
    }

    function loop() {
        if (disabled) return;
        var diff = target - current;

        if (Math.abs(diff) < 0.4) {
            current = target;
            apply(current);
            running = false;
            rafId = null;
            stuckFrames = 0;
            return;
        }

        current += diff * EASE;
        apply(current);

        // 看门狗：连续多帧"想动却没动"就放弃接管
        if (Math.abs(window.scrollY - lastWatchY) < 1) {
            stuckFrames++;
            if (stuckFrames > 45) { selfDisable(); return; }
        } else {
            stuckFrames = 0;
            lastWatchY = window.scrollY;
        }

        rafId = requestAnimationFrame(loop);
    }
    function start() {
        if (disabled || running) return;
        running = true;
        rafId = requestAnimationFrame(loop);
    }

    function onWheel(e) {
        if (disabled) return;
        if (e.ctrlKey || blocked()) return;                 // 缩放 / 灯箱打开时让位
        if (e.target && e.target.closest && e.target.closest('[data-native-scroll]')) return;
        e.preventDefault();
        target = clamp(target + e.deltaY);
        start();
        scheduleSnap();
    }
    window.addEventListener('wheel', onWheel, { passive: false });

    /* 键盘 / 拖动滚动条 / 锚点跳转：同步内部状态，避免打架。
       只接受"不是我们自己写入"的位置变化。 */
    window.addEventListener('scroll', function () {
        if (disabled) return;
        var y = window.scrollY;
        if (lastSet >= 0 && Math.abs(y - lastSet) <= 2) return;  // 自己触发的，忽略
        current = target = y;                                    // 用户触发的，同步
    }, { passive: true });

    window.addEventListener('resize', function () {
        target = clamp(target);
        current = window.scrollY;
    });

    /* 磁吸吸附：滚动停止后，若最近的章节边界在阈值内则缓缓吸附过去 */
    function scheduleSnap() {
        clearTimeout(snapTimer);
        snapTimer = setTimeout(function () {
            if (disabled || blocked()) return;
            var nodes = document.querySelectorAll('[data-snap]');
            if (!nodes.length) return;
            var best = null, bestDist = Infinity;
            for (var i = 0; i < nodes.length; i++) {
                var top = nodes[i].getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
                var d = Math.abs(top - current);
                if (d < bestDist) { bestDist = d; best = top; }
            }
            if (best !== null && bestDist <= SNAP_RANGE) {
                target = clamp(best);
                start();
            }
        }, SNAP_DELAY);
    }
})();
