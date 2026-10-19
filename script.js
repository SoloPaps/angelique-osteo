// ============================================================
// UTILITAIRES localStorage
// ============================================================
function lsGet(key) {
  try { return localStorage.getItem(key); } catch(e) { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch(e) {}
}

// ============================================================
// CHARGEMENT DES SCRIPTS TIERS (centralisé)
// ============================================================
function loadConsentScripts() {
  if (!document.querySelector('script[src*="emailjs"]')) {
    var s1 = document.createElement('script');
    s1.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s1.onload = function() { if (typeof initEmailJS === 'function') initEmailJS(); };
    document.head.appendChild(s1);
  }
  if (!document.querySelector('script[src*="recaptcha"]')) {
    var s2 = document.createElement('script');
    s2.src = 'https://www.google.com/recaptcha/api.js?render=6Ldup4osAAAAACCUSh7PHbTCISNPjY-ABHnM6h1H';
    s2.async = true;
    document.head.appendChild(s2);
  }
}

// ============================================================
// IFRAMES TIERCES
// ============================================================
function loadThirdPartyContent() {
  document.querySelectorAll('iframe.requires-cookies').forEach(function(iframe) {
    var dataSrc = iframe.getAttribute('data-src');
    if (!dataSrc) return;
    iframe.src = dataSrc;
    var ph = iframe.nextElementSibling;
    if (ph && ph.classList.contains('cookie-placeholder')) ph.style.display = 'none';
  });
}

// ============================================================
// GESTION DES COOKIES
// ============================================================
var cookieReturnFocus = null;

function cookieFocusables(banner) {
  return Array.prototype.slice.call(
    banner.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
  );
}

function setPageInert(on) {
  var banner = document.getElementById('cookie-banner');
  Array.prototype.forEach.call(document.body.children, function(el) {
    if (el === banner) return;
    if (on) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  });
}

function hideCookieBanner() {
  var banner = document.getElementById('cookie-banner');
  if (banner) banner.style.display = 'none';
  setPageInert(false);
  var back = cookieReturnFocus;
  cookieReturnFocus = null;
  if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
}

function showCookieBanner(returnEl) {
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;
  cookieReturnFocus = returnEl || null;
  banner.style.display = 'flex';
  setPageInert(true);
  var accept = document.getElementById('btn-accept-cookies');
  var target = accept || cookieFocusables(banner)[0];
  if (target) target.focus({ preventScroll: true });
}

function acceptCookies() {
  lsSet('cookie_consent', 'accepted');
  hideCookieBanner();
  loadThirdPartyContent();
  loadConsentScripts();
}

function refuseCookies() {
  lsSet('cookie_consent', 'refused');
  hideCookieBanner();
}

function initCookies() {
  var consent = lsGet('cookie_consent');
  var banner = document.getElementById('cookie-banner');
  if (consent === 'accepted') {
    if (banner) banner.style.display = 'none';
    loadThirdPartyContent();
    loadConsentScripts();
  } else if (consent === 'refused') {
    if (banner) banner.style.display = 'none';
  } else if (banner) {
    showCookieBanner(null);
  }
}

window.openCookieDialog = showCookieBanner;

// ============================================================
// ANNÉE COPYRIGHT
// ============================================================
(function() {
  var el = document.getElementById('copyright-year');
  if (el) el.textContent = new Date().getFullYear();
})();

// ============================================================
// MARQUEE
// Les lectures de géométrie sont groupées avant les écritures
// de style, et l'animation ne démarre qu'après le premier
// affichage pour ne pas forcer un reflow pendant le LCP.
// ============================================================
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var track = document.getElementById('marqueeTrack');
  var outer = document.getElementById('marqueeOuter');
  if (!track || !outer) return;

  var clone = track.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('id');

  var pos = 0;
  var trackWidth = 0;
  var started = false;
  var mobileQuery = window.matchMedia('(max-width: 767px)');

  function isMobile() { return mobileQuery.matches; }

  function measure() {
    return {
      width: track.scrollWidth + 16,
      height: track.offsetHeight + 20
    };
  }

  function applyLayout(metrics) {
    outer.style.position = 'relative';
    outer.style.height = metrics.height + 'px';
    track.style.position = 'absolute';
    track.style.top = '0';
    track.style.left = '0';
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    if (!clone.parentNode) outer.appendChild(clone);
    trackWidth = metrics.width;
  }

  function refreshWidth() {
    var metrics = measure();
    outer.style.height = metrics.height + 'px';
    trackWidth = metrics.width;
  }

  var normalSpeed = isMobile() ? 0.22 : 0.5;
  var slowSpeed   = isMobile() ? 0.08 : 0.18;
  var currentSpeed = normalSpeed, targetSpeed = normalSpeed;

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      normalSpeed = isMobile() ? 0.22 : 0.5;
      slowSpeed   = isMobile() ? 0.08 : 0.18;
      targetSpeed = normalSpeed;
      if (started) refreshWidth();
    }, 100);
  });

  outer.addEventListener('mouseenter', function() { targetSpeed = slowSpeed; });
  outer.addEventListener('mouseleave', function() { targetSpeed = normalSpeed; });
  outer.addEventListener('focusin',    function() { targetSpeed = 0; });
  outer.addEventListener('focusout',   function() { targetSpeed = normalSpeed; });

  var raf;
  function tick() {
    if (trackWidth === 0) { raf = requestAnimationFrame(tick); return; }
    currentSpeed += (targetSpeed - currentSpeed) * 0.04;
    pos += currentSpeed;
    if (pos >= trackWidth) { pos -= trackWidth; }
    track.style.transform = 'translateX(-' + pos + 'px)';
    clone.style.transform = 'translateX(' + (trackWidth - pos) + 'px)';
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (started) return;
    started = true;
    requestAnimationFrame(function() {
      applyLayout(measure());
      raf = requestAnimationFrame(tick);
    });
  }

  document.addEventListener('visibilitychange', function() {
    if (!started) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(tick);
  });

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();

// ============================================================
// SCHEMA.ORG — Mise à jour depuis Firebase (filtre côté client)
// ============================================================
window.addEventListener('load', function() {
  var schemaEl = document.getElementById('schema-medical-business');
  if (!schemaEl) return;
  fetch('https://angelique-osteo-default-rtdb.europe-west1.firebasedatabase.app/reviews.json')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || typeof data !== 'object') return;
      var reviews = Object.values(data).filter(function(r) { return r && r.approved === true; });
      if (!reviews.length) return;
      var count = reviews.length;
      var avg = (reviews.reduce(function(s, r) { return s + (Number(r.rating) || 5); }, 0) / count).toFixed(1);
      try {
        var schema = JSON.parse(schemaEl.textContent);
        if (schema.aggregateRating) {
          schema.aggregateRating.ratingValue = avg;
          schema.aggregateRating.reviewCount = String(count);
          schemaEl.textContent = JSON.stringify(schema);
        }
      } catch(e) {}
    })
    .catch(function() {});
});


// ============================================================
// DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

  // Init cookies
  initCookies();

  // Boutons cookies
  var btnAccept = document.getElementById('btn-accept-cookies');
  var btnRefuse = document.getElementById('btn-refuse-cookies');
  if (btnAccept) btnAccept.addEventListener('click', function(e) { e.preventDefault(); acceptCookies(); });
  if (btnRefuse) btnRefuse.addEventListener('click', function(e) { e.preventDefault(); refuseCookies(); });

  var manageCookies = document.getElementById('manage-cookies');
  if (manageCookies) {
    manageCookies.addEventListener('click', function(e) {
      e.preventDefault();
      showCookieBanner(manageCookies);
    });
  }

  document.addEventListener('keydown', function(e) {
    var banner = document.getElementById('cookie-banner');
    if (!banner || banner.style.display === 'none' || e.key !== 'Tab') return;
    var items = cookieFocusables(banner);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (!banner.contains(document.activeElement)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Menu hamburger
  var hamburger = document.querySelector('.hamburger');
  var navLinks  = document.querySelector('.navbar-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      var isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Carousel
  // FIX forced reflow : offsetWidth lu une seule fois avant les changements de style
  var track = document.querySelector('.carousel-track');
  if (track) {
    var btnNext  = document.querySelector('.next');
    var btnPrev  = document.querySelector('.prev');
    var isMoving = false;
    track.style.willChange = 'transform';

    function getItems() { return Array.from(track.children); }
    function setClass(el, cls) { el.className = cls; }
    function updateClasses() {
      getItems().forEach(function(el, i) { setClass(el, i === 1 ? 'center' : 'side'); });
    }

    function move(dir) {
      if (isMoving) return;
      isMoving = true;
      var items = getItems();
      var gap   = parseInt(getComputedStyle(track).gap) || 8;
      // FIX : on lit offsetWidth UNE FOIS ici, avant toute modification de style
      var dist  = items[0].offsetWidth + gap;

      // Maintenant on modifie les styles — plus de reflow jusqu'au prochain paint
      track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      track.style.transform  = 'translateX(' + (dir === 1 ? -dist : dist) + 'px)';

      if (dir === 1) {
        if (items[2]) setClass(items[2], 'center');
        setClass(items[1], 'side');
        setClass(items[0], 'side');
      } else {
        setClass(items[0], 'center');
        setClass(items[1], 'side');
        if (items[2]) setClass(items[2], 'side');
      }
      setTimeout(function() {
        track.style.transition = 'none';
        track.style.transform  = 'translateX(0)';
        if (dir === 1) track.appendChild(items[0]);
        else track.prepend(items[items.length - 1]);
        updateClasses();
        isMoving = false;
      }, 500);
    }

    if (btnNext && btnPrev) {
      btnNext.addEventListener('click', function() { move(1); });
      btnPrev.addEventListener('click', function() { move(-1); });
    }
    var touchStartX = 0;
    track.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function(e) {
      var diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) move(diff < 0 ? 1 : -1);
    }, { passive: true });
  }

  // FAQ
  var faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length) {
    faqItems.forEach(function(item) {
      var summary = item.querySelector('.faq-question');
      if (!summary) return;
      [item, summary].forEach(function(el) {
        el.addEventListener('click', function(e) {
          if (e.currentTarget === item && e.target.closest('.faq-question')) return;
          e.preventDefault();
          var isOpen = item.hasAttribute('open');
          faqItems.forEach(function(other) { other.removeAttribute('open'); });
          if (!isOpen) item.setAttribute('open', '');
        });
      });
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.faq-item')) {
        faqItems.forEach(function(item) { item.removeAttribute('open'); });
      }
    });
  }

  // Animations au scroll
  var isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) { el.classList.add('visible'); });
  } else {
    var scrollObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: isMobile ? 0.08 : 0.15 });
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
      scrollObserver.observe(el);
    });
  }

  // Filtres catégories
  var tabs   = document.querySelectorAll('.filter-tab');
  var groups = document.querySelectorAll('.category-group');
  var panel  = document.getElementById('formations-panel');
  if (tabs.length && groups.length) {
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var filter = tab.getAttribute('data-filter');
        tabs.forEach(function(t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        if (panel && tab.id) panel.setAttribute('aria-labelledby', tab.id + ' formations-titre');
        groups.forEach(function(group) {
          group.classList.toggle('hidden', filter !== 'all' && group.getAttribute('data-category') !== filter);
        });
      });
    });
  }

  // Bouton flottant d'aide
  var helpBtn        = document.getElementById('helpBtn');
  var floatingActions = document.getElementById('floating-actions');
  var overlay        = document.getElementById('page-blur-overlay');
  function openHelper() {
    floatingActions.classList.add('open');
    if (overlay) overlay.classList.add('active');
    var span = helpBtn.querySelector('[aria-hidden]');
    if (span) span.textContent = '×';
    helpBtn.setAttribute('aria-expanded', 'true');
  }
  function closeHelper() {
    floatingActions.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    var span = helpBtn.querySelector('[aria-hidden]');
    if (span) span.textContent = '?';
    helpBtn.setAttribute('aria-expanded', 'false');
  }
  if (helpBtn && floatingActions) {
    helpBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      floatingActions.classList.contains('open') ? closeHelper() : openHelper();
    });
    if (overlay) overlay.addEventListener('click', closeHelper);
    document.addEventListener('click', function(e) {
      if (
        !helpBtn.contains(e.target) &&
        !floatingActions.contains(e.target)
      ) {
        closeHelper();
      }
    });
  }

});