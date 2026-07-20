/**
 * Highlight the nav tab for the page currently being viewed.
 * Runs in the browser so it always matches the URL (even if HTML cache is stale).
 */
(function () {
  var nav = document.getElementById("primary-nav");
  if (!nav) return;

  var path = window.location.pathname || "/";
  // strip trailing slash except root
  if (path.length > 1 && path.charAt(path.length - 1) === "/") {
    path = path.slice(0, -1);
  }

  function isActive(href) {
    if (!href) return false;
    if (href === "/") return path === "/";
    if (href === "/field") return path === "/field" || path.indexOf("/field/") === 0;
    return path === href || path.indexOf(href + "/") === 0;
  }

  var links = nav.querySelectorAll("a[href]");
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute("href") || "";
    // ignore external / hash-only
    if (href.charAt(0) !== "/") continue;

    var on = isActive(href);
    if (on) {
      a.classList.add("nav-active");
      a.setAttribute("aria-current", "page");
    } else {
      a.classList.remove("nav-active");
      a.removeAttribute("aria-current");
    }
  }
})();
