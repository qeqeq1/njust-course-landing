/* ── 动态版本 ── */
(function () {
    var btn     = document.getElementById('btn-download');
    var span    = document.getElementById('apk-version');
    var confirm = document.getElementById('dl-confirm');
    var fallUrl = btn.getAttribute('data-href');
    var fallVer = 'v1.1.3';

    function apply(url, ver) {
        var u = url + (url.indexOf('?') === -1 ? '?from=landing' : '&from=landing');
        btn.setAttribute('data-href', u);
        confirm.href = u;
        span.textContent = ver;
    }

    fetch('https://course-cdn.njust.store/latest.json')
        .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        })
        .then(function (data) {
            if (data.download_url && data.version) {
                apply(data.download_url, data.version);
                return;
            }
            throw new Error('invalid');
        })
        .catch(function () {
            apply(fallUrl, fallVer);
        });
})();

/* ── 下载确认弹窗 ── */
(function () {
    var modal   = document.getElementById('dl-modal');
    var trigger = document.getElementById('btn-download');
    var confirm = document.getElementById('dl-confirm');
    var cancel  = document.getElementById('dl-cancel');

    var fillTimer = null;

    var countdown = 0;

    trigger.addEventListener('click', function () {
        var url = trigger.getAttribute('data-href') || confirm.href;
        confirm.href = url;
        confirm.classList.add('is-waiting');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        countdown = 3;
        confirm.textContent = '确认下载 (' + countdown + 's)';
        fillTimer = setInterval(function () {
            countdown--;
            if (countdown <= 0) {
                clearInterval(fillTimer);
                confirm.classList.remove('is-waiting');
                confirm.textContent = '确认下载';
            } else {
                confirm.textContent = '确认下载 (' + countdown + 's)';
            }
        }, 1000);
    });

    function shut() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        clearInterval(fillTimer);
        confirm.classList.add('is-waiting');
        confirm.textContent = '确认下载';
    }

    cancel.addEventListener('click', shut);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) shut();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) shut();
    });
})();

/* ── Lightbox ── */
(function () {
    var lb    = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightbox-img');
    var close = document.getElementById('lightbox-close');

    function open(src) {
        lbImg.src = src;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function shut() {
        lb.classList.remove('open');
        document.body.style.overflow = '';
    }
    close.addEventListener('click', shut);
    lb.addEventListener('click', function (e) {
        if (e.target === lb) shut();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lb.classList.contains('open')) shut();
    });

    document.querySelectorAll('.mockup-frame img, .phone-ph img, .lightbox-trigger').forEach(function (el) {
        el.addEventListener('click', function (e) {
            if (el.tagName === 'IMG') { open(el.src); }
            else { e.preventDefault(); open(el.getAttribute('data-lightbox') || el.href); }
        });
    });

    /* ── iOS help tooltip ── */
    (function () {
        var tip = document.getElementById('ios-help');
        var pop = document.getElementById('ios-help-popover');
        if (!tip || !pop) return;
        tip.addEventListener('click', function (e) {
            e.stopPropagation();
            var rect = tip.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            pop.style.left = cx + 'px';
            pop.style.bottom = (window.innerHeight - rect.top + 8) + 'px';

            /* keep within viewport */
            pop.style.display = 'block';
            var pw = pop.offsetWidth;
            pop.style.display = '';
            var minX = pw / 2 + 8;
            var maxX = window.innerWidth - pw / 2 - 8;
            if (cx < minX) pop.style.left = minX + 'px';
            else if (cx > maxX) pop.style.left = maxX + 'px';

            pop.classList.toggle('show');
        });
        document.addEventListener('click', function () {
            pop.classList.remove('show');
        });
        window.addEventListener('resize', function () {
            pop.classList.remove('show');
        });
    })();
})();

/* ── Carousel ── */
(function () {
    var track   = document.getElementById('showcase-track');
    var dots    = document.querySelectorAll('#showcase-dots button');
    var items   = track.querySelectorAll('.mockup-item');
    var total   = items.length;
    var index   = 0;
    var startX  = 0;
    var movedX  = 0;
    var dragging = false;

    function slideWidth() {
        return items[0].offsetWidth; /* gap is 0 */
    }

    function goTo(i) {
        index = Math.max(0, Math.min(i, total - 1));
        track.style.transform = 'translateX(' + (-index * slideWidth()) + 'px)';
        dots.forEach(function (d, j) {
            d.classList.toggle('active', j === index);
        });
    }

    dots.forEach(function (d) {
        d.addEventListener('click', function () { goTo(parseInt(d.dataset.index)); });
    });

    /* ── Touch swipe ── */
    track.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        dragging = true;
        track.style.transition = 'none';
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
        if (!dragging) return;
        movedX = e.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener('touchend', function () {
        if (!dragging) return;
        dragging = false;
        track.style.transition = '';
        var threshold = slideWidth() * 0.25;
        if (movedX < -threshold) { goTo(index + 1); }
        else if (movedX > threshold) { goTo(index - 1); }
        else { goTo(index); }
        movedX = 0;
    });

    var mq = window.matchMedia('(min-width: 1100px)');
    mq.addEventListener('change', function () {
        track.style.transform = '';
        index = 0;
        dots.forEach(function (d, j) { d.classList.toggle('active', j === 0); });
    });
})();
