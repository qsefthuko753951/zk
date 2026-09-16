/* site.js — 全站共享：导航、滚动进度、入场揭示、技能条、WebP 切换、视频懒加载 */
(function () {
    'use strict';

    /* ---------- 移动端导航 ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') { links.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
        });
    }

    /* ---------- 滚动进度条 ---------- */
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    function onScroll() {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ---------- 入场揭示（含墨迹扩散遮罩） ---------- */
    var revealables = document.querySelectorAll('.reveal, .ink-reveal');
    if ('IntersectionObserver' in window && revealables.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
        revealables.forEach(function (el) { io.observe(el); });
    } else {
        revealables.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---------- 技能条填充 ---------- */
    var bars = document.querySelectorAll('.bar > i[data-value]');
    if (bars.length && 'IntersectionObserver' in window) {
        var bio = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.style.width = Math.max(0, Math.min(100, parseFloat(en.target.dataset.value) || 0)) + '%';
                bio.unobserve(en.target);
            });
        }, { threshold: 0.4 });
        bars.forEach(function (b) { bio.observe(b); });
    }

    /* ---------- WebP 兜底（2026-09-16：图片已全部改为 WebP 直引用，此段仅作兼容）
       若某张图仍写着 data-webp，则探测成功后再切换，失败保持原图不裂。 ---------- */
    if (window.SITE_CONFIG && window.SITE_CONFIG.webp) {
        document.querySelectorAll('img[data-webp]').forEach(function (img) {
            var w = img.getAttribute('data-webp');
            if (!w || img.getAttribute('src') === w) return;
            var test = new Image();
            test.onload = function () { img.src = w; };
            test.onerror = function () { /* 缺失则保持原图 */ };
            test.src = w;
        });
    }

    /* ---------- 视频：点击封面才加载（移动端省流量） ---------- */
    var video = document.getElementById('media-video');
    var cover = document.getElementById('media-video-cover');
    if (video && cover) {
        var src = video.getAttribute('data-src');
        var loaded = false;
        function play() {
            if (!loaded && src) { video.preload = 'auto'; video.src = src; loaded = true; }
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
        }
        cover.addEventListener('click', play);
        cover.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
        });
        video.addEventListener('play', function () { cover.classList.add('is-hidden'); });
        video.addEventListener('pause', function () { cover.classList.remove('is-hidden'); });
        video.addEventListener('ended', function () { cover.classList.remove('is-hidden'); });
    }

    /* ---------- 页脚年份 ---------- */
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
})();
