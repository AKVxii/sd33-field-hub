/**
 * Site shell: mobile nav (focus trap, Esc, body lock), header scroll state.
 */
(function () {
  var header = document.getElementById("site-header");
  var toggle = document.getElementById("nav-toggle");
  var drawer = document.getElementById("mobile-nav");
  var panel = document.getElementById("mobile-nav-panel");
  var closeBtn = document.getElementById("nav-close");
  var lastFocus = null;

  function setHeaderScroll() {
    if (!header) return;
    if ((window.scrollY || 0) > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  setHeaderScroll();
  window.addEventListener("scroll", setHeaderScroll, { passive: true });

  if (!toggle || !drawer || !panel) return;

  function focusable() {
    return panel.querySelectorAll(
      'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
    );
  }

  function openNav() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    drawer.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("nav-open");
    var items = focusable();
    if (items.length) items[0].focus();
  }

  function closeNav() {
    drawer.classList.remove("is-open");
    drawer.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isOpen() {
    return drawer.classList.contains("is-open");
  }

  toggle.addEventListener("click", function () {
    if (isOpen()) closeNav();
    else openNav();
  });
  if (closeBtn) closeBtn.addEventListener("click", closeNav);

  drawer.addEventListener("click", function (e) {
    if (e.target === drawer) closeNav();
  });

  panel.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (a) closeNav();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (isOpen()) {
        e.preventDefault();
        closeNav();
      }
      var more = document.querySelector(".nav-more[open]");
      if (more) more.removeAttribute("open");
      return;
    }
    if (e.key !== "Tab" || !isOpen()) return;
    var items = Array.prototype.slice.call(focusable());
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Close More menu on outside click
  document.addEventListener("click", function (e) {
    var more = document.querySelector(".nav-more[open]");
    if (!more) return;
    if (!more.contains(e.target)) more.removeAttribute("open");
  });

  if (document.querySelector(".mobile-sticky-cta")) {
    document.body.classList.add("has-mobile-cta");
  }
})();
