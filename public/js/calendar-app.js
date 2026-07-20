/**
 * Interactive month calendar for SD 33 Field Hub events.
 * Click a day → details panel. Loads /api/events.json.
 */
(function () {
  var root = document.getElementById("live-calendar");
  if (!root) return;

  var monthLabel = document.getElementById("cal-month-label");
  var gridEl = document.getElementById("cal-grid");
  var detailEl = document.getElementById("cal-day-detail");
  var prevBtn = document.getElementById("cal-prev");
  var nextBtn = document.getElementById("cal-next");
  var todayBtn = document.getElementById("cal-today");

  var events = [];
  var view = new Date();
  view.setDate(1);
  view.setHours(12, 0, 0, 0);

  var selectedKey = null;

  function ymd(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseYmd(s) {
    var p = String(s || "").split("-");
    if (p.length < 3) return null;
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
  }

  function eventOnDay(ev, key) {
    if (!ev.date) return false;
    var start = ev.date;
    var end = ev.dateEnd || ev.date;
    return key >= start && key <= end;
  }

  function eventsForDay(key) {
    return events.filter(function (e) {
      return eventOnDay(e, key);
    });
  }

  function monthName(d) {
    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typeClass(t) {
    t = String(t || "").toLowerCase();
    if (/door/.test(t)) return "dot-doors";
    if (/phone/.test(t)) return "dot-phones";
    if (/social|karaoke|happy/.test(t)) return "dot-social";
    if (/breakfast|lunch|meal/.test(t)) return "dot-meal";
    if (/parade|festival|fair|market/.test(t)) return "dot-fest";
    if (/gotv|vote|election/.test(t)) return "dot-gotv";
    return "dot-other";
  }

  function renderDetail(key) {
    if (!detailEl) return;
    if (!key) {
      detailEl.innerHTML =
        '<p class="muted">Click a highlighted date on the calendar to see event details, location, gear, and signup links.</p>';
      return;
    }
    var list = eventsForDay(key);
    var d = parseYmd(key);
    var pretty = d
      ? d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : key;

    if (!list.length) {
      detailEl.innerHTML =
        "<h3>" +
        esc(pretty) +
        '</h3><p class="muted">No events scheduled this day. <a href="/volunteer#ideas">Suggest an event</a>.</p>';
      return;
    }

    var html = "<h3>" + esc(pretty) + "</h3>";
    html +=
      '<p class="muted">' +
      list.length +
      " event" +
      (list.length === 1 ? "" : "s") +
      "</p>";

    list.forEach(function (e) {
      html += '<article class="cal-detail-card">';
      html +=
        '<div class="cal-detail-meta"><span class="cal-chip ' +
        typeClass(e.type) +
        '">' +
        esc(e.type || "event") +
        "</span>";
      if (e.community)
        html +=
          '<span class="cal-chip community">' + esc(e.community) + "</span>";
      if (e.priority === "high")
        html += '<span class="cal-chip pri">Priority</span>';
      html += "</div>";
      html += "<h4>" + esc(e.title) + "</h4>";
      if (e.time) html += "<p><strong>Time:</strong> " + esc(e.time) + "</p>";
      html +=
        "<p><strong>Location:</strong> " +
        esc(e.locationName || "") +
        (e.address ? " · " + esc(e.address) : "") +
        "</p>";
      if (e.description) html += "<p>" + esc(e.description) + "</p>";
      if (e.districts && e.districts.length)
        html +=
          '<p class="muted"><strong>Districts:</strong> ' +
          esc(e.districts.join(" · ")) +
          "</p>";
      if (e.gear) {
        html +=
          '<ul class="cal-gear"><li><strong>Stickers:</strong> ' +
          esc(e.gear.stickers || "—") +
          "</li><li><strong>Literature:</strong> " +
          esc(e.gear.literature || "—") +
          "</li><li><strong>Shirts:</strong> " +
          esc(e.gear.shirts || "—") +
          "</li></ul>";
      }
      html += '<p class="cta-row">';
      html +=
        '<a class="btn btn-gold" href="/volunteer?event=' +
        encodeURIComponent(e.id) +
        '">Sign up · calendar</a>';
      if (e.googleCalendar)
        html +=
          '<a class="btn btn-navy" href="' +
          esc(e.googleCalendar) +
          '" target="_blank" rel="noopener">Google Calendar</a>';
      html +=
        '<a class="btn" href="/events/' +
        encodeURIComponent(e.id) +
        '.ics">.ics file</a>';
      if (e.socialShare)
        html +=
          '<button type="button" class="btn cal-share" data-share="' +
          esc(e.socialShare).replace(/"/g, "&quot;") +
          '">Copy social post</button>';
      html += "</p></article>";
    });

    detailEl.innerHTML = html;
    detailEl.querySelectorAll(".cal-share").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = btn.getAttribute("data-share") || "";
        if (navigator.clipboard)
          navigator.clipboard.writeText(t).then(function () {
            btn.textContent = "Copied!";
          });
      });
    });
  }

  function render() {
    if (!gridEl) return;
    if (monthLabel) monthLabel.textContent = monthName(view);

    var year = view.getFullYear();
    var month = view.getMonth();
    var first = new Date(year, month, 1, 12);
    var startPad = first.getDay(); // 0 Sun
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var todayKey = ymd(new Date());

    var html = "";
    var headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    headers.forEach(function (h) {
      html += '<div class="cal-dow">' + h + "</div>";
    });

    for (var i = 0; i < startPad; i++) {
      html += '<div class="cal-day empty"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var d = new Date(year, month, day, 12);
      var key = ymd(d);
      var dayEvents = eventsForDay(key);
      var cls = "cal-day";
      if (key === todayKey) cls += " is-today";
      if (dayEvents.length) cls += " has-events";
      if (key === selectedKey) cls += " is-selected";
      if (key < todayKey) cls += " is-past";

      html +=
        '<button type="button" class="' +
        cls +
        '" data-date="' +
        key +
        '" aria-label="' +
        key +
        (dayEvents.length ? ", " + dayEvents.length + " events" : "") +
        '">';
      html += '<span class="cal-daynum">' + day + "</span>";
      if (dayEvents.length) {
        html += '<span class="cal-dots">';
        var max = Math.min(dayEvents.length, 4);
        for (var j = 0; j < max; j++) {
          html +=
            '<span class="cal-dot ' +
            typeClass(dayEvents[j].type) +
            '"></span>';
        }
        if (dayEvents.length > 4)
          html +=
            '<span class="cal-more">+' + (dayEvents.length - 4) + "</span>";
        html += "</span>";
        html +=
          '<span class="cal-count">' +
          dayEvents.length +
          " event" +
          (dayEvents.length > 1 ? "s" : "") +
          "</span>";
      }
      html += "</button>";
    }

    gridEl.innerHTML = html;
    gridEl.querySelectorAll(".cal-day[data-date]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedKey = btn.getAttribute("data-date");
        render();
        renderDetail(selectedKey);
        if (detailEl) detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  }

  function load() {
    fetch("/api/events.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        events = (data.events || []).filter(function (e) {
          return e.date;
        });
        // Default select first upcoming day with events, or today
        var todayKey = ymd(new Date());
        var firstUpcoming = null;
        events.forEach(function (e) {
          if (e.date >= todayKey && (!firstUpcoming || e.date < firstUpcoming))
            firstUpcoming = e.date;
        });
        selectedKey = firstUpcoming || todayKey;
        var sel = parseYmd(selectedKey);
        if (sel) {
          view = new Date(sel.getFullYear(), sel.getMonth(), 1, 12);
        }
        render();
        renderDetail(selectedKey);
      })
      .catch(function () {
        if (detailEl)
          detailEl.innerHTML =
            '<p class="muted">Could not load events. Refresh the page.</p>';
      });
  }

  if (prevBtn)
    prevBtn.addEventListener("click", function () {
      view.setMonth(view.getMonth() - 1);
      render();
    });
  if (nextBtn)
    nextBtn.addEventListener("click", function () {
      view.setMonth(view.getMonth() + 1);
      render();
    });
  if (todayBtn)
    todayBtn.addEventListener("click", function () {
      var n = new Date();
      view = new Date(n.getFullYear(), n.getMonth(), 1, 12);
      selectedKey = ymd(n);
      render();
      renderDetail(selectedKey);
    });

  load();
})();
