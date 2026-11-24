/* 标记脚本可用：.reveal 的隐藏样式挂在 html.js 上，
   脚本加载失败时内容照常可见，不会出现空白页。 */
document.documentElement.classList.add('js');

/* ── 动态版本 ──
   data-href 指向 GitHub releases/latest，永久有效；
   latest.json 拉取成功后替换为 CDN 直链（更快），失败则保留兜底链接。
   刻意不再写死某个版本号：写死会导致 CDN 抖动时把旧包推给用户。 */
(function () {
    var btn = document.getElementById('btn-download');
    var span = document.getElementById('apk-version');
    var confirmBtn = document.getElementById('dl-confirm');
    if (!btn || !span) return;

    function withFrom(url) {
        if (!url) return url;
        return url + (url.indexOf('?') === -1 ? '?' : '&') + 'from=landing';
    }

    var fallUrl = btn.getAttribute('data-href');
    if (fallUrl) {
        var withParam = withFrom(fallUrl);
        btn.setAttribute('data-href', withParam);
        if (confirmBtn) confirmBtn.href = withParam;
    }
    span.textContent = '最新版';

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 5000);

    fetch('https://course-cdn.njust.store/latest.json', {
        signal: controller.signal,
        cache: 'no-cache'
    })
        .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        })
        .then(function (data) {
            clearTimeout(timeout);
            if (data.download_url && data.version) {
                var u = withFrom(data.download_url);
                btn.setAttribute('data-href', u);
                if (confirmBtn) confirmBtn.href = u;
                span.textContent = data.version;
            }
        })
        .catch(function () {
            clearTimeout(timeout);
            /* 保留「最新版」文案与 GitHub 兜底链接，静默失败 */
        });
})();

/* ── 下载确认弹窗 ── */
(function () {
    var modal = document.getElementById('dl-modal');
    var trigger = document.getElementById('btn-download');
    var confirmBtn = document.getElementById('dl-confirm');
    var cancel = document.getElementById('dl-cancel');
    if (!modal || !trigger || !confirmBtn || !cancel) return;

    var fillTimer = null;
    var lastFocus = null;

    function focusables() {
        return modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
    }

    function open() {
        var url = trigger.getAttribute('data-href');
        if (url) confirmBtn.href = url;

        lastFocus = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        confirmBtn.classList.add('is-waiting');
        var countdown = 3;
        confirmBtn.textContent = '确认下载 (' + countdown + 's)';
        fillTimer = setInterval(function () {
            countdown--;
            if (countdown <= 0) {
                clearInterval(fillTimer);
                confirmBtn.classList.remove('is-waiting');
                confirmBtn.textContent = '确认下载';
            } else {
                confirmBtn.textContent = '确认下载 (' + countdown + 's)';
            }
        }, 1000);

        /* 默认焦点落在「取消」，避免回车直接触发下载 */
        cancel.focus();
    }

    function shut() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        clearInterval(fillTimer);
        confirmBtn.classList.add('is-waiting');
        confirmBtn.textContent = '确认下载';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    trigger.addEventListener('click', open);
    cancel.addEventListener('click', shut);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) shut();
    });

    /* 焦点陷阱：Tab 在对话框内循环 */
    modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var f = focusables();
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) shut();
    });
})();

/* ── iOS 说明气泡 ── */
(function () {
    var tip = document.getElementById('ios-help');
    var pop = document.getElementById('ios-help-popover');
    if (!tip || !pop) return;

    function show() {
        pop.style.display = 'block';
        var pw = pop.offsetWidth;
        pop.style.display = '';

        var rect = tip.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var minX = pw / 2 + 8;
        var maxX = window.innerWidth - pw / 2 - 8;
        cx = Math.max(minX, Math.min(cx, maxX));

        pop.style.left = cx + 'px';
        pop.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        pop.classList.add('show');
        tip.setAttribute('aria-expanded', 'true');
    }

    function hide() {
        pop.classList.remove('show');
        tip.setAttribute('aria-expanded', 'false');
    }

    tip.addEventListener('click', function (e) {
        e.stopPropagation();
        if (pop.classList.contains('show')) hide();
        else show();
    });

    document.addEventListener('click', hide);
    window.addEventListener('resize', hide);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hide();
    });
})();

/* ── 截图轮播 ── */
(function () {
    var track = document.getElementById('showcase-track');
    if (!track) return;

    var items = track.querySelectorAll('.mockup-item');
    var total = items.length;
    if (total < 2) return;

    var dotsWrap = document.getElementById('showcase-dots');
    var dots = dotsWrap ? dotsWrap.querySelectorAll('button') : [];
    var index = 0;
    var startX = 0;
    var movedX = 0;
    var dragging = false;

    function slideWidth() {
        return items[0].getBoundingClientRect().width || 1;
    }

    function setActive(i) {
        for (var k = 0; k < dots.length; k++) {
            if (k === i) dots[k].setAttribute('aria-current', 'true');
            else dots[k].removeAttribute('aria-current');
        }
    }

    function goTo(i, animate) {
        index = Math.max(0, Math.min(i, total - 1));
        if (animate === false) track.style.transition = 'none';
        track.style.transform = 'translateX(' + (-index * slideWidth()) + 'px)';
        if (animate === false) {
            void track.offsetWidth; /* 强制回流，避免无过渡地连跳 */
            track.style.transition = '';
        }
        setActive(index);
    }

    for (var d = 0; d < dots.length; d++) {
        (function (btn) {
            btn.addEventListener('click', function () {
                goTo(parseInt(btn.dataset.index, 10));
            });
        })(dots[d]);
    }

    /* ── 触摸拖动：跟手位移，松手吸附 ── */
    track.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        movedX = 0;
        dragging = true;
        track.style.transition = 'none';
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
        if (!dragging) return;
        var dx = e.touches[0].clientX - startX;
        movedX = dx;

        /* 首尾越界时加阻尼，给出「到头了」的手感 */
        if ((index === 0 && dx > 0) || (index === total - 1 && dx < 0)) {
            dx *= 0.32;
        }
        track.style.transform = 'translateX(' + (-index * slideWidth() + dx) + 'px)';
    }, { passive: true });

    track.addEventListener('touchend', function () {
        if (!dragging) return;
        dragging = false;
        track.style.transition = '';

        var threshold = slideWidth() * 0.22;
        if (movedX < -threshold) goTo(index + 1);
        else if (movedX > threshold) goTo(index - 1);
        else goTo(index);

        movedX = 0;
    });

    track.addEventListener('touchcancel', function () {
        dragging = false;
        track.style.transition = '';
        goTo(index);
    });

    /* 断点切换：桌面变 grid，重置位移 */
    var mq = window.matchMedia('(min-width: 1100px)');
    function onModeChange() {
        track.style.transform = '';
        index = 0;
        setActive(0);
    }
    if (mq.addEventListener) mq.addEventListener('change', onModeChange);
    else if (mq.addListener) mq.addListener(onModeChange);

    /* 窗口尺寸变化时校正当前位移 */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { goTo(index, false); }, 150);
    });
})();

/* ── 滚动显现 ── */
(function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    function showAll() {
        for (var i = 0; i < els.length; i++) els[i].classList.add('in');
    }

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
        showAll();
        return;
    }

    var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                entries[i].target.classList.add('in');
                io.unobserve(entries[i].target);
            }
        }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    for (var i = 0; i < els.length; i++) io.observe(els[i]);
})();

/* ── 图片灯箱（Viewer.js）：支持滚轮 / 按钮 / 双击缩放与拖动 ── */
(function () {
    if (typeof Viewer === 'undefined') return;

    /* srcset 生效时 img.src 是压缩后的图，灯箱要取 data-full 上的原图 */
    function sourceOf(img) {
        return img.getAttribute('data-full') || img.currentSrc || img.src;
    }

    var options = {
        url: sourceOf,
        zIndex: 10000,
        navbar: true,
        title: false,
        tooltip: false,
        movable: true,
        zoomable: true,
        zoomOnWheel: true,
        zoomOnTouch: true,
        toggleOnDblclick: true,
        slideOnTouch: true,
        keyboard: true,
        zoomRatio: 0.4,
        minZoomRatio: 0.2,
        maxZoomRatio: 8,
        toolbar: {
            zoomIn: 1,
            zoomOut: 1,
            oneToOne: 1,
            reset: 1,
            prev: 1,
            next: 1,
            play: 0,
            rotateLeft: 0,
            rotateRight: 0,
            flipHorizontal: 0,
            flipVertical: 0
        }
    };

    ['showcase-track', 'guide-gallery'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var imgs = el.querySelectorAll('img');
        if (!imgs.length) return;

        var viewer = new Viewer(el, options);

        /* 显式接管点击：阻止 <a> 直接跳转，确保稳定唤起灯箱 */
        Array.prototype.forEach.call(imgs, function (img, i) {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function (e) {
                e.preventDefault();
                viewer.view(i);
            });
        });
    });

    /* 下载弹窗内的校历：隐藏缩略图 + 点击文字唤起灯箱 */
    var modalCard = document.querySelector('.dl-modal-card');
    var modalLink = document.getElementById('modal-calendar');
    var modal = document.getElementById('dl-modal');
    if (modalCard && modalLink && modalCard.querySelector('img')) {
        var modalViewer = new Viewer(modalCard, {
            url: sourceOf,
            zIndex: 10000,
            hidden: function () {
                /* 关闭灯箱后恢复下载弹窗 */
                if (modal) modal.classList.add('open');
            },
            navbar: false,
            title: false,
            tooltip: false,
            movable: true,
            zoomable: true,
            zoomOnWheel: true,
            zoomOnTouch: true,
            toggleOnDblclick: true,
            keyboard: true,
            zoomRatio: 0.4,
            minZoomRatio: 0.2,
            maxZoomRatio: 8,
            toolbar: {
                zoomIn: 1,
                zoomOut: 1,
                oneToOne: 1,
                reset: 1,
                prev: 0,
                next: 0,
                play: 0,
                rotateLeft: 0,
                rotateRight: 0,
                flipHorizontal: 0,
                flipVertical: 0
            }
        });
        modalLink.addEventListener('click', function (e) {
            e.preventDefault();
            /* 先收起下载弹窗，避免遮挡灯箱 */
            if (modal) modal.classList.remove('open');
            modalViewer.view(0);
        });
    }
})();
