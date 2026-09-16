/* games.js — 游戏页：坦克大战试玩舱（懒加载 iframe + 自适应缩放 + 全屏/重开/收起） */
(function () {
    'use strict';
    var stage = document.querySelector('.play-stage');
    var wrap = document.getElementById('frame-wrap');
    var scaler = document.getElementById('frame-scaler');
    var frame = document.getElementById('game-frame');
    var poster = document.getElementById('play-poster');
    if (!stage || !wrap || !scaler || !frame) return;

    var SRC = 'games/tank/index.html';
    var BASE = 880; // 游戏内部固定画布尺寸（832 + 外框留白）

    function fit() {
        var w = wrap.clientWidth || stage.clientWidth || window.innerWidth;
        var s = Math.min(1, w / BASE);
        if (document.fullscreenElement === wrap) s = Math.min(w / BASE, window.innerHeight / BASE);
        scaler.style.transform = 'scale(' + s + ')';
        if (document.fullscreenElement !== wrap) wrap.style.height = Math.round(BASE * s) + 'px';
    }

    window.startGame = function () {
        if (!frame.getAttribute('src')) frame.setAttribute('src', SRC);
        if (poster) poster.style.display = 'none';
        wrap.hidden = false;
        fit();
        stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    frame.addEventListener('load', function () {
        fit();
        if (frame.getAttribute('src')) { try { frame.contentWindow.focus(); } catch (e) {} }
    });

    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);

    var bFull = document.getElementById('game-full');
    if (bFull) bFull.addEventListener('click', function () {
        if (!frame.getAttribute('src')) window.startGame();
        if (wrap.requestFullscreen) wrap.requestFullscreen();
        else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
    });

    var bReload = document.getElementById('game-reload');
    if (bReload) bReload.addEventListener('click', function () {
        if (!frame.getAttribute('src')) { window.startGame(); return; }
        try { frame.contentWindow.location.reload(); }
        catch (e) { frame.setAttribute('src', SRC); }
    });

    var bClose = document.getElementById('game-close');
    if (bClose) bClose.addEventListener('click', function () {
        if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
        wrap.hidden = true;
        try { frame.contentWindow.location.replace('about:blank'); } catch (e) {}
        frame.removeAttribute('src');
        if (poster) poster.style.display = '';
        stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
})();
