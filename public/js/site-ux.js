/**
 * Site-wide UX helpers: compact sticky header, open details a11y.
 */
(function () {
  var header = document.getElementById("site-header");
  if (header) {
    var compactAt = 48;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y > compactAt) header.classList.add("is-compact");
      else header.classList.remove("is-compact");
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mark body when sticky mobile CTA is present
  if (document.querySelector(".sticky-cta-mobile")) {
    document.body.classList.add("has-sticky-cta");
  }

  // Escape closes open "More" menu
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector(".nav-more[open]");
    if (open) open.removeAttribute("open");
  });
})();
