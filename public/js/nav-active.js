/**
 * Highlight the nav tab for the page currently being viewed.
 * Opens the "More" menu if the active page lives there.
 */
(function () {
  var path = window.location.pathname || "/";
  if (path.length > 1 && path.charAt(path.length - 1) === "/") {
    path = path.slice(0, -1);
  }

  function isActive(href) {
    if (!href) return false;
    if (href === "/") return path === "/";
    if (href === "/field") return path === "/field" || path.indexOf("/field/") === 0;
    if (href === "/volunteer") return path === "/volunteer" || path.indexOf("/volunteer/") === 0;
    if (href === "/portal") return path === "/portal" || path.indexOf("/field") === 0 || path.indexOf("/team") === 0 || path.indexOf("/pulsar") === 0 || path.indexOf("/schedule") === 0;
    return path === href || path.indexOf(href + "/") === 0;
  }

  function markNav(root) {
    if (!root) return false;
    var moreOpen = false;
    var links = root.querySelectorAll("a[href]");
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
    return moreOpen;
  }

  var moreOpen = markNav(document.getElementById("primary-nav"));
  markNav(document.getElementById("mobile-nav"));

  var more = document.querySelector(".nav-more");
  if (more && moreOpen) more.setAttribute("open", "open");
})();
