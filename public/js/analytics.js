/**
 * Privacy-conscious analytics abstraction.
 * Disabled by default. Never captures full street addresses or political preferences.
 * Enable only with explicit owner config: window.__FIELD_HUB_ANALYTICS__ = { enabled: true, endpoint: "..." }
 */
(function () {
  var cfg = (typeof window !== "undefined" && window.__FIELD_HUB_ANALYTICS__) || {};
  var enabled = !!cfg.enabled;

  function track(eventName, props) {
    if (!enabled || !eventName) return;
    var payload = {
      event: String(eventName).slice(0, 80),
      ts: new Date().toISOString(),
      path: (location && location.pathname) || "",
      props: props && typeof props === "object" ? props : {},
    };
    // Strip disallowed keys if present
    delete payload.props.street;
    delete payload.props.address;
    delete payload.props.phone;
    delete payload.props.email;
    delete payload.props.partyPreference;
    try {
      if (cfg.endpoint && navigator.sendBeacon) {
        navigator.sendBeacon(cfg.endpoint, JSON.stringify(payload));
      } else if (cfg.debug) {
        console.info("[field-hub-analytics]", payload);
      }
    } catch (e) {}
  }

  window.FieldHubAnalytics = { track: track, enabled: enabled };

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("[data-track]");
    if (!t) return;
    track(t.getAttribute("data-track"), { label: (t.textContent || "").trim().slice(0, 60) });
  });
})();
