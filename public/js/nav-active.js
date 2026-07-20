/**
 * Highlight the nav tab for the page currently being viewed.
 * Opens the "More" menu if the active page lives there.
 */
(function () {
  var nav = document.getElementById("primary-nav");
  if (!nav) return;

  var path = window.location.pathname || "/";
  if (path.length > 1 && path.charAt(path.length - 1) === "/") {
    path = path.slice(0, -1);
  }

  function isActive(href) {
    if (!href) return false;
    if (href === "/") return path === "/";
    if (href === "/field") return path === "/field" || path.indexOf("/field/") === 0;
    if (href === "/volunteer") return path === "/volunteer" || path.indexOf("/volunteer/") === 0;
    if (href === "/pulsar") return path === "/pulsar" || path.indexOf("/pulsar/") === 0;
    return path === href || path.indexOf(href + "/") === 0;
  }

  var links = nav.querySelectorAll("a[href]");
  var moreOpen = false;
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) !== "/") continue;

    var on = isActive(href);
    if (on) {
      a.classList.add("nav-active");
      a.setAttribute("aria-current", "page");
      if (a.closest && a.closest(".nav-more")) moreOpen = true;
    } else {
      a.classList.remove("nav-active");
      a.removeAttribute("aria-current");
    }
  }

  var more = nav.querySelector(".nav-more");
  if (more && moreOpen) more.setAttribute("open", "open");

  // Close More menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!more || !more.hasAttribute("open")) return;
    if (!more.contains(e.target)) more.removeAttribute("open");
  });
})();
